import { normalizePhone } from '@/lib/order-validation';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';

export interface FraudCheckResult {
  passed: boolean;
  reason?: 'no_data' | 'low_ratio';
  all?: number;
  delivered?: number;
  returned?: number;
  deliveryPercent?: number;
}

export const checkFraud = async (phone: string): Promise<FraudCheckResult> => {
  const settings = useFraudSettingsStore.getState();
  if (!settings.enabled) return { passed: true };

  const normalized = normalizePhone(phone);
  if (normalized.length < 11) return { passed: true };

  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/courier-check`, {
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
    return { passed: true };
  }
};
