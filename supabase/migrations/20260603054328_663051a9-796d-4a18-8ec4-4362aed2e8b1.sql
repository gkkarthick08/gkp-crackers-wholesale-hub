-- Phase 1: Fix referral hardcoded bonus + race condition + wallet negative guard

CREATE OR REPLACE FUNCTION public.claim_referral_bonus(referral_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ref_record RECORD;
  bonus_referrer NUMERIC := 50;
  bonus_referred NUMERIC := 25;
  setting_val JSONB;
BEGIN
  -- Race-safe claim: only proceed if not yet claimed; lock the row
  SELECT * INTO ref_record
  FROM referrals
  WHERE id = referral_id AND is_claimed = false
  FOR UPDATE;

  IF ref_record IS NULL THEN
    RETURN false; -- already claimed or missing
  END IF;

  -- Authorization: only referred user or admin can claim
  IF auth.uid() IS DISTINCT FROM ref_record.referred_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only the referred user or admin can claim this bonus';
  END IF;

  -- Read bonus amounts from site_settings (fall back to defaults)
  SELECT value INTO setting_val FROM public.site_settings WHERE key = 'referralBonus';
  IF setting_val IS NOT NULL THEN
    BEGIN
      bonus_referrer := (setting_val #>> '{}')::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      bonus_referrer := 50;
    END;
  END IF;

  SELECT value INTO setting_val FROM public.site_settings WHERE key = 'referralBonusReferred';
  IF setting_val IS NOT NULL THEN
    BEGIN
      bonus_referred := (setting_val #>> '{}')::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      bonus_referred := 25;
    END;
  END IF;

  IF bonus_referrer < 0 THEN bonus_referrer := 0; END IF;
  IF bonus_referred < 0 THEN bonus_referred := 0; END IF;

  -- Mark claimed first (atomic; if another tx already flipped it, no rows updated)
  UPDATE referrals
  SET is_claimed = true, bonus_amount = bonus_referrer
  WHERE id = referral_id AND is_claimed = false;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Credit referrer
  IF bonus_referrer > 0 THEN
    UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + bonus_referrer
    WHERE id = ref_record.referrer_id;

    INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
    VALUES (ref_record.referrer_id, bonus_referrer, 'referral_bonus', 'Referral bonus earned', referral_id);
  END IF;

  -- Credit referred user (welcome bonus)
  IF bonus_referred > 0 THEN
    UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + bonus_referred
    WHERE id = ref_record.referred_id;

    INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
    VALUES (ref_record.referred_id, bonus_referred, 'referral_bonus', 'Welcome bonus for using referral', referral_id);
  END IF;

  RETURN true;
END;
$function$;

-- Harden wallet purchase: refuse on non-positive balance
CREATE OR REPLACE FUNCTION public.user_wallet_purchase(order_id uuid, purchase_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance NUMERIC;
  order_record RECORD;
BEGIN
  IF purchase_amount IS NULL OR purchase_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid purchase amount';
  END IF;

  SELECT * INTO order_record
  FROM orders
  WHERE id = order_id AND customer_id = auth.uid();

  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found or unauthorized';
  END IF;

  SELECT wallet_balance INTO current_balance
  FROM profiles WHERE id = auth.uid()
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance <= 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  IF current_balance < purchase_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  IF purchase_amount > COALESCE(order_record.discount_amount, 0) THEN
    RAISE EXCEPTION 'Invalid purchase amount';
  END IF;

  UPDATE profiles
  SET wallet_balance = wallet_balance - purchase_amount
  WHERE id = auth.uid();

  INSERT INTO wallet_transactions
    (user_id, amount, transaction_type, description, reference_id)
  VALUES
    (auth.uid(), purchase_amount, 'purchase', 'Order payment: ' || order_record.order_number, order_id);

  RETURN true;
END;
$function$;