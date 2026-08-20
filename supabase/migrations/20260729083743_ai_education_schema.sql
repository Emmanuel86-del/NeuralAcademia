/*
# AI Education Platform - Core Schema

1. Overview
This migration creates the complete database schema for an AI Education platform with four
feature areas: AI Personal Tutor, Corporate AI Training Portal, Skills Assessment Engine,
and AI Language Learning Coach. The platform supports two user roles: Student and Corporate Admin.

2. New Tables
- `profiles` — extends auth.users with a display name, role (student/corporate_admin), and company.
- `courses` — training courses for the Corporate AI Training Portal.
- `enrollments` — links students to courses with progress tracking.
- `assessments` — quiz definitions with questions stored as JSONB.
- `assessment_results` — stores student attempts and scores.
- `tutor_sessions` — saved chat conversations with the AI Personal Tutor.
- `language_progress` — tracks vocabulary and lesson progress for the Language Coach.

3. Security
- RLS enabled on every table.
- Owner-scoped policies for student-owned data.
- Admin-scoped policies for courses and assessments.
- All policies use auth.uid() with DEFAULT auth.uid() on owner columns.

4. Important Notes
- user_id columns default to auth.uid() so frontend inserts omitting user_id succeed.
- Courses are read by anyone authenticated but only managed by corporate admins.
- Assessment questions are stored as JSONB for flexible quiz structures.
*/

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'corporate_admin')),
  company text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ===== COURSES =====
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'AI Fundamentals',
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_hours integer NOT NULL DEFAULT 1,
  instructor text NOT NULL DEFAULT '',
  thumbnail_color text NOT NULL DEFAULT 'blue',
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_courses" ON courses;
CREATE POLICY "read_published_courses" ON courses FOR SELECT
  TO authenticated USING (is_published = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "insert_courses_admin" ON courses;
CREATE POLICY "insert_courses_admin" ON courses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "update_courses_admin" ON courses;
CREATE POLICY "update_courses_admin" ON courses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "delete_courses_admin" ON courses;
CREATE POLICY "delete_courses_admin" ON courses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

-- ===== ENROLLMENTS =====
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_enrollments" ON enrollments;
CREATE POLICY "select_own_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_enrollments" ON enrollments;
CREATE POLICY "insert_own_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enrollments" ON enrollments;
CREATE POLICY "update_own_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_enrollments" ON enrollments;
CREATE POLICY "delete_own_enrollments" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== ASSESSMENTS =====
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'AI Fundamentals',
  skill_level text NOT NULL DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_assessments" ON assessments;
CREATE POLICY "read_published_assessments" ON assessments FOR SELECT
  TO authenticated USING (is_published = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "insert_assessments_admin" ON assessments;
CREATE POLICY "insert_assessments_admin" ON assessments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "update_assessments_admin" ON assessments;
CREATE POLICY "update_assessments_admin" ON assessments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

DROP POLICY IF EXISTS "delete_assessments_admin" ON assessments;
CREATE POLICY "delete_assessments_admin" ON assessments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'corporate_admin')
  );

-- ===== ASSESSMENT RESULTS =====
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed boolean NOT NULL DEFAULT false,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  taken_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_results" ON assessment_results;
CREATE POLICY "select_own_results" ON assessment_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_results" ON assessment_results;
CREATE POLICY "insert_own_results" ON assessment_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_results" ON assessment_results;
CREATE POLICY "update_own_results" ON assessment_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_results" ON assessment_results;
CREATE POLICY "delete_own_results" ON assessment_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== TUTOR SESSIONS =====
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  topic text NOT NULL DEFAULT 'General',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tutor_sessions" ON tutor_sessions;
CREATE POLICY "select_own_tutor_sessions" ON tutor_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tutor_sessions" ON tutor_sessions;
CREATE POLICY "insert_own_tutor_sessions" ON tutor_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tutor_sessions" ON tutor_sessions;
CREATE POLICY "update_own_tutor_sessions" ON tutor_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tutor_sessions" ON tutor_sessions;
CREATE POLICY "delete_own_tutor_sessions" ON tutor_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== LANGUAGE PROGRESS =====
CREATE TABLE IF NOT EXISTS language_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'spanish',
  proficiency_level integer NOT NULL DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 6),
  words_learned integer NOT NULL DEFAULT 0,
  lessons_completed integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  last_studied_at timestamptz,
  xp_points integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, language)
);

ALTER TABLE language_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_language_progress" ON language_progress;
CREATE POLICY "select_own_language_progress" ON language_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_language_progress" ON language_progress;
CREATE POLICY "insert_own_language_progress" ON language_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_language_progress" ON language_progress;
CREATE POLICY "update_own_language_progress" ON language_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_language_progress" ON language_progress;
CREATE POLICY "delete_own_language_progress" ON language_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_language_progress_user ON language_progress(user_id);

-- ===== TRIGGER: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
