-- Drop the old check constraint and add new one with 'note' included
ALTER TABLE public.behavior_notes DROP CONSTRAINT behavior_notes_type_check;
ALTER TABLE public.behavior_notes ADD CONSTRAINT behavior_notes_type_check CHECK (type = ANY (ARRAY['positive'::text, 'negative'::text, 'note'::text]));