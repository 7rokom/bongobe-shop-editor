import { create } from 'zustand';
import { db } from '@/lib/supabase-db';
import { normalizePhone } from '@/lib/order-validation';

export type BlockType = 'phone' | 'ip' | 'fingerprint';

export interface BlockedEntry {
  id: string;
  type: BlockType;
  value: string;
  customer_name?: string;
  reason?: string;
  blocked_at: string;
  linked_group?: string;
}

interface BlockStore {
  blockedList: BlockedEntry[];
  loading: boolean;
  fetchBlocked: () => Promise<void>;
  blockCustomerFull: (data: { phone: string; ip?: string; fingerprint?: string; customerName?: string; reason?: string }) => Promise<void>;
  blockCustomer: (entry: { type: BlockType; value: string; customerName?: string; reason?: string }) => Promise<void>;
  unblockCustomer: (id: string) => Promise<void>;
  unblockGroup: (groupId: string) => Promise<void>;
  isPhoneBlocked: (phone: string) => boolean;
  checkBlockedRemote: (phone: string, ip?: string, fingerprint?: string) => Promise<boolean>;
}

export const useBlockStore = create<BlockStore>()((set, get) => ({
  blockedList: [],
  loading: false,

  fetchBlocked: async () => {
    set({ loading: true });
    try {
      const { data } = await db.from('blocked_customers').select('*').order('blocked_at', { ascending: false });
      set({ blockedList: data || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  blockCustomer: async (entry) => {
    const existing = get().blockedList.find(b => b.type === entry.type && b.value === entry.value);
    if (existing) return;
    const newEntry = {
      id: crypto.randomUUID(),
      type: entry.type,
      value: entry.value,
      customer_name: entry.customerName || null,
      reason: entry.reason || null,
      blocked_at: new Date().toISOString(),
    };
    await db.from('blocked_customers').insert(newEntry);
    set(s => ({ blockedList: [newEntry as BlockedEntry, ...s.blockedList] }));
  },

  blockCustomerFull: async ({ phone, ip, fingerprint, customerName, reason }) => {
    const groupId = crypto.randomUUID();
    const now = new Date().toISOString();
    const list = get().blockedList;
    const newEntries: any[] = [];

    if (phone && !list.some(b => b.type === 'phone' && b.value === phone)) {
      newEntries.push({ id: crypto.randomUUID(), type: 'phone', value: phone, customer_name: customerName, reason, blocked_at: now, linked_group: groupId });
    }
    if (ip && !list.some(b => b.type === 'ip' && b.value === ip)) {
      newEntries.push({ id: crypto.randomUUID(), type: 'ip', value: ip, customer_name: customerName, reason, blocked_at: now, linked_group: groupId });
    }
    if (fingerprint && !list.some(b => b.type === 'fingerprint' && b.value === fingerprint)) {
      newEntries.push({ id: crypto.randomUUID(), type: 'fingerprint', value: fingerprint, customer_name: customerName, reason, blocked_at: now, linked_group: groupId });
    }

    if (newEntries.length > 0) {
      await db.from('blocked_customers').insert(newEntries);
      set(s => ({ blockedList: [...newEntries, ...s.blockedList] }));
    }
  },

  unblockCustomer: async (id) => {
    await db.from('blocked_customers').delete().eq('id', id);
    set(s => ({ blockedList: s.blockedList.filter(b => b.id !== id) }));
  },

  unblockGroup: async (groupId) => {
    await db.from('blocked_customers').delete().eq('linked_group', groupId);
    set(s => ({ blockedList: s.blockedList.filter(b => b.linked_group !== groupId) }));
  },

  isPhoneBlocked: (phone) => get().blockedList.some(b => b.type === 'phone' && b.value === phone),

  // This checks against Supabase directly — used by customer-facing checkout
    checkBlockedRemote: async (phone, ip, fingerprint) => {
    try {
      const orParts: string[] = [];
        const normalizedPhone = phone ? normalizePhone(phone) : '';

        if (normalizedPhone) orParts.push(`and(type.eq.phone,value.eq.${normalizedPhone})`);
      if (ip) orParts.push(`and(type.eq.ip,value.eq.${ip})`);
      if (fingerprint) orParts.push(`and(type.eq.fingerprint,value.eq.${fingerprint})`);

      if (orParts.length === 0) return false;

      const { data, error } = await db
        .from('blocked_customers')
        .select('id')
        .or(orParts.join(','))
        .limit(1);

      if (error) return false;
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  },
}));
