CREATE OR REPLACE FUNCTION public.validate_order_item_prices()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  product_record RECORD;
  order_record RECORD;
  expected_price NUMERIC;
BEGIN
  -- Skip validation for wholesale items (product_id is null)
  IF NEW.product_id IS NULL THEN
    NEW.total_price := NEW.unit_price * NEW.quantity;
    RETURN NEW;
  END IF;

  -- Get the product from database
  SELECT * INTO product_record FROM products WHERE id = NEW.product_id;
  
  IF product_record IS NULL THEN
    RAISE EXCEPTION 'Product not found: %', NEW.product_id;
  END IF;
  
  -- Get the order to determine user_type
  SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;
  
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', NEW.order_id;
  END IF;
  
  -- Determine expected price based on user_type
  IF order_record.user_type = 'dealer' THEN
    expected_price := product_record.wholesale_price;
  ELSE
    expected_price := product_record.retail_price;
  END IF;
  
  -- Validate price matches (allow small rounding differences)
  IF ABS(NEW.unit_price - expected_price) > 0.01 THEN
    RAISE EXCEPTION 'Price mismatch for product %: expected %, got %', 
      product_record.name, expected_price, NEW.unit_price;
  END IF;
  
  -- Recalculate total_price to ensure consistency
  NEW.total_price := NEW.unit_price * NEW.quantity;
  
  RETURN NEW;
END;
$function$;