import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useProductStore } from "@/stores/useProductStore";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import SEOHead, { DOMAIN } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

const ITEMS_PER_PAGE = 20;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [sortBy, setSortBy] = useState("default");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const searchQuery = searchParams.get("q") || "";

  const publishedProducts = useMemo(() => products.filter(p => (p.status || 'published') === 'published'), [products]);

  const matchingCat = categories.find(c => c.slug === activeCategory);
  const activeCatName = matchingCat?.name || '';

  const filtered = useMemo(() => {
    let result = activeCategory
      ? publishedProducts.filter((p) => {
          if (!p.category) return false;
          const cats = p.category.split(', ').map((c: string) => c.trim());
          return cats.includes(activeCategory) || cats.includes(activeCatName);
        })
      : publishedProducts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q)
      );
    }

    if (sortBy === "low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "high") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [publishedProducts, activeCategory, activeCatName, searchQuery, sortBy]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [activeCategory, sortBy, searchQuery]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Infinite scroll observer
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { rootMargin: "200px" }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  const SidebarContent = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">ক্যাটাগরি</h3>
      <div className="space-y-1">
        <Button
          variant={!activeCategory ? "default" : "ghost"}
          size="sm"
          className="w-full justify-start rounded-lg text-xs"
          onClick={() => { setSearchParams({}); setFilterOpen(false); }}
        >
          সকল পণ্য
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.slug ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start rounded-lg text-xs gap-2"
            onClick={() => { setSearchParams({ category: cat.slug }); setFilterOpen(false); }}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-semibold mb-2">সর্ট করুন</h3>
        <div className="space-y-1">
          {[
            { value: "default", label: "ডিফল্ট" },
            { value: "low", label: "কম দাম" },
            { value: "high", label: "বেশি দাম" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={sortBy === opt.value ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start rounded-lg text-xs"
              onClick={() => { setSortBy(opt.value); setFilterOpen(false); }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const shopTitle = activeCatName ? `${activeCatName} — BongoBe` : 'সকল পণ্য — BongoBe';
  const breadcrumbItems = activeCatName ? [{ label: 'শপ', href: '/shop' }, { label: activeCatName }] : [{ label: 'শপ' }];

  return (
    <div className="bg-white min-h-screen">
      <SEOHead title={shopTitle} description={`${activeCatName || 'সকল'} পণ্য কিনুন BongoBe থেকে। সেরা দামে অনলাইনে অর্ডার করুন।`} canonical={`${DOMAIN}/shop${activeCategory ? `?category=${activeCategory}` : ''}`} />
      <div className="container-box py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-56 flex-shrink-0">
            <div className="bg-card rounded-2xl p-4 shadow-sm sticky top-32">
              <SidebarContent />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{filtered.length}টি পণ্য পাওয়া গেছে</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px]">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                এই ক্যাটাগরিতে কোন পণ্য পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(true)}
        className="lg:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground rounded-[5px] p-3 shadow-lg flex items-center gap-2 text-[16px] font-semibold"
      >
        <SlidersHorizontal className="h-5 w-5" />
        ফিল্টার
      </button>

      {/* Mobile Filter Popup */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">ফিল্টার ও সর্ট</h2>
              <button onClick={() => setFilterOpen(false)} className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
