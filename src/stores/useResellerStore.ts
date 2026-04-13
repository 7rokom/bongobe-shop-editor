import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface Reseller {
  id: string; name: string; email: string; phone: string;
  password: string; isActive: boolean; createdAt: string; balance: number;
  approvalStatus?: string; deactivationNote?: string; serialNumber?: number;
}

export interface ResellerOrder {
  id: string; resellerId: string; resellerName: string;
  customerName: string; customerPhone: string; customerAddress: string;
  items: { productId: string; productTitle: string; image: string; qty: number; resellerPrice: number; sellingPrice: number; profit: number; }[];
  deliveryCharge: number; packagingCharge?: number; codCharge?: number;
  totalSellingPrice: number; totalResellerCost: number; totalProfit: number;
  status: string; date: string; notes?: string[];
}

export interface PaymentRequest {
  id: string; resellerId: string; resellerName: string; amount: number;
  method: string; accountNumber: string; status: 'পেন্ডিং' | 'অনুমোদিত' | 'বাতিল'; date: string;
}

interface ResellerStore {
  resellers: Reseller[];
  orders: ResellerOrder[];
  paymentRequests: PaymentRequest[];
  loading: boolean;
  fetchResellers: () => Promise<void>;
  fetchResellerOrders: () => Promise<void>;
  fetchPaymentRequests: () => Promise<void>;
  addReseller: (r: Reseller) => Promise<void>;
  updateReseller: (id: string, updates: Partial<Reseller>) => Promise<void>;
  loginReseller: (email: string, password: string) => Reseller | null;
  addResellerOrder: (order: ResellerOrder) => Promise<void>;
  updateResellerOrderStatus: (orderId: string, status: string) => Promise<void>;
  updateResellerOrder: (orderId: string, updates: Partial<ResellerOrder>) => Promise<void>;
  addPaymentRequest: (req: PaymentRequest) => Promise<void>;
  updatePaymentRequest: (id: string, status: 'অনুমোদিত' | 'বাতিল') => Promise<void>;
  getResellerBalance: (resellerId: string) => number;
  getWithdrawableBalance: (resellerId: string) => number;
}

const mapReseller = (r: any): Reseller => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone || '',
  password: r.password, isActive: r.is_active ?? true, createdAt: r.created_at || '',
  balance: Number(r.balance) || 0,
  approvalStatus: r.approval_status || 'approved',
  deactivationNote: r.deactivation_note || '',
  serialNumber: r.serial_number || undefined,
});

const mapOrder = (r: any): ResellerOrder => ({
  id: r.id, resellerId: r.reseller_id, resellerName: r.reseller_name || '',
  customerName: r.customer_name, customerPhone: r.customer_phone || '',
  customerAddress: r.customer_address || '', items: r.items || [],
  deliveryCharge: Number(r.delivery_charge), packagingCharge: r.packaging_charge ? Number(r.packaging_charge) : undefined,
  codCharge: r.cod_charge ? Number(r.cod_charge) : undefined,
  totalSellingPrice: Number(r.total_selling_price), totalResellerCost: Number(r.total_reseller_cost),
  totalProfit: Number(r.total_profit), status: r.status, date: r.date || '',
  notes: r.notes || [],
});

const mapPayment = (r: any): PaymentRequest => ({
  id: r.id, resellerId: r.reseller_id, resellerName: r.reseller_name || '',
  amount: Number(r.amount), method: r.method || '', accountNumber: r.account_number || '',
  status: r.status, date: r.date || '',
});

