-- Fix OTP codes policy - Remove the old permissive policy
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.otp_codes;

-- Fix shared_templates - Don't expose user_id in public lookups
-- Create a view for public template lookups
CREATE OR REPLACE VIEW public.shared_templates_public
WITH (security_invoker = on) AS
SELECT 
  id,
  template_id,
  share_code,
  is_active,
  created_at
FROM shared_templates
WHERE is_active = true;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can lookup active shared templates" ON public.shared_templates;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can lookup active shared templates"
ON public.shared_templates FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND is_active = true
);