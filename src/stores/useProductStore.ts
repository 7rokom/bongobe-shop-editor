import { create } from 'zustand';
import { Product } from '@/data/store-data';
import { db } from '@/lib/supabase-db';

interface ProductStore {
  products: Product[];
  loading: boolean;
  initialized: boolean;
  fetchProducts: () => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<Product | null>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductsByCategory: (categorySlug: string) => Product[];
  getRelatedProducts: (productId: string, category: string) => Product[];
}

const mapRowToProduct = (row: any): Product => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  shortDescription: row.short_description || '',
  longDescription: row.long_description || '',
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  buyPrice: row.buy_price ? Number(row.buy_price) : undefined,
  resellerPrice: row.reseller_price ? Number(row.reseller_price) : undefined,
  images: row.images || [],
  featuredImage: row.featured_image,
  featuredVideo: row.featured_video,
  category: row.category || '',
  colors: row.colors || [],
  sizes: row.sizes || [],
  weights: row.weights || [],
  variationPrices: row.variation_prices || [],
  variations: row.variations || [],
  metaDescription: row.meta_description,
  metaKeywords: row.meta_keywords,
  stockType: row.stock_type as 'self' | 'vendor' | undefined,
  stockProductName: row.stock_product_name,
  status: row.status as 'published' | 'draft' | undefined,
  inStock: row.in_stock ?? true,
  rating: Number(row.rating) || 0,
  reviewCount: row.review_count || 0,
  reviews: row.reviews || [],
  freeDelivery: row.free_delivery ?? false,
});

const mapProductToRow = (p: Partial<Product>) => {
  const row: any = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.title !== undefined) row.title = p.title;
  if (p.slug !== undefined) row.slug = p.slug;
  if (p.shortDescription !== undefined) row.short_description = p.shortDescription;
  if (p.longDescription !== undefined) row.long_description = p.longDescription;
  if (p.price !== undefined) row.price = p.price;
  if (p.originalPrice !== undefined) row.original_price = p.originalPrice;
  if (p.buyPrice !== undefined) row.buy_price = p.buyPrice;
  if (p.resellerPrice !== undefined) row.reseller_price = p.resellerPrice;
  if (p.images !== undefined) row.images = p.images;
  if (p.featuredImage !== undefined) row.featured_image = p.featuredImage;
  if (p.featuredVideo !== undefined) row.featured_video = p.featuredVideo;
  if (p.category !== undefined) row.category = p.category;
  
  if (p.colors !== undefined) row.colors = p.colors;
  if (p.sizes !== undefined) row.sizes = p.sizes;
  if (p.weights !== undefined) row.weights = p.weights;
  if (p.variationPrices !== undefined) row.variation_prices = p.variationPrices;
  if (p.variations !== undefined) row.variations = p.variations;
  if (p.metaDescription !== undefined) row.meta_description = p.metaDescription;
  if (p.metaKeywords !== undefined) row.meta_keywords = p.metaKeywords;
  if (p.stockType !== undefined) row.stock_type = p.stockType;
  if (p.stockProductName !== undefined) row.stock_product_name = p.stockProductName;
  if (p.status !== undefined) row.status = p.status;
  if (p.inStock !== undefined) row.in_stock = p.inStock;
  if (p.rating !== undefined) row.rating = p.rating;
  if (p.reviewCount !== undefined) row.review_count = p.reviewCount;
  if (p.reviews !== undefined) row.reviews = p.reviews;
  if (p.freeDelivery !== undefined) row.free_delivery = p.freeDelivery;
  return row;
};

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  loading: false,
  initialized: false,

  fetchProducts: async () => {
    if (get().initialized) return;
    set({ loading: true });
    const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      set({ products: data.map(mapRowToProduct), initialized: true });
    }
    set({ loading: false });
  },

  fetchProductBySlug: async (slug: string) => {
    // Check local store first
    const existing = get().products.find((p) => p.slug === slug);
    if (existing) return existing;
    // Direct DB query
    const { data, error } = await db.from('products').select('*').eq('slug', slug).limit(1);
    if (!error && data && data.length > 0) {
      const product = mapRowToProduct(data[0]);
      // Merge into store if not already there
      set((state) => {
        if (state.products.find((p) => p.id === product.id)) return state;
        return { products: [...state.products, product] };
      });
      return product;
    }
    return null;
  },

  addProduct: async (product) => {
    const row = mapProductToRow(product);
    const { error } = await db.from('products').insert(row);
    if (!error) {
      set((state) => ({ products: [product, ...state.products] }));
    }
  },

  updateProduct: async (id, updates) => {
    const row = mapProductToRow(updates);
    const { error } = await db.from('products').update(row).eq('id', id);
    if (!error) {
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    }
  },

  deleteProduct: async (id) => {
    const { error } = await db.from('products').delete().eq('id', id);
    if (!error) {
      set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    }
  },

  getProductBySlug: (slug) => get().products.find((p) => p.slug === slug),
  getProductsByCategory: (categorySlug) => get().products.filter((p) => p.category === categorySlug),
  getRelatedProducts: (productId, category) =>
    get().products.filter((p) => p.category === category && p.id !== productId).slice(0, 6),
}));