export const useResellerStore = create<ResellerStore>()((set, get) => ({
  resellers: [],
  orders: [],
  paymentRequests: [],
  loading: false,

  fetchResellers: async () => {
    set({ loading: true });
    const { data } = await db.from('resellers').select('*');
    if (data) set({ resellers: data.map(mapReseller) });
    set({ loading: false });
  },

  fetchResellerOrders: async () => {
    const { data } = await db.from('reseller_orders').select('*');
    if (data) set({ orders: data.map(mapOrder) });
  },

  fetchPaymentRequests: async () => {
    const { data } = await db.from('payment_requests').select('*');
    if (data) set({ paymentRequests: data.map(mapPayment) });
  },

  addReseller: async (r) => {
    const { error } = await db.from('resellers').insert({
      id: r.id, name: r.name, email: r.email, phone: r.phone,
      password: r.password, is_active: r.isActive, created_at: r.createdAt, balance: r.balance,
      approval_status: r.approvalStatus || 'approved', deactivation_note: r.deactivationNote || '',
    });
    if (!error) set((s) => ({ resellers: [...s.resellers, r] }));
  },

  updateReseller: async (id, updates) => {
    const row: any = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.phone !== undefined) row.phone = updates.phone;
    if (updates.password !== undefined) row.password = updates.password;
    if (updates.isActive !== undefined) row.is_active = updates.isActive;
    if (updates.balance !== undefined) row.balance = updates.balance;
    if (updates.approvalStatus !== undefined) row.approval_status = updates.approvalStatus;
    if (updates.deactivationNote !== undefined) row.deactivation_note = updates.deactivationNote;
    const { error } = await db.from('resellers').update(row).eq('id', id);
    if (!error) set((s) => ({ resellers: s.resellers.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
  },

  loginReseller: (email, password) => {
    return get().resellers.find((r) => r.email === email && r.password === password && r.isActive && r.approvalStatus === 'approved') || null;
  },

  addResellerOrder: async (order) => {
    const { error } = await db.from('reseller_orders').insert({
      id: order.id, reseller_id: order.resellerId, reseller_name: order.resellerName,
      customer_name: order.customerName, customer_phone: order.customerPhone,
      customer_address: order.customerAddress, items: order.items,
      delivery_charge: order.deliveryCharge, packaging_charge: order.packagingCharge || 0,
      cod_charge: order.codCharge || 0, total_selling_price: order.totalSellingPrice,
      total_reseller_cost: order.totalResellerCost, total_profit: order.totalProfit,
      status: order.status, date: order.date, notes: order.notes || [],
    });
    if (!error) set((s) => ({ orders: [order, ...s.orders] }));
  },

  updateResellerOrderStatus: async (orderId, status) => {
    const { error } = await db.from('reseller_orders').update({ status }).eq('id', orderId);
    if (!error) set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }));
  },

  updateResellerOrder: async (orderId, updates) => {
    const row: any = {};
    if (updates.customerName !== undefined) row.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) row.customer_phone = updates.customerPhone;
    if (updates.customerAddress !== undefined) row.customer_address = updates.customerAddress;
    if (updates.items !== undefined) row.items = updates.items;
    if (updates.totalSellingPrice !== undefined) row.total_selling_price = updates.totalSellingPrice;
    if (updates.totalResellerCost !== undefined) row.total_reseller_cost = updates.totalResellerCost;
    if (updates.totalProfit !== undefined) row.total_profit = updates.totalProfit;
    if (updates.deliveryCharge !== undefined) row.delivery_charge = updates.deliveryCharge;
    if (updates.packagingCharge !== undefined) row.packaging_charge = updates.packagingCharge;
    if (updates.codCharge !== undefined) row.cod_charge = updates.codCharge;
    const { error } = await db.from('reseller_orders').update(row).eq('id', orderId);
    if (!error) set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o)) }));
    return error ? Promise.reject(error) : Promise.resolve();
  },

  addPaymentRequest: async (req) => {
    const { error } = await db.from('payment_requests').insert({
      id: req.id, reseller_id: req.resellerId, reseller_name: req.resellerName,
      amount: req.amount, method: req.method, account_number: req.accountNumber,
      status: req.status, date: req.date,
    });
    if (!error) set((s) => ({ paymentRequests: [req, ...s.paymentRequests] }));
  },

  updatePaymentRequest: async (id, status) => {
    const { error } = await db.from('payment_requests').update({ status }).eq('id', id);
    if (!error) {
      const s = get();
      const req = s.paymentRequests.find((p) => p.id === id);
      if (!req) return;
      const updated = s.paymentRequests.map((p) => (p.id === id ? { ...p, status } : p));
      if (status === 'অনুমোদিত' && req.status === 'পেন্ডিং') {
        const resellers = s.resellers.map((r) =>
          r.id === req.resellerId ? { ...r, balance: r.balance - req.amount } : r
        );
        await db.from('resellers').update({ balance: resellers.find(r => r.id === req.resellerId)?.balance }).eq('id', req.resellerId);
        set({ paymentRequests: updated, resellers });
      } else {
        set({ paymentRequests: updated });
      }
    }
  },

  getResellerBalance: (resellerId) => {
    const orders = get().orders.filter((o) => o.resellerId === resellerId);
    const totalProfit = orders.reduce((sum, o) => sum + o.totalProfit, 0);
    const approvedPayments = get().paymentRequests
      .filter((p) => p.resellerId === resellerId && p.status === 'অনুমোদিত')
      .reduce((sum, p) => sum + p.amount, 0);
    return totalProfit - approvedPayments;
  },

  getWithdrawableBalance: (resellerId) => {
    const orders = get().orders.filter((o) => o.resellerId === resellerId && o.status === 'ডেলিভারড');
    const deliveredProfit = orders.reduce((sum, o) => sum + o.totalProfit, 0);
    const approvedPayments = get().paymentRequests
      .filter((p) => p.resellerId === resellerId && p.status === 'অনুমোদিত')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = get().paymentRequests
      .filter((p) => p.resellerId === resellerId && p.status === 'পেন্ডিং')
      .reduce((sum, p) => sum + p.amount, 0);
    return deliveredProfit - approvedPayments - pendingPayments;
  },
}));
