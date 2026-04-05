import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface VariationItem {
  id: string;
  name: string;
  type: 'color' | 'size' | 'weight';
}

interface VariationStore {
  items: VariationItem[];
  loading: boolean;
  fetchVariations: () => Promise<void>;
  addItem: (item: VariationItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getByType: (type: 'color' | 'size' | 'weight') => VariationItem[];
}

export const useVariationStore = create<VariationStore>()((set, get) => ({
  items: [],
  loading: false,

  fetchVariations: async () => {
    set({ loading: true });
    const { data, error } = await db.from('variations').select('*');
    if (!error && data) {
      set({ items: data.map((r: any) => ({ id: r.id, name: r.name, type: r.type })) });
    }
    set({ loading: false });
  },

  addItem: async (item) => {
    const { error } = await db.from('variations').insert({ id: item.id, name: item.name, type: item.type });
    if (!error) set((s) => ({ items: [...s.items, item] }));
  },

  deleteItem: async (id) => {
    const { error } = await db.from('variations').delete().eq('id', id);
    if (!error) set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  getByType: (type) => get().items.filter((i) => i.type === type),
}));
