import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useProductStore } from '@/stores/useProductStore';
import { useResellerStore } from '@/stores/useResellerStore';
import { toast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { validatePhone, validateName } from '@/lib/order-validation';
import ValidationPopup from '@/components/ValidationPopup';
import { Trash2, Plus, Search, X, CheckCircle } from 'lucide-react';
import type { ResellerCartItem } from './ResellerShop';
import { db } from '@/lib/supabase-db';

const PACKAGING_CHARGE = 10;

const deliveryCharges: Record<string, { label: string; price: number }> = {
  inside_dhaka: { label: 'ঢাকার মধ্যে', price: 70 },
  around_dhaka: { label: 'ঢাকার আশেপাশে', price: 100 },
  outside_dhaka: { label: 'ঢাকার বাহিরে', price: 130 },
};

const calcCodCharge = (totalPrice: number) => Math.ceil(totalPrice / 100);

const getReseller = () => {
  const auth = localStorage.getItem('reseller-auth');
  return auth ? JSON.parse(auth) : null;
};

const ResellerPlaceOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const allProducts = useProductStore((s) => s.products);
  const resellerOrders = useResellerStore((s) => s.orders);
  const addResellerOrder = useResellerStore((s) => s.addResellerOrder);
  

  const initialItems: ResellerCartItem[] = location.state?.products || [];
  const [items, setItems] = useState<ResellerCartItem[]>(initialItems);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [deliveryZone, setDeliveryZone] = useState('inside_dhaka');
  const [validationMsg, setValidationMsg] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const updateItem = (index: number, updates: Partial<ResellerCartItem>) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addProduct = (product: any) => {
    const existing = items.findIndex(i => i.product.id === product.id);
    if (existing >= 0) {
      updateItem(existing, { qty: items[existing].qty + 1 });
    } else {
      setItems(prev => [...prev, { product, qty: 1, sellingPrice: product.price }]);
    }
    setShowProductPicker(false);
    setProductSearch('');
  };

  const filteredProducts = allProducts.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Calculations — charges are deducted from selling price, not added on top
  const delivery = deliveryCharges[deliveryZone].price;
  const subtotalSelling = items.reduce((s, i) => s + i.sellingPrice * i.qty, 0);
  const subtotalReseller = items.reduce((s, i) => s + (i.product.resellerPrice || i.product.price) * i.qty, 0);
  const codCharge = calcCodCharge(subtotalSelling);
  const grandTotal = subtotalSelling;
  const totalProfit = subtotalSelling - subtotalReseller - delivery - PACKAGING_CHARGE - codCharge;

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({ title: 'অন্তত একটি প্রোডাক্ট যোগ করুন', variant: 'destructive' });
      return;
    }
    if (!customerForm.name || !customerForm.phone || !customerForm.address) {
      toast({ title: 'কাস্টমারের সব তথ্য দিন', variant: 'destructive' });
      return;
    }
    const nameErr = validateName(customerForm.name);
    if (nameErr) { setValidationMsg(nameErr); return; }
    const phoneErr = validatePhone(customerForm.phone);
    if (phoneErr) { setValidationMsg(phoneErr); return; }

    const reseller = getReseller();
    if (!reseller) return;

    const resellerCost = subtotalReseller + delivery + PACKAGING_CHARGE + codCharge;

    // Get max order number from both counter AND existing reseller_orders
    const { data: counterRow } = await db.from('counters').select('value').eq('id', 'reseller_order_number').single();
    const counterVal = counterRow?.value || 0;

    // Also check max numeric ID from existing reseller_orders (e.g. "RO15" → 15)
    const { data: existingOrders } = await db.from('reseller_orders').select('id');
    let maxExisting = 0;
    if (existingOrders) {
      for (const o of existingOrders) {
        const num = parseInt(String(o.id).replace(/^RO/i, ''), 10);
        if (!isNaN(num) && num > maxExisting) maxExisting = num;
      }
    }

    const nextNum = Math.max(counterVal, maxExisting) + 1;
    await db.from('counters').update({ value: nextNum }).eq('id', 'reseller_order_number');
    const orderId = 'RO' + String(nextNum).padStart(2, '0');
    const resellerOrder = {
      id: orderId,
      resellerId: reseller.id,
      resellerName: reseller.name,
      customerName: customerForm.name,
      customerPhone: customerForm.phone,
      customerAddress: customerForm.address,
      items: items.map(i => ({
        productId: i.product.id,
        productTitle: i.product.title,
        image: i.product.featuredImage || i.product.images[0] || '',
        qty: i.qty,
        resellerPrice: i.product.resellerPrice || i.product.price,
        sellingPrice: i.sellingPrice,
        profit: (i.sellingPrice - (i.product.resellerPrice || i.product.price)) * i.qty,
        selectedColor: i.selectedColor || '',
        selectedSize: i.selectedSize || '',
        selectedWeight: i.selectedWeight || '',
      })),
      deliveryCharge: delivery,
      packagingCharge: PACKAGING_CHARGE,
      codCharge,
      totalSellingPrice: grandTotal,
      totalResellerCost: resellerCost,
      totalProfit,
      status: 'পেন্ডিং',
      date: new Date().toISOString(),
      notes: customerForm.note.trim() ? [customerForm.note.trim()] : [],
    };

    try {
      await addResellerOrder(resellerOrder);
      toast({ title: 'অর্ডার সাবমিট হয়েছে!', description: `অর্ডার নং: ${orderId}, লাভ: ৳${totalProfit}` });
      navigate('/reseller/orders');
    } catch (err) {
      toast({ title: 'অর্ডার সাবমিট ব্যর্থ হয়েছে', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <h1 className="text-2xl font-bold text-foreground">অর্ডার সাবমিট করুন</h1>

      {/* Product Items */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">প্রোডাক্ট সমূহ</Label>
            <Button variant="outline" size="sm" onClick={() => setShowProductPicker(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> প্রোডাক্ট যোগ করুন
            </Button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">কোনো প্রোডাক্ট যোগ করা হয়নি</p>
          )}

          {items.map((item, index) => {
            const resellerPrice = item.product.resellerPrice || item.product.price;
            const profit = (item.sellingPrice - resellerPrice) * item.qty;
            const colors = item.product.colors || [];
            const sizes = item.product.sizes || [];
            const weights = item.product.weights || [];
            return (
              <div key={`${item.product.id}-${index}`} className="flex gap-3 p-3 bg-muted/50 rounded-lg relative">
                <img
                  src={item.product.featuredImage || item.product.images[0] || '/placeholder.svg'}
                  alt=""
                  className="w-16 h-16 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.product.title}</p>
                    <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">রিসেলার প্রাইজ: ৳{resellerPrice}</p>
                  
                  {/* Variation Selectors */}
                  {colors.length > 0 && (
                    <div>
                      <Label className="text-xs">কালার</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {colors.map((c: string) => (
                          <button
                            key={c}
                            onClick={() => updateItem(index, { selectedColor: c })}
                            className={`px-2 py-0.5 text-xs rounded border transition-colors ${item.selectedColor === c ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div>
                      <Label className="text-xs">সাইজ</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {sizes.map((s: string) => (
                          <button
                            key={s}
                            onClick={() => updateItem(index, { selectedSize: s })}
                            className={`px-2 py-0.5 text-xs rounded border transition-colors ${item.selectedSize === s ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {weights.length > 0 && (
                    <div>
                      <Label className="text-xs">ওজন</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {weights.map((w: string) => (
                          <button
                            key={w}
                            onClick={() => updateItem(index, { selectedWeight: w })}
                            className={`px-2 py-0.5 text-xs rounded border transition-colors ${item.selectedWeight === w ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">পরিমাণ</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => updateItem(index, { qty: Number(e.target.value) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">বিক্রয় মূল্য</Label>
                      <Input
                        type="number"
                        value={item.sellingPrice}
                        onChange={(e) => updateItem(index, { sellingPrice: Number(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  {profit > 0 && (
                    <p className="text-xs font-medium text-green-600">লাভ: ৳{profit}</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <Label className="text-base font-semibold">কাস্টমার তথ্য</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">কাস্টমারের নাম *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="নাম"
              />
            </div>
            <div>
              <Label className="text-sm">ফোন নম্বর *</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <Label className="text-sm">ঠিকানা *</Label>
              <Input
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="সম্পূর্ণ ঠিকানা"
              />
            </div>
            <div>
              <Label className="text-sm">নোট (ঐচ্ছিক)</Label>
              <Input
                value={customerForm.note}
                onChange={(e) => setCustomerForm({ ...customerForm, note: e.target.value })}
                placeholder="অর্ডার সম্পর্কিত কোনো নোট থাকলে লিখুন"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-base font-semibold">ডেলিভারি এরিয়া</Label>
          <RadioGroup value={deliveryZone} onValueChange={setDeliveryZone} className="space-y-2">
            {Object.entries(deliveryCharges).map(([key, val]) => (
              <label
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  deliveryZone === key ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={key} />
                  <span className="text-sm font-medium">{val.label}</span>
                </div>
                <span className="text-sm font-bold text-primary">৳{val.price}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Order Summary */}
      {items.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Label className="text-base font-semibold">অর্ডার সামারি</Label>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">সেলিং প্রাইজ:</span><span>৳{subtotalSelling}</span></div>
              <div className="flex justify-between text-destructive"><span>- DP প্রাইজ:</span><span>৳{subtotalReseller}</span></div>
              <div className="flex justify-between text-destructive"><span>- ডেলিভারি চার্জ:</span><span>৳{delivery}</span></div>
              <div className="flex justify-between text-destructive"><span>- প্যাকেজিং চার্জ:</span><span>৳{PACKAGING_CHARGE}</span></div>
              <div className="flex justify-between text-destructive"><span>- COD চার্জ (১%):</span><span>৳{codCharge}</span></div>
              <div className="flex justify-between font-bold border-t pt-2 text-base">
                <span>কাস্টমার পে করবে:</span><span>৳{grandTotal}</span>
              </div>
              {totalProfit > 0 ? (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>মোট লাভ:</span><span>৳{totalProfit}</span>
                </div>
              ) : totalProfit < 0 ? (
                <div className="flex justify-between text-destructive font-medium">
                  <span>লস:</span><span>৳{Math.abs(totalProfit)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      <Button className="w-full text-base h-12" onClick={handleSubmit} disabled={items.length === 0}>
        <CheckCircle className="h-4 w-4 mr-2" /> অর্ডার সাবমিট করুন
      </Button>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
          <div className="bg-background w-full max-w-md max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">প্রোডাক্ট সিলেক্ট করুন</h3>
              <button onClick={() => { setShowProductPicker(false); setProductSearch(''); }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  className="pl-9"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
                >
                  <img
                    src={product.featuredImage || product.images[0] || '/placeholder.svg'}
                    alt=""
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                    <p className="text-xs text-primary font-bold">৳{product.resellerPrice || product.price}</p>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ValidationPopup open={!!validationMsg} message={validationMsg} onClose={() => setValidationMsg('')} />
    </div>
  );
};

export default ResellerPlaceOrder;
