import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CheckoutInit {
  reference: string;
  email: string;
  amount: number;
  currency: string;
  label?: string;
  subscriptionId?: string;
}

interface PaystackState {
  loading: boolean;
  verifying: boolean;
  success: boolean;
  error: string | null;
}

export function usePaystackCheckout() {
  const { refreshProfile } = useAuth();
  const [state, setState] = useState<PaystackState>({
    loading: false,
    verifying: false,
    success: false,
    error: null,
  });

  function update(patch: Partial<PaystackState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setState({ loading: false, verifying: false, success: false, error: null });
  }

  async function startCheckout(): Promise<boolean> {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      update({ error: 'Paystack is not configured. Add your public key to the environment settings.' });
      return false;
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    if (!token) {
      update({ error: 'Please sign in to upgrade.' });
      return false;
    }

    update({ loading: true, error: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Checkout failed (${response.status})`);
      }

      const data: CheckoutInit = await response.json();

      return new Promise<boolean>((resolve) => {
        const handler = window.PaystackPop?.setup({
          key: publicKey,
          email: data.email,
          amount: data.amount,
          currency: data.currency,
          ref: data.reference,
          label: data.label,
          onClose: () => {
            update({ loading: false });
            resolve(false);
          },
          callback: (paystackResponse) => {
            verifyTransaction(paystackResponse.reference, session.session!.user.id)
              .then(resolve);
          },
        });

        if (!handler) {
          update({ loading: false, error: 'Paystack failed to load. Please refresh and try again.' });
          resolve(false);
          return;
        }

        handler.openIframe();
      });
    } catch (err) {
      update({
        loading: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      });
      return false;
    }
  }

  async function verifyTransaction(reference: string, userId: string): Promise<boolean> {
    update({ verifying: true, error: null });

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference, userId }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Payment verification failed');
      }

      await refreshProfile();

      update({ success: true, loading: false, verifying: false });
      return true;
    } catch (err) {
      update({
        verifying: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      });
      return false;
    }
  }

  return { ...state, startCheckout, reset };
}
