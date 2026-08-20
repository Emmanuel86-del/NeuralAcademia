/*
# Migrate subscriptions from Stripe to Paystack

1. Overview
Drops Stripe-specific columns from `subscriptions` and adds Paystack-specific columns.
All existing rows are preserved; Stripe columns are removed since the payment
provider is switching to Paystack Inline Popup (KES).

2. Modified Tables
- `subscriptions`
  - Removed: stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, price_id
  - Added: paystack_reference (text), paystack_customer_code (text),
           paystack_authorization_code (text), amount (bigint), currency (text)

3. Security
RLS policies remain unchanged (owner-scoped CRUD for authenticated users).
The paystack-webhook edge function uses the service role key to update rows.
*/
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_checkout_session_id,
  DROP COLUMN IF EXISTS price_id;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS paystack_customer_code text,
  ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
  ADD COLUMN IF NOT EXISTS amount bigint,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'KES';

CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference ON subscriptions(paystack_reference);
