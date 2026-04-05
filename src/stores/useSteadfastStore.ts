import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface SteadfastOrderData {
  consignment_id?: number;
  tracking_code?: string;
  steadfast_status?: string;
  sent_at?: string;
}

interface SteadfastSettings {
  apiKey: string;
  secretKey: string;
}

interface SteadfastStore {
  settings: SteadfastSettings;
  orderData: Record<string, SteadfastOrderData>; // keyed by order id
  updateSettings: (s: Partial<SteadfastSettings>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  setOrderData: (orderId: string, data: SteadfastOrderData) => void;
  removeOrderData: (orderId: string) => void;
  getOrderData: (orderId: string) => SteadfastOrderData | undefined;
  fetchDispatchData: () => Promise<void>;
}

export const useSteadfastStore = create<SteadfastStore>()((set, get) => ({
  settings: { apiKey: '', secretKey: '' },
  orderData: {},
  updateSettings: async (s) => {
    set((state) => ({ settings: { ...state.settings, ...s } }));
    const settings = get().settings;
    await db.from('courier_settings').upsert({ id: 'steadfast', data: settings, updated_at: new Date().toISOString() });
  },
  fetchSettings: async () => {
    const { data } = await db.from('courier_settings').select('data').eq('id', 'steadfast').maybeSingle();
    if (data?.data) set({ settings: data.data });
  },
  fetchDispatchData: async () => {
    const { data } = await db.from('courier_dispatch').select('*').eq('courier_type', 'steadfast');
    if (data) {
      const orderData: Record<string, SteadfastOrderData> = {};
      data.forEach((r: any) => {
        orderData[r.order_id] = {
          consignment_id: r.consignment_id ? Number(r.consignment_id) : undefined,
          tracking_code: r.tracking_code || undefined,
          steadfast_status: r.courier_status || undefined,
          sent_at: r.sent_at || undefined,
        };
      });
      set({ orderData });
    }
  },
  setOrderData: async (orderId, data) => {
    set((state) => ({ orderData: { ...state.orderData, [orderId]: { ...state.orderData[orderId], ...data } } }));
    const { error } = await db.from('courier_dispatch').upsert({
      order_id: orderId,
      courier_type: 'steadfast',
      consignment_id: String(data.consignment_id || ''),
      tracking_code: data.tracking_code || '',
      courier_status: data.steadfast_status || '',
      sent_at: data.sent_at || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' });
    if (error) console.error('courier_dispatch upsert failed (steadfast):', error);
  },
  removeOrderData: (orderId) => {
    set((state) => {
      const { [orderId]: _, ...rest } = state.orderData;
      return { orderData: rest };
    });
    db.from('courier_dispatch').delete().eq('order_id', orderId);
  },
  getOrderData: (orderId) => get().orderData[orderId],
}));
