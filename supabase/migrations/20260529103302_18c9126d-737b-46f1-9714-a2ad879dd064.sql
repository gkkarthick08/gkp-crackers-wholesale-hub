
-- 1. Fix profiles UPDATE: prevent self-elevation of wallet_balance, user_type, is_verified
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND wallet_balance IS NOT DISTINCT FROM (SELECT p.wallet_balance FROM public.profiles p WHERE p.id = auth.uid())
  AND user_type IS NOT DISTINCT FROM (SELECT p.user_type FROM public.profiles p WHERE p.id = auth.uid())
  AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2. Fix order_items INSERT: require ownership of parent order
DROP POLICY IF EXISTS "Authenticated users can create order items" ON public.order_items;
CREATE POLICY "Users can create items for own orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND o.customer_id = auth.uid())
        OR (auth.uid() IS NULL AND o.customer_id IS NULL)
      )
  )
);

-- 3. Add ownership check to block_stock & restore_stock
CREATE OR REPLACE FUNCTION public.block_stock(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE item RECORD; order_rec RECORD;
BEGIN
  SELECT * INTO order_rec FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  -- Ownership check: only the order's customer or an admin may block stock.
  -- Allow when order has no customer (guest) and caller is admin or service.
  IF NOT public.is_admin() THEN
    IF order_rec.customer_id IS NULL OR order_rec.customer_id <> auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.restore_stock(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE item RECORD; order_rec RECORD;
BEGIN
  SELECT * INTO order_rec FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  -- Ownership: only admin or owning customer may restore stock.
  IF NOT public.is_admin() THEN
    IF order_rec.customer_id IS NULL OR order_rec.customer_id <> auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;
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
END; $function$;

-- 4. Strengthen order_item price validation for wholesale items (product_id IS NULL)
CREATE OR REPLACE FUNCTION public.validate_order_item_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  product_record RECORD;
  order_record RECORD;
  ws_record RECORD;
  expected_price NUMERIC;
BEGIN
  -- Wholesale item (no product_id): validate against wholesale_products by product_code
  IF NEW.product_id IS NULL THEN
    IF NEW.unit_price IS NULL OR NEW.unit_price <= 0 THEN
      RAISE EXCEPTION 'Invalid unit_price for wholesale item';
    END IF;
    IF NEW.product_code IS NOT NULL THEN
      SELECT * INTO ws_record FROM public.wholesale_products WHERE product_code = NEW.product_code;
      IF ws_record IS NOT NULL THEN
        -- Allow either per-unit sale_price or case_price as unit_price
        IF ABS(NEW.unit_price - ws_record.sale_price) > 0.01
           AND ABS(NEW.unit_price - ws_record.case_price) > 0.01 THEN
          RAISE EXCEPTION 'Wholesale price mismatch for %: got %', NEW.product_code, NEW.unit_price;
        END IF;
      END IF;
    END IF;
    NEW.total_price := NEW.unit_price * NEW.quantity;
    RETURN NEW;
  END IF;

  SELECT * INTO product_record FROM public.products WHERE id = NEW.product_id;
  IF product_record IS NULL THEN
    RAISE EXCEPTION 'Product not found: %', NEW.product_id;
  END IF;

  SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', NEW.order_id;
  END IF;

  IF order_record.user_type = 'dealer' THEN
    expected_price := product_record.wholesale_price;
  ELSE
    expected_price := product_record.retail_price;
  END IF;

  IF ABS(NEW.unit_price - expected_price) > 0.01 THEN
    RAISE EXCEPTION 'Price mismatch for product %: expected %, got %',
      product_record.name, expected_price, NEW.unit_price;
  END IF;

  NEW.total_price := NEW.unit_price * NEW.quantity;
  RETURN NEW;
END;
$function$;

-- 5. Hide wholesale_price column from anonymous (public) visitors.
-- Authenticated users still see it; UI code only fetches it for verified dealers/admins.
REVOKE SELECT (wholesale_price) ON public.products FROM anon;
