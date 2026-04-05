import { create } from 'zustand';
import { normalizePhone } from '@/lib/order-validation';
import { db } from '@/lib/supabase-db';

export interface IncompleteOrder {
  id: string;
  name: string;
  phone: string;
  address: string;
  items: { title: string; quantity: number; price: number; image?: string }[];
  totalPrice: number;
  deliveryCharge: number;
  deliveryZone: string;
  grandTotal: number;
  date: string;
  type: 'blocked' | 'incomplete';
  blockReason?: string;
  status?: 'pending' | 'cancelled';
  customerIp?: string;
  customerFingerprint?: string;
}

interface IncompleteOrderStore {
  orders: IncompleteOrder[];
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<IncompleteOrder, 'id' | 'date'>) => void;
  removeOrder: (id: string) => void;
  removeOrders: (ids: Set<string>) => void;
  cancelOrder: (id: string) => void;
  removeByPhone: (phone: string) => void;
}

const SUPABASE_URL = 'https://vdznwxispnuzfwotaxgd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkem53eGlzcG51emZ3b3RheGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTIzMjIsImV4cCI6MjA4OTI4ODMyMn0.fuHClmDNJLsUfl5JT3sqr_1_EfsEIdXK1uw1Qcch5Ls';

function buildPayload(order: Omit<IncompleteOrder, 'id' | 'date'>) {
  const id = 'INC' + Date.now().toString().slice(-6);
  const normalizedPhone = normalizePhone(order.phone);
  return {
    id,
    name: order.name || '',
    phone: normalizedPhone,
    address: order.address || '',
    items: order.items,
    total_price: order.totalPrice,
    delivery_charge: order.deliveryCharge,
    delivery_zone: order.deliveryZone,
    grand_total: order.grandTotal,
    type: order.type,
    block_reason: order.blockReason || null,
    status: order.status || 'pending',
    customer_ip: order.customerIp || null,
    customer_fingerprint: order.customerFingerprint || null,
  };
}

const REST_URL = `${SUPABASE_URL}/rest/v1/incomplete_orders`;
const REST_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: 'return=minimal',
};

// visibilitychange ও SPA cleanup এর জন্য — normal fetch, সব হেডারসহ
export function sendIncompleteOrderFetch(order: Omit<IncompleteOrder, 'id' | 'date'>) {
  try {
    const payload = buildPayload(order);
    fetch(REST_URL, {
      method: 'POST',
      headers: REST_HEADERS,
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Silent fail
  }
}

// beforeunload / pagehide এর জন্য — navigator.sendBeacon (সবচেয়ে নির্ভরযোগ্য unload এ)
export function sendBeaconIncompleteOrder(order: Omit<IncompleteOrder, 'id' | 'date'>) {
  try {
    const payload = buildPayload(order);
    const body = JSON.stringify(payload);

    // sendBeacon কাস্টম হেডার সাপোর্ট করে না, apikey query param এ পাঠানো হচ্ছে
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const beaconUrl = `${REST_URL}?apikey=${SUPABASE_KEY}`;
      const ok = navigator.sendBeacon(beaconUrl, blob);
      if (ok) return;
    }

    // Fallback: fetch with keepalive
    fetch(REST_URL, {
      method: 'POST',
      headers: REST_HEADERS,
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent fail
  }
}

function mapRow(row: any): IncompleteOrder {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    items: row.items || [],
    totalPrice: Number(row.total_price) || 0,
    deliveryCharge: Number(row.delivery_charge) || 0,
    deliveryZone: row.delivery_zone || '',
    grandTotal: Number(row.grand_total) || 0,
    date: row.created_at,
    type: row.type,
    blockReason: row.block_reason,
    status: row.status,
    customerIp: row.customer_ip,
    customerFingerprint: row.customer_fingerprint,
  };
}

export const useIncompleteOrderStore = create<IncompleteOrderStore>()(
  (set) => ({
    orders: [],

    fetchOrders: async () => {
      const { data, error } = await db
        .from('incomplete_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        set({ orders: data.map(mapRow) });
      }
    },

    addOrder: async (order) => {
      const normalizedPhone = normalizePhone(order.phone);
      const id = 'INC' + Date.now().toString().slice(-6);

      // For incomplete type, delete existing entry with same phone first
      if (order.type === 'incomplete') {
        await db
          .from('incomplete_orders')
          .delete()
          .eq('type', 'incomplete')
          .eq('phone', normalizedPhone);
      }

      const payload = {
        id,
        name: order.name,
        phone: normalizedPhone,
        address: order.address,
        items: order.items,
        total_price: order.totalPrice,
        delivery_charge: order.deliveryCharge,
        delivery_zone: order.deliveryZone,
        grand_total: order.grandTotal,
        type: order.type,
        block_reason: order.blockReason || null,
        status: order.status || 'pending',
        customer_ip: order.customerIp || null,
        customer_fingerprint: order.customerFingerprint || null,
      };

      const { error } = await db.from('incomplete_orders').insert(payload);

      if (!error) {
        const newOrder: IncompleteOrder = {
          ...order,
          phone: normalizedPhone,
          id,
          date: new Date().toISOString(),
        };

        set((state) => {
          if (order.type === 'incomplete') {
            const filtered = state.orders.filter(
              (o) => !(o.type === 'incomplete' && normalizePhone(o.phone) === normalizedPhone)
            );
            return { orders: [newOrder, ...filtered] };
          }
          return { orders: [newOrder, ...state.orders] };
        });
      }
    },

    removeOrder: async (id) => {
      await db.from('incomplete_orders').delete().eq('id', id);
      set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
    },

    removeOrders: async (ids) => {
      const idArray = Array.from(ids);
      await db.from('incomplete_orders').delete().in('id', idArray);
      set((state) => ({ orders: state.orders.filter((o) => !ids.has(o.id)) }));
    },

    cancelOrder: async (id) => {
      await db.from('incomplete_orders').update({ status: 'cancelled' }).eq('id', id);
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, status: 'cancelled' as const } : o),
      }));
    },

    removeByPhone: async (phone) => {
      const normalized = normalizePhone(phone);
      await db.from('incomplete_orders').delete().eq('type', 'incomplete').eq('phone', normalized);
      set((state) => ({
        orders: state.orders.filter(
          (o) => !(o.type === 'incomplete' && normalizePhone(o.phone) === normalized)
        ),
      }));
    },
  })
);
