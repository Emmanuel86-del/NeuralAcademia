/*
# Recreate the on_auth_user_created trigger

## Problem
The `on_auth_user_created` trigger on `auth.users` is missing. The trigger
function `public.handle_new_user()` still exists, but no trigger is attached
to `auth.users`, so no profile row is created when a new user signs up.
The frontend then queries for a profile that doesn't exist, gets null, and
the app's auth state crashes (loading never resolves correctly, features
that depend on profile.role fail).

## Changes
1. Recreate (idempotently) the `handle_new_user()` SECURITY DEFINER function.
   - Reads full_name, role, company from `raw_user_meta_data` (set by
     `supabase.auth.signUp({ options: { data: { ... } } })`).
   - Falls back to 'student' role and '' for missing fields.
   - Uses ON CONFLICT DO NOTHING so re-running after a partial insert is safe.
2. Re-attach the `on_auth_user_created` AFTER INSERT trigger on `auth.users`.
3. Re-revoke EXECUTE from PUBLIC/anon/authenticated so the SECURITY DEFINER
   function cannot be called directly via the REST API.

## Security
- The function is SECURITY DEFINER with `search_path = public` so it can
  INSERT into the RLS-protected `profiles` table during the signup trigger
  (triggers run in a privileged context unaffected by the REVOKE).
- EXECUTE is revoked from PUBLIC/anon/authenticated to prevent direct
  invocation outside the signup flow.
- No data is deleted or modified; existing profiles are untouched.
*/

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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
