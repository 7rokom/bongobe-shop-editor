import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { useResellerRef } from "@/contexts/ResellerRefContext";
import { useProductStore } from "@/stores/useProductStore";
import { trackViewContent, trackAddToCart } from "@/lib/dataLayer";
import { useCartStore, useWishlistStore } from "@/stores/useStore";
import { useSiteSettingsStore } from "@/stores/useSiteSettingsStore";
import { useFraudBlockedStore } from "@/stores/useFraudBlockedStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, ShoppingCart, Phone, MessageCircle, Plus, Minus, Loader2, Eye, Star } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductTrustSidebar from "@/components/ProductTrustSidebar";
import SEOHead, { DOMAIN } from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

import { toast } from "@/hooks/use-toast";

const getHashNumber = (id: string, min: number, max: number): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return min + (Math.abs(hash) % (max - min + 1));
};

const useSalesCount = (productId: string) => {
  return useMemo(() => getHashNumber(productId, 1, 69), [productId]);
};

const CallWhatsAppButtons = () => {
  const phone = useSiteSettingsStore((s) => s.phone);
  const whatsappNumber = useSiteSettingsStore((s) => s.whatsappNumber);
  const waNumber = whatsappNumber?.replace(/^0/, '88') || '';
  return (
    <div className="flex items-center gap-[6px]">
      <a href={`tel:${phone}`} className="flex-1 min-w-0">
        <Button
          size="lg"
          className="w-full rounded-[5px] text-[16px] font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3"
        >
          <Phone className="h-4 w-4 shrink-0" />
          <span className="truncate">কলে অর্ডার করুন</span>
        </Button>
      </a>
      <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
        <Button
          size="lg"
          className="w-full rounded-[5px] text-[16px] font-bold gap-1.5 bg-[#25D366] text-white hover:bg-[#1da851] px-3"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">হোয়াটস্যাপ-এ অর্ডার করুন</span>
        </Button>
      </a>
    </div>
  );
};

