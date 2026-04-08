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

// Check if device has any order in blocking statuses
export const checkDeviceBlocked = async (fingerprint: string): Promise<boolean> => {
  if (!fingerprint) return false;
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const blockingStatuses = ['পেন্ডিং', 'হোল্ড', 'ক্যান্সেল', 'রিটার্ন'];
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('id')
      .eq('customer_fingerprint', fingerprint)
      .in('status', blockingStatuses)
      .limit(1);
    if (error) return false;
    return (data?.length || 0) > 0;
  } catch {
    return false;
  }
};
