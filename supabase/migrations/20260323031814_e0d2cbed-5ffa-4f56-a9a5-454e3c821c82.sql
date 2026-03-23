
CREATE TABLE public.wholesale_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  mrp NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  case_qty INTEGER NOT NULL DEFAULT 1,
  case_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.wholesale_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wholesale products" ON public.wholesale_products FOR ALL USING (is_admin());
CREATE POLICY "Verified dealers can view visible wholesale products" ON public.wholesale_products FOR SELECT USING (is_visible = true);

CREATE TRIGGER update_wholesale_products_updated_at BEFORE UPDATE ON public.wholesale_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
