import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useProductStore } from "@/stores/useProductStore";
import { useSiteSettingsStore } from "@/stores/useSiteSettingsStore";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
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
          <CarouselItem key={product.id} className="pl-[10px] basis-1/2 sm:basis-1/4 lg:basis-1/6">
            <ProductCard product={product} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
});
ProductCarousel.displayName = "ProductCarousel";

const Index = () => {
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const { homepageSections, siteName, siteMetaDescription } = useSiteSettingsStore();
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
        const sorted = Object.entries(salesCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
        setTopSellingIds(sorted);
      } catch (e) { /* ignore */ }
    };
    fetchTopSelling();
  }, []);

  const topSelling = useMemo(() => {
    if (topSellingIds.length === 0) return publishedProducts.slice(0, 6);
    const result: typeof publishedProducts = [];
    for (const name of topSellingIds) {
      const p = publishedProducts.find(prod => prod.title === name);
      if (p) result.push(p);
    }
    // If less than 6, fill with other products
    if (result.length < 6) {
      for (const p of publishedProducts) {
        if (result.length >= 6) break;
        if (!result.find(r => r.id === p.id)) result.push(p);
      }
    }
    return result;
  }, [topSellingIds, publishedProducts]);

  const sortedSections = useMemo(() => [...homepageSections].sort((a, b) => a.order - b.order), [homepageSections]);

  const seoJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName || 'BongoBe',
    url: DOMAIN,
    potentialAction: { '@type': 'SearchAction', target: `${DOMAIN}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }), [siteName]);

  return (
    <div>
      <SEOHead
        title={`${siteName || 'BongoBe'} — বাংলাদেশের সেরা অনলাইন শপিং`}
        description={siteMetaDescription || 'বাংলাদেশের বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম। সেরা মানের পণ্য, দ্রুত ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা।'}
        canonical={DOMAIN}
        ogType="website"
        jsonLd={seoJsonLd}
      />
      <HeroSection />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-8 bg-white">
          <div className="container-box">
            <h2 className="text-2xl font-bold mb-6 text-center">ক্যাটাগরি</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-[5px] sm:gap-4">
              {categories.map((cat) => {
                return (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    className="bg-card rounded-[5px] p-3 sm:p-5 text-center border border-primary shadow-sm hover:shadow-[0_8px_20px_rgba(0,141,14,0.3)] hover:-translate-y-[5px] transition-all duration-300 group"
                  >
                    {cat.icon && cat.icon.startsWith('fa') ? (
                      <i className={`${cat.icon} text-2xl sm:text-3xl text-primary mb-2 inline-block group-hover:scale-110 transition-transform`} />
                    ) : (
                      <span className="text-2xl sm:text-3xl mb-2 inline-block">{cat.icon || '📦'}</span>
                    )}
                    <h3 className="text-sm sm:text-[18px] font-medium">{cat.name}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Top Selling */}
      {topSelling.length > 0 && (
        <section className="pt-[10px] pb-[10px] mt-0 mb-0 bg-white">
          <div className="container-box">
            <div className="flex items-end justify-between mb-1">
              <h2 className="text-xl font-bold text-primary">টপ সেলিং প্রোডাক্ট</h2>
              <Link to="/shop" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                সব দেখুন →
              </Link>
            </div>
            <div className="border-t border-primary pt-4">
              <ProductCarousel products={topSelling} />
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {publishedProducts.length === 0 && categories.length === 0 && (
        <section className="py-16 bg-white">
          <div className="container-box text-center text-muted-foreground">
            <Store className="h-16 w-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg">এখনো কোনো পণ্য বা ক্যাটাগরি যোগ করা হয়নি।</p>
          </div>
        </section>
      )}

      {/* Dynamic Category Sections from settings */}
      {sortedSections.map((section) => {
        const cat = categories.find((c) => c.slug === section.categorySlug);
        const catName = cat?.name || '';
        const catProducts = publishedProducts.filter(p => {
          if (!p.category) return false;
          const cats = p.category.split(', ').map((c: string) => c.trim());
          return cats.includes(section.categorySlug) || cats.includes(catName);
        }).slice(0, section.productCount);
        if (catProducts.length === 0) return null;
        const catData = categories.find(c => c.slug === section.categorySlug);
        const catIcon = catData?.icon || '';
        return (
          <section key={section.id} className="py-6 bg-white">
            <div className="container-box">
              <div className="flex items-end justify-between mb-1">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  {catIcon && catIcon.startsWith('fa') ? (
                    <i className={`${catIcon} text-lg`} />
                  ) : null}
                  {section.title}
                </h2>
                <Link to={`/shop?category=${section.categorySlug}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  সব দেখুন →
                </Link>
              </div>
              <div className="border-t border-primary pt-4">
                <ProductCarousel products={catProducts} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Index;
