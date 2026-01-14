-- Add display settings columns to classrooms table
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS show_badges boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_leaderboard boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stats_banner boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.classrooms.show_badges IS 'Whether to show student achievement badges under their photos';
COMMENT ON COLUMN public.classrooms.show_leaderboard IS 'Whether to show the weekly leaderboard';
COMMENT ON COLUMN public.classrooms.show_stats_banner IS 'Whether to show the stats banner with motivational messages';