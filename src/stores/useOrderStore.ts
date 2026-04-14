import { create } from 'zustand';
import { db } from '@/lib/supabase-db';
import { Order, OrderItem } from '@/components/admin/OrderDetailDialog';

const toBanglaDate = (d: Date) => {
  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBangla = (n: number) => n.toString().split('').map(ch => banglaDigits[parseInt(ch)]).join('');
  return `${toBangla(d.getDate())} ${months[d.getMonth()]} ${toBangla(d.getFullYear())}`;
};

const getBanglaDate = () => toBanglaDate(new Date());

const formatInvoiceNumber = (num: number) => '#' + String(num).padStart(2, '0');

const mapRow = (r: any): Order => ({
  id: r.id,
  customer: r.customer,
  phone: r.phone,
  address: r.address,
  items: r.items || [],
  deliveryCharge: Number(r.delivery_charge),
  originalDeliveryCharge: Number(r.original_delivery_charge),
  total: Number(r.total),
  status: r.status,
  date: r.date,
  isoDate: r.iso_date,
  confirmedBy: r.confirmed_by || '',
  assignedTo: r.assigned_to,
  assignedToName: r.assigned_to_name,
  customerIp: r.customer_ip,
  customerFingerprint: r.customer_fingerprint,
  note: r.note || '',
  paidReturnAmount: r.paid_return_amount ?? null,
});

interface OrderStore {
  orders: Order[];
  nextOrderNumber: number;
  loading: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  updateStatus: (orderId: string, newStatus: string) => Promise<void>;
  assignOrder: (orderId: string, employeeId: string, employeeName: string) => Promise<void>;
  unassignOrder: (orderId: string) => Promise<void>;
  deleteOrders: (orderIds: Set<string>) => Promise<void>;
  getNextInvoiceId: () => string;
  createOrderFromCheckout: (data: {
    name: string;
    phone: string;
    address: string;
    items: { title: string; quantity: number; price: number; image?: string; variations?: Record<string, string>; freeDelivery?: boolean }[];
    deliveryCharge: number;
    subtotal: number;
    confirmedBy?: string;
    customerIp?: string;
    customerFingerprint?: string;
    orderNote?: string;
  }) => Promise<string>;
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  nextOrderNumber: 1,
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const orders = data.map(mapRow);
      // Calculate next order number from existing
      let maxNum = 0;
      orders.forEach((o: Order) => {
        const num = parseInt(o.id.replace('#', ''));
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      set({ orders, nextOrderNumber: maxNum + 1 });
    }
    set({ loading: false });
  },

  addOrder: async (order) => {
    const { error } = await db.from('orders').insert({
      id: order.id, customer: order.customer, phone: order.phone, address: order.address,
      items: order.items, delivery_charge: order.deliveryCharge,
      original_delivery_charge: order.originalDeliveryCharge, total: order.total,
      status: order.status, date: order.date, iso_date: order.isoDate,
      confirmed_by: order.confirmedBy, customer_ip: order.customerIp,
      customer_fingerprint: order.customerFingerprint,
    });
    if (!error) set((state) => ({ orders: [order, ...state.orders] }));
  },

  updateOrder: async (updated) => {
    const { error } = await db.from('orders').update({
      customer: updated.customer, phone: updated.phone, address: updated.address,
      items: updated.items, delivery_charge: updated.deliveryCharge,
      original_delivery_charge: updated.originalDeliveryCharge, total: updated.total,
      status: updated.status, confirmed_by: updated.confirmedBy,
      assigned_to: updated.assignedTo, assigned_to_name: updated.assignedToName,
      note: updated.note || '',
    }).eq('id', updated.id);
    if (!error) set((state) => ({ orders: state.orders.map((o) => (o.id === updated.id ? updated : o)) }));
  },

  deleteOrders: async (orderIds) => {
    const ids = Array.from(orderIds);
    const { error } = await db.from('orders').delete().in('id', ids);
    if (!error) set((state) => ({ orders: state.orders.filter((o) => !orderIds.has(o.id)) }));
  },

  updateStatus: async (orderId, newStatus) => {
    const { error } = await db.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) set((state) => ({ orders: state.orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o) }));
  },

  assignOrder: async (orderId, employeeId, employeeName) => {
    const { error } = await db.from('orders').update({ assigned_to: employeeId, assigned_to_name: employeeName }).eq('id', orderId);
    if (!error) set((state) => ({ orders: state.orders.map((o) => o.id === orderId ? { ...o, assignedTo: employeeId, assignedToName: employeeName } : o) }));
  },

  unassignOrder: async (orderId) => {
    const { error } = await db.from('orders').update({ assigned_to: null, assigned_to_name: null }).eq('id', orderId);
    if (!error) set((state) => ({ orders: state.orders.map((o) => o.id === orderId ? { ...o, assignedTo: undefined, assignedToName: undefined } : o) }));
  },

  getNextInvoiceId: () => {
    const num = get().nextOrderNumber;
    const id = formatInvoiceNumber(num);
    set({ nextOrderNumber: num + 1 });
    return id;
  },

  createOrderFromCheckout: async (data) => {
    // Get counter value AND max existing order ID, use whichever is higher
    const { data: counterRow } = await db.from('counters').select('value').eq('id', 'order_number').single();
    const counterVal = counterRow?.value || 0;

    // Also check max numeric ID from orders table to prevent overwrites
    const { data: allOrders } = await db.from('orders').select('id');
    let maxOrderId = 0;
    if (allOrders) {
      allOrders.forEach((o: any) => {
        const n = parseInt(String(o.id).replace('#', ''));
        if (!isNaN(n) && n > maxOrderId) maxOrderId = n;
      });
    }

    const num = Math.max(counterVal, maxOrderId) + 1;
    await db.from('counters').update({ value: num }).eq('id', 'order_number');

    const invoiceId = formatInvoiceNumber(num);
    const newOrder: Order = {
      id: invoiceId,
      customer: data.name,
      phone: data.phone,
      address: data.address,
      items: data.items.map((i) => ({
        name: i.title, qty: i.quantity, price: i.price, originalPrice: i.price,
        image: i.image || 'https://placehold.co/80x80', variations: i.variations,
        freeDelivery: i.freeDelivery || false,
      })),
      deliveryCharge: data.deliveryCharge,
      originalDeliveryCharge: data.deliveryCharge,
      total: data.subtotal + data.deliveryCharge,
      status: data.confirmedBy ? 'কনফার্মড' : 'পেন্ডিং',
      date: getBanglaDate(),
      isoDate: new Date().toISOString(),
      confirmedBy: data.confirmedBy || '',
      customerIp: data.customerIp,
      customerFingerprint: data.customerFingerprint,
      note: data.orderNote || '',
    };

    const { error } = await db.from('orders').insert({
      id: newOrder.id, customer: newOrder.customer, phone: newOrder.phone, address: newOrder.address,
      items: newOrder.items, delivery_charge: newOrder.deliveryCharge,
      original_delivery_charge: newOrder.originalDeliveryCharge, total: newOrder.total,
      status: newOrder.status, date: newOrder.date, iso_date: newOrder.isoDate,
      confirmed_by: newOrder.confirmedBy, customer_ip: newOrder.customerIp,
      customer_fingerprint: newOrder.customerFingerprint,
      note: newOrder.note || '',
    });

    if (!error) {
      set((state) => ({ orders: [newOrder, ...state.orders], nextOrderNumber: num + 1 }));
    }
    return invoiceId;
  },
}));
