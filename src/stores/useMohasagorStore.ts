import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getMarkedUpResellerPrice } from '@/lib/reseller-markup';
import type { Product } from '@/data/store-data';

interface MohasagorStore {
  products: Product[];
  loading: boolean;
  fetched: boolean;
  fetchProducts: () => Promise<void>;
}

const mapProduct = (item: any): Product => {
  const resellingPrice = Number(item.reselling_price) || 0;
  const salePrice = Number(item.sale_price) || Number(item.price) || 0;
  const originalPrice = Number(item.price) || 0;

  // Build images array
  const images: string[] = [];
  if (item.product_image) {
    if (Array.isArray(item.product_image)) {
      item.product_image.forEach((img: any) => {
        if (typeof img === 'string') images.push(img);
        else if (img?.image) images.push(img.image);
      });
    }
  }
  const featuredImage = item.thumbnail_img || images[0] || '';

  return {
    id: `mohasagor-${item.id || item.slug}`,
    title: item.name || '',
    slug: `mohasagor-${item.slug || item.id}`,
    shortDescription: item.short_description || item.description || '',
    longDescription: item.description || '',
    price: salePrice,
    originalPrice: originalPrice > salePrice ? originalPrice : undefined,
    resellerPrice: getMarkedUpResellerPrice(resellingPrice),
    images: images.length ? images : [featuredImage],
    featuredImage,
    category: item.category?.name || 'Mohasagor',
    inStock: item.in_stock !== false && item.stock !== 0,
    rating: Number(item.rating) || 4.5,
    reviewCount: Number(item.review_count) || 0,
    status: 'published',
  };
};

export const useMohasagorStore = create<MohasagorStore>()((set, get) => ({
  products: [],
  loading: false,
  fetched: false,

  fetchProducts: async () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mohasagor-products');
      if (error) throw error;
      
      // Handle different response structures
      const items = Array.isArray(data) ? data : (data?.data || data?.products || []);
      const products = items.map(mapProduct);
      set({ products, fetched: true });
    } catch (err) {
      console.error('Failed to fetch Mohasagor products:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
