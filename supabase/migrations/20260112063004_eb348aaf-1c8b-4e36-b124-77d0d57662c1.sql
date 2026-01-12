-- Fix profiles table - add policy to prevent anonymous access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Fix orders table - require customer_id for authenticated users
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR 
    (auth.uid() IS NULL AND customer_id IS NULL)
  );

-- Allow guests to create orders too (without customer_id)
CREATE POLICY "Guest users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() IS NULL AND customer_id IS NULL);

-- Fix site_settings - restrict to authenticated users
DROP POLICY IF EXISTS "Public can view settings" ON public.site_settings;
CREATE POLICY "Authenticated users can view settings" ON public.site_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create a public_settings table for non-sensitive data
CREATE TABLE IF NOT EXISTS public.public_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.public_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public settings" ON public.public_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage public settings" ON public.public_settings
  FOR ALL USING (public.is_admin());