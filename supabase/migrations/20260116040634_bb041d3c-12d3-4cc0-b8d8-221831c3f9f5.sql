-- Fix #1: Create a user-facing function for wallet purchases (replacing admin_wallet_transaction for user checkout)
CREATE OR REPLACE FUNCTION public.user_wallet_purchase(
  order_id UUID,
  purchase_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance NUMERIC;
  order_record RECORD;
BEGIN
  -- Verify caller owns the order
  SELECT * INTO order_record
  FROM orders 
  WHERE id = order_id AND customer_id = auth.uid();
  
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found or unauthorized';
  END IF;
  
  -- Check sufficient balance
  SELECT wallet_balance INTO current_balance
  FROM profiles WHERE id = auth.uid();
  
  IF current_balance IS NULL OR current_balance < purchase_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  
  -- Validate purchase amount matches order discount
  IF purchase_amount > order_record.discount_amount OR purchase_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid purchase amount';
  END IF;
  
  -- Deduct from wallet
  UPDATE profiles 
  SET wallet_balance = wallet_balance - purchase_amount
  WHERE id = auth.uid();
  
  -- Log transaction
  INSERT INTO wallet_transactions 
    (user_id, amount, transaction_type, description, reference_id)
  VALUES 
    (auth.uid(), purchase_amount, 'purchase', 'Order payment: ' || order_record.order_number, order_id);
  
  RETURN true;
END;
$$;

-- Fix #2: Create a trigger function to validate order item prices against actual product prices
CREATE OR REPLACE FUNCTION public.validate_order_item_prices()
RETURNS TRIGGER AS $$
DECLARE
  product_record RECORD;
  order_record RECORD;
  expected_price NUMERIC;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on order_items
DROP TRIGGER IF EXISTS check_order_item_prices ON public.order_items;
CREATE TRIGGER check_order_item_prices
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_item_prices();

-- Create a trigger to recalculate order totals after items are inserted
CREATE OR REPLACE FUNCTION public.recalculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total NUMERIC;
  calculated_items INTEGER;
BEGIN
  -- Calculate totals from order_items
  SELECT 
    COALESCE(SUM(total_price), 0),
    COALESCE(SUM(quantity), 0)
  INTO calculated_total, calculated_items
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Update the order with validated totals
  UPDATE orders
  SET 
    total_amount = calculated_total,
    total_items = calculated_items,
    final_amount = calculated_total - COALESCE(discount_amount, 0)
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to recalculate after order items are inserted
DROP TRIGGER IF EXISTS recalc_order_totals ON public.order_items;
CREATE TRIGGER recalc_order_totals
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_totals();