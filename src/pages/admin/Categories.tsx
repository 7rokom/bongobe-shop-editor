import { useState } from 'react';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ImportExportButtons from '@/components/admin/ImportExportButtons';

const Categories = () => {
  const { categories: cats, addCategory, deleteCategory, updateCategory } = useCategoryStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const handleSave = () => {
    if (!name.trim()) { toast.error('ক্যাটাগরির নাম দিন'); return; }
    if (editingId) {
      updateCategory(editingId, { name: name.trim(), icon: icon.trim() || '📦' });
      toast.success('ক্যাটাগরি আপডেট হয়েছে');
    } else {
      addCategory({
        id: Date.now().toString(),
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        icon: icon.trim() || '📦',
        productCount: 0,
      });
      toast.success('নতুন ক্যাটাগরি যোগ হয়েছে');
    }
    setName(''); setIcon(''); setEditingId(null); setDialogOpen(false);
  };

  const handleEdit = (cat: typeof cats[0]) => {
    setEditingId(cat.id); setName(cat.name); setIcon(cat.icon); setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    toast.success('ক্যাটাগরি ডিলিট করা হয়েছে');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ক্যাটাগরি</h1>
          <p className="text-sm text-muted-foreground">মোট {cats.length}টি ক্যাটাগরি</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportExportButtons
            data={cats}
            filename="categories"
            label="ক্যাটাগরি"
            onImport={(items) => {
              items.forEach((c: any) => {
                if (!cats.find(ec => ec.id === c.id)) addCategory(c);
              });
            }}
          />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setName(''); setIcon(''); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> নতুন ক্যাটাগরি</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি যোগ করুন'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>ক্যাটাগরির নাম</Label>
                <Input placeholder="ক্যাটাগরির নাম লিখুন" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>আইকন (Font Awesome ক্লাস)</Label>
                <Input placeholder="fa-solid fa-mobile-screen" value={icon} onChange={(e) => setIcon(e.target.value)} />
                <p className="text-xs text-muted-foreground">যেমন: fa-solid fa-mobile-screen, fa-solid fa-headphones, fa-solid fa-shirt</p>
              </div>
              <Button className="w-full" onClick={handleSave}>সেভ করুন</Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((cat) => (
          <Card key={cat.id} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {cat.icon && cat.icon.startsWith('fa') ? (
                  <i className={`${cat.icon} text-3xl text-primary`} />
                ) : (
                  <span className="text-3xl">{cat.icon || '📦'}</span>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.productCount}টি পণ্য</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Categories;
