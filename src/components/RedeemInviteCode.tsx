import { useState } from 'react';
import { Ticket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RedeemInviteCodeProps {
  onRedeemed?: () => void;
}

/**
 * Lets an employee join their company's team plan by entering the invite
 * code an admin generated in BuyTeamSeats. Calls the redeem_invite_code
 * Postgres function (see migration_add_course_columns.sql), which checks
 * seat availability and links this user's profile to the license
 * atomically — so two people can't both grab the last open seat.
 *
 * Drop this into wherever a newly-signed-up employee first lands
 * (e.g. an empty Dashboard state, or an Account/Settings page).
 */
export default function RedeemInviteCode({ onRedeemed }: RedeemInviteCodeProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.rpc('redeem_invite_code', { code: code.trim() });

    setLoading(false);
    if (error) {
      setError(error.message || 'Could not redeem this code. Double-check it and try again.');
      return;
    }
    setSuccess(true);
    onRedeemed?.();
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        You're all set — your account is now linked to your company's plan.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Ticket className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Have a company invite code?</h3>
          <p className="text-sm text-slate-500">Enter it to join your team's plan.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ACME-7F3K"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-mono tracking-wider focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </form>
  );
}
