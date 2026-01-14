-- Create table for student weekly achievements/badges
CREATE TABLE public.student_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL, -- 'gold_medal', 'silver_medal', 'bronze_medal', 'star', 'rising_star'
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, classroom_id, week_start, achievement_type)
);

-- Enable RLS
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements"
ON public.student_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.student_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
ON public.student_achievements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
ON public.student_achievements
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_student_achievements_student ON public.student_achievements(student_id);
CREATE INDEX idx_student_achievements_classroom_week ON public.student_achievements(classroom_id, week_start);
CREATE INDEX idx_student_achievements_user ON public.student_achievements(user_id);