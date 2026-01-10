-- Add unique constraint for attendance upsert to work correctly
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_student_date_period_unique 
UNIQUE (student_id, date, period);

-- Add grade_level_id to subjects table to link subjects to specific grade levels
ALTER TABLE public.subjects
ADD COLUMN grade_level_id uuid REFERENCES public.grade_levels(id) ON DELETE SET NULL;