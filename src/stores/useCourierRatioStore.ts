import { create } from 'zustand';
import { db } from '@/lib/supabase-db';
import { toast } from 'sonner';

export interface CourierRatioData {
  all: number;
  delivered: number;
  returned: number;
  loading: boolean;
}

interface CourierRatioStore {
  data: Record<string, CourierRatioData>;
  loaded: boolean;
  loadCache: () => Promise<void>;
  checkRatio: (phone: string, apiKey?: string, force?: boolean) => Promise<void>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const useCourierRatioStore = create<CourierRatioStore>()((set, get) => ({
  data: {},
  loaded: false,

  loadCache: async () => {
    if (get().loaded) return;
    try {
      const { data } = await db.from('courier_ratio_cache').select('*');
      if (data && data.length > 0) {
        const cached: Record<string, CourierRatioData> = {};
        data.forEach((r: any) => {
          cached[r.phone] = { all: r.all_count || 0, delivered: r.delivered || 0, returned: r.returned || 0, loading: false };
        });
        set({ data: cached, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  checkRatio: async (phone: string, apiKey?: string, force?: boolean) => {
    const existing = get().data[phone];
    // If cached and not forcing refresh, skip
    if (existing && !existing.loading && !force) return;

    set((s) => ({ data: { ...s.data, [phone]: { all: 0, delivered: 0, returned: 0, loading: true } } }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/courier-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...(apiKey ? { apiKey } : {}) }),
      });
      const json = await res.json();
      const result: CourierRatioData = {
        all: json.all || 0, delivered: json.delivered || 0, returned: json.returned || 0, loading: false,
      };

      set((s) => ({ data: { ...s.data, [phone]: result } }));

      // Persist to Supabase
      await db.from('courier_ratio_cache').upsert({
        phone,
        all_count: result.all,
        delivered: result.delivered,
        returned: result.returned,
        checked_at: new Date().toISOString(),
      }, { onConflict: 'phone' });

      if (!json.all && !json.delivered && !json.returned) {
        toast.error('কুরিয়ার ডাটা পাওয়া যায়নি');
      }
    } catch {
      set((s) => ({ data: { ...s.data, [phone]: { all: 0, delivered: 0, returned: 0, loading: false } } }));
      toast.error('কুরিয়ার চেক ব্যর্থ হয়েছে');
    }
  },
}));
