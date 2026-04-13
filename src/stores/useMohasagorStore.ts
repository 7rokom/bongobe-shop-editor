import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getMarkedUpResellerPrice } from '@/lib/reseller-markup';
import type { Product } from '@/data/store-data';

interface MohasagorStore {
  products: Product[];
  categories: string[];
  loading: boolean;
  fetched: boolean;
  fetchProducts: () => Promise<void>;
}

const mapProduct = (item: any): Product => {
  const resellingPrice = Number(item.sale_price) || 0;
  const originalPrice = Number(item.price) || 0;

  const images: string[] = [];
  if (Array.isArray(item.product_images)) {
    item.product_images.forEach((img: any) => {
      if (img?.product_image) images.push(img.product_image);
    });
  }
  const featuredImage = item.thumbnail_img || images[0] || '';

  return {
    id: `mohasagor-${item.id}`,
    title: item.name || '',
    slug: `mohasagor-${item.slug || item.id}`,
    shortDescription: item.details?.substring(0, 150) || '',
    longDescription: item.details || '',
    price: originalPrice,
    originalPrice: originalPrice,
    resellerPrice: getMarkedUpResellerPrice(resellingPrice),
    images: images.length ? images : [featuredImage],
    featuredImage,
    category: item.category || 'Mohasagor',
    inStock: item.status === 'active',
    rating: 4.5,
    reviewCount: 0,
    status: 'published',
  };
};

export const useMohasagorStore = create<MohasagorStore>()((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  fetched: false,

  fetchProducts: async () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('mohasagor-products');
      if (error) throw error;

      const items = data?.products || (Array.isArray(data) ? data : []);
      const products = items.map(mapProduct);
      
      // Extract unique categories
      const categorySet = new Set<string>();
      products.forEach((p: Product) => {
        if (p.category && p.category !== 'Mohasagor') {
          categorySet.add(p.category);
        }
      });
      const categories = Array.from(categorySet).sort();
      
      // Reverse so newest items come first
      products.reverse();
      
      set({ products, categories, fetched: true });
    } catch (err) {
      console.error('Failed to fetch Mohasagor products:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
