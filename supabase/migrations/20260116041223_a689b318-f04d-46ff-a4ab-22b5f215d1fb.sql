-- Fix #1: Add database constraints for server-side input validation
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_full_name_length;
ALTER TABLE profiles ADD CONSTRAINT check_full_name_length 
  CHECK (length(full_name) >= 1 AND length(full_name) <= 100);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_phone_format;
ALTER TABLE profiles ADD CONSTRAINT check_phone_format
  CHECK (phone IS NULL OR phone = '' OR length(phone) >= 10);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_business_name_length;
ALTER TABLE profiles ADD CONSTRAINT check_business_name_length
  CHECK (business_name IS NULL OR length(business_name) <= 200);

-- Fix #2: Update claim_referral_bonus to add authorization check
CREATE OR REPLACE FUNCTION public.claim_referral_bonus(referral_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_record RECORD;
  bonus_amount NUMERIC := 50;
BEGIN
  -- Get referral record
  SELECT * INTO ref_record FROM referrals WHERE id = referral_id AND is_claimed = false;
  
  IF ref_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Authorization check: only the referred user or admin can claim
  IF auth.uid() != ref_record.referred_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only the referred user or admin can claim this bonus';
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
$function$;