const FakeReviewForm = () => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !comment.trim() || rating === 0) {
      toast({ title: 'সব ফিল্ড পূরণ করুন এবং রেটিং দিন', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
    setName('');
    setRating(0);
    setComment('');
  };

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center space-y-2">
        <span className="text-2xl">✅</span>
        <p className="text-sm text-foreground font-medium">
          প্রিয় গ্রাহক! আমরা আপনার রিভিউ গ্রহণ করেছি। আমাদের প্রতিনিধি রিভিউটি অপ্প্রভ করে দিলেই আপনার রিভিউ এখানে শো করবে।
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h4 className="font-bold text-foreground text-[16px]">কাস্টমার রিভিউ</h4>
      <p className="text-sm text-muted-foreground">নতুন রিভিউ যোগ করুন</p>
      <input
        type="text"
        placeholder="কাস্টমারের নাম"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
      />
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground mr-1">রেটিং:</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)}>
            <Star className={`w-5 h-5 cursor-pointer transition-colors ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`} />
          </button>
        ))}
      </div>
      <textarea
        placeholder="রিভিউ কমেন্ট লিখুন..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
      />
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSubmit}>
        <Plus className="w-4 h-4" />
        রিভিউ যোগ করুন
      </Button>
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const resellerRef = useResellerRef();
  const checkoutPath = resellerRef ? `/r/${resellerRef}/checkout` : '/checkout';
  const { getProductBySlug, getRelatedProducts, fetchProductBySlug } = useProductStore();
  const storeLoading = useProductStore((s) => s.loading);
  const initialized = useProductStore((s) => s.initialized);
  const product = getProductBySlug(slug || "");
  const [slugFetchDone, setSlugFetchDone] = useState(false);

  // Direct slug fetch for deep links / refresh
  useEffect(() => {
    if (!slug) return;
    if (product) { setSlugFetchDone(true); return; }
    fetchProductBySlug(slug).then(() => setSlugFetchDone(true));
  }, [slug]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [activeTab, setActiveTab] = useState("description");
  const tabsRef = useRef<HTMLDivElement>(null);
  const salesCount = useSalesCount(product?.id || '');

  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => product ? s.isInWishlist(product.id) : false);
  const isDeviceBlocked = useFraudBlockedStore((s) => s.isDeviceBlocked);

  // Track view_item event
  useEffect(() => {
    if (product) {
      trackViewContent({
        item_id: product.id,
        item_name: product.title,
        price: product.price,
        quantity: 1,
        item_category: product.category,
      });
    }
  }, [product?.id]);

  const loading = useProductStore((s) => s.loading);

  const allImages = useMemo(() => {
    if (!product) return ['/placeholder.svg'];
    const imgs: string[] = [];
    if (product.featuredImage) imgs.push(product.featuredImage);
    product.images.forEach((img) => {
      if (!imgs.includes(img)) imgs.push(img);
    });
    return imgs.length > 0 ? imgs : ['/placeholder.svg'];
  }, [product]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.price;
    const vp = product.variationPrices;
    if (vp && vp.length > 0) {
      if (selectedColor) {
        const cp = vp.find(v => v.variationType === 'color' && v.variationName === selectedColor);
        if (cp?.price) price = cp.price;
      }
      if (selectedSize) {
        const sp = vp.find(v => v.variationType === 'size' && v.variationName === selectedSize);
        if (sp?.price) price = sp.price;
      }
      if (selectedWeight) {
        const wp = vp.find(v => v.variationType === 'weight' && v.variationName === selectedWeight);
        if (wp?.price) price = wp.price;
      }
    }
    return price;
  }, [product, selectedColor, selectedSize, selectedWeight]);

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.metaDescription || product.shortDescription?.replace(/<[^>]*>/g, '').slice(0, 160),
      image: allImages,
      url: `${DOMAIN}/product/${product.slug}`,
      brand: { '@type': 'Brand', name: 'BongoBe' },
      offers: {
        '@type': 'Offer',
        price: currentPrice,
        priceCurrency: 'BDT',
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${DOMAIN}/product/${product.slug}`,
      },
      ...(product.reviews && product.reviews.length > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1),
          reviewCount: product.reviews.length,
        },
      } : {}),
    };
  }, [product, currentPrice, allImages]);

  if (!product) {
    if (!slugFetchDone || loading) {
      return (
        <div className="container-box py-20 text-center flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">একটু অপেক্ষা করুন🙏</h1>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="container-box py-20 text-center">
        <h1 className="text-2xl font-bold">পণ্যটি পাওয়া যায়নি</h1>
      </div>
    );
  }

  const related = getRelatedProducts(product.id, product.category);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasWeights = product.weights && product.weights.length > 0;

  const validateVariations = (): boolean => {
    const missing: string[] = [];
    if (hasColors && !selectedColor) missing.push('কালার');
    if (hasSizes && !selectedSize) missing.push('সাইজ');
    if (hasWeights && !selectedWeight) missing.push('ওজন');
    if (missing.length > 0) {
      toast({ title: `দয়া করে ${missing.join(', ')} সিলেক্ট করুন`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const breadcrumbItems = [
    { label: 'শপ', href: '/shop' },
    ...(product.category ? [{ label: product.category.split(',')[0].trim(), href: `/shop?category=${product.category.split(',')[0].trim()}` }] : []),
    { label: product.title },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={`${product.title} — BongoBe`}
        description={product.metaDescription || product.shortDescription?.replace(/<[^>]*>/g, '').slice(0, 160)}
        canonical={`${DOMAIN}/product/${product.slug}`}
        ogImage={product.featuredImage || allImages[0]}
        ogType="product"
        jsonLd={productJsonLd}
      />
      <div className="container-box pt-[15px] md:pt-[15px] lg:pt-[25px] pb-8">
        <Breadcrumbs items={breadcrumbItems} />
        {/* Product Main - 3 column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[35%_50%] gap-4 lg:gap-6 mb-10 items-start">
          
          {/* ===== IMAGE GALLERY ===== */}
          <div>
            <div className="relative aspect-square rounded-[5px] overflow-hidden bg-card border border-primary/30 mb-3 shadow-sm">
              <img
                src={allImages[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
                fetchPriority="high"
                loading="eager"
                width={600}
                height={600}
              />
              {discount > 0 && (
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-[5px]">
                  -{discount}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-[5px] overflow-hidden border-2 transition-all ${
                    selectedImage === i ? "border-primary shadow-md scale-[1.02]" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {/* Guarantee text with decorative lines */}
            <div className="bg-muted/50 rounded-[5px] p-3 mt-3 border border-black/50">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-[3px] bg-primary rounded-full" />
                <span className="text-[22px] font-bold text-destructive whitespace-nowrap">ছবির মত হুবহু প্রডাক্ট পাবেন</span>
                <div className="flex-1 h-[3px] bg-primary rounded-full" />
              </div>
            </div>
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div className="space-y-3">
            <h1 className="text-[25px] md:text-[27px] font-bold leading-tight text-black dark:text-white line-clamp-2">{product.title}</h1>
            <div className="h-px w-full bg-primary/80 rounded-full !mt-[7px]" />
            <div className="text-black dark:text-white text-[18px] md:text-[18px] prose prose-sm max-w-none leading-[1.3] [&_*]:text-black dark:[&_*]:text-white [&_p]:mb-[2px] [&_li]:mb-[2px] !mt-[7px] overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_*]:max-w-full font-['Noto_Serif_Bengali'] whitespace-pre-line" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />

            {/* Variations - side by side on desktop */}
            <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-2 lg:gap-4">
              {/* Color Variations */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[16px] font-medium">কালার:</label>
                  {product.colors.map((color) => {
                    const hasPrice = product.variationPrices?.find(v => v.variationType === 'color' && v.variationName === color);
                    return (
                      <Button
                        key={color}
                        variant={selectedColor === color ? "default" : "outline"}
                        size="sm"
                        className={`rounded-[5px] ${selectedColor !== color ? "border-foreground" : ""}`}
                        onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                      >
                        {color} {hasPrice?.price ? `(৳${hasPrice.price})` : ''}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Size Variations */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[16px] font-medium">সাইজ:</label>
                  {product.sizes.map((size) => {
                    const hasPrice = product.variationPrices?.find(v => v.variationType === 'size' && v.variationName === size);
                    return (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        size="sm"
                        className={`rounded-[5px] ${selectedSize !== size ? "border-foreground" : ""}`}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      >
                        {size} {hasPrice?.price ? `(৳${hasPrice.price})` : ''}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Weight Variations */}
              {product.weights && product.weights.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[16px] font-medium">ওজন:</label>
                  {product.weights.map((weight) => {
                    const hasPrice = product.variationPrices?.find(v => v.variationType === 'weight' && v.variationName === weight);
                    return (
                      <Button
                        key={weight}
                        variant={selectedWeight === weight ? "default" : "outline"}
                        size="sm"
                        className={`rounded-[5px] ${selectedWeight !== weight ? "border-foreground" : ""}`}
                        onClick={() => setSelectedWeight(selectedWeight === weight ? '' : weight)}
                      >
                        {weight} {hasPrice?.price ? `(৳${hasPrice.price})` : ''}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legacy Variations */}
            {product.variations?.map((variation) => (
              <div key={variation.name} className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium">{variation.name}:</label>
                {variation.options.map((opt) => (
                  <Button
                    key={opt}
                    variant={selectedVariations[variation.name] === opt ? "default" : "outline"}
                    size="sm"
                    className={`rounded-[5px] ${selectedVariations[variation.name] !== opt ? "border-foreground" : ""}`}
                    onClick={() =>
                      setSelectedVariations({ ...selectedVariations, [variation.name]: opt })
                    }
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            ))}

            {/* Sales Count + Review Rating */}
            <div className="flex items-center gap-1 flex-wrap mt-[5px] mb-[2px]">
              {product.reviews && product.reviews.length > 0 && (() => {
                const avg = product.reviews!.reduce((sum, r) => sum + r.rating, 0) / product.reviews!.length;
                return (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab("reviews");
                        setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-primary font-medium underline">
                        ({product.reviews!.length} Reviews)
                      </span>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Price Section */}
            <div className="bg-muted/50 rounded-[5px] p-3 border border-black/50 overflow-hidden">
              <div className="flex items-center gap-3">
                <span className="text-[20px] font-bold text-foreground">দামঃ</span>
                <span className="text-3xl font-extrabold text-primary">৳{currentPrice}</span>
                {product.originalPrice && (
                  <span className="text-2xl text-muted-foreground/60 line-through font-bold">৳{product.originalPrice}</span>
                )}
                {discount > 0 && (
                  <span className="bg-destructive/10 text-destructive text-sm font-bold px-2 py-0.5 rounded-[5px]">
                    {discount}% ছাড়
                  </span>
                )}
              </div>
            </div>


            {/* Buttons Section */}
            <div className="flex flex-col gap-[10px] pt-1">
              {/* Quantity + Add to Cart + Wishlist */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-foreground rounded-[5px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-[5px]"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-[5px]"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="flex-1 gap-2 rounded-[5px] hover:bg-foreground hover:text-background text-[18px]"
                  onClick={() => {
                    if (!validateVariations()) return;
                    const allVariations = { ...selectedVariations };
                    if (selectedColor) allVariations['কালার'] = selectedColor;
                    if (selectedSize) allVariations['সাইজ'] = selectedSize;
                    if (selectedWeight) allVariations['ওজন'] = selectedWeight;
                    addToCart(product, quantity, allVariations);
                    trackAddToCart([{ item_id: product.id, item_name: product.title, price: currentPrice, quantity, item_category: product.category }]);
                    openCart();
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-[5px] h-10 w-10 border-foreground"
                  onClick={() => toggleWishlist(product)}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? "fill-primary text-primary" : ""}`} />
                </Button>
              </div>

              {/* Order Now */}
              <Button
                size="lg"
                className="w-full rounded-[5px] text-[25px] font-bold gap-2 bg-[#feff00] text-foreground border border-foreground hover:bg-foreground hover:text-background shadow-[0_4px_15px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all active:scale-[0.98]"
                onClick={() => {
                  if (isDeviceBlocked) {
                    toast({ title: 'আপনার ডিভাইস ব্লক করা হয়েছে', variant: 'destructive' });
                    return;
                  }
                  if (!validateVariations()) return;
                  const allVariations = { ...selectedVariations };
                  if (selectedColor) allVariations['কালার'] = selectedColor;
                  if (selectedSize) allVariations['সাইজ'] = selectedSize;
                  if (selectedWeight) allVariations['ওজন'] = selectedWeight;
                  addToCart(product, quantity, allVariations);
                  trackAddToCart([{ item_id: product.id, item_name: product.title, price: currentPrice, quantity, item_category: product.category }]);
                  navigate(checkoutPath);
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                অর্ডার করুন
              </Button>

              {/* Call & WhatsApp inline buttons */}
              <CallWhatsAppButtons />
            </div>
          </div>

        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10" ref={tabsRef}>
          <TabsList className="w-full bg-transparent p-0 h-auto gap-0 rounded-none overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="description"
              className="flex-1 rounded-none px-3 sm:px-6 py-3 text-[14px] sm:text-[16px] font-bold text-primary-foreground uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none bg-secondary text-secondary-foreground transition-all whitespace-nowrap"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 rounded-none px-3 sm:px-6 py-3 text-[14px] sm:text-[16px] font-bold text-primary-foreground uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none bg-secondary text-secondary-foreground transition-all whitespace-nowrap"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-0">
            <div className="p-1 bg-background overflow-hidden break-words border border-t-0 border-border">
              <div
                className="prose prose-sm sm:prose max-w-none w-full font-['Noto_Serif_Bengali'] text-foreground [&_p]:mb-3 [&_br]:block [&_br]:content-[''] [&_br]:mb-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-[5px] [&_img]:my-3 [&_img]:block [&_img]:mx-auto [&_*]:max-w-full [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 break-words overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: product.longDescription || product.shortDescription || '' }}
              />
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-[10px]">
            <div className="p-4 md:p-6 bg-background space-y-6">
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4 space-y-2">
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {review.images.map((img, i) => (
                            <img key={i} src={img} alt={`review-${i}`} className="w-16 h-16 object-cover rounded-md border border-border flex-shrink-0" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{review.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">এখনো কোনো রিভিউ নেই</p>
              )}

              {/* Fake Review Submit Form */}
              <FakeReviewForm />
            </div>
          </TabsContent>
        </Tabs>

        <div className="h-[25px]" />
      </div>

      {/* Mobile Sticky Order Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white p-3 md:hidden border-t border-border">
        <Button
          className="w-full h-12 text-[27px] font-bold gap-2 rounded-[5px] animate-blink-order border border-foreground shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
          onClick={() => {
            if (isDeviceBlocked) {
              toast({ title: 'আপনার ডিভাইস ব্লক করা হয়েছে', variant: 'destructive' });
              return;
            }
            if (!validateVariations()) return;
            const allVariations = { ...selectedVariations };
            if (selectedColor) allVariations['কালার'] = selectedColor;
            if (selectedSize) allVariations['সাইজ'] = selectedSize;
            if (selectedWeight) allVariations['ওজন'] = selectedWeight;
            addToCart(product, quantity, allVariations);
            trackAddToCart([{ item_id: product.id, item_name: product.title, price: currentPrice, quantity, item_category: product.category }]);
            navigate(checkoutPath);
          }}
        >
          <ShoppingCart className="h-5 w-5" />
          অর্ডার করুন
        </Button>
      </div>

    </div>
  );
};

export default ProductPage;
