import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';
import { supabase } from '@/integrations/supabase/client';

const COOLDOWN_KEY = 'last-order-time';

export function getCooldownMessage(): string {
  return useFraudSettingsStore.getState().cooldownMessage || "প্রিয় গ্রাহক! আপনি ইতিমধ্যে ১বার অর্ডার করেছেন। আমাদের ওয়েবসাইটে প্রতি ২ ঘন্টায় ১ বারের বেশি অর্ডার করা যায় না। ধন্যবাদ!";
}

// Keep for backward compatibility
export const COOLDOWN_MESSAGE = "প্রিয় গ্রাহক! আপনি ইতিমধ্যে ১বার অর্ডার করেছেন। আমাদের ওয়েবসাইটে প্রতি ২ ঘন্টায় ১ বারের বেশি অর্ডার করা যায় না। ধন্যবাদ!";

// localStorage-based check (kept for quick UI hints on ProductCard/ProductPage)
export function isOrderCooldownActive(): boolean {
  try {
    const state = useFraudSettingsStore.getState();
    if (!state.cooldownEnabled) return false;
    const last = localStorage.getItem(COOLDOWN_KEY);
    if (!last) return false;
    const cooldownMs = (state.cooldownMinutes || 120) * 60 * 1000;
    return Date.now() - Number(last) < cooldownMs;
  } catch {
    return false;
  }
}

export function setOrderCooldown(): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {}
}

// Server-side cooldown check — queries orders table by phone, IP, or fingerprint
export async function checkServerCooldown(
  phone: string,
  ip?: string,
  fingerprint?: string
): Promise<boolean> {
  try {
    const state = useFraudSettingsStore.getState();
    if (!state.cooldownEnabled) return false;

    const cooldownMinutes = state.cooldownMinutes || 120;
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

    // Normalize phone: remove spaces, dashes
    const normalizedPhone = phone.replace(/[\s\-]/g, '');

    // Build OR filter: phone match OR ip match OR fingerprint match
    const filters: string[] = [`phone.eq.${normalizedPhone}`];
    if (ip) filters.push(`customer_ip.eq.${ip}`);
    if (fingerprint) filters.push(`customer_fingerprint.eq.${fingerprint}`);

    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', cutoff)
      .or(filters.join(','))
      .limit(1);

    if (error) {
      console.error('Server cooldown check failed:', error);
      // Fallback to localStorage check
      return isOrderCooldownActive();
    }

    return (data?.length ?? 0) > 0;
  } catch {
    // Fallback to localStorage
    return isOrderCooldownActive();
  }
}
