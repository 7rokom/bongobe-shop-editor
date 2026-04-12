ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS custom_price numeric DEFAULT NULL;
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS custom_original_price numeric DEFAULT NULL;