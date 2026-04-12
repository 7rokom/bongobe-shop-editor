import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useProductStore } from "@/stores/useProductStore";
import { useSiteSettingsStore } from "@/stores/useSiteSettingsStore";
import { Link } from "react-router-dom";
import { Store, Truck, RotateCcw, Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useMemo, memo, useEffect, useState } from "react";
import SEOHead, { DOMAIN } from "@/components/SEOHead";
import { db } from "@/lib/supabase-db";

const ProductCarousel = memo(({ products }: { products: any[] }) => {
  const plugin = useMemo(() => Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true }), []);

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[plugin]}
      className="w-full"
    >
      <CarouselContent className="-ml-[10px] pt-[5px]">
        {products.map((product) => (
          <CarouselItem key={product.id} className="pl-[10px] basis-1/2 sm:basis-1/3 lg:basis-1/5">
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
});
ProductCarousel.displayName = "ProductCarousel";

// Category color palette for visual cards
const categoryColors = [
  "from-orange-400 to-amber-500",
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-yellow-400 to-orange-500",
  "from-teal-400 to-emerald-500",
  "from-purple-400 to-fuchsia-500",
  "from-cyan-400 to-blue-500",
  "from-red-400 to-pink-500",
];

const Index = () => {
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const { siteName, siteMetaDescription } = useSiteSettingsStore();
  const publishedProducts = useMemo(() => products.filter(p => (p.status || 'published') === 'published'), [products]);

  // Fetch top selling products based on actual order data
  const [topSellingIds, setTopSellingIds] = useState<string[]>([]);
  useEffect(() => {
    const fetchTopSelling = async () => {
      try {
        const { data: orders, error } = await db.from('orders').select('items').not('status', 'eq', 'ক্যান্সেল');
        if (error || !orders) return;
        const salesCount: Record<string, number> = {};
        for (const order of orders) {
          const items = order.items as any[];
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const name = item.name || '';
            if (name) {
              salesCount[name] = (salesCount[name] || 0) + (item.qty || 1);
            }
          }
        }
        const sorted = Object.entries(salesCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name);
        setTopSellingIds(sorted);
      } catch (e) { /* ignore */ }
    };
    fetchTopSelling();
  }, []);

  const topSelling = useMemo(() => {
    if (topSellingIds.length === 0) return publishedProducts.slice(0, 10);
    const result: typeof publishedProducts = [];
    for (const name of topSellingIds) {
      const p = publishedProducts.find(prod => prod.title === name);
      if (p) result.push(p);
    }
    if (result.length < 10) {
      for (const p of publishedProducts) {
        if (result.length >= 10) break;
        if (!result.find(r => r.id === p.id)) result.push(p);
      }
    }
    return result;
  }, [topSellingIds, publishedProducts]);

  const seoJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName || 'BongoBe',
    url: DOMAIN,
    potentialAction: { '@type': 'SearchAction', target: `${DOMAIN}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }), [siteName]);

  return (
    <div className="bg-background">
      <SEOHead
        title={`${siteName || 'BongoBe'} — বাংলাদেশের সেরা অনলাইন শপিং`}
        description={siteMetaDescription || 'বাংলাদেশের বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। সেরা মানের পণ্য, দ্রুত ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা।'}
        canonical={DOMAIN}
        ogType="website"
        jsonLd={seoJsonLd}
      />
      <HeroSection />

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-8 bg-background">
          <div className="container-box">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                <span className="text-foreground">{categories.length} </span>
                <span className="text-primary">Categories</span>
                <span className="text-foreground"> of </span>
                <span className="text-primary">{siteName || '7Rokom'}</span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1">সাত প্রকারের নানান ক্যাটেগরি!</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className={`relative overflow-hidden rounded-xl h-[120px] sm:h-[150px] bg-gradient-to-br ${categoryColors[idx % categoryColors.length]} group transition-transform hover:scale-[1.02] shadow-md`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="relative z-10 p-4 h-full flex items-start">
                    <div className="flex items-center gap-2">
                      {cat.icon && cat.icon.startsWith('fa') ? (
                        <i className={`${cat.icon} text-xl text-white`} />
                      ) : (
                        <span className="text-xl">{cat.icon || '📦'}</span>
                      )}
                      <h3 className="text-white font-bold text-base sm:text-lg drop-shadow">{cat.name}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Selling Products */}
      {topSelling.length > 0 && (
        <section className="py-6 bg-background">
          <div className="container-box">
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Best Selling Products</h2>
              <div className="w-24 h-1 bg-primary mx-auto mt-2 rounded-full" />
            </div>
            <ProductCarousel products={topSelling} />
          </div>
        </section>
      )}

      {/* All Products */}
      {publishedProducts.length > 0 && (
        <section className="py-6 bg-background">
          <div className="container-box">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-primary">সকল প্রোডাক্ট</h2>
              <Link to="/shop" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                সব দেখুন →
              </Link>
            </div>
            <div className="border-t border-primary pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[10px]">
                {publishedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {publishedProducts.length === 0 && categories.length === 0 && (
        <section className="py-16 bg-background">
          <div className="container-box text-center text-muted-foreground">
            <Store className="h-16 w-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">এখনো কোনো পণ্য বা ক্যাটাগরি যোগ করা হয়নি।</p>
          </div>
        </section>
      )}

      {/* Trust bar */}
      <section className="py-6 bg-muted/50 border-t">
        <div className="container-box">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="h-7 w-7 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-foreground">Cash on Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw className="h-7 w-7 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-foreground">Easy Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Star className="h-7 w-7 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-foreground">Customer Satisfaction</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
