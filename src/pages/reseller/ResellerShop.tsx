import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductStore } from '@/stores/useProductStore';
import { ShoppingCart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ResellerCartItem {
  product: any;
  qty: number;
  sellingPrice: number;
}

const ResellerShop = () => {
  const products = useProductStore((s) => s.products);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOrder = (product: any) => {
    navigate('/reseller/place-order', { state: { products: [{ product, qty: 1, sellingPrice: product.price }] } });
  };

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product) => {
          const resellerPrice = product.resellerPrice || product.price;
          return (
            <Card key={product.id} className="border-0 shadow-sm overflow-hidden group">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.featuredImage || product.images[0] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium text-foreground line-clamp-2">{product.title}</p>
                <p className="text-lg font-bold text-primary">৳{resellerPrice}</p>
                <Button size="sm" className="w-full gap-1.5" onClick={() => handleOrder(product)}>
                  <ShoppingCart className="h-3.5 w-3.5" /> অর্ডার করুন
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ResellerShop;
