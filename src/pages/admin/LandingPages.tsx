import { useState, useEffect, useMemo } from 'react';
import { useLandingPageStore, type LandingPage } from '@/stores/useLandingPageStore';
import { useProductStore } from '@/stores/useProductStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ExternalLink, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-|-$/g, '') || `lp-${Date.now()}`;

const LandingPages = () => {
  const { pages, fetchPages, addPage, updatePage, deletePage } = useLandingPageStore();
  const products = useProductStore((s) => s.products);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [title, setTitle] = useState('');
  const [productId, setProductId] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [productSearch, setProductSearch] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customOriginalPrice, setCustomOriginalPrice] = useState('');
  useEffect(() => { fetchPages(); }, []);

  const filteredProducts = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    if (!productSearch.trim()) return published;
    const q = productSearch.toLowerCase();
    return published.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setProductId('');
    setSlug('');
    setStatus('published');
    setProductSearch('');
    setCustomPrice('');
    setCustomOriginalPrice('');
    setShowEditor(true);
  };

  const openEdit = (page: LandingPage) => {
    setEditing(page);
    setTitle(page.title);
    setProductId(page.productId);
    setSlug(page.slug);
    setStatus(page.status);
    setProductSearch('');
    setCustomPrice(page.customPrice ? String(page.customPrice) : '');
    setCustomOriginalPrice(page.customOriginalPrice ? String(page.customOriginalPrice) : '');
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !productId) {
      toast({ title: 'হেডিং এবং প্রডাক্ট সিলেক্ট করুন', variant: 'destructive' });
      return;
    }
    const finalSlug = slug.trim() || generateSlug(title);
    const priceData = {
      customPrice: customPrice ? Number(customPrice) : null,
      customOriginalPrice: customOriginalPrice ? Number(customOriginalPrice) : null,
    };
    if (editing) {
      await updatePage(editing.id, { title, productId, slug: finalSlug, status, ...priceData });
      toast({ title: 'ল্যান্ডিং পেজ আপডেট হয়েছে' });
    } else {
      await addPage({ id: crypto.randomUUID(), title, productId, slug: finalSlug, status, ...priceData });
      toast({ title: 'ল্যান্ডিং পেজ তৈরি হয়েছে' });
    }
    setShowEditor(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('ডিলিট করতে চান?')) {
      await deletePage(id);
      toast({ title: 'ডিলিট হয়েছে' });
    }
  };

  const getProductName = (id: string) => products.find((p) => p.id === id)?.title || 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ল্যান্ডিং পেজ</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> নতুন পেজ
        </Button>
      </div>

      <div className="border rounded-[5px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>হেডিং</TableHead>
              <TableHead>প্রডাক্ট</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>{getProductName(page.productId)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${page.status === 'published' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {page.status === 'published' ? 'পাবলিশড' : 'ড্রাফট'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => window.open(`/lp/${page.slug}`, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(page)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  কোনো ল্যান্ডিং পেজ নেই। নতুন তৈরি করুন।
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'পেজ এডিট করুন' : 'নতুন ল্যান্ডিং পেজ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">হেডিং টেক্সট *</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!editing) setSlug(generateSlug(e.target.value)); }} placeholder="যেমন: সুপার অফার! মাত্র ৳৯৯৯ তে..." />
            </div>
            <div>
              <Label className="mb-1.5 block">প্রডাক্ট সিলেক্ট করুন *</Label>
              {/* Searchable product selector */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="প্রডাক্ট সার্চ করুন..."
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-[5px] divide-y">
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">কোনো প্রডাক্ট পাওয়া যায়নি</p>
                )}
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-muted/50 transition-colors ${productId === p.id ? 'bg-primary/10 font-semibold' : ''}`}
                  >
                    {p.featuredImage && (
                      <img src={p.featuredImage} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <span className="truncate flex-1">{p.title}</span>
                    {productId === p.id && <span className="text-primary text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
              {productId && (
                <p className="text-xs text-primary mt-1">সিলেক্টেড: {getProductName(productId)}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">স্লাগ (URL)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
              <p className="text-xs text-muted-foreground mt-1">URL: /lp/{slug || '...'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">কাস্টম বর্তমান প্রাইজ (৳)</Label>
                <Input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="প্রডাক্টের প্রাইজ ব্যবহার হবে" />
              </div>
              <div>
                <Label className="mb-1.5 block">কাস্টম রেগুলার প্রাইজ (৳)</Label>
                <Input type="number" value={customOriginalPrice} onChange={(e) => setCustomOriginalPrice(e.target.value)} placeholder="প্রডাক্টের প্রাইজ ব্যবহার হবে" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">স্ট্যাটাস</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">পাবলিশড</SelectItem>
                  <SelectItem value="draft">ড্রাফট</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>
              {editing ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPages;
