-- Create table to store daily classroom statistics
CREATE TABLE public.daily_classroom_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  best_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  best_student_points INTEGER DEFAULT 0,
  positive_notes_count INTEGER DEFAULT 0,
  negative_notes_count INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  engagement_rate INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_classroom_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats"
ON public.daily_classroom_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
ON public.daily_classroom_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.daily_classroom_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_classroom_stats_updated_at
BEFORE UPDATE ON public.daily_classroom_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_daily_classroom_stats_classroom_date ON public.daily_classroom_stats(classroom_id, date);
CREATE INDEX idx_daily_classroom_stats_user_date ON public.daily_classroom_stats(user_id, date);