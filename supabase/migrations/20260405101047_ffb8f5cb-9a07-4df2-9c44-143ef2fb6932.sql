
-- Drop all existing tables
DROP TABLE IF EXISTS follow_up_data CASCADE;
DROP TABLE IF EXISTS variations CASCADE;
DROP TABLE IF EXISTS landing_pages CASCADE;
DROP TABLE IF EXISTS courier_ratio_cache CASCADE;
DROP TABLE IF EXISTS courier_dispatch CASCADE;
DROP TABLE IF EXISTS courier_settings CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS fraud_settings CASCADE;
DROP TABLE IF EXISTS incomplete_orders CASCADE;
DROP TABLE IF EXISTS blocked_customers CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS reseller_product_prices CASCADE;
DROP TABLE IF EXISTS reseller_payment_methods CASCADE;
DROP TABLE IF EXISTS reseller_orders CASCADE;
DROP TABLE IF EXISTS resellers CASCADE;
DROP TABLE IF EXISTS stock_entries CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS employee_activities CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS counters CASCADE;

-- 1. counters
CREATE TABLE public.counters (
  id text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
);
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.counters FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. categories
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  icon text DEFAULT '',
  product_count integer DEFAULT 0
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. products
CREATE TABLE public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  buy_price numeric,
  reseller_price numeric,
  images jsonb DEFAULT '[]',
  featured_image text,
  featured_video text,
  category text DEFAULT '',
  brand text,
  colors jsonb DEFAULT '[]',
  sizes jsonb DEFAULT '[]',
  weights jsonb DEFAULT '[]',
  variation_prices jsonb DEFAULT '[]',
  variations jsonb DEFAULT '[]',
  meta_description text,
  meta_keywords text,
  meta_tags jsonb DEFAULT '[]',
  reviews jsonb DEFAULT '[]',
  stock_type text DEFAULT 'self',
  stock_product_name text,
  status text DEFAULT 'published',
  in_stock boolean DEFAULT true,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  free_delivery boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. orders
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  customer text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  delivery_charge numeric DEFAULT 0,
  original_delivery_charge numeric DEFAULT 0,
  total numeric DEFAULT 0,
  status text DEFAULT 'পেন্ডিং',
  date text,
  iso_date timestamptz DEFAULT now(),
  confirmed_by text DEFAULT '',
  assigned_to text,
  assigned_to_name text,
  customer_ip text,
  customer_fingerprint text,
  note text DEFAULT '',
  paid_return_amount numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.orders FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. employees
