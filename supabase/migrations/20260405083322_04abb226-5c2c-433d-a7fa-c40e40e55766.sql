
-- Products table
CREATE TABLE public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  buy_price numeric,
  reseller_price numeric,
  images jsonb DEFAULT '[]'::jsonb,
  featured_image text,
  featured_video text,
  category text DEFAULT '',
  colors jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  weights jsonb DEFAULT '[]'::jsonb,
  variation_prices jsonb DEFAULT '[]'::jsonb,
  variations jsonb DEFAULT '[]'::jsonb,
  meta_description text,
  meta_keywords text,
  stock_type text,
  stock_product_name text,
  status text DEFAULT 'published',
  in_stock boolean DEFAULT true,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  reviews jsonb DEFAULT '[]'::jsonb,
  free_delivery boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT '',
  product_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  customer text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  delivery_charge numeric DEFAULT 0,
  original_delivery_charge numeric DEFAULT 0,
  total numeric DEFAULT 0,
  status text DEFAULT 'পেন্ডিং',
  date text DEFAULT '',
  iso_date timestamptz,
  confirmed_by text DEFAULT '',
  assigned_to text,
  assigned_to_name text,
  customer_ip text,
  customer_fingerprint text,
  note text DEFAULT '',
  paid_return_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Counters table (for order numbering)
CREATE TABLE public.counters (
  id text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
);
INSERT INTO public.counters (id, value) VALUES ('order_number', 0);

-- Employees table
CREATE TABLE public.employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  role text DEFAULT '',
  password text NOT NULL,
  created_at text DEFAULT '',
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '[]'::jsonb
);

-- Employee activities table
CREATE TABLE public.employee_activities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id text,
  employee_name text,
  action text DEFAULT '',
  order_id text DEFAULT '',
  details text DEFAULT '',
  timestamp text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blog posts table
CREATE TABLE public.blog_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  image text DEFAULT '',
  gallery_images jsonb DEFAULT '[]'::jsonb,
  date text DEFAULT '',
  author text DEFAULT '',
  category text DEFAULT '',
  type text DEFAULT 'post',
  status text DEFAULT 'published',
  meta_description text,
  meta_keywords text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Site settings table
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fraud settings table
CREATE TABLE public.fraud_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Resellers table
CREATE TABLE public.resellers (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  password text NOT NULL,
  is_active boolean DEFAULT true,
  created_at text DEFAULT '',
  balance numeric DEFAULT 0,
  approval_status text DEFAULT 'approved',
  deactivation_note text DEFAULT ''
);

-- Reseller orders table
CREATE TABLE public.reseller_orders (
  id text PRIMARY KEY,
  reseller_id text NOT NULL,
  reseller_name text DEFAULT '',
  customer_name text NOT NULL,
  customer_phone text DEFAULT '',
  customer_address text DEFAULT '',
  items jsonb DEFAULT '[]'::jsonb,
  delivery_charge numeric DEFAULT 0,
  packaging_charge numeric DEFAULT 0,
  cod_charge numeric DEFAULT 0,
  total_selling_price numeric DEFAULT 0,
  total_reseller_cost numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  status text DEFAULT 'পেন্ডিং',
  date text DEFAULT '',
  notes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment requests table
CREATE TABLE public.payment_requests (
  id text PRIMARY KEY,
  reseller_id text NOT NULL,
  reseller_name text DEFAULT '',
  amount numeric DEFAULT 0,
  method text DEFAULT '',
  account_number text DEFAULT '',
  status text DEFAULT 'পেন্ডিং',
  date text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text DEFAULT '',
  amount numeric DEFAULT 0,
  note text DEFAULT '',
  date text DEFAULT '',
  employee_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Deposits table
CREATE TABLE public.deposits (
  id text PRIMARY KEY,
  title text NOT NULL,
  source text DEFAULT '',
  amount numeric DEFAULT 0,
  note text DEFAULT '',
  date text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stock entries table
CREATE TABLE public.stock_entries (
  id text PRIMARY KEY,
  product_name text NOT NULL,
  quantity integer DEFAULT 0,
  buy_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  supplier text DEFAULT '',
  note text DEFAULT '',
  date text DEFAULT '',
  damage integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Variations table
CREATE TABLE public.variations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Blocked customers table
CREATE TABLE public.blocked_customers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type text NOT NULL,
  value text NOT NULL,
  customer_name text,
  reason text,
  blocked_at text DEFAULT '',
  linked_group text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Incomplete orders table
CREATE TABLE public.incomplete_orders (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  items jsonb DEFAULT '[]'::jsonb,
  total_price numeric DEFAULT 0,
  delivery_charge numeric DEFAULT 0,
  delivery_zone text DEFAULT '',
  grand_total numeric DEFAULT 0,
  date text DEFAULT '',
  type text DEFAULT 'incomplete',
  block_reason text,
  status text DEFAULT 'pending',
  customer_ip text,
  customer_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Landing pages table
CREATE TABLE public.landing_pages (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  product_id text NOT NULL,
  status text DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Follow up data table
CREATE TABLE public.follow_up_data (
  order_id text PRIMARY KEY,
  status text,
  note text DEFAULT '',
  tracking_url text DEFAULT '',
  courier_name text DEFAULT '',
  stock_type text DEFAULT 'self',
  vendor_buy_price numeric DEFAULT 0,
  courier_locked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Courier ratio cache table
CREATE TABLE public.courier_ratio_cache (
  phone text PRIMARY KEY,
  all_count integer DEFAULT 0,
  delivered integer DEFAULT 0,
  returned integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Courier settings table
CREATE TABLE public.courier_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Courier dispatch table
CREATE TABLE public.courier_dispatch (
  order_id text PRIMARY KEY,
  courier text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anonymous access to all tables (public e-commerce site)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_ratio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_dispatch ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth in this app - admin auth is client-side)
CREATE POLICY "Allow all access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.employee_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.fraud_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.resellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.reseller_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.payment_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.deposits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.stock_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.variations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.blocked_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.incomplete_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.landing_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.follow_up_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.courier_ratio_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.courier_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.courier_dispatch FOR ALL USING (true) WITH CHECK (true);
