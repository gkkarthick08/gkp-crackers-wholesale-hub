
-- Bug 3: Fix wholesale_products RLS
DROP POLICY IF EXISTS "Verified dealers can view visible wholesale products" ON public.wholesale_products;

CREATE POLICY "Verified dealers can view visible wholesale products"
ON public.wholesale_products FOR SELECT
USING (
  is_visible = true AND (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'dealer'
        AND profiles.is_verified = true
    )
  )
);

-- Bug 6: Stock management
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS stock_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.block_stock(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE item RECORD; order_rec RECORD;
BEGIN
  SELECT * INTO order_rec FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF order_rec.stock_blocked THEN RETURN TRUE; END IF;
  FOR item IN
    SELECT oi.product_id, oi.product_code, oi.quantity
    FROM public.order_items oi WHERE oi.order_id = p_order_id
  LOOP
    IF item.product_id IS NOT NULL THEN
      UPDATE public.products 
        SET stock = GREATEST(0, stock - item.quantity) 
        WHERE id = item.product_id;
    ELSE
      UPDATE public.wholesale_products 
        SET stock = GREATEST(0, stock - item.quantity) 
        WHERE product_code = item.product_code;
    END IF;
  END LOOP;
  UPDATE public.orders SET stock_blocked = true WHERE id = p_order_id;
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.restore_stock(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE item RECORD; order_rec RECORD;
BEGIN
  SELECT * INTO order_rec FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF NOT order_rec.stock_blocked THEN RETURN TRUE; END IF;
  FOR item IN
    SELECT oi.product_id, oi.product_code, oi.quantity
    FROM public.order_items oi WHERE oi.order_id = p_order_id
  LOOP
    IF item.product_id IS NOT NULL THEN
      UPDATE public.products 
        SET stock = stock + item.quantity 
        WHERE id = item.product_id;
    ELSE
      UPDATE public.wholesale_products 
        SET stock = stock + item.quantity 
        WHERE product_code = item.product_code;
    END IF;
  END LOOP;
  UPDATE public.orders SET stock_blocked = false WHERE id = p_order_id;
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.block_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_stock(UUID) TO authenticated;