CREATE TABLE public.employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  phone text DEFAULT '',
  role text DEFAULT '',
  permissions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at text
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.employees FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. employee_activities
CREATE TABLE public.employee_activities (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  action text DEFAULT '',
  order_id text DEFAULT '',
  details text DEFAULT '',
  timestamp text
);
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.employee_activities FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. expenses
CREATE TABLE public.expenses (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text DEFAULT '',
  amount numeric DEFAULT 0,
  date text,
  employee_id text,
  note text DEFAULT ''
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.expenses FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. deposits
CREATE TABLE public.deposits (
  id text PRIMARY KEY,
  title text NOT NULL,
  amount numeric DEFAULT 0,
  date text,
  source text DEFAULT '',
  note text DEFAULT ''
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.deposits FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. stock_entries
CREATE TABLE public.stock_entries (
  id text PRIMARY KEY,
  product_name text NOT NULL,
  quantity integer DEFAULT 0,
  buy_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  supplier text DEFAULT '',
  date text,
  note text DEFAULT '',
  damage integer DEFAULT 0
);
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.stock_entries FOR ALL TO public USING (true) WITH CHECK (true);

-- 10. resellers
CREATE TABLE public.resellers (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  phone text DEFAULT '',
  balance numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  approval_status text DEFAULT 'approved',
  shop_name text,
  deactivation_note text DEFAULT '',
  created_at text
);
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.resellers FOR ALL TO public USING (true) WITH CHECK (true);

-- 11. reseller_orders
CREATE TABLE public.reseller_orders (
  id text PRIMARY KEY,
  reseller_id text NOT NULL,
  reseller_name text DEFAULT '',
  customer_name text NOT NULL,
  customer_phone text DEFAULT '',
  customer_address text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  delivery_charge numeric DEFAULT 0,
  cod_charge numeric DEFAULT 0,
  packaging_charge numeric DEFAULT 0,
  total_selling_price numeric DEFAULT 0,
  total_reseller_cost numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  status text DEFAULT 'পেন্ডিং',
  date text,
  notes jsonb DEFAULT '[]'
);
ALTER TABLE public.reseller_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.reseller_orders FOR ALL TO public USING (true) WITH CHECK (true);

-- 12. reseller_payment_methods
CREATE TABLE public.reseller_payment_methods (
  id text PRIMARY KEY,
  reseller_id text NOT NULL,
  method_type text NOT NULL DEFAULT 'bkash',
  account_number text NOT NULL DEFAULT '',
  label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reseller_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.reseller_payment_methods FOR ALL TO public USING (true) WITH CHECK (true);

-- 13. reseller_product_prices
CREATE TABLE public.reseller_product_prices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reseller_id text NOT NULL,
  product_id text NOT NULL,
  custom_price numeric NOT NULL
);
ALTER TABLE public.reseller_product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.reseller_product_prices FOR ALL TO public USING (true) WITH CHECK (true);

-- 14. payment_requests
CREATE TABLE public.payment_requests (
  id text PRIMARY KEY,
  reseller_id text NOT NULL,
  reseller_name text DEFAULT '',
  amount numeric DEFAULT 0,
  method text DEFAULT '',
  account_number text DEFAULT '',
  status text DEFAULT 'পেন্ডিং',
  date text
);
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.payment_requests FOR ALL TO public USING (true) WITH CHECK (true);

-- 15. blog_posts
CREATE TABLE public.blog_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  image text DEFAULT '',
  gallery_images jsonb DEFAULT '[]',
  date text,
  author text DEFAULT '',
  category text DEFAULT '',
  type text DEFAULT 'post',
  status text DEFAULT 'published',
  meta_description text,
  meta_keywords text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.blog_posts FOR ALL TO public USING (true) WITH CHECK (true);

-- 16. blocked_customers
CREATE TABLE public.blocked_customers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type text NOT NULL,
  value text NOT NULL,
  customer_name text,
  reason text,
  linked_group text,
  blocked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.blocked_customers FOR ALL TO public USING (true) WITH CHECK (true);

-- 17. incomplete_orders
CREATE TABLE public.incomplete_orders (
  id text PRIMARY KEY,
  type text NOT NULL DEFAULT 'incomplete',
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  total_price numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 0,
  delivery_zone text NOT NULL DEFAULT '',
  grand_total numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  block_reason text,
  customer_ip text,
  customer_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.incomplete_orders FOR ALL TO public USING (true) WITH CHECK (true);

-- 18. fraud_settings
CREATE TABLE public.fraud_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.fraud_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.fraud_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 19. site_settings
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.site_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 20. courier_settings
CREATE TABLE public.courier_settings (
  id text PRIMARY KEY DEFAULT 'default',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.courier_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 21. courier_dispatch
CREATE TABLE public.courier_dispatch (
  order_id text PRIMARY KEY,
  courier_type text DEFAULT '',
  consignment_id text DEFAULT '',
  tracking_code text DEFAULT '',
  store_id text DEFAULT '',
  courier_status text DEFAULT '',
  sent_at text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.courier_dispatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.courier_dispatch FOR ALL TO public USING (true) WITH CHECK (true);

-- 22. courier_ratio_cache
CREATE TABLE public.courier_ratio_cache (
  phone text PRIMARY KEY,
  all_count integer DEFAULT 0,
  delivered integer DEFAULT 0,
  returned integer DEFAULT 0,
  checked_at timestamptz DEFAULT now()
);
ALTER TABLE public.courier_ratio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.courier_ratio_cache FOR ALL TO public USING (true) WITH CHECK (true);

-- 23. landing_pages
CREATE TABLE public.landing_pages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  slug text NOT NULL,
  product_id text NOT NULL,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.landing_pages FOR ALL TO public USING (true) WITH CHECK (true);

-- 24. variations
CREATE TABLE public.variations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL
);
ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.variations FOR ALL TO public USING (true) WITH CHECK (true);

-- 25. follow_up_data
CREATE TABLE public.follow_up_data (
  order_id text PRIMARY KEY,
  status text,
  note text DEFAULT '',
  tracking_url text DEFAULT '',
  courier_name text DEFAULT '',
  stock_type text DEFAULT 'self',
  vendor_buy_price numeric DEFAULT 0,
  courier_locked boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.follow_up_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.follow_up_data FOR ALL TO public USING (true) WITH CHECK (true);

-- Default rows
INSERT INTO site_settings (id, data) VALUES ('default', '{}');
INSERT INTO fraud_settings (id, data) VALUES ('default', '{}');
INSERT INTO courier_settings (id, data) VALUES ('default', '{}');
INSERT INTO counters (id, value) VALUES ('order_number', 0);
