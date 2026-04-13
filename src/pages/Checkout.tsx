import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/useStore";
import { useOrderStore } from "@/stores/useOrderStore";
import { useCouponStore } from "@/stores/useCouponStore";
import { useBlockStore } from "@/stores/useBlockStore";
import { useFraudBlockedStore } from "@/stores/useFraudBlockedStore";
import { useIncompleteOrderStore, sendBeaconIncompleteOrder, sendIncompleteOrderFetch } from "@/stores/useIncompleteOrderStore";
import { useFraudSettingsStore } from "@/stores/useFraudSettingsStore";
import { useResellerStore } from "@/stores/useResellerStore";
import { useResellerRef } from "@/contexts/ResellerRefContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Truck, CheckCircle, ShieldCheck, Loader2 } from "lucide-react";
import { validatePhone, validateName } from "@/lib/order-validation";
import ValidationPopup from "@/components/ValidationPopup";
import { generateFingerprint } from "@/lib/fingerprint";
import { trackInitiateCheckout, trackPurchase } from "@/lib/dataLayer";
import { checkFraud, checkDeviceBlocked } from "@/lib/fraud-check";
import PostOrderPopup from "@/components/PostOrderPopup";

const deliveryOptions = [
  { value: "70", label: "ঢাকার মধ্যে", price: 70 },
  { value: "100", label: "ঢাকার আশেপাশে", price: 100 },
  { value: "130", label: "ঢাকার বাইরে", price: 130 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
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

  const [customerIp, setCustomerIp] = useState("");
  const [customerFingerprint, setCustomerFingerprint] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => setCustomerIp(data.ip))
        .catch(() => setCustomerIp(''));
      setCustomerFingerprint(generateFingerprint());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState("130");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showPostOrderPopup, setShowPostOrderPopup] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [validationMsg, setValidationMsg] = useState("");
  const checkoutTracked = useRef(false);
  const orderSubmitted = useRef(false);

  useEffect(() => {
    if (items.length > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      trackInitiateCheckout(
        items.map((i) => ({
          item_id: i.product.id,
          item_name: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          item_category: i.product.category,
        })),
        totalPrice()
      );
    }
  }, []);

  const beaconDataRef = useRef<any>(null);
  useEffect(() => {
    beaconDataRef.current = { name, phone, address, items, delivery, customerIp, customerFingerprint, discount };
  });

  useEffect(() => {
    let sent = false;
    const buildOrderData = () => {
      if (sent || orderSubmitted.current) return null;
      const d = beaconDataRef.current;
      if (!d || !d.name || !d.phone || !d.address || !d.items?.length) return null;
      const dc = Number(d.delivery);
      const st = d.items.reduce((s: number, i: any) => s + i.product.price * i.quantity, 0);
      return {
        name: d.name, phone: d.phone, address: d.address,
        items: d.items.map((i: any) => ({ title: i.product.title, quantity: i.quantity, price: i.product.price, image: i.product.images[0] || "", variations: i.selectedVariations && Object.keys(i.selectedVariations).length > 0 ? i.selectedVariations : undefined })),
        totalPrice: st, deliveryCharge: dc,
        deliveryZone: d.delivery === "70" ? "ঢাকার মধ্যে" : d.delivery === "100" ? "ঢাকার আশেপাশে" : "ঢাকার বাইরে",
        grandTotal: st + dc - (d.discount || 0), type: "incomplete" as const,
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

  const hasFreeDelivery = items.some((i) => i.product.freeDelivery);

  if (items.length === 0 && !orderComplete && !orderSubmitted.current && !showPostOrderPopup) {
    navigate("/shop");
    return null;
  }

  const deliveryCharge = hasFreeDelivery ? 0 : Number(delivery);
  const subtotal = totalPrice();
  const total = subtotal + deliveryCharge - discount;

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const result = storeApplyCoupon(couponCode.trim(), subtotal);
    if (!result.valid) { toast({ title: result.message, variant: "destructive" }); return; }
    setDiscount(result.discount);
    setAppliedCoupon(couponCode.trim());
    toast({ title: `কুপন অ্যাপ্লাই হয়েছে! ৳${result.discount} ছাড়` });
  };

  const handleSubmit = async () => {
    if (!name || !phone || !address) { toast({ title: "সকল তথ্য পূরণ করুন", variant: "destructive" }); return; }
    const nameErr = validateName(name);
    if (nameErr) { setValidationMsg(nameErr); return; }
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setValidationMsg(phoneErr); return; }

    // Check if blocked in blocked_customers table (manually blocked)
    const isBlocked = await checkBlockedRemote(phone, customerIp || undefined, customerFingerprint || undefined);
    if (isBlocked) {
      await addIncomplete({ name, phone, address, items: items.map((i) => ({ title: i.product.title, quantity: i.quantity, price: i.product.price, image: i.product.images[0] || "" })), totalPrice: subtotal, deliveryCharge, deliveryZone: delivery === "70" ? "ঢাকার মধ্যে" : delivery === "100" ? "ঢাকার আশেপাশে" : "ঢাকার বাইরে", grandTotal: total, type: "blocked", blockReason: 'আগে থেকেই ব্লক করা কাস্টমার', customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined });
      setValidationMsg("আপনি আগেও আমাদের ওয়েবসাইটে অর্ডার করেছিলেন। কিন্তু অর্ডার ক্যান্সেল করে দিয়েছেন। তাই আপনাকে ব্লক করে দেওয়া হয়েছে।");
      return;
    }

    // Check device blocked by fingerprint, phone, or IP (all non-ডেলিভারড statuses)
    const deviceResult = await checkDeviceBlocked(customerFingerprint || undefined, phone, customerIp || undefined);

    if (deviceResult.blocked) {
      // Don't create order, save to incomplete with note
      await addIncomplete({
        name, phone, address,
        items: items.map((i) => ({ title: i.product.title, quantity: i.quantity, price: i.product.price, image: i.product.images[0] || "" })),
        totalPrice: subtotal, deliveryCharge,
        deliveryZone: delivery === "70" ? "ঢাকার মধ্যে" : delivery === "100" ? "ঢাকার আশেপাশে" : "ঢাকার বাইরে",
        grandTotal: total, type: "blocked",
        blockReason: `এনার একটি অর্ডার [${deviceResult.status}] স্ট্যাটাসে আছে`,
        customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined,
        note: orderNote.trim() || undefined,
      });
      setValidationMsg(`প্রিয় গ্রাহক ❤️\n\nআপনি আগেও একটি অর্ডার করেছেন। কিন্তু সেই অর্ডারটি এখন ${deviceResult.status} স্ট্যাটাসে আছে। তাই এখন নতুন কোন অর্ডার করতে পারবেন না। দয়া করে ২৪ ঘন্টা অপেক্ষা করুন। আমরা আপনার নাম্বারে কল করবো। ধন্যবাদ!`);
      return;
    }

    // Fraud check (courier ratio)
    let fraudFailed = false;
    let fraudBlockNote = '';
    if (fraudEnabled) {
      setFraudChecking(true);
      const fraudResult = await checkFraud(phone);
      setFraudChecking(false);
      if (!fraudResult.passed) {
        fraudFailed = true;
        fraudBlockNote = fraudResult.reason === 'no_data'
          ? 'এনার কুরিয়ার হিস্টোরি পাওয়া যায়নি'
          : `এনার কুরিয়ার রেশিও কম (${fraudResult.deliveryPercent}%)`;
      }
    }

    // Place the order (both fraud pass and fail create the order)
    const id = await createOrder({
      name, phone, address,
      items: items.map((i) => ({ title: i.product.title, quantity: i.quantity, price: i.product.price, image: i.product.images[0], variations: i.selectedVariations && Object.keys(i.selectedVariations).length > 0 ? i.selectedVariations : undefined, freeDelivery: i.product.freeDelivery || false })),
      deliveryCharge, subtotal: subtotal - discount, customerIp: customerIp || undefined, customerFingerprint: customerFingerprint || undefined, orderNote: fraudFailed ? `${orderNote.trim() ? orderNote.trim() + ' | ' : ''}⚠️ ${fraudBlockNote}` : orderNote.trim() || undefined,
    });

    orderSubmitted.current = true;
    removeByPhone(phone);
    clearCart();

    if (fraudFailed) {
      // Fraud failed: order created but NO purchase tag, redirect to fake thank you
      navigate("/order-confirmed", { state: { orderId: id } });
      return;
    }

    // Normal flow: fire purchase tag
    trackPurchase(id, items.map((i) => ({ item_id: i.product.id, item_name: i.product.title, price: i.product.price, quantity: i.quantity, item_category: i.product.category })), total, deliveryCharge, discount);

    const popupEnabled = useFraudSettingsStore.getState().postOrderPopupEnabled;
    if (popupEnabled) { setPendingOrderId(id); setShowPostOrderPopup(true); }
    else { navigate("/thank-you", { state: { orderId: id } }); }
  };

  if (orderComplete) {
    return (
      <div className="bg-muted/30 min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">অর্ডার সফল হয়েছে!</h1>
          <p className="text-muted-foreground mb-1 text-sm">আপনার অর্ডার নম্বর</p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg py-3 px-4 mb-5">
            <p className="text-3xl font-bold text-primary tracking-wide">{orderId}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
          <Button onClick={() => navigate("/")} className="w-full" size="lg">হোমপেজে যান</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Red instruction banner */}
      <div className="bg-destructive text-destructive-foreground text-center py-3 px-4">
        <p className="text-[25px] font-bold leading-tight">
          ১০০% নিশ্চিত হয়ে অর্ডার করতে এই ফর্মটি পূরণ করে নিচের "Place Order" বাটনে ক্লিক করুন
        </p>
      </div>

      <div className="container-box py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* LEFT: Billing Details */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Billing details</h2>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম"
                  className="w-full h-12 px-4 border-2 border-border rounded bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Delivery Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="এলাকা, থানা এবং জেলার নাম"
                  className="w-full h-12 px-4 border-2 border-border rounded bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/[\u09E6-\u09EF]/.test(val)) {
                      toast({ title: "আপনার ফোন নাম্বারটি ইংরেজিতে লিখুন প্লিজ!", duration: 4000 });
                    }
                    setPhone(val);
                  }}
                  placeholder="আপনার ফোন নাম্বার"
                  className="w-full h-12 px-4 border-2 border-border rounded bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Order Note */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  অর্ডার নোট (অপশনাল)
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-border rounded bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Shipping / Delivery Area */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">Shipping</h3>
                {!hasFreeDelivery ? (
                  <RadioGroup value={delivery} onValueChange={setDelivery} className="space-y-2">
                    {deliveryOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition-all ${
                          delivery === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} />
                        <span className="flex-1 text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="font-bold text-sm text-primary">৳{opt.price}</span>
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="bg-primary/5 border-2 border-primary/20 rounded p-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary">🎉 ফ্রি ডেলিভারি!</span>
                  </div>
                )}
              </div>

              {/* Coupon */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">কুপন কোড (যদি থাকে)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="কুপন কোড লিখুন"
                    className="flex-1 h-12 px-4 border-2 border-border rounded bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button onClick={applyCoupon} variant="outline" className="h-12 px-6 font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    অ্যাপ্লাই
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary bg-primary/5 rounded px-3 py-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>কুপন "{appliedCoupon}" অ্যাপ্লাই হয়েছে (৳{discount} ছাড়)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Your order</h2>

            <div className="border-2 border-border rounded overflow-hidden">
              {/* Table Header */}
              <div className="flex bg-muted/60 px-4 py-3 border-b-2 border-border">
                <span className="flex-1 text-sm font-bold text-foreground">Product</span>
                <span className="text-sm font-bold text-foreground w-24 text-right">Subtotal</span>
              </div>

              {/* Items */}
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-14 h-14 object-cover rounded border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ৳{item.product.price} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-foreground w-24 text-right flex-shrink-0">
                    ৳{item.product.price * item.quantity}
                  </span>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-foreground">Subtotal</span>
                <span className="text-sm font-bold text-foreground">৳{subtotal}</span>
              </div>

              {/* Delivery */}
              <div className="flex justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-muted-foreground" /> Shipping
                </span>
                <span className={`text-sm font-bold ${hasFreeDelivery ? 'text-primary' : 'text-foreground'}`}>
                  {hasFreeDelivery ? 'ফ্রি' : `৳${deliveryCharge}`}
                </span>
              </div>

              {/* Discount */}
              {discount > 0 && (
                <div className="flex justify-between px-4 py-3 border-b border-border text-primary">
                  <span className="text-sm font-medium">Discount</span>
                  <span className="text-sm font-bold">-৳{discount}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between px-4 py-4 bg-muted/30">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">৳{total}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-5 bg-muted/40 border-2 border-border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm text-foreground">Cash on delivery</span>
              </div>
              <p className="text-xs text-muted-foreground">
                পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। আপনার ব্যক্তিগত তথ্য সুরক্ষিত থাকবে।
              </p>
            </div>

            {/* Place Order Button */}
            <div className="relative mt-5">
              <div className="absolute inset-0 rounded animate-[pulse-cta_2s_ease-in-out_infinite]" style={{ backgroundColor: '#ff6b00' }} />
              <Button
                size="lg"
                className="relative w-full rounded text-lg font-bold h-14 text-white hover:opacity-90 shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
                style={{ backgroundColor: '#ff6b00' }}
                onClick={handleSubmit}
                disabled={fraudChecking || fraudBlocked}
              >
                {fraudChecking ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> চেক করা হচ্ছে...</>
                ) : (
                  <>Place Order — ৳{total}</>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              অর্ডার করার মাধ্যমে আপনি আমাদের শর্তাবলীতে সম্মত হচ্ছেন
            </p>
          </div>
        </div>
      </div>

      <ValidationPopup open={!!validationMsg} message={validationMsg} onClose={() => setValidationMsg("")} />
      <PostOrderPopup orderId={pendingOrderId} isOpen={showPostOrderPopup} onComplete={() => { setShowPostOrderPopup(false); navigate("/thank-you", { state: { orderId: pendingOrderId } }); }} />
    </div>
  );
};

export default Checkout;
