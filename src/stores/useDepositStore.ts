import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface Deposit {
  id: string;
  title: string;
  source: string;
  amount: number;
  note: string;
  date: string;
}

export const depositSources = [
  'মূল ইনভেস্ট', 'সার্কেল ইনভেস্ট', 'নিজস্ব বিনিয়োগ', 'পার্টনার বিনিয়োগ', 'ব্যাংক লোন',
  'বিক্রয় আয়', 'রিটার্ন রিফান্ড', 'অন্যান্য',
];

interface DepositStore {
  deposits: Deposit[];
  loading: boolean;
  fetchDeposits: () => Promise<void>;
  addDeposit: (deposit: Deposit) => Promise<void>;
  updateDeposit: (id: string, updates: Partial<Deposit>) => Promise<void>;
  deleteDeposit: (id: string) => Promise<void>;
}

export const useDepositStore = create<DepositStore>()((set) => ({
  deposits: [],
  loading: false,

  fetchDeposits: async () => {
    set({ loading: true });
    const { data, error } = await db.from('deposits').select('*');
    if (!error && data) set({ deposits: data.map((r: any) => ({ id: r.id, title: r.title, source: r.source || '', amount: Number(r.amount), note: r.note || '', date: r.date || '' })) });
    set({ loading: false });
  },

  addDeposit: async (deposit) => {
    const { error } = await db.from('deposits').insert(deposit);
    if (!error) set((s) => ({ deposits: [deposit, ...s.deposits] }));
  },

  updateDeposit: async (id, updates) => {
    const { error } = await db.from('deposits').update(updates).eq('id', id);
    if (!error) set((s) => ({ deposits: s.deposits.map((d) => (d.id === id ? { ...d, ...updates } : d)) }));
  },

  deleteDeposit: async (id) => {
    const { error } = await db.from('deposits').delete().eq('id', id);
    if (!error) set((s) => ({ deposits: s.deposits.filter((d) => d.id !== id) }));
  },
}));
