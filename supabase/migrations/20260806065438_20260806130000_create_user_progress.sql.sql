/*
# Create user_progress table for lesson-level progress tracking

## Purpose
Tracks per-lesson completion for each user so we can show green checkmarks
next to completed lessons in the module sidebar and compute overall course
completion percentage from lesson-level granularity (instead of only module-level).

## New Table: user_progress
- id (uuid, PK)
- user_id (uuid, FK auth.users, owner)
- lesson_id (integer, FK lessons.id)
- completed (boolean, default false)
- completed_at (timestamptz, nullable)
- created_at (timestamptz)

## Security
- RLS enabled.
- Owner-scoped: authenticated users can only SELECT/INSERT/UPDATE their own rows.
- DELETE is intentionally not granted (progress records are append/update only).
- user_id defaults to auth.uid() so inserts omitting it succeed.
- Unique constraint on (user_id, lesson_id) prevents duplicate progress rows.
*/

CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON public.user_progress;
CREATE POLICY "select_own_progress"
  ON public.user_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON public.user_progress;
CREATE POLICY "insert_own_progress"
  ON public.user_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON public.user_progress;
CREATE POLICY "update_own_progress"
  ON public.user_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON public.user_progress(lesson_id);
