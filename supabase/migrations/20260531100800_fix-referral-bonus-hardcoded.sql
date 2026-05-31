-- Issue #5: Referral bonus RPC hardcoded ₹50 - should use admin settings
-- Updated claim_referral_bonus function to fetch bonus amounts from site_settings

CREATE OR REPLACE FUNCTION public.claim_referral_bonus(referral_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_record RECORD;
  bonus_amount NUMERIC;
  referred_bonus_amount NUMERIC;
  settings_record RECORD;
BEGIN
  -- Get the referral record and check authorization
  SELECT r.*, u.id as user_id INTO ref_record
  FROM public.referrals r
  JOIN public.profiles p ON r.referrer_id = p.id
  JOIN auth.users u ON u.id = auth.uid()
  WHERE r.id = referral_id AND p.id = auth.uid() AND NOT r.is_claimed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral not found or already claimed';
  END IF;

  -- Fetch bonus amounts from site_settings (issue #5: was hardcoded before)
  SELECT * INTO settings_record FROM public.site_settings LIMIT 1;
  
  -- Use settings values if available, otherwise fall back to defaults
  bonus_amount := COALESCE(settings_record.referral_bonus, 50);
  referred_bonus_amount := COALESCE(settings_record.referral_bonus_referred, 25);

  -- Update referral as claimed with the bonus amount
  UPDATE public.referrals 
  SET is_claimed = true, bonus_amount = bonus_amount, claimed_at = now()
  WHERE id = referral_id;

  -- Add wallet credit to referrer
  INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, description, referral_id)
  VALUES (ref_record.referrer_id, bonus_amount, 'referral_bonus', 'Referral bonus earned', referral_id);

  -- Add wallet credit to referred user
  INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, description, referral_id)
  VALUES (ref_record.referred_id, referred_bonus_amount, 'referral_bonus', 'Welcome bonus for using referral', referral_id);

  -- Update wallet balances
  UPDATE public.profiles 
  SET wallet_balance = wallet_balance + bonus_amount
  WHERE id = ref_record.referrer_id;

  UPDATE public.profiles 
  SET wallet_balance = wallet_balance + referred_bonus_amount
  WHERE id = ref_record.referred_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral_bonus(uuid) TO authenticated;
