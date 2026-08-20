/*
# Enable RLS and enforce public-read / admin-write policies

## Purpose
Ensure courses, modules, and lessons render seamlessly for all visitors
(including unauthenticated/anon users) while restricting all write and
delete operations to authenticated administrators. Also fix the profiles
table so users can read all profiles and update only their own, with
admins gaining full access.

## Changes by table

### 1. courses
- Enable RLS (was disabled despite existing policies).
- Drop all legacy permissive policies.
- SELECT: public (anon + authenticated) — courses render on dashboard/training portal.
- INSERT / UPDATE / DELETE: authenticated users whose profile role is 'corporate_admin'.

### 2. modules
- Enable RLS (was disabled despite existing policies).
- Drop all legacy permissive policies.
- SELECT: public (anon + authenticated) — modules render in course view.
- INSERT / UPDATE / DELETE: authenticated admins only.

### 3. lessons
- Enable RLS (was disabled despite existing policies).
- Drop all legacy permissive policies.
- SELECT: public (anon + authenticated) — lesson content renders in LMS.
- INSERT / UPDATE / DELETE: authenticated admins only.

### 4. profiles
- RLS already enabled — keep it.
- Drop legacy "Allow public read profiles" and "Allow user update profiles" (the latter
  was FOR ALL with USING(true), allowing anyone to do anything to any profile).
- SELECT: public (anon + authenticated) — profile lookups for course authors etc.
- INSERT: authenticated users creating their own profile row (auth.uid() = id).
- UPDATE: authenticated users updating their own profile, OR admins updating any profile.
- DELETE: authenticated admins only (users cannot delete their own profile row via the
  client; profile cleanup should be handled by auth triggers / admin tooling).

## Security notes
- Admin is defined as profiles.role = 'corporate_admin' for the current auth.uid().
- A helper subquery `(SELECT role FROM profiles WHERE id = auth.uid()) = 'corporate_admin'`
  is used in each admin policy predicate.
- SELECT policies use USING(true) intentionally — this content is public by design.
- Write policies are scoped TO authenticated with an admin-role check, so anon and
  non-admin authenticated users cannot mutate content.
- No data is deleted or modified; only policies and RLS flags change.
*/

-- =============================================================
-- courses
-- =============================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.courses;
DROP POLICY IF EXISTS "Allow public read/write on courses" ON public.courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.courses;

CREATE POLICY "public_select_courses"
  ON public.courses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_insert_courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_update_courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_delete_courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

-- =============================================================
-- modules
-- =============================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert/update on modules" ON public.modules;
DROP POLICY IF EXISTS "Allow public read access on modules" ON public.modules;
DROP POLICY IF EXISTS "Allow public read/write on modules" ON public.modules;
DROP POLICY IF EXISTS "Allow read access to modules" ON public.modules;

CREATE POLICY "public_select_modules"
  ON public.modules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_insert_modules"
  ON public.modules FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_update_modules"
  ON public.modules FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_delete_modules"
  ON public.modules FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

-- =============================================================
-- lessons
-- =============================================================
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;

CREATE POLICY "public_select_lessons"
  ON public.lessons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_insert_lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_update_lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_delete_lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

-- =============================================================
-- profiles
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow user update profiles" ON public.profiles;

CREATE POLICY "public_select_profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "self_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "self_or_admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  )
  WITH CHECK (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

CREATE POLICY "admin_delete_profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

-- =============================================================
-- module_progress (already correct — no changes needed)
-- RLS enabled with owner-scoped select/insert/update/delete policies.
-- =============================================================
