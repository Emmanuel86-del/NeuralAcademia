/*
# Add course modules and per-module progress tracking

1. Overview
Upgrades the Training Portal into a functional LMS by giving each course a list of
ordered modules (lessons). Students mark each module complete via a checkbox; their
progress is stored per-module and rolled up into the existing enrollment.progress.

2. New Tables
- `course_modules` — ordered lessons belonging to a course.
  - id (uuid PK)
  - course_id (uuid FK -> courses, cascade delete)
  - title (text)
  - content (text) — lesson body / explanation
  - module_order (int) — 1-based ordering; module 1 is free, modules >= 2 are premium
  - duration_minutes (int, default 10)
  - created_at (timestamptz)
- `module_progress` — one row per (user, module) marking completion.
  - id (uuid PK)
  - user_id (uuid FK -> auth.users, cascade delete, DEFAULT auth.uid())
  - module_id (uuid FK -> course_modules, cascade delete)
  - course_id (uuid FK -> courses, cascade delete) — denormalized for easy roll-up queries
  - completed (boolean, default false)
  - completed_at (timestamptz, nullable)
  - UNIQUE(user_id, module_id)

3. Security
- course_modules: SELECT for authenticated (published courses); INSERT/UPDATE/DELETE
  restricted to corporate_admins (matching the existing courses policy pattern).
- module_progress: owner-scoped CRUD via auth.uid() = user_id, with DEFAULT auth.uid()
  on user_id so frontend inserts omitting user_id succeed.

4. Notes
- module_order starts at 1. The paywall logic in the app treats modules with
  module_order >= 2 as premium (module 1 is the free preview).
- Enrollment progress is recalculated client-side from completed module counts.
*/

-- ===== COURSE MODULES =====
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  module_order integer NOT NULL DEFAULT 1,
  duration_minutes integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_course_modules" ON course_modules;
CREATE POLICY "read_course_modules" ON course_modules FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
        AND (courses.is_published = true OR courses.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_course_modules_admin" ON course_modules;
CREATE POLICY "insert_course_modules_admin" ON course_modules FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "update_course_modules_admin" ON course_modules;
CREATE POLICY "update_course_modules_admin" ON course_modules FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "delete_course_modules_admin" ON course_modules;
CREATE POLICY "delete_course_modules_admin" ON course_modules FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

-- ===== MODULE PROGRESS =====
CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, module_id)
);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_module_progress" ON module_progress;
CREATE POLICY "select_own_module_progress" ON module_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_module_progress" ON module_progress;
CREATE POLICY "insert_own_module_progress" ON module_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_module_progress" ON module_progress;
CREATE POLICY "update_own_module_progress" ON module_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_module_progress" ON module_progress;
CREATE POLICY "delete_own_module_progress" ON module_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_course ON module_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);
