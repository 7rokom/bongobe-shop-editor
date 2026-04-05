import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export type FollowUpStatus = 'কনফার্ম' | 'প্যাকেজিং' | 'শিপমেন্ট' | 'এসাইন' | 'ফলোয়াপ' | 'ডেলিভারড' | 'রিটার্ন' | 'পেইড রিটার্ন';

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ['কনফার্ম', 'প্যাকেজিং', 'শিপমেন্ট', 'এসাইন', 'ফলোয়াপ', 'ডেলিভারড', 'রিটার্ন', 'পেইড রিটার্ন'];

// Mapping from follow-up status to order status (for syncing)
// এসাইন and ফলোয়াপ don't sync to order status
export const FOLLOW_UP_TO_ORDER_STATUS: Partial<Record<FollowUpStatus, string>> = {
  'কনফার্ম': 'কনফার্মড',
  'প্যাকেজিং': 'প্যাকেজিং',
  'শিপমেন্ট': 'শিপমেন্ট',
  'ডেলিভারড': 'ডেলিভারড',
  'রিটার্ন': 'রিটার্ন',
  'পেইড রিটার্ন': 'পেইড রিটার্ন',
};

export type OrderStockType = 'self' | 'vendor';

interface FollowUpRow {
  order_id: string;
  status: string | null;
  note: string;
  tracking_url: string;
  courier_name: string;
  stock_type: string;
  vendor_buy_price: number;
  courier_locked: boolean;
}

interface FollowUpStore {
  statuses: Record<string, FollowUpStatus>;
  notes: Record<string, string>;
  trackingUrls: Record<string, string>;
  courierNames: Record<string, string>;
  stockTypes: Record<string, OrderStockType>;
  vendorBuyPrices: Record<string, number>;
  courierLocked: Record<string, boolean>;
  loading: boolean;
  fetchAll: () => Promise<void>;
  setStatus: (orderId: string, status: FollowUpStatus) => void;
  getStatus: (orderId: string) => FollowUpStatus | undefined;
  setNote: (orderId: string, note: string) => void;
  setTrackingUrl: (orderId: string, url: string) => void;
  removeTrackingUrl: (orderId: string) => void;
  setCourierName: (orderId: string, name: string) => void;
  removeCourierName: (orderId: string) => void;
  removeStatus: (orderId: string) => void;
  setStockType: (orderId: string, type: OrderStockType) => void;
  removeStockType: (orderId: string) => void;
  getStockType: (orderId: string) => OrderStockType;
  setVendorBuyPrice: (orderId: string, price: number) => void;
  getVendorBuyPrice: (orderId: string) => number | undefined;
  setCourierLocked: (orderId: string, locked: boolean) => void;
  getCourierLocked: (orderId: string) => boolean;
}

// Upsert helper — insert or update a single field for an order
const upsertField = async (orderId: string, field: string, value: any) => {
  await db.from('follow_up_data').upsert(
    { order_id: orderId, [field]: value, updated_at: new Date().toISOString() },
    { onConflict: 'order_id' }
  );
};

