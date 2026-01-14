-- Fix otp_codes: Remove overly permissive policy and add attempt tracking
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;

-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.otp_codes;

-- OTP codes should only be accessed via edge functions (service role)
-- No client-side access needed
CREATE POLICY "No client access to otp_codes"
ON public.otp_codes FOR SELECT
USING (false);

CREATE POLICY "No client insert to otp_codes"
ON public.otp_codes FOR INSERT
WITH CHECK (false);

CREATE POLICY "No client update to otp_codes"
ON public.otp_codes FOR UPDATE
USING (false);

CREATE POLICY "No client delete to otp_codes"
ON public.otp_codes FOR DELETE
USING (false);

-- Fix discount_codes: Only authenticated users and admins should access
DROP POLICY IF EXISTS "Public can view discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Anyone can read discount codes" ON public.discount_codes;

-- Create proper policies for discount_codes
CREATE POLICY "Authenticated users can view active discount codes"
ON public.discount_codes FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND is_active = true
);

CREATE POLICY "Admins can manage all discount codes"
ON public.discount_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Fix system_settings: Add is_sensitive column and restrict access
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS is_sensitive boolean DEFAULT false;

-- Mark API keys as sensitive
UPDATE public.system_settings SET is_sensitive = true WHERE key LIKE '%api_key%' OR key LIKE '%secret%';

-- Drop old permissive policy
DROP POLICY IF EXISTS "Teachers can read public settings" ON public.system_settings;

-- Create new restricted policy
CREATE POLICY "Users can read non-sensitive settings"
ON public.system_settings FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (is_sensitive = false OR public.has_role(auth.uid(), 'admin'))
);

-- Only admins can modify settings
CREATE POLICY "Only admins can modify settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));