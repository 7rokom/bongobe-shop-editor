import { useEffect } from 'react';
import { useProductStore } from '@/stores/useProductStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';
import { useBlogStore } from '@/stores/useBlogStore';


/**
 * Public-only data initializer — loads products, categories, settings.
 * Admin data is loaded lazily inside AdminLayout.
 */
const DataInitializer = () => {
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchSiteSettings = useSiteSettingsStore((s) => s.fetchSettings);
  const fetchFraudSettings = useFraudSettingsStore((s) => s.fetchSettings);
  const fetchPosts = useBlogStore((s) => s.fetchPosts);

  useEffect(() => {
    fetchSiteSettings();
    fetchFraudSettings();

    if (!isSupabaseConfigured) {
      console.log('Supabase not configured — skipping data fetch');
      return;
    }

    // Only fetch what's needed for public pages
    fetchProducts();
    fetchCategories();
    fetchPosts();
  }, []);

  return null;
};

export default DataInitializer;
