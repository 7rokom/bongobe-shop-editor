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
import { ShoppingCart, Truck, User, Phone, MapPin, Tag, ShieldCheck, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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

  const [fraudBlocked, setFraudBlocked] = useState(isFraudBlocked());
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

  // Variation states
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
      beaconDataRef.current = { name, phone, address, product, delivery, customerIp, customerFingerprint, discount, quantity };
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
        items: [{ title: d.product.title, quantity: d.quantity, price: getCurrentPrice(), image: d.product.images?.[0] || '' }],
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
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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

    if (isDeviceBlocked) {
      await addIncomplete({
        name, phone, address,
        items: [{ title: product.title, quantity, price: currentPrice, image: product.images?.[0] || '' }],
        totalPrice: subtotal, deliveryCharge,
        deliveryZone: delivery === '70' ? 'ঢাকার মধ্যে' : delivery === '100' ? 'ঢাকার আশেপাশে' : 'ঢাকার বাইরে',
        grandTotal: total, type: 'blocked',
        blockReason: deviceBlockReason === 'no_data' ? 'কুরিয়ার হিস্টোরি পাওয়া যায়নি' : 'ডেলিভারি রেশিওর কারণে সাময়িক ব্লক',
        customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
      });
      toast({ title: 'আপনার ডিভাইস ব্লক করা হয়েছে', variant: 'destructive' });
      return;
    }

    if (fraudEnabled) {
      setFraudChecking(true);
      const fraudResult = await checkFraud(phone);
      setFraudChecking(false);
      if (!fraudResult.passed) {
        setFraudBlock(); setFraudBlocked(true); setFraudBlockReason(fraudResult.reason || 'low_ratio');
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

    const serverCooldown = await checkServerCooldown(phone, customerIp || undefined, customerFingerprint || undefined);
    if (serverCooldown || isOrderCooldownActive()) { setValidationMsg(getCooldownMessage()); return; }

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

    trackPurchase(id, [{ item_id: product.id, item_name: product.title, price: currentPrice, quantity, item_category: product.category }], total, deliveryCharge, discount);
    setOrderCooldown();
    orderSubmitted.current = true;
    removeByPhone(phone);

    const popupEnabled = useFraudSettingsStore.getState().postOrderPopupEnabled;
    if (popupEnabled) { setPendingOrderId(id); setShowPostOrderPopup(true); }
    else { navigate('/thank-you', { state: { orderId: id } }); }
  };

  return (
    <div className="min-h-screen">
      {/* Top section: white-to-yellow gradient background */}
      <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fffde6 40%, #fff9c4 100%)' }}>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Ad: Above heading */}
          <AdSlot />
          {/* Heading - RED */}
          <h1 className="text-[25px] font-bold text-center text-destructive leading-tight">{page.title}</h1>

          {/* Image Gallery with bottom shadow */}
          <div>
            <div className="aspect-square rounded-[5px] overflow-hidden border border-primary/30 mb-3 relative">
              <img src={allImages[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
              {/* Bottom shadow overlay like reference */}
              <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-[5px] overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary' : 'border-border'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ad: Below image gallery */}
          <AdSlot />
          {/* Product Title */}
          <h2 className="text-[25px] md:text-[27px] font-bold text-foreground leading-tight">{product.title}</h2>

          {/* Short Description */}
          <div className="text-base leading-relaxed prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto"
            dangerouslySetInnerHTML={{ __html: product.shortDescription }} />

          {/* Variations */}
          {hasColors && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[16px] font-medium">কালার:</label>
              {product.colors!.map((color) => {
                const hp = product.variationPrices?.find((v) => v.variationType === 'color' && v.variationName === color);
                return (
                  <Button key={color} variant={selectedColor === color ? 'default' : 'outline'} size="sm"
                    className={`rounded-[5px] ${selectedColor !== color ? 'border-foreground' : ''}`}
                    onClick={() => setSelectedColor(selectedColor === color ? '' : color)}>
                    {color} {hp?.price ? `(৳${hp.price})` : ''}
                  </Button>
                );
              })}
            </div>
          )}
          {hasSizes && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[16px] font-medium">সাইজ:</label>
              {product.sizes!.map((size) => {
                const hp = product.variationPrices?.find((v) => v.variationType === 'size' && v.variationName === size);
                return (
                  <Button key={size} variant={selectedSize === size ? 'default' : 'outline'} size="sm"
                    className={`rounded-[5px] ${selectedSize !== size ? 'border-foreground' : ''}`}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}>
                    {size} {hp?.price ? `(৳${hp.price})` : ''}
                  </Button>
                );
              })}
            </div>
          )}
          {hasWeights && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[16px] font-medium">ওজন:</label>
              {product.weights!.map((weight) => {
                const hp = product.variationPrices?.find((v) => v.variationType === 'weight' && v.variationName === weight);
                return (
                  <Button key={weight} variant={selectedWeight === weight ? 'default' : 'outline'} size="sm"
                    className={`rounded-[5px] ${selectedWeight !== weight ? 'border-foreground' : ''}`}
                    onClick={() => setSelectedWeight(selectedWeight === weight ? '' : weight)}>
                    {weight} {hp?.price ? `(৳${hp.price})` : ''}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Ad: Before order button */}
          <AdSlot />

          {/* Order Button */}
          <Button size="lg" className="w-full animate-blink-order text-[23px] font-bold h-14 rounded-[5px] border border-foreground" onClick={scrollToCheckout}>
            <ShoppingCart className="h-5 w-5 mr-2" /> অর্ডার করুন
          </Button>
        </div>
      </div>

      {/* Collapsible Description - white bg */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <button onClick={() => setShowDescription(!showDescription)}
          className="w-full flex items-center justify-center gap-2 py-3 text-[16px] font-bold text-primary border border-primary rounded-[5px] hover:bg-primary/5 transition-colors">
          {showDescription ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          প্রডাক্ট এর বিস্তারিত জানুন
        </button>
        {showDescription && (
          <div className="prose prose-sm max-w-none text-[16px] leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words [&_*]:max-w-full overflow-x-auto animate-fade-in mt-4"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            dangerouslySetInnerHTML={{ __html: product.longDescription }} />
        )}
      </div>

      {/* Price Section - red background like reference */}
      <div className="py-8" style={{ background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 50%, #d32f2f 100%)' }}>
        <div className="max-w-lg mx-auto px-4 space-y-5 text-center">
          {product.originalPrice && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-[25px] font-bold text-white">বাজার মূল্য:</span>
              <span className="text-[30px] font-bold text-white animate-strike-loop">৳{product.originalPrice}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[25px] font-bold text-white">বর্তমান অফার মূল্য:</span>
            <span className="text-[32px] font-extrabold text-white">৳{currentPrice}</span>
          </div>
        </div>
      </div>

      {/* Checkout Section - light background */}
      <div style={{ background: '#f5f5f5' }}>
        <div ref={checkoutRef} className="max-w-lg mx-auto px-4 py-6 space-y-5">
          <p className="text-[25px] font-bold text-destructive text-center leading-tight">
            অর্ডার করতে সঠিক তথ্য দিয়ে নিচের ফর্ম পূরণ করে নিচের "অর্ডার কনফার্ম করুন" বাটনে ক্লিক করুন
          </p>

          {/* Ad: Above form, below instruction text */}
          <AdSlot />

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-[16px] font-medium mb-1.5 block text-foreground">আপনার নাম *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="সম্পূর্ণ নাম" className="pl-10 h-11 rounded-[5px] bg-white" />
              </div>
            </div>
            <div>
              <Label className="text-[16px] font-medium mb-1.5 block text-foreground">মোবাইল নম্বর *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={phone} onChange={(e) => {
                  const val = e.target.value;
                  if (/[\u09E6-\u09EF]/.test(val)) toast({ title: 'আপনার ফোন নাম্বারটি ইংরেজিতে লিখুন প্লিজ!', duration: 4000 });
                  setPhone(val);
                }} placeholder="01XXXXXXXXX" className="pl-10 h-11 rounded-[5px] bg-white" />
              </div>
            </div>
            <div>
              <Label className="text-[16px] font-medium mb-1.5 block text-foreground">সম্পূর্ণ ঠিকানা *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="গ্রাম/এলাকার নাম, থানার নাম, জেলার নাম" className="pl-10 h-11 rounded-[5px] bg-white" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">অর্ডার নোট (অপশনাল)</Label>
              <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="" rows={2}
                className="flex w-full rounded-[5px] border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          {/* Delivery */}
          {hasFreeDelivery ? (
            <div className="bg-primary/10 rounded-[5px] p-4 border border-primary/30">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary"><Truck className="h-4 w-4" /> 🎉 ফ্রি ডেলিভারি!</h3>
              <p className="text-sm text-muted-foreground mt-1">এই প্রডাক্টে ডেলিভারি চার্জ ফ্রি</p>
            </div>
          ) : (
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> ডেলিভারি এরিয়া</h3>
            <RadioGroup value={delivery} onValueChange={setDelivery} className="space-y-[3px]">
              {deliveryOptions.map((opt) => (
                <div key={opt.value}
                  className={`flex items-center gap-3 p-3.5 border-2 rounded-[5px] cursor-pointer transition-all bg-white ${delivery === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
                  onClick={() => setDelivery(opt.value)}>
                  <RadioGroupItem value={opt.value} id={`lp-d-${opt.value}`} />
                  <label htmlFor={`lp-d-${opt.value}`} className="flex-1 cursor-pointer text-sm font-medium">{opt.label}</label>
                  <span className="font-bold text-sm text-primary">৳{opt.price}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
          )}

          {/* Coupon */}
          <div className="flex gap-2">
            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="কুপন কোড (অপশনাল)" className="flex-1 h-11 rounded-[5px] bg-white" />
            <Button variant="outline" onClick={applyCoupon} className="rounded-[5px] h-11 px-5 font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground">অ্যাপ্লাই</Button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-[5px] px-3 py-2">
              <CheckCircle className="h-4 w-4" /> কুপন "{appliedCoupon}" অ্যাপ্লাই হয়েছে (৳{discount} ছাড়)
            </div>
          )}

          {/* Order Summary */}
          <div className="border rounded-[5px] overflow-hidden bg-white">
            <div className="bg-primary px-4 py-3">
              <h3 className="font-bold text-primary-foreground flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> অর্ডার সামারি</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3 bg-muted/50 rounded-[5px] p-2.5">
                <img src={product.images?.[0] || '/placeholder.svg'} alt={product.title} className="w-16 h-16 object-cover rounded-[5px] border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{product.title}</p>
                  {selectedColor && <p className="text-xs text-muted-foreground">কালার: {selectedColor}</p>}
                  {selectedSize && <p className="text-xs text-muted-foreground">সাইজ: {selectedSize}</p>}
                  {selectedWeight && <p className="text-xs text-muted-foreground">ওজন: {selectedWeight}</p>}
                  <p className="text-xs text-muted-foreground">{quantity}টি x ৳{currentPrice}</p>
                  <p className="font-bold text-sm text-primary">৳{subtotal}</p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span className="font-medium">৳{subtotal}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span className={`font-medium ${hasFreeDelivery ? 'text-primary' : ''}`}>{hasFreeDelivery ? 'ফ্রি' : `৳${deliveryCharge}`}</span></div>
                {discount > 0 && <div className="flex justify-between text-primary"><span>ডিসকাউন্ট</span><span>-৳{discount}</span></div>}
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-lg">সর্বমোট</span>
                <span className="font-bold text-2xl text-primary">৳{total}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[5px] animate-[pulse-cta_2s_ease-in-out_infinite]" style={{ backgroundColor: '#feff00' }} />
            <Button size="lg"
              className="relative w-full rounded-[5px] text-[23px] font-bold h-14 text-foreground hover:opacity-90 shadow-md border border-foreground"
              style={{ backgroundColor: '#feff00' }}
              onClick={handleSubmit} disabled={fraudChecking || fraudBlocked}>
              {fraudChecking ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> একটু অপেক্ষা করুন....</> : 'অর্ডার কনফার্ম করুন'}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> ক্যাশ অন ডেলিভারি (COD)
          </div>
        </div>
      </div>

      <ValidationPopup open={!!validationMsg} message={validationMsg} onClose={() => setValidationMsg('')} />
      <PostOrderPopup orderId={pendingOrderId} isOpen={showPostOrderPopup} onComplete={() => { setShowPostOrderPopup(false); navigate('/thank-you', { state: { orderId: pendingOrderId } }); }} />
      <Dialog open={showFraudPopup} onOpenChange={(v) => { if (!v) setShowFraudPopup(false); }}>
        <DialogContent className="sm:max-w-md text-center" hideClose>
          <div className="py-4 space-y-4">
            <p className="text-[17px] leading-relaxed text-foreground text-left px-2">
              {fraudBlockReason === 'no_data' ? useFraudSettingsStore.getState().noDataMessage : useFraudSettingsStore.getState().lowRatioMessage}
            </p>
            <Button onClick={() => setShowFraudPopup(false)} className="w-full rounded-[5px]">ঠিক আছে</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
