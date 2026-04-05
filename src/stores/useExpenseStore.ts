import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  note: string;
  date: string;
  employeeId?: string;
}

export const expenseCategories = [
  'বিজ্ঞাপন খরচ', 'কুরিয়ার খরচ', 'প্যাকেজিং খরচ', 'অফিস খরচ',
  'বেতন', 'ভাড়া', 'ইন্টারনেট ও ফোন', 'পণ্য ক্রয়', 'পরিবহন',
  'রক্ষণাবেক্ষণ', 'রিসেলার পেমেন্ট', 'টিম মেম্বার পেমেন্ট', 'অন্যান্য',
];

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>()((set) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async () => {
    set({ loading: true });
    const { data, error } = await db.from('expenses').select('*');
    if (!error && data) set({ expenses: data.map((r: any) => ({ id: r.id, title: r.title, category: r.category || '', amount: Number(r.amount), note: r.note || '', date: r.date || '', employeeId: r.employee_id || undefined })) });
    set({ loading: false });
  },

  addExpense: async (expense) => {
    const row: any = { id: expense.id, title: expense.title, category: expense.category, amount: expense.amount, note: expense.note, date: expense.date };
    if (expense.employeeId) row.employee_id = expense.employeeId;
    const { error } = await db.from('expenses').insert(row);
    if (!error) set((s) => ({ expenses: [expense, ...s.expenses] }));
  },

  updateExpense: async (id, updates) => {
    const row: any = { ...updates };
    if ('employeeId' in updates) { row.employee_id = updates.employeeId; delete row.employeeId; }
    const { error } = await db.from('expenses').update(row).eq('id', id);
    if (!error) set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
  },

  deleteExpense: async (id) => {
    const { error } = await db.from('expenses').delete().eq('id', id);
    if (!error) set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },
}));
