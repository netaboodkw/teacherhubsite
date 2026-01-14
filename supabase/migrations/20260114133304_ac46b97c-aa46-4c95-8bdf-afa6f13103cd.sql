-- Create a table to store AI generated content
CREATE TABLE public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'screenshot',
  aspect_ratio TEXT NOT NULL DEFAULT '3:4',
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all generated content" 
ON public.ai_generated_content 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can create generated content" 
ON public.ai_generated_content 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete generated content" 
ON public.ai_generated_content 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_generated_content_updated_at
BEFORE UPDATE ON public.ai_generated_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for AI generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-generated-content', 'ai-generated-content', true);

-- Storage policies
CREATE POLICY "Admins can upload AI generated content" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ai-generated-content' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view AI generated content" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-generated-content');

CREATE POLICY "Admins can delete AI generated content files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ai-generated-content' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);