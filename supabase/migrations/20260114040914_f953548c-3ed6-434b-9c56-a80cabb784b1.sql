-- Fix the shared_templates_public view to use security_invoker
DROP VIEW IF EXISTS public.shared_templates_public;

CREATE VIEW public.shared_templates_public
WITH (security_invoker = on) AS
SELECT 
    id,
    template_id,
    share_code,
    is_active,
    created_at
FROM shared_templates
WHERE is_active = true;

-- Grant access to authenticated users
GRANT SELECT ON public.shared_templates_public TO authenticated;