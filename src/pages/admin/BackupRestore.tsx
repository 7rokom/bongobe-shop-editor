import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, AlertCircle, CheckCircle2, Database, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/supabase-db';

// ---- Section definitions ----

interface BackupItem {
  key: string;
  label: string;
  source: 'supabase' | 'localStorage';
  localStorageKey?: string; // for localStorage items
  localStorageDataKey?: string; // key inside the parsed JSON (e.g. 'state.orders')
}

interface BackupSection {
  label: string;
  items: BackupItem[];
}

const BACKUP_SECTIONS: BackupSection[] = [
  {
    label: 'অর্ডার ম্যানেজ',
    items: [
      { key: 'orders', label: 'অর্ডার সমূহ', source: 'supabase' },
      { key: 'incomplete_orders', label: 'অসম্পূর্ণ অর্ডার', source: 'localStorage', localStorageKey: 'incomplete-orders', localStorageDataKey: 'orders' },
      { key: 'follow_up', label: 'ফলোয়াপ সীট', source: 'localStorage', localStorageKey: 'follow-up-store' },
      { key: 'coupons', label: 'কুপন', source: 'localStorage', localStorageKey: 'coupon-store', localStorageDataKey: 'coupons' },
      { key: 'blocked_customers', label: 'ব্লকড কাস্টমার', source: 'localStorage', localStorageKey: 'blocked-customers', localStorageDataKey: 'blockedList' },
      { key: 'fraud_settings', label: 'ফ্রড সেটিংস', source: 'supabase' },
    ],
  },
  {
    label: 'প্রোডাক্ট ম্যানেজ',
    items: [
      { key: 'products', label: 'সকল প্রোডাক্ট', source: 'supabase' },
      { key: 'categories', label: 'ক্যাটাগরি', source: 'supabase' },
      { key: 'variations', label: 'ভেরিয়েশন', source: 'supabase' },
    ],
  },
  {
    label: 'টিম মেম্বার',
    items: [
      { key: 'employees', label: 'সকল টিম মেম্বার', source: 'supabase' },
      { key: 'employee_activities', label: 'টিম রিপোর্ট', source: 'supabase' },
    ],
  },
  {
    label: 'রিসেলার',
    items: [
      { key: 'resellers', label: 'সকল রিসেলার', source: 'supabase' },
      { key: 'reseller_orders', label: 'রিসেলার অর্ডার', source: 'supabase' },
      { key: 'payment_requests', label: 'পেমেন্ট রিকুয়েস্ট', source: 'supabase' },
    ],
  },
  {
    label: 'একাউন্ট ম্যানেজ',
    items: [
      { key: 'stock_entries', label: 'স্টক ম্যানেজ', source: 'supabase' },
      { key: 'expenses', label: 'খরচ', source: 'supabase' },
      { key: 'deposits', label: 'ডিপোজিট', source: 'supabase' },
    ],
  },
  {
    label: 'পোস্ট এবং পেজ',
    items: [
      { key: 'blog_posts', label: 'পোস্ট এবং পেজ', source: 'supabase' },
    ],
  },
  {
    label: 'সেটিংস',
    items: [
      { key: 'site_settings', label: 'সাইট সেটিংস', source: 'supabase' },
      { key: 'admin_auth', label: 'পাসওয়ার্ড সেটিংস', source: 'localStorage', localStorageKey: 'admin-auth' },
    ],
  },
];

const ALL_ITEMS = BACKUP_SECTIONS.flatMap((s) => s.items);

// ---- Helpers ----

const readLocalStorageItem = (item: BackupItem): any => {
  try {
    const raw = localStorage.getItem(item.localStorageKey!);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist stores data under { state: { ... }, version: ... }
    const state = parsed?.state;
    if (!state) return parsed;
    if (item.localStorageDataKey) return state[item.localStorageDataKey];
    return state;
  } catch {
    return null;
  }
};

const writeLocalStorageItem = (item: BackupItem, data: any) => {
  try {
    const raw = localStorage.getItem(item.localStorageKey!);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        if (item.localStorageDataKey) {
          parsed.state[item.localStorageDataKey] = data;
        } else {
          // Replace entire state
          parsed.state = data;
        }
        localStorage.setItem(item.localStorageKey!, JSON.stringify(parsed));
        return;
      }
    }
    // If no existing structure, create zustand persist format
    if (item.localStorageDataKey) {
      localStorage.setItem(item.localStorageKey!, JSON.stringify({ state: { [item.localStorageDataKey]: data }, version: 0 }));
    } else {
      localStorage.setItem(item.localStorageKey!, JSON.stringify({ state: data, version: 0 }));
    }
  } catch (err) {
    console.error('localStorage write error:', err);
  }
};

// ---- Component ----

const BackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setProgress(0);
    const backupData: Record<string, any> = {};
    let itemCount = 0;

    try {
      for (let i = 0; i < ALL_ITEMS.length; i++) {
        const item = ALL_ITEMS[i];
        setCurrentItem(item.label);
        setProgress(Math.round(((i + 1) / ALL_ITEMS.length) * 100));

        if (item.source === 'supabase') {
          const { data, error } = await db.from(item.key).select('*');
          if (!error && data && data.length > 0) {
            backupData[item.key] = data;
            itemCount++;
          }
        } else {
          const data = readLocalStorageItem(item);
          if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
            backupData[item.key] = data;
            itemCount++;
          }
        }
      }

      if (itemCount === 0) {
        toast.error('ব্যাকআপ নেওয়ার মতো কোনো ডাটা নেই');
        return;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `db-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${itemCount}টি আইটেমের ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে`);
    } catch (err) {
      console.error('Backup error:', err);
      toast.error('ব্যাকআপ নেওয়ার সময় সমস্যা হয়েছে');
    } finally {
      setIsBackingUp(false);
      setProgress(0);
      setCurrentItem('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFileRef.current = file;
    setShowConfirm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    const file = pendingFileRef.current;
    if (!file) return;
    setShowConfirm(false);
    setIsRestoring(true);
    setProgress(0);
    setRestoreStatus('idle');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const validItems = ALL_ITEMS.filter((item) => data[item.key] !== undefined);

        if (validItems.length === 0) {
          toast.error('ফাইলে কোনো বৈধ ডাটা পাওয়া যায়নি');
          setIsRestoring(false);
          return;
        }

        let restored = 0;
        let failed = 0;

        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          setCurrentItem(item.label);
          setProgress(Math.round(((i + 1) / validItems.length) * 100));

          if (item.source === 'supabase') {
            // Delete existing
            const { error: deleteError } = await db.from(item.key).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) {
              console.error(`Delete error for ${item.key}:`, deleteError);
              failed++;
              continue;
            }

            // Insert in batches of 100
            const rows = data[item.key];
            if (Array.isArray(rows) && rows.length > 0) {
              const batchSize = 100;
              let batchFailed = false;
              for (let j = 0; j < rows.length; j += batchSize) {
                const batch = rows.slice(j, j + batchSize);
                const { error: insertError } = await db.from(item.key).insert(batch);
                if (insertError) {
                  console.error(`Insert error for ${item.key}:`, insertError);
                  batchFailed = true;
                  break;
                }
              }
              batchFailed ? failed++ : restored++;
            } else {
              restored++;
            }
          } else {
            // localStorage restore
            try {
              writeLocalStorageItem(item, data[item.key]);
              restored++;
            } catch {
              failed++;
            }
          }
        }

        if (failed > 0) {
          toast.warning(`${restored}টি আইটেম রিস্টোর হয়েছে, ${failed}টিতে সমস্যা হয়েছে`);
        } else {
          toast.success(`${restored}টি আইটেমের ডাটা সফলভাবে রিস্টোর হয়েছে। পেজ রিলোড হচ্ছে...`);
        }
        setRestoreStatus('success');
        setTimeout(() => window.location.reload(), 2000);
      } catch {
        setRestoreStatus('error');
        toast.error('ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে। সঠিক JSON ফাইল দিন।');
      } finally {
        setIsRestoring(false);
        setProgress(0);
        setCurrentItem('');
        pendingFileRef.current = null;
      }
    };
    reader.readAsText(file);
  };

  const isProcessing = isBackingUp || isRestoring;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-6 h-6" /> ব্যাকআপ ও রিস্টোর
        </h1>
        <p className="text-sm text-muted-foreground">
          ডাটাবেসের সকল ডাটা ব্যাকআপ নিন এবং প্রয়োজনে আগের ব্যাকআপ থেকে রিস্টোর করুন
        </p>
      </div>

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isBackingUp ? 'ব্যাকআপ নেওয়া হচ্ছে' : 'রিস্টোর করা হচ্ছে'}: {currentItem}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" /> ব্যাকআপ নিন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            নিচের সকল সেকশনের ডাটা একটি JSON ফাইল হিসেবে ডাউনলোড হবে।
          </p>

          {/* Section-wise items */}
          <div className="space-y-2">
            {BACKUP_SECTIONS.map((section) => (
              <div key={section.label} className="border rounded-md">
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span>{section.label}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                    {expandedSections.has(section.label) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>
                {expandedSections.has(section.label) && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                    {section.items.map((item) => (
                      <Badge key={item.key} variant="outline" className="text-[10px]">
                        {item.label}
                        {item.source === 'localStorage' && <span className="ml-1 text-muted-foreground">(লোকাল)</span>}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleBackup} disabled={isProcessing} className="gap-2 w-full sm:w-auto">
            {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            ব্যাকআপ ডাউনলোড করুন
          </Button>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> রিস্টোর করুন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              সতর্কতা: রিস্টোর করলে বর্তমান সকল ডাটা ব্যাকআপ ফাইলের ডাটা দিয়ে প্রতিস্থাপিত হবে। আগে ব্যাকআপ নিয়ে রাখুন।
            </p>
          </div>

          {showConfirm && (
            <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5 space-y-3">
              <p className="text-sm font-medium text-foreground">
                আপনি কি নিশ্চিত যে রিস্টোর করতে চান? বর্তমান সকল ডাটা মুছে যাবে।
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={executeRestore}>
                  হ্যাঁ, রিস্টোর করুন
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowConfirm(false); pendingFileRef.current = null; }}>
                  বাতিল
                </Button>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || showConfirm}
            className="gap-2 w-full sm:w-auto"
          >
            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            ব্যাকআপ ফাইল আপলোড করুন
          </Button>

          {restoreStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" /> রিস্টোর সফল হয়েছে
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
