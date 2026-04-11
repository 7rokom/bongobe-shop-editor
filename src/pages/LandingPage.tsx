import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLandingPageStore } from '@/stores/useLandingPageStore';
import { useProductStore } from '@/stores/useProductStore';
import { useCartStore } from '@/stores/useStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useCouponStore } from '@/stores/useCouponStore';
import { useBlockStore } from '@/stores/useBlockStore';
import { useFraudBlockedStore } from '@/stores/useFraudBlockedStore';
import { useIncompleteOrderStore, sendBeaconIncompleteOrder, sendIncompleteOrderFetch } from '@/stores/useIncompleteOrderStore';
import { useFraudSettingsStore } from '@/stores/useFraudSettingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Truck, User, Phone, MapPin, Tag, ShieldCheck, CheckCircle, Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { validatePhone, validateName } from '@/lib/order-validation';
import ValidationPopup from '@/components/ValidationPopup';
import { generateFingerprint } from '@/lib/fingerprint';
import { trackPurchase } from '@/lib/dataLayer';
import { checkFraud, checkDeviceBlocked } from '@/lib/fraud-check';
import PostOrderPopup from '@/components/PostOrderPopup';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

const AdSlot = () => {
  const { adsenseCode } = useSiteSettingsStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !adsenseCode) return;
    const scripts = ref.current.querySelectorAll('script');
    scripts.forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }, [adsenseCode]);
  if (!adsenseCode) return null;
  return <div ref={ref} className="my-4" dangerouslySetInnerHTML={{ __html: adsenseCode }} />;
};

