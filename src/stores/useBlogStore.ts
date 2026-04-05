import { create } from 'zustand';
import { BlogPost } from '@/data/store-data';
import { db } from '@/lib/supabase-db';

interface BlogStore {
  posts: BlogPost[];
  loading: boolean;
  initialized: boolean;
  fetchPosts: () => Promise<void>;
  fetchPostBySlug: (slug: string, type?: string) => Promise<BlogPost | null>;
  addPost: (post: BlogPost) => Promise<void>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const mapRow = (r: any): BlogPost => ({
  id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt || '',
  content: r.content || '', image: r.image || '', galleryImages: r.gallery_images || [],
  date: r.date || '', author: r.author || '', category: r.category || '',
  type: r.type || 'post', status: r.status || 'published',
  metaDescription: r.meta_description, metaKeywords: r.meta_keywords,
});

const toRow = (p: Partial<BlogPost>) => {
  const r: any = {};
  if (p.id !== undefined) r.id = p.id;
  if (p.title !== undefined) r.title = p.title;
  if (p.slug !== undefined) r.slug = p.slug;
  if (p.excerpt !== undefined) r.excerpt = p.excerpt;
  if (p.content !== undefined) r.content = p.content;
  if (p.image !== undefined) r.image = p.image;
  if (p.galleryImages !== undefined) r.gallery_images = p.galleryImages;
  if (p.date !== undefined) r.date = p.date;
  if (p.author !== undefined) r.author = p.author;
  if (p.category !== undefined) r.category = p.category;
  if (p.type !== undefined) r.type = p.type;
  if (p.status !== undefined) r.status = p.status;
  if (p.metaDescription !== undefined) r.meta_description = p.metaDescription;
  if (p.metaKeywords !== undefined) r.meta_keywords = p.metaKeywords;
  return r;
};

export const useBlogStore = create<BlogStore>()((set, get) => ({
  posts: [],
  loading: false,
  initialized: false,

  fetchPosts: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const { data, error } = await db.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (!error && data) set({ posts: data.map(mapRow), initialized: true });
    set({ loading: false });
  },

  fetchPostBySlug: async (slug: string, type?: string) => {
    const existing = get().posts.find((p) => p.slug === slug && (!type || p.type === type));
    if (existing) return existing;
    let query = db.from('blog_posts').select('*').eq('slug', slug);
    if (type) query = query.eq('type', type);
    const { data, error } = await query.limit(1);
    if (!error && data && data.length > 0) {
      const post = mapRow(data[0]);
      set((s) => {
        if (s.posts.find((p) => p.id === post.id)) return s;
        return { posts: [...s.posts, post] };
      });
      return post;
    }
    return null;
  },

  addPost: async (post) => {
    const { error } = await db.from('blog_posts').insert(toRow(post));
    if (!error) set((s) => ({ posts: [post, ...s.posts] }));
  },

  updatePost: async (id, updates) => {
    const { error } = await db.from('blog_posts').update(toRow(updates)).eq('id', id);
    if (!error) set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
  },

  deletePost: async (id) => {
    const { error } = await db.from('blog_posts').delete().eq('id', id);
    if (!error) set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
  },
}));
