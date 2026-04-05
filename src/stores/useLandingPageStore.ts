import { create } from 'zustand';
import { db } from '@/lib/supabase-db';

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  productId: string;
  status: 'published' | 'draft';
  createdAt: string;
}

interface LandingPageStore {
  pages: LandingPage[];
  loading: boolean;
  fetchPages: () => Promise<void>;
  addPage: (page: Omit<LandingPage, 'createdAt'>) => Promise<void>;
  updatePage: (id: string, data: Partial<LandingPage>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  getPageBySlug: (slug: string) => LandingPage | undefined;
}

export const useLandingPageStore = create<LandingPageStore>((set, get) => ({
  pages: [],
  loading: false,

  fetchPages: async () => {
    set({ loading: true });
    const { data, error } = await db.from('landing_pages').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      set({
        pages: data.map((r: any) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          productId: r.product_id,
          status: r.status || 'published',
          createdAt: r.created_at,
        })),
      });
    }
    set({ loading: false });
  },

  addPage: async (page) => {
    const { error } = await db.from('landing_pages').insert({
      id: page.id,
      title: page.title,
      slug: page.slug,
      product_id: page.productId,
      status: page.status,
    });
    if (!error) {
      set((s) => ({ pages: [{ ...page, createdAt: new Date().toISOString() }, ...s.pages] }));
    }
  },

  updatePage: async (id, data) => {
    const dbData: any = {};
    if (data.title !== undefined) dbData.title = data.title;
    if (data.slug !== undefined) dbData.slug = data.slug;
    if (data.productId !== undefined) dbData.product_id = data.productId;
    if (data.status !== undefined) dbData.status = data.status;
    const { error } = await db.from('landing_pages').update(dbData).eq('id', id);
    if (!error) {
      set((s) => ({
        pages: s.pages.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }));
    }
  },

  deletePage: async (id) => {
    const { error } = await db.from('landing_pages').delete().eq('id', id);
    if (!error) {
      set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }));
    }
  },

  getPageBySlug: (slug) => get().pages.find((p) => p.slug === slug),
}));
