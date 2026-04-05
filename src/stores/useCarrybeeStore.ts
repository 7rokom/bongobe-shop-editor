import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface CarrybeeOrderData {
  consignment_id?: string;
  transfer_status?: string;
  sent_at?: string;
  store_id?: string;
}

interface CarrybeeSettings {
  clientId: string;
  clientSecret: string;
  clientContext: string;
  defaultStoreId: string;
  defaultCityId: number;
  defaultZoneId: number;
}

interface CarrybeeStore {
  settings: CarrybeeSettings;
  orderData: Record<string, CarrybeeOrderData>;
  updateSettings: (s: Partial<CarrybeeSettings>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  setOrderData: (orderId: string, data: CarrybeeOrderData) => void;
  removeOrderData: (orderId: string) => void;
  getOrderData: (orderId: string) => CarrybeeOrderData | undefined;
  fetchDispatchData: () => Promise<void>;
}

export const useCarrybeeStore = create<CarrybeeStore>()((set, get) => ({
  settings: { clientId: '', clientSecret: '', clientContext: '', defaultStoreId: '', defaultCityId: 0, defaultZoneId: 0 },
  orderData: {},
  updateSettings: async (s) => {
    set((state) => ({ settings: { ...state.settings, ...s } }));
    const settings = get().settings;
    await db.from('courier_settings').upsert({ id: 'carrybee', data: settings, updated_at: new Date().toISOString() });
  },
  fetchSettings: async () => {
    const { data } = await db.from('courier_settings').select('data').eq('id', 'carrybee').maybeSingle();
    if (data?.data) set({ settings: data.data });
  },
  fetchDispatchData: async () => {
    const { data } = await db.from('courier_dispatch').select('*').eq('courier_type', 'carrybee');
    if (data) {
      const orderData: Record<string, CarrybeeOrderData> = {};
      data.forEach((r: any) => {
        orderData[r.order_id] = {
          consignment_id: r.consignment_id || undefined,
          transfer_status: r.courier_status || undefined,
          sent_at: r.sent_at || undefined,
          store_id: r.store_id || undefined,
        };
      });
      set({ orderData });
    }
  },
  setOrderData: async (orderId, data) => {
    set((state) => ({ orderData: { ...state.orderData, [orderId]: { ...state.orderData[orderId], ...data } } }));
    const { error } = await db.from('courier_dispatch').upsert({
      order_id: orderId,
      courier_type: 'carrybee',
      consignment_id: data.consignment_id || '',
      tracking_code: '',
      courier_status: data.transfer_status || '',
      store_id: data.store_id || '',
      sent_at: data.sent_at || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'order_id' });
    if (error) console.error('courier_dispatch upsert failed (carrybee):', error);
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
