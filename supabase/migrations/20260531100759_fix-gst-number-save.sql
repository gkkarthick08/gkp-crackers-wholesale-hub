-- Issue #58: Fix GST number not being saved during dealer signup
-- The handle_new_user() trigger now extracts and saves gst_number from auth metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  referral_user_id UUID;
BEGIN
  -- Generate unique referral code
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone,
    email,
    user_type,
    business_name,
    gst_number,
    referral_code
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    new.email,
    COALESCE((new.raw_user_meta_data->>'user_type')::user_type, 'retail'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'gst_number',
    'GKP' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
  );
  
  -- Handle referral if provided
  IF new.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    SELECT id INTO referral_user_id 
    FROM public.profiles 
    WHERE referral_code = new.raw_user_meta_data->>'referred_by';
    
    IF referral_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referral_user_id, new.id);
      
      UPDATE public.profiles 
      SET referred_by = referral_user_id 
      WHERE id = new.id;
    END IF;
  END IF;
  
  RETURN new;
END;
$$;
