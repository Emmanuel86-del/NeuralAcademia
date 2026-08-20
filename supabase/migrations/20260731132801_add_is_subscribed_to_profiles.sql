/*
# Add is_subscribed flag to profiles

1. Changes
- Adds `is_subscribed` (boolean, NOT NULL, default false) to the `profiles` table.
  This flag indicates whether a user has an active subscription that unlocks
  all course content beyond the free preview modules.

2. Security
- No new tables. No RLS or policy changes — `profiles` already has read/update
  policies scoped to the owning user via `auth.uid() = id`.

3. Notes
- This is additive only: one new boolean column with a safe default.
  No data is dropped or retyped. Existing rows get `false` automatically.
- The application reads this flag to gate access to modules beyond the
  free preview (Module 1). The flag is flipped to `true` after a successful
  subscription payment (handled separately by the Paystack verify flow).
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_subscribed boolean NOT NULL DEFAULT false;
