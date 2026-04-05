
-- Create pos_orders table
CREATE TABLE public.pos_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone TEXT,
  customer_address TEXT,
  billing_mode TEXT NOT NULL DEFAULT 'retail',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  mrp_total NUMERIC NOT NULL DEFAULT 0,
  savings NUMERIC NOT NULL DEFAULT 0,
  packing_charges NUMERIC NOT NULL DEFAULT 0,
  delivery_charges NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  bill_number TEXT
);

-- Create pos_order_items table
CREATE TABLE public.pos_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  mrp NUMERIC NOT NULL DEFAULT 0,
  is_wholesale BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for pos_orders
CREATE POLICY "Admins can manage pos orders"
ON public.pos_orders FOR ALL
USING (public.is_admin());

CREATE POLICY "Staff can manage pos orders"
ON public.pos_orders FOR ALL
USING (public.has_role(auth.uid(), 'staff'));

-- RLS policies for pos_order_items
CREATE POLICY "Admins can manage pos order items"
ON public.pos_order_items FOR ALL
USING (public.is_admin());

CREATE POLICY "Staff can manage pos order items"
ON public.pos_order_items FOR ALL
USING (public.has_role(auth.uid(), 'staff'));

-- Generate bill number trigger
CREATE OR REPLACE FUNCTION public.generate_pos_bill_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.bill_number IS NULL THEN
    NEW.bill_number := 'POS' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pos_bill_number
BEFORE INSERT ON public.pos_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_pos_bill_number();

-- Updated at trigger
CREATE TRIGGER update_pos_orders_updated_at
BEFORE UPDATE ON public.pos_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
