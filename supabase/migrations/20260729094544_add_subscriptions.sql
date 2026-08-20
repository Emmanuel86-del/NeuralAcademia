/*
# Add subscriptions table and premium status

1. Overview
Adds a `subscriptions` table to track Stripe checkout sessions and active premium
subscriptions for students. Also adds a `is_premium` column to `profiles` so the
frontend can quickly check subscription status without joining.

2. New Tables
- `subscriptions` — tracks each Stripe checkout session and its resulting subscription state.
  - `id` (uuid PK)
  - `user_id` (uuid, defaults to auth.uid(), FK to auth.users)
  - `stripe_customer_id` (text, nullable — set by webhook)
  - `stripe_subscription_id` (text, nullable — set by webhook)
  - `stripe_checkout_session_id` (text — set at checkout creation)
  - `status` (text: pending / active / canceled / expired)
  - `price_id` (text — the Stripe Price ID used)
  - `current_period_end` (timestamptz, nullable — set by webhook)
  - `created_at` / `updated_at` (timestamps)

3. Modified Tables
- `profiles` — adds `is_premium` boolean column (default false).

4. Security
- RLS enabled on subscriptions.
- Owner-scoped CRUD: each user can only see/manage their own subscription rows.
- The stripe-webhook edge function uses the service role key to update rows, bypassing RLS.
*/
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_checkout_session ON subscriptions(stripe_checkout_session_id);
