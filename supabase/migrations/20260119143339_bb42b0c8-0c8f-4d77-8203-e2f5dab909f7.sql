-- Create fingerprint_records table to track daily fingerprint attendance
CREATE TABLE public.fingerprint_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_time TIME NOT NULL,
  fingerprint_window_start TIME NOT NULL,
  fingerprint_window_end TIME NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'on_time' CHECK (status IN ('on_time', 'late', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.fingerprint_records ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own fingerprint records" 
ON public.fingerprint_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fingerprint records" 
ON public.fingerprint_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fingerprint records" 
ON public.fingerprint_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_fingerprint_records_user_date ON public.fingerprint_records(user_id, date);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_fingerprint_records_updated_at
BEFORE UPDATE ON public.fingerprint_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();