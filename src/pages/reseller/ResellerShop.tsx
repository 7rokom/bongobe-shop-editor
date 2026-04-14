import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductStore } from '@/stores/useProductStore';
import { useMohasagorStore } from '@/stores/useMohasagorStore';
import { useResellerStore } from '@/stores/useResellerStore';
import { ShoppingCart, Search, Link2, Check, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/supabase-db';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface ResellerCartItem {
  product: any;
  qty: number;
  sellingPrice: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedWeight?: string;
}

const ResellerShop = () => {
  const products = useProductStore((s) => s.products);
  const { products: mohasagorProducts, categories: mohasagorCategories, loading: mohasagorLoading, fetchProducts: fetchMohasagor } = useMohasagorStore();
  const resellers = useResellerStore((s) => s.resellers);
  const fetchResellers = useResellerStore((s) => s.fetchResellers);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  const auth = localStorage.getItem('reseller-auth');
  const resellerId = auth ? JSON.parse(auth).id : '';
  const reseller = resellers.find(r => r.id === resellerId);
  const serialNumber = reseller?.serialNumber;

  useEffect(() => {
    fetchMohasagor();
  }, []);

  useEffect(() => {
    if (!resellerId) return;
    if (!reseller) fetchResellers();
    db.from('reseller_product_prices').select('*').eq('reseller_id', resellerId)
      .then(({ data }: any) => {
        if (data) {
          const prices: Record<string, number> = {};
          data.forEach((d: any) => { prices[d.product_id] = Number(d.custom_price); });
          setCustomPrices(prices);
        }
      });
  }, [resellerId]);

  const filterProducts = (list: any[]) =>
    list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const handleOrder = (product: any) => {
    const sellingPrice = customPrices[product.id] || product.price;
    navigate('/reseller/place-order', { state: { products: [{ product, qty: 1, sellingPrice }] } });
  };

  const handleCopyLink = (product: any) => {
    const ref = serialNumber || resellerId;
    const slug = product.slug;
    const link = `${window.location.origin}/r/${ref}/product/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(product.id);
      toast({ title: 'লিংক কপি হয়েছে!' });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSavePrice = async () => {
    if (!editingProduct || !editPrice) return;
    const price = Number(editPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: 'সঠিক দাম দিন', variant: 'destructive' });
      return;
    }
    const existing = await db.from('reseller_product_prices')
      .select('id').eq('reseller_id', resellerId).eq('product_id', editingProduct.id).maybeSingle();
    if (existing.data) {
      await db.from('reseller_product_prices').update({ custom_price: price }).eq('id', existing.data.id);
    } else {
      await db.from('reseller_product_prices').insert({ reseller_id: resellerId, product_id: editingProduct.id, custom_price: price });
    }
    setCustomPrices(prev => ({ ...prev, [editingProduct.id]: price }));
    toast({ title: 'দাম সেভ হয়েছে!' });
    setEditingProduct(null);
  };

  const renderProductCard = (product: any) => {
    const resellerPrice = product.resellerPrice || product.price;
    const sellingPrice = customPrices[product.id] || product.price;
    return (
      <Card key={product.id} className="border-0 shadow-sm overflow-hidden group">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={product.featuredImage || product.images[0] || '/placeholder.svg'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{product.title}</p>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">রিসেলার প্রাইস: ৳{resellerPrice}</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-bold text-primary">৳{sellingPrice}</p>
              <button
                className="text-muted-foreground hover:text-primary"
                onClick={() => { setEditingProduct(product); setEditPrice(String(sellingPrice)); }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleOrder(product)}>
              <ShoppingCart className="h-3.5 w-3.5" /> অর্ডার
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 px-2"
              onClick={() => handleCopyLink(product)}
            >
              {copiedId === product.id ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">লিংক</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredOwn = filterProducts(products);
  
  // Filter mohasagor by category
  const filteredMohasagor = filterProducts(
    selectedCategory === 'all' 
      ? mohasagorProducts 
      : mohasagorProducts.filter(p => p.category === selectedCategory)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">শপ পেজ</h1>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="প্রোডাক্ট খুঁজুন..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">সব প্রোডাক্ট ({mohasagorProducts.length})</TabsTrigger>
          <TabsTrigger value="trending">ট্রেন্ডিং প্রোডাক্ট ({filteredOwn.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {/* Category filter tabs */}
          {mohasagorCategories.length > 0 && (
            <ScrollArea className="w-full mb-4">
              <div className="flex gap-2 pb-2">
                <Button
                  size="sm"
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className="whitespace-nowrap"
                >
                  সব ({mohasagorProducts.length})
                </Button>
                {mohasagorCategories.map((cat) => {
                  const count = mohasagorProducts.filter(p => p.category === cat).length;
                  return (
                    <Button
                      key={cat}
                      size="sm"
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat} ({count})
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {mohasagorLoading ? (
            <p className="text-center text-muted-foreground py-8">লোড হচ্ছে...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMohasagor.map((p) => renderProductCard(p))}
            </div>
          )}
          {!mohasagorLoading && filteredMohasagor.length === 0 && <p className="text-center text-muted-foreground py-8">কোন প্রোডাক্ট পাওয়া যায়নি</p>}
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredOwn.map((p) => renderProductCard(p))}
          </div>
          {filteredOwn.length === 0 && <p className="text-center text-muted-foreground py-8">কোন প্রোডাক্ট পাওয়া যায়নি</p>}
        </TabsContent>
      </Tabs>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>সেলিং প্রাইস সেট করুন</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{editingProduct.title}</p>
              <p className="text-sm">রিসেলার প্রাইস: <span className="font-bold">৳{editingProduct.resellerPrice || editingProduct.price}</span></p>
              <div className="space-y-2">
                <Label>আপনার সেলিং প্রাইস</Label>
                <Input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="সেলিং প্রাইস"
                />
              </div>
              {Number(editPrice) > (editingProduct.resellerPrice || editingProduct.price) && (
                <p className="text-sm text-green-600 font-medium">
                  আপনার লাভ: ৳{Number(editPrice) - (editingProduct.resellerPrice || editingProduct.price)}
                </p>
              )}
              <Button className="w-full" onClick={handleSavePrice}>সেভ করুন</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResellerShop;
