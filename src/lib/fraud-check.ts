import { normalizePhone } from '@/lib/order-validation';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';

const BLOCK_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const STORAGE_KEY = 'fraud-block-until';

export interface FraudCheckResult {
  passed: boolean;
  reason?: 'no_data' | 'low_ratio';
  all?: number;
  delivered?: number;
  returned?: number;
  deliveryPercent?: number;
}

export const isFraudBlocked = (): boolean => {
  const blockUntil = localStorage.getItem(STORAGE_KEY);
  if (!blockUntil) return false;
  if (Date.now() < Number(blockUntil)) return true;
  localStorage.removeItem(STORAGE_KEY);
  return false;
};

export const setFraudBlock = () => {
  localStorage.setItem(STORAGE_KEY, String(Date.now() + BLOCK_DURATION));
};

export const clearFraudBlock = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const checkFraud = async (phone: string): Promise<FraudCheckResult> => {
  const settings = useFraudSettingsStore.getState();
  if (!settings.enabled) return { passed: true };

  const normalized = normalizePhone(phone);
  if (normalized.length < 11) return { passed: true };

  try {
    const res = await fetch('https://vdznwxispnuzfwotaxgd.supabase.co/functions/v1/courier-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalized,
        ...(settings.bdcourierApiKey ? { apiKey: settings.bdcourierApiKey } : {}),
      }),
    });
    const data = await res.json();
    const all = data.all || 0;
    const delivered = data.delivered || 0;
    const returned = data.returned || 0;

    if (all === 0) {
      return {
        passed: !settings.blockOnNoData,
        reason: 'no_data',
        all, delivered, returned, deliveryPercent: 0,
      };
    }

    const deliveryPercent = Math.round((delivered / all) * 100);
    const passed = deliveryPercent >= settings.minDeliveryPercent;

    return {
      passed,
      reason: passed ? undefined : 'low_ratio',
      all, delivered, returned, deliveryPercent,
    };
  } catch {
    // On API error, allow order (don't block due to network issues)
    return { passed: true };
  }
};
