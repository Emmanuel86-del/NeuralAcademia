import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TeamLicense } from '@/types';

const PRICE_PER_SEAT_KES = 2500;

interface TeamCheckoutState {
  loading: boolean;
  verifying: boolean;
  success: boolean;
  error: string | null;
  license: TeamLicense | null;
}

export function useTeamCheckout() {
  const [state, setState] = useState<TeamCheckoutState>({
    loading: false,
    verifying: false,
    success: false,
    error: null,
    license: null,
  });

  const update = useCallback((patch: Partial<TeamCheckoutState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, verifying: false, success: false, error: null, license: null });
  }, []);

  async function startTeamCheckout(seats: number): Promise<boolean> {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      update({ error: 'Paystack is not configured. Add your public key to the environment settings.' });
      return false;
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    if (!token) {
      update({ error: 'Please sign in to purchase team seats.' });
      return false;
    }

    update({ loading: true, error: null, success: false, license: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-team-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seats }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Checkout failed (${response.status})`);
      }

      const data: {
        reference: string;
        email: string;
        amount: number;
        currency: string;
        label?: string;
        seats: number;
      } = await response.json();

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
            verifyTeamTransaction(
              paystackResponse.reference,
              session.session!.user.id,
              data.seats
            ).then(resolve);
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

  async function verifyTeamTransaction(
    reference: string,
    userId: string,
    seats: number
  ): Promise<boolean> {
    update({ verifying: true, error: null });

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-team-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference, userId, seats }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Payment verification failed');
      }

      const result: { verified: boolean; license?: TeamLicense } = await response.json();

      if (!result.verified || !result.license) {
        throw new Error('Verification succeeded but no license was created');
      }

      update({ success: true, loading: false, verifying: false, license: result.license });
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

  return {
    ...state,
    pricePerSeat: PRICE_PER_SEAT_KES,
    startTeamCheckout,
    reset,
  };
}
