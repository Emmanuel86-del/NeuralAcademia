/*
# Create company_licenses table for team seat purchases

## Purpose
Stores team license purchases made by corporate admins (HR managers) via
Paystack. Each row represents a seat-bundle purchase and contains a unique
8-character invite code that the admin can copy and share with employees.

## New Table: company_licenses
- id (uuid, PK)
- admin_user_id (uuid, FK auth.users, owner of the license)
- seats (integer, number of employee seats purchased)
- amount_paid (integer, total amount in KES)
- paystack_reference (text, unique payment reference)
- invite_code (text, unique 8-char code for sharing)
- status (text: active / expired / canceled)
- created_at (timestamptz)

## Security
- RLS enabled.
- Owner-scoped: an admin can only SELECT/INSERT/UPDATE their own license rows.
- DELETE is blocked (licenses are financial records; cancellation is via status update).
- user_id defaults to auth.uid() so inserts omitting it succeed.
*/

CREATE TABLE IF NOT EXISTS public.company_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seats integer NOT NULL CHECK (seats > 0),
  amount_paid integer NOT NULL DEFAULT 0,
  paystack_reference text UNIQUE,
  invite_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_licenses" ON public.company_licenses;
CREATE POLICY "select_own_licenses"
  ON public.company_licenses FOR SELECT
  TO authenticated USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "insert_own_licenses" ON public.company_licenses;
CREATE POLICY "insert_own_licenses"
  ON public.company_licenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "update_own_licenses" ON public.company_licenses;
CREATE POLICY "update_own_licenses"
  ON public.company_licenses FOR UPDATE
  TO authenticated USING (auth.uid() = admin_user_id) WITH CHECK (auth.uid() = admin_user_id);

CREATE INDEX IF NOT EXISTS idx_company_licenses_admin ON public.company_licenses(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_company_licenses_invite_code ON public.company_licenses(invite_code);