export const useFollowUpStore = create<FollowUpStore>()((set, get) => ({
  statuses: {},
  notes: {},
  trackingUrls: {},
  courierNames: {},
  stockTypes: {},
  vendorBuyPrices: {},
  courierLocked: {},
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await db.from('follow_up_data').select('*');
    if (!error && data) {
      const statuses: Record<string, FollowUpStatus> = {};
      const notes: Record<string, string> = {};
      const trackingUrls: Record<string, string> = {};
      const courierNames: Record<string, string> = {};
      const stockTypes: Record<string, OrderStockType> = {};
      const vendorBuyPrices: Record<string, number> = {};
      const courierLocked: Record<string, boolean> = {};
      (data as FollowUpRow[]).forEach((r) => {
        if (r.status) statuses[r.order_id] = r.status as FollowUpStatus;
        if (r.note) notes[r.order_id] = r.note;
        if (r.tracking_url) trackingUrls[r.order_id] = r.tracking_url;
        if (r.courier_name) courierNames[r.order_id] = r.courier_name;
        if (r.stock_type && r.stock_type !== 'self') stockTypes[r.order_id] = r.stock_type as OrderStockType;
        if (r.vendor_buy_price) vendorBuyPrices[r.order_id] = Number(r.vendor_buy_price);
        if (r.courier_locked) courierLocked[r.order_id] = true;
      });
      set({ statuses, notes, trackingUrls, courierNames, stockTypes, vendorBuyPrices, courierLocked });
    }
    set({ loading: false });
  },

  setStatus: (orderId, status) => {
    set((s) => ({ statuses: { ...s.statuses, [orderId]: status } }));
    upsertField(orderId, 'status', status);
  },
  getStatus: (orderId) => get().statuses[orderId],

  setNote: (orderId, note) => {
    set((s) => ({ notes: { ...s.notes, [orderId]: note } }));
    upsertField(orderId, 'note', note);
  },

  setTrackingUrl: (orderId, url) => {
    set((s) => ({ trackingUrls: { ...s.trackingUrls, [orderId]: url } }));
    upsertField(orderId, 'tracking_url', url);
  },
  removeTrackingUrl: (orderId) => {
    set((s) => {
      const { [orderId]: _, ...rest } = s.trackingUrls;
      return { trackingUrls: rest };
    });
    upsertField(orderId, 'tracking_url', '');
  },

  setCourierName: (orderId, name) => {
    set((s) => ({ courierNames: { ...s.courierNames, [orderId]: name } }));
    upsertField(orderId, 'courier_name', name);
  },
  removeCourierName: (orderId) => {
    set((s) => {
      const { [orderId]: _, ...rest } = s.courierNames;
      return { courierNames: rest };
    });
    upsertField(orderId, 'courier_name', '');
  },

  removeStatus: (orderId) => {
    set((s) => {
      const { [orderId]: _, ...restS } = s.statuses;
      const { [orderId]: _2, ...restN } = s.notes;
      const { [orderId]: _3, ...restT } = s.trackingUrls;
      const { [orderId]: _4, ...restC } = s.courierNames;
      const { [orderId]: _5, ...restST } = s.stockTypes;
      const { [orderId]: _6, ...restVBP } = s.vendorBuyPrices;
      return { statuses: restS, notes: restN, trackingUrls: restT, courierNames: restC, stockTypes: restST, vendorBuyPrices: restVBP };
    });
    db.from('follow_up_data').delete().eq('order_id', orderId);
  },

  setStockType: (orderId, type) => {
    set((s) => ({ stockTypes: { ...s.stockTypes, [orderId]: type } }));
    upsertField(orderId, 'stock_type', type);
  },
  removeStockType: (orderId) => {
    set((s) => {
      const { [orderId]: _, ...rest } = s.stockTypes;
      const { [orderId]: _2, ...restVBP } = s.vendorBuyPrices;
      return { stockTypes: rest, vendorBuyPrices: restVBP };
    });
    upsertField(orderId, 'stock_type', 'self');
    upsertField(orderId, 'vendor_buy_price', 0);
  },
  getStockType: (orderId) => get().stockTypes[orderId] || 'self',

  setVendorBuyPrice: (orderId, price) => {
    set((s) => ({ vendorBuyPrices: { ...s.vendorBuyPrices, [orderId]: price } }));
    upsertField(orderId, 'vendor_buy_price', price);
  },
  getVendorBuyPrice: (orderId) => get().vendorBuyPrices[orderId],

  setCourierLocked: (orderId, locked) => {
    set((s) => ({ courierLocked: { ...s.courierLocked, [orderId]: locked } }));
    upsertField(orderId, 'courier_locked', locked);
  },
  getCourierLocked: (orderId) => get().courierLocked[orderId] || false,
}));