const deliveryOptions = [
  { value: '70', label: 'ঢাকার মধ্যে', price: 70 },
  { value: '100', label: 'ঢাকার আশেপাশে', price: 100 },
  { value: '130', label: 'ঢাকার বাইরে', price: 130 },
];

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { pages, fetchPages, loading: lpLoading } = useLandingPageStore();
  const { products, loading: prodLoading } = useProductStore();

  const page = pages.find((p) => p.slug === slug);
  const product = page ? products.find((p) => p.id === page.productId) : undefined;

  useEffect(() => {
    if (pages.length === 0) fetchPages();
  }, []);

  // Checkout state
  const createOrder = useOrderStore((s) => s.createOrderFromCheckout);
  const { coupons, applyCoupon: storeApplyCoupon } = useCouponStore();
  const checkBlockedRemote = useBlockStore((s) => s.checkBlockedRemote);
  const isDeviceBlocked = useFraudBlockedStore((s) => s.isDeviceBlocked);
  const deviceBlockReason = useFraudBlockedStore((s) => s.blockReason);
  const markBlocked = useFraudBlockedStore((s) => s.markBlocked);
  const addIncomplete = useIncompleteOrderStore((s) => s.addOrder);
  const removeByPhone = useIncompleteOrderStore((s) => s.removeByPhone);
  const fraudEnabled = useFraudSettingsStore((s) => s.enabled);

  const [fraudBlocked, setFraudBlocked] = useState(false);
  const [fraudBlockReason, setFraudBlockReason] = useState<'no_data' | 'low_ratio' | null>(null);
  const [fraudChecking, setFraudChecking] = useState(false);
  const [showFraudPopup, setShowFraudPopup] = useState(false);
  const [customerIp, setCustomerIp] = useState('');
  const [customerFingerprint, setCustomerFingerprint] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [delivery, setDelivery] = useState('130');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const [showPostOrderPopup, setShowPostOrderPopup] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');

  const checkoutRef = useRef<HTMLDivElement>(null);
  const orderSubmitted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => setCustomerIp(data.ip))
        .catch(() => setCustomerIp(''));
      setCustomerFingerprint(generateFingerprint());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Incomplete order beacon
  const beaconDataRef = useRef<any>(null);
  useEffect(() => {
    if (product) {
      beaconDataRef.current = { name, phone, address, product, delivery, customerIp, customerFingerprint, discount, quantity, selectedColor, selectedSize, selectedWeight };
    }
  });

  useEffect(() => {
    let sent = false;
    const buildOrderData = () => {
      if (sent || orderSubmitted.current) return null;
      const d = beaconDataRef.current;
      if (!d || !d.name || !d.phone || !d.address || !d.product) return null;
      const dc = Number(d.delivery);
      const st = getCurrentPrice() * d.quantity;
      return {
        name: d.name, phone: d.phone, address: d.address,
        items: [{ title: d.product.title, quantity: d.quantity, price: getCurrentPrice(), image: d.product.images?.[0] || '', variations: (() => { const v: Record<string,string> = {}; if (d.selectedColor) v['কালার'] = d.selectedColor; if (d.selectedSize) v['সাইজ'] = d.selectedSize; if (d.selectedWeight) v['ওজন'] = d.selectedWeight; return Object.keys(v).length > 0 ? v : undefined; })() }],
        totalPrice: st, deliveryCharge: dc,
        deliveryZone: d.delivery === '70' ? 'ঢাকার মধ্যে' : d.delivery === '100' ? 'ঢাকার আশেপাশে' : 'ঢাকার বাইরে',
        grandTotal: st + dc - (d.discount || 0), type: 'incomplete' as const,
        customerIp: d.customerIp || undefined, customerFingerprint: d.customerFingerprint || undefined,
      };
    };
    const handleUnload = () => { const data = buildOrderData(); if (!data) return; sent = true; sendBeaconIncompleteOrder(data); };
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') { const data = buildOrderData(); if (!data) return; sent = true; sendIncompleteOrderFetch(data); } };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const data = buildOrderData();
      if (data) { sent = true; sendIncompleteOrderFetch(data); }
    };
  }, []);

  if (!page || !product) {
    if (lpLoading || prodLoading || products.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl font-bold text-foreground">পেজটি পাওয়া যায়নি</p>
      </div>
    );
  }

  const allImages = (() => {
    const imgs: string[] = [];
    if (product.featuredImage) imgs.push(product.featuredImage);
    product.images.forEach((img) => { if (!imgs.includes(img)) imgs.push(img); });
    return imgs.length > 0 ? imgs : ['/placeholder.svg'];
  })();

  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasWeights = product.weights && product.weights.length > 0;

  const getCurrentPrice = () => {
    let currentPrice = product.price;
    const vp = product.variationPrices;
    if (vp && vp.length > 0) {
      if (selectedColor) { const cp = vp.find((v) => v.variationType === 'color' && v.variationName === selectedColor); if (cp?.price) currentPrice = cp.price; }
      if (selectedSize) { const sp = vp.find((v) => v.variationType === 'size' && v.variationName === selectedSize); if (sp?.price) currentPrice = sp.price; }
      if (selectedWeight) { const wp = vp.find((v) => v.variationType === 'weight' && v.variationName === selectedWeight); if (wp?.price) currentPrice = wp.price; }
    }
    return currentPrice;
  };

  const currentPrice = getCurrentPrice();
  const hasFreeDelivery = product.freeDelivery || false;
  const deliveryCharge = hasFreeDelivery ? 0 : Number(delivery);
  const subtotal = currentPrice * quantity;
  const total = subtotal + deliveryCharge - discount;

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = storeApplyCoupon(couponCode.trim(), subtotal);
    if (!result.valid) { toast({ title: result.message, variant: 'destructive' }); return; }
    setDiscount(result.discount);
    setAppliedCoupon(couponCode.trim());
    toast({ title: `কুপন অ্যাপ্লাই হয়েছে! ৳${result.discount} ছাড়` });
  };

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateVariations = (): boolean => {
    const missing: string[] = [];
    if (hasColors && !selectedColor) missing.push('কালার');
    if (hasSizes && !selectedSize) missing.push('সাইজ');
    if (hasWeights && !selectedWeight) missing.push('ওজন');
    if (missing.length > 0) { toast({ title: `দয়া করে ${missing.join(', ')} সিলেক্ট করুন`, variant: 'destructive' }); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateVariations()) return;
    if (!name || !phone || !address) { toast({ title: 'সকল তথ্য পূরণ করুন', variant: 'destructive' }); return; }
    const nameErr = validateName(name);
    if (nameErr) { setValidationMsg(nameErr); return; }
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setValidationMsg(phoneErr); return; }

    const isBlocked = await checkBlockedRemote(phone, customerIp || undefined, customerFingerprint || undefined);
    if (isBlocked) {
      await addIncomplete({
        name, phone, address,
        items: [{ title: product.title, quantity, price: currentPrice, image: product.images?.[0] || '' }],
        totalPrice: subtotal, deliveryCharge,
        deliveryZone: delivery === '70' ? 'ঢাকার মধ্যে' : delivery === '100' ? 'ঢাকার আশেপাশে' : 'ঢাকার বাইরে',
        grandTotal: total, type: 'blocked', blockReason: 'আগে থেকেই ব্লক করা কাস্টমার',
        customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
      });
      setValidationMsg('আপনি আগেও আমাদের ওয়েবসাইটে অর্ডার করেছিলেন। কিন্তু অর্ডার ক্যান্সেল করে দিয়েছেন। তাই আপনাকে ব্লক করে দেওয়া হয়েছে।');
      return;
    }

    const deviceResult = await checkDeviceBlocked(customerFingerprint || undefined, phone, customerIp || undefined);
    if (deviceResult.blocked) {
      const variations: Record<string, string> = {};
      if (selectedColor) variations['কালার'] = selectedColor;
      if (selectedSize) variations['সাইজ'] = selectedSize;
      if (selectedWeight) variations['ওজন'] = selectedWeight;
      const id = await createOrder({
        name, phone, address,
        items: [{ title: product.title, quantity, price: currentPrice, image: product.images?.[0] || '',
          variations: Object.keys(variations).length > 0 ? variations : undefined, freeDelivery: hasFreeDelivery }],
        deliveryCharge, subtotal: subtotal - discount,
        customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
        orderNote: orderNote.trim() || undefined,
      });
      orderSubmitted.current = true;
      removeByPhone(phone);
      setValidationMsg(`প্রিয় গ্রাহক ❤️\n\nআপনি আমাদের ওয়েবসাইটে একটি অর্ডার করেছেন। কিন্তু আপনার অর্ডারটি এখন ${deviceResult.status} হয়ে আছে। তাই এখন আপনি আর নতুন অর্ডার করতে পারবেন না। দয়া করে ২৪ ঘন্টা অপেক্ষা করুন। আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবে। ধন্যবাদ!`);
      return;
    }

    if (fraudEnabled) {
      setFraudChecking(true);
      const fraudResult = await checkFraud(phone);
      setFraudChecking(false);
      if (!fraudResult.passed) {
        setFraudBlocked(true); setFraudBlockReason(fraudResult.reason || 'low_ratio');
        setShowFraudPopup(true); markBlocked(fraudResult.reason || 'low_ratio');
        await addIncomplete({
          name, phone, address,
          items: [{ title: product.title, quantity, price: currentPrice, image: product.images?.[0] || '' }],
          totalPrice: subtotal, deliveryCharge,
          deliveryZone: delivery === '70' ? 'ঢাকার মধ্যে' : delivery === '100' ? 'ঢাকার আশেপাশে' : 'ঢাকার বাইরে',
          grandTotal: total, type: 'blocked',
          blockReason: fraudResult.reason === 'no_data' ? 'কুরিয়ার হিস্টোরি পাওয়া যায়নি' : `ডেলিভারি রেশিও ${fraudResult.deliveryPercent}% (মিনিমাম প্রয়োজন)`,
          customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
        });
        return;
      }
    }

    const variations: Record<string, string> = {};
    if (selectedColor) variations['কালার'] = selectedColor;
    if (selectedSize) variations['সাইজ'] = selectedSize;
    if (selectedWeight) variations['ওজন'] = selectedWeight;

    const id = await createOrder({
      name, phone, address,
      items: [{
        title: product.title, quantity, price: currentPrice,
        image: product.images?.[0] || '',
        variations: Object.keys(variations).length > 0 ? variations : undefined,
        freeDelivery: hasFreeDelivery,
      }],
      deliveryCharge, subtotal: subtotal - discount,
      customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
      orderNote: orderNote.trim() || undefined,
    });

    orderSubmitted.current = true;
    removeByPhone(phone);

    const { useBlockStore } = await import('@/stores/useBlockStore');
    await useBlockStore.getState().blockCustomerFull({ phone, ip: customerIp || undefined, fingerprint: customerFingerprint || undefined, customerName: name, reason: `অর্ডার ${id} করায় অটো-ব্লক` });

    trackPurchase(id, [{ item_id: product.id, item_name: product.title, price: currentPrice, quantity, item_category: product.category }], total, deliveryCharge, discount);

    const popupEnabled = useFraudSettingsStore.getState().postOrderPopupEnabled;
    if (popupEnabled) { setPendingOrderId(id); setShowPostOrderPopup(true); }
    else { navigate('/thank-you', { state: { orderId: id } }); }
  };

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO HEADER — Yellow wave background ===== */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFD54F 0%, #FFECB3 60%, #FFF8E1 100%)' }}>
        {/* Wavy bottom SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 relative z-10">
          <h1 className="text-[22px] md:text-[32px] font-extrabold text-center text-foreground leading-snug">
            {page.title}
          </h1>
        </div>
      </section>

      {/* ===== PRODUCT INFO — Two column on desktop ===== */}
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left: Description & variations */}
          <div className="space-y-5 order-2 md:order-1">
            <h2 className="text-[22px] md:text-[26px] font-bold text-foreground leading-tight">{product.title}</h2>

            {/* Short Description */}
            <div className="text-[15px] md:text-base leading-relaxed prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }} />

            {/* Variations */}
            {hasColors && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[15px] font-semibold">কালার:</label>
                {product.colors!.map((color) => {
                  const hp = product.variationPrices?.find((v) => v.variationType === 'color' && v.variationName === color);
                  return (
                    <Button key={color} variant={selectedColor === color ? 'default' : 'outline'} size="sm"
                      className={`rounded-full text-xs ${selectedColor !== color ? 'border-foreground/40' : ''}`}
                      onClick={() => setSelectedColor(selectedColor === color ? '' : color)}>
                      {color} {hp?.price ? `(৳${hp.price})` : ''}
                    </Button>
                  );
                })}
              </div>
            )}
            {hasSizes && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[15px] font-semibold">সাইজ:</label>
                {product.sizes!.map((size) => {
                  const hp = product.variationPrices?.find((v) => v.variationType === 'size' && v.variationName === size);
                  return (
                    <Button key={size} variant={selectedSize === size ? 'default' : 'outline'} size="sm"
                      className={`rounded-full text-xs ${selectedSize !== size ? 'border-foreground/40' : ''}`}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}>
                      {size} {hp?.price ? `(৳${hp.price})` : ''}
                    </Button>
                  );
                })}
              </div>
            )}
            {hasWeights && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[15px] font-semibold">ওজন:</label>
                {product.weights!.map((weight) => {
                  const hp = product.variationPrices?.find((v) => v.variationType === 'weight' && v.variationName === weight);
                  return (
                    <Button key={weight} variant={selectedWeight === weight ? 'default' : 'outline'} size="sm"
                      className={`rounded-full text-xs ${selectedWeight !== weight ? 'border-foreground/40' : ''}`}
                      onClick={() => setSelectedWeight(selectedWeight === weight ? '' : weight)}>
                      {weight} {hp?.price ? `(৳${hp.price})` : ''}
                    </Button>
                  );
                })}
              </div>
            )}

            <AdSlot />
          </div>

          {/* Right: Image carousel */}
          <div className="order-1 md:order-2">
            <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted/30">
              <img src={allImages[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow-md transition-colors">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow-md transition-colors">
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}
            </div>
            {/* Dots */}
            {allImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${selectedImage === i ? 'bg-primary scale-125' : 'bg-border'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Collapsible Description ===== */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <button onClick={() => setShowDescription(!showDescription)}
          className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-bold text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
          {showDescription ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          প্রডাক্ট এর বিস্তারিত জানুন
        </button>
        {showDescription && (
          <div className="prose prose-sm max-w-none text-[15px] leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words [&_*]:max-w-full overflow-x-auto mt-4"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            dangerouslySetInnerHTML={{ __html: product.longDescription }} />
        )}
      </section>

      {/* ===== PRICE SECTION ===== */}
      <section className="py-8 md:py-10 text-center">
        <div className="max-w-5xl mx-auto px-4 space-y-3">
          {product.originalPrice && (
            <p className="text-[22px] md:text-[28px] font-bold text-foreground">
              রেগুলার প্রাইজ= <span className="line-through decoration-destructive decoration-[3px]">১৪৭০</span>{' '}
              <span className="line-through decoration-destructive decoration-[3px]">৳{product.originalPrice}</span>
              {' '}টাকা
            </p>
          )}
          <p className="text-[24px] md:text-[32px] font-extrabold text-foreground">
            বর্তমান প্রাইজ{' '}
            <span className="inline-flex items-center justify-center w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-full border-[3px] border-destructive text-destructive text-[22px] md:text-[28px] font-extrabold">
              ৳{currentPrice}
            </span>
            {' '}টাকা
          </p>
        </div>
      </section>

      {/* ===== CHECKOUT SECTION ===== */}
      <section className="bg-muted/40 border-t">
        <div ref={checkoutRef} className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
          {/* CTA Text */}
          <p className="text-[18px] md:text-[22px] font-bold text-destructive text-center leading-tight">
            অর্ডার করতে নিচের ফর্মটি পূরন করে নিচের "অর্ডার করুন" বাটুনে চাপদিন।
          </p>

          <AdSlot />

          {/* Product mini-card in checkout */}
          <div className="flex items-center gap-3 border rounded-lg p-3 bg-background max-w-lg mx-auto md:max-w-none">
            <img src={product.images?.[0] || '/placeholder.svg'} alt={product.title} className="w-14 h-14 object-cover rounded border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{product.title}</p>
            </div>
            <div className="flex items-center gap-1.5 border rounded px-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground">-</button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-7 h-7 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground">+</button>
            </div>
            <span className="font-bold text-primary whitespace-nowrap">৳{subtotal}</span>
          </div>

          {/* Two column: Form + Order summary on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* LEFT: Billing details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Billing details</h3>
              <div>
                <Label className="text-sm font-medium mb-1.5 block text-foreground">আপনার নাম *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="সম্পূর্ণ নাম" className="h-11 rounded-lg bg-background" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block text-foreground">মোবাইল নাম্বার *</Label>
                <Input value={phone} onChange={(e) => {
                  const val = e.target.value;
                  if (/[\u09E6-\u09EF]/.test(val)) toast({ title: 'আপনার ফোন নাম্বারটি ইংরেজিতে লিখুন প্লিজ!', duration: 4000 });
                  setPhone(val);
                }} placeholder="01XXXXXXXXX" className="h-11 rounded-lg bg-background" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block text-foreground">সম্পূর্ণ ঠিকানা *</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="গ্রাম/এলাকার নাম, থানার নাম, জেলার নাম" className="h-11 rounded-lg bg-background" />
              </div>

              {/* Shipping / Delivery */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Shipping</h4>
                {hasFreeDelivery ? (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                    <p className="text-sm font-bold text-primary flex items-center gap-2"><Truck className="h-4 w-4" /> 🎉 সম্পূর্ণ ফ্রি ডেলিভারি</p>
                  </div>
                ) : (
                  <RadioGroup value={delivery} onValueChange={setDelivery} className="space-y-1.5">
                    {deliveryOptions.map((opt) => (
                      <div key={opt.value}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all bg-background ${delivery === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                        onClick={() => setDelivery(opt.value)}>
                        <RadioGroupItem value={opt.value} id={`lp-d-${opt.value}`} />
                        <label htmlFor={`lp-d-${opt.value}`} className="flex-1 cursor-pointer text-sm">{opt.label}</label>
                        <span className="font-bold text-sm text-primary">৳{opt.price}</span>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">অর্ডার নোট (অপশনাল)</Label>
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="" rows={2}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>

            {/* RIGHT: Your order */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Your order</h3>
              <div className="border rounded-lg overflow-hidden bg-background">
                {/* Header row */}
                <div className="flex justify-between px-4 py-2.5 bg-muted/60 border-b text-sm font-semibold text-muted-foreground">
                  <span>Product</span>
                  <span>Subtotal</span>
                </div>
                {/* Product row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <img src={product.images?.[0] || '/placeholder.svg'} alt="" className="w-10 h-10 object-cover rounded border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.title}</p>
                    {selectedColor && <p className="text-xs text-muted-foreground">কালার: {selectedColor}</p>}
                    {selectedSize && <p className="text-xs text-muted-foreground">সাইজ: {selectedSize}</p>}
                    {selectedWeight && <p className="text-xs text-muted-foreground">ওজন: {selectedWeight}</p>}
                  </div>
                  <span className="text-sm whitespace-nowrap">×{quantity}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">৳{subtotal}</span>
                </div>
                {/* Subtotal */}
                <div className="flex justify-between px-4 py-2.5 border-b text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">৳{subtotal}</span>
                </div>
                {/* Delivery */}
                <div className="flex justify-between px-4 py-2.5 border-b text-sm">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                  <span className={`font-medium ${hasFreeDelivery ? 'text-primary' : ''}`}>{hasFreeDelivery ? 'ফ্রি' : `৳${deliveryCharge}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 border-b text-sm text-primary">
                    <span>ডিসকাউন্ট</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                {/* Total */}
                <div className="flex justify-between px-4 py-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary text-lg">৳{total}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="কুপন কোড (অপশনাল)" className="flex-1 h-10 rounded-lg bg-background" />
                <Button variant="outline" onClick={applyCoupon} className="rounded-lg h-10 px-5 font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground">অ্যাপ্লাই</Button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
                  <CheckCircle className="h-4 w-4" /> কুপন "{appliedCoupon}" অ্যাপ্লাই হয়েছে (৳{discount} ছাড়)
                </div>
              )}

              {/* Cash on delivery box */}
              <div className="border rounded-lg p-4 bg-background space-y-2">
                <p className="font-semibold text-sm">Cash on delivery</p>
                <p className="text-xs text-muted-foreground">Pay with cash upon delivery.</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our <span className="text-primary underline cursor-pointer">privacy policy</span>.
              </p>

              {/* Submit Button */}
              <Button size="lg"
                className="w-full rounded-lg text-[18px] md:text-[20px] font-bold h-14 bg-[#1a237e] hover:bg-[#283593] text-white shadow-md"
                onClick={handleSubmit} disabled={fraudChecking || fraudBlocked}>
                {fraudChecking ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> একটু অপেক্ষা করুন....</> : `অর্ডার করুন ৳${total}`}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ValidationPopup open={!!validationMsg} message={validationMsg} onClose={() => setValidationMsg('')} />
      <PostOrderPopup orderId={pendingOrderId} isOpen={showPostOrderPopup} onComplete={() => { setShowPostOrderPopup(false); navigate('/thank-you', { state: { orderId: pendingOrderId } }); }} />
      <Dialog open={showFraudPopup} onOpenChange={(v) => { if (!v) setShowFraudPopup(false); }}>
        <DialogContent className="sm:max-w-md text-center" hideClose>
          <div className="py-4 space-y-4">
            <p className="text-[17px] leading-relaxed text-foreground text-left px-2">
              {fraudBlockReason === 'no_data' ? useFraudSettingsStore.getState().noDataMessage : useFraudSettingsStore.getState().lowRatioMessage}
            </p>
            <Button onClick={() => setShowFraudPopup(false)} className="w-full rounded-lg">ঠিক আছে</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
