import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '@/stores/useProductStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit2, Trash2, Eye, FileText, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import ImportExportButtons from '@/components/admin/ImportExportButtons';
import { Product } from '@/data/store-data';

const Products = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const { products: productList, deleteProduct, updateProduct } = useProductStore();

  const filtered = productList.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (p.status || 'published') === statusFilter;
    return matchSearch && matchStatus;
  });

  const publishedCount = productList.filter(p => (p.status || 'published') === 'published').length;
  const draftCount = productList.filter(p => p.status === 'draft').length;

  const handleDelete = (id: string) => { deleteProduct(id); toast.success('পণ্য ডিলিট করা হয়েছে'); };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    updateProduct(id, { status: newStatus as 'published' | 'draft' });
    toast.success(newStatus === 'published' ? 'পণ্য পাবলিশ করা হয়েছে' : 'পণ্য ড্রাফটে নেওয়া হয়েছে');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">পণ্য সমূহ</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">মোট {productList.length}টি পণ্য</span>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">{publishedCount} পাবলিশড</Badge>
            <Badge variant="secondary" className="text-xs">{draftCount} ড্রাফট</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportExportButtons
            data={productList}
            filename="products"
            label="পণ্য"
            onImport={(items: Product[]) => {
              items.forEach(p => {
                if (!productList.find(ep => ep.id === p.id)) {
                  useProductStore.getState().addProduct(p);
                }
              });
            }}
          />
          <Button className="gap-2" onClick={() => navigate('/admin/products/new')}>
            <Plus className="w-4 h-4" /> নতুন পণ্য যোগ করুন
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="পণ্য খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব পণ্য</SelectItem>
            <SelectItem value="published">পাবলিশড</SelectItem>
            <SelectItem value="draft">ড্রাফট</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">পণ্য</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">ক্যাটাগরি</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">মূল্য</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">স্ট্যাটাস</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">স্টক</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const productStatus = product.status || 'published';
                  return (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={product.featuredImage || product.images[0]} alt={product.title} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-medium line-clamp-1 max-w-[200px]">{product.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">৳ {product.price}</span>
                        {product.originalPrice && <span className="text-xs text-muted-foreground line-through ml-1">৳ {product.originalPrice}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStatus(product.id, productStatus)} className="cursor-pointer">
                          {productStatus === 'published' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 gap-1 text-xs"><Eye className="w-3 h-3" /> পাবলিশড</Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs hover:bg-secondary/80"><FileText className="w-3 h-3" /> ড্রাফট</Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.inStock ? 'স্টকে আছে' : 'স্টকে নেই'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(product.status || 'published') === 'published' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="ভিউ করুন" onClick={() => navigate(`/product/${product.slug}`)}>
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="লিংক কপি" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/product/${product.slug}`);
                                toast.success('লিংক কপি হয়েছে');
                              }}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/products/edit/${product.id}`)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
