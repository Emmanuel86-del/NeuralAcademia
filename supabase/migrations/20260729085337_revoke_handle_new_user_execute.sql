/*
# Revoke execute on handle_new_user from anon and authenticated

1. Overview
The trigger function `public.handle_new_user()` is SECURITY DEFINER (it runs with the
owner's privileges so it can INSERT into profiles during signup). By default, Postgres
grants EXECUTE on functions to PUBLIC, which means the `anon` and `authenticated` roles
can call it directly via the PostgREST API at `/rest/v1/rpc/handle_new_user`. That is a
security risk: a caller could invoke the function outside the intended signup trigger flow.

2. Changes
- REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated.
- The function remains SECURITY DEFINER so the AFTER INSERT trigger on auth.users still
  works correctly (the trigger fires in a privileged context and is not affected by the
  REVOKE — triggers invoke their functions internally, not through the PUBLIC grant).

3. Security
- Prevents direct invocation of the SECURITY DEFINER function via the REST API.
- The signup trigger flow is unaffected: the trigger still fires on auth.users INSERT.
*/
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
