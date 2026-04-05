import { create } from 'zustand';
import { Category } from '@/data/store-data';
import { db } from '@/lib/supabase-db';

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>()((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    const { data, error } = await db.from('categories').select('*');
    if (!error && data) {
      set({
        categories: data.map((r: any) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          icon: r.icon || '',
          productCount: r.product_count || 0,
        })),
      });
    }
    set({ loading: false });
  },

  addCategory: async (cat) => {
    const { error } = await db.from('categories').insert({
      id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon, product_count: cat.productCount,
    });
    if (!error) set((s) => ({ categories: [...s.categories, cat] }));
  },

  deleteCategory: async (id) => {
    const { error } = await db.from('categories').delete().eq('id', id);
    if (!error) set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  updateCategory: async (id, updates) => {
    const row: any = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.slug !== undefined) row.slug = updates.slug;
    if (updates.icon !== undefined) row.icon = updates.icon;
    if (updates.productCount !== undefined) row.product_count = updates.productCount;
    const { error } = await db.from('categories').update(row).eq('id', id);
    if (!error) set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
  },
}));
