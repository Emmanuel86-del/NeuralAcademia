/*
# Fix handle_new_user trigger and profiles RLS policies

## Problem
The `handle_new_user()` trigger function tries to INSERT into a `company` column
that no longer exists on `profiles` (it was dropped during the LMS schema fix
migration). As a result, the trigger throws an exception on every new signup,
no profile row is created, and the user gets stuck on the "profile is still
loading" screen because the frontend cannot find a profile.

Additionally, the `self_insert_profiles` policy requires `auth.uid() = id`, but
the trigger runs as SECURITY DEFINER (bypassing RLS), so the policy only matters
for the frontend fallback insert. The `public_select_profiles` policy uses
`USING (true)` which is fine for public read, but we also want to make sure
authenticated users can read their own profile reliably.

## Changes

### 1. Fix handle_new_user() trigger function
- Remove references to the non-existent `company` column.
- Insert only into columns that exist in the current `profiles` table:
  `id`, `email`, `full_name`, `role`.
- Use `ON CONFLICT (id) DO NOTHING` for idempotency.
- Keep SECURITY DEFINER with `search_path = public`.

### 2. Re-attach the trigger
- Drop and recreate `on_auth_user_created` on `auth.users`.

### 3. Revoke direct EXECUTE
- Prevent direct invocation via REST API.

### 4. RLS policies on profiles
- Drop existing policies.
- SELECT: authenticated users can read all profiles (needed for admin lookups,
  course author info, etc.). Anon can also read (public content).
- INSERT: authenticated users can insert their own profile (frontend fallback).
- UPDATE: self or admin.
- DELETE: admin only.

### 5. Backfill missing profiles
- Insert profile rows for any auth.users that don't have a profile yet, using
  their email and metadata.

## Security
- The trigger function is SECURITY DEFINER so it can write to RLS-protected
  profiles during the auth signup flow. EXECUTE is revoked from PUBLIC/anon/
  authenticated to prevent direct REST invocation.
- No data is deleted; existing profiles are untouched.
*/

-- ===== 1. Fix the trigger function =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ===== 2. Re-attach the trigger =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 3. Revoke direct EXECUTE =====
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ===== 4. RLS policies on profiles =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "self_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "self_or_admin_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;

-- Anyone (including anon) can read profiles — needed for course author info, etc.
CREATE POLICY "public_select_profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert their own profile (frontend fallback if trigger fails)
CREATE POLICY "self_insert_profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile; admins can update any
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

-- Only admins can delete profiles
CREATE POLICY "admin_delete_profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'corporate_admin'
  );

-- ===== 5. Backfill missing profiles =====
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'student')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
