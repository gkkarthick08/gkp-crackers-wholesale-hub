-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND is_admin());

-- Function to claim referral bonus
CREATE OR REPLACE FUNCTION public.claim_referral_bonus(referral_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_record RECORD;
  bonus_amount NUMERIC := 50; -- Default bonus amount
BEGIN
  -- Get referral record
  SELECT * INTO ref_record FROM referrals WHERE id = referral_id AND is_claimed = false;
  
  IF ref_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update referral as claimed
  UPDATE referrals SET is_claimed = true, bonus_amount = bonus_amount WHERE id = referral_id;
  
  -- Credit referrer's wallet
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + bonus_amount WHERE id = ref_record.referrer_id;
  
  -- Create wallet transaction for referrer
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (ref_record.referrer_id, bonus_amount, 'referral_bonus', 'Referral bonus earned', referral_id);
  
  -- Also credit referred user (optional - 25 bonus)
  UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + 25 WHERE id = ref_record.referred_id;
  
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (ref_record.referred_id, 25, 'referral_bonus', 'Welcome bonus for using referral', referral_id);
  
  RETURN true;
END;
$$;

-- Function for admin to credit/debit wallet
CREATE OR REPLACE FUNCTION public.admin_wallet_transaction(
  target_user_id UUID,
  transaction_amount NUMERIC,
  trans_type TEXT,
  trans_description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  -- Update wallet balance
  UPDATE profiles 
  SET wallet_balance = COALESCE(wallet_balance, 0) + transaction_amount 
  WHERE id = target_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (user_id, amount, transaction_type, description)
  VALUES (target_user_id, ABS(transaction_amount), trans_type, trans_description);
  
  RETURN true;
END;
$$;