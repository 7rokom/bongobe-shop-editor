# Supabase Setup Prompt — অন্য Lovable প্রজেক্টে দিন

নিচের পুরো prompt টা copy করে নতুন Lovable প্রজেক্টে paste করুন। এটা আপনার সাইটের জন্য সকল প্রয়োজনীয় Supabase tables তৈরি করে দেবে।

---

## 📋 Prompt শুরু (এখান থেকে copy করুন)

আমার e-commerce + reseller + admin সাইটের জন্য Supabase database setup করো। নিচের সব tables তৈরি করতে হবে এক migration-এ। সব table-এ RLS enable থাকবে এবং `"Allow all access"` policy থাকবে (কারণ আমার সাইটে custom auth ব্যবহার হয়, Supabase auth না)।

### সকল Tables তৈরি করতে নিচের SQL migration চালাও:

```sql
-- ============================================
-- 1. PRODUCTS & CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT '',
  product_count INTEGER DEFAULT 0
);

CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  long_description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  buy_price NUMERIC,
  reseller_price NUMERIC,
  images JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  featured_video TEXT,
  category TEXT DEFAULT '',
  brand TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  weights JSONB DEFAULT '[]'::jsonb,
  variations JSONB DEFAULT '[]'::jsonb,
  variation_prices JSONB DEFAULT '[]'::jsonb,
  meta_description TEXT,
  meta_keywords TEXT,
  meta_tags JSONB DEFAULT '[]'::jsonb,
  reviews JSONB DEFAULT '[]'::jsonb,
  stock_type TEXT DEFAULT 'self',
  stock_product_name TEXT,
  status TEXT DEFAULT 'published',
  in_stock BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  free_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.variations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL
);

-- ============================================
-- 2. ORDERS
-- ============================================
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  original_delivery_charge NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'পেন্ডিং',
  confirmed_by TEXT DEFAULT '',
  assigned_to TEXT,
  assigned_to_name TEXT,
  customer_ip TEXT,
  customer_fingerprint TEXT,
  note TEXT DEFAULT '',
  paid_return_amount NUMERIC,
  date TEXT,
  iso_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.incomplete_orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'incomplete',
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  delivery_zone TEXT NOT NULL DEFAULT '',
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  block_reason TEXT,
  customer_ip TEXT,
  customer_fingerprint TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.follow_up_data (
  order_id TEXT PRIMARY KEY,
  status TEXT,
  note TEXT DEFAULT '',
  tracking_url TEXT DEFAULT '',
  courier_name TEXT DEFAULT '',
  courier_locked BOOLEAN DEFAULT false,
  stock_type TEXT DEFAULT 'self',
  vendor_buy_price NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. COURIER & DISPATCH
-- ============================================
CREATE TABLE public.courier_dispatch (
  order_id TEXT PRIMARY KEY,
  courier_type TEXT DEFAULT '',
  consignment_id TEXT DEFAULT '',
  tracking_code TEXT DEFAULT '',
  store_id TEXT DEFAULT '',
  courier_status TEXT DEFAULT '',
  sent_at TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.courier_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.courier_ratio_cache (
  phone TEXT PRIMARY KEY,
  all_count INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  returned INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. FRAUD & BLOCKED CUSTOMERS
-- ============================================
CREATE TABLE public.fraud_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.blocked_customers (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  customer_name TEXT,
  reason TEXT,
  linked_group TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. EMPLOYEES
-- ============================================
CREATE TABLE public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TEXT
);

CREATE TABLE public.employee_activities (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  action TEXT DEFAULT '',
  order_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  timestamp TEXT
);

-- ============================================
-- 6. RESELLERS
-- ============================================
CREATE SEQUENCE IF NOT EXISTS resellers_serial_seq START 1;

CREATE TABLE public.resellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  shop_name TEXT,
  balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  approval_status TEXT DEFAULT 'approved',
  deactivation_note TEXT DEFAULT '',
  serial_number INTEGER NOT NULL DEFAULT nextval('resellers_serial_seq'),
  created_at TEXT
);

CREATE TABLE public.reseller_orders (
  id TEXT PRIMARY KEY,
  reseller_id TEXT NOT NULL,
  reseller_name TEXT DEFAULT '',
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_address TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_selling_price NUMERIC DEFAULT 0,
  total_reseller_cost NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  packaging_charge NUMERIC DEFAULT 0,
  cod_charge NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'পেন্ডিং',
  date TEXT,
  notes JSONB DEFAULT '[]'::jsonb,
  admin_note TEXT DEFAULT ''
);

CREATE TABLE public.reseller_payment_methods (
  id TEXT PRIMARY KEY,
  reseller_id TEXT NOT NULL,
  method_type TEXT NOT NULL DEFAULT 'bkash',
  account_number TEXT NOT NULL DEFAULT '',
  label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reseller_product_prices (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  reseller_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  custom_price NUMERIC NOT NULL
);

CREATE TABLE public.payment_requests (
  id TEXT PRIMARY KEY,
  reseller_id TEXT NOT NULL,
  reseller_name TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  method TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  status TEXT DEFAULT 'পেন্ডিং',
  date TEXT
);

-- ============================================
-- 7. FINANCE
-- ============================================
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT '',
  employee_id TEXT,
  note TEXT DEFAULT '',
  date TEXT
);

CREATE TABLE public.deposits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  source TEXT DEFAULT '',
  note TEXT DEFAULT '',
  date TEXT
);

CREATE TABLE public.stock_entries (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  damage INTEGER DEFAULT 0,
  supplier TEXT DEFAULT '',
  note TEXT DEFAULT '',
  date TEXT
);

-- ============================================
-- 8. CONTENT (Blog, Landing Pages)
-- ============================================
CREATE TABLE public.blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  gallery_images JSONB DEFAULT '[]'::jsonb,
  author TEXT DEFAULT '',
  category TEXT DEFAULT '',
  type TEXT DEFAULT 'post',
  status TEXT DEFAULT 'published',
  meta_description TEXT,
  meta_keywords TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.landing_pages (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  product_id TEXT NOT NULL,
  custom_price NUMERIC,
  custom_original_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. SETTINGS & COUNTERS
-- ============================================
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.counters (
  id TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- 10. ENABLE RLS + ALLOW ALL POLICY (custom auth)
-- ============================================
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'categories','products','variations','orders','incomplete_orders','follow_up_data',
    'courier_dispatch','courier_settings','courier_ratio_cache','fraud_settings','blocked_customers',
    'employees','employee_activities','resellers','reseller_orders','reseller_payment_methods',
    'reseller_product_prices','payment_requests','expenses','deposits','stock_entries',
    'blog_posts','landing_pages','site_settings','counters'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('CREATE POLICY "Allow all access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
```

---

### এর পরে নিচের Edge Functions গুলো deploy করতে হবে:

আমার প্রজেক্টে নিচের ৪টি edge function আছে — এগুলোর code আমি আলাদাভাবে দেবো অথবা তুমি আমার repo থেকে copy করতে পারো:

1. **`courier-check`** — bdcourier API থেকে fraud ratio চেক করে (paid endpoint: `https://api.bdcourier.com/courier-check`)
2. **`steadfast`** — Steadfast courier-এ order পাঠায়
3. **`carrybee`** — Carrybee courier-এ order পাঠায়
4. **`mohasagor-products`** — Mohasagor wholesale API থেকে product data আনে

### এর পরে নিচের Secrets গুলো Supabase-এ add করতে হবে:

- `MOHASAGOR_API_KEY` — Mohasagor wholesale API key
- `MOHASAGOR_SECRET_KEY` — Mohasagor wholesale secret
- `LOVABLE_API_KEY` — (auto)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` — (auto)

### Default Admin Credentials

প্রথমবার login করতে নিচের credentials কাজ করবে (code-এ hardcoded default):
- Email: `786.mahfuzurrahman@gmail.com`
- Password: `mdmahfuzurrahman`

Login করার পর Admin → Password Settings থেকে পরিবর্তন করুন।

---

## 📋 Prompt শেষ

উপরের পুরো অংশ copy করে নতুন Lovable চ্যাটে paste করলে সে migration approve করার জন্য বলবে। Approve করলেই সকল table তৈরি হবে এবং আপনার সাইট properly run করবে।
