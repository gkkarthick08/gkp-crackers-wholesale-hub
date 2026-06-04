ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE public.wholesale_products ADD COLUMN IF NOT EXISTS hsn_code TEXT;