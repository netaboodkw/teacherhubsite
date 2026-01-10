-- Add period column to attendance_records
ALTER TABLE public.attendance_records 
ADD COLUMN period integer NOT NULL DEFAULT 1;

-- Add index for better performance on date + period queries
CREATE INDEX idx_attendance_date_period ON public.attendance_records(classroom_id, date, period);