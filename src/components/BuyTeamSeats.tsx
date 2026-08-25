import { useState, useEffect } from 'react';
import { Users, Loader2, Copy, Check, Ticket, Minus, Plus, AlertCircle } from 'lucide-react';
import { useTeamCheckout } from '@/hooks/useTeamCheckout';
import { supabase } from '@/lib/supabase';
import type { TeamLicense } from '@/types';

export default function BuyTeamSeats() {
  const { loading, verifying, success, error, license, pricePerSeat, startTeamCheckout, reset } =
    useTeamCheckout();
  const [seats, setSeats] = useState(10);
  const [copied, setCopied] = useState(false);
  const [existingLicenses, setExistingLicenses] = useState<TeamLicense[]>([]);

  useEffect(() => {
    async function loadLicenses() {
      const { data } = await supabase
        .from('company_licenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setExistingLicenses(data as TeamLicense[]);
    }
    loadLicenses();
  }, [success]);

  const total = seats * pricePerSeat;

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (success && license) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Team Seats Purchased!</h3>
            <p className="text-sm text-slate-600">
              {license.seats} seats for KES {license.amount_paid.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-dashed border-emerald-300 mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Share this invite code with your team
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-2xl font-bold text-emerald-700 tracking-wider">
              {license.invite_code}
            </div>
            <button
              onClick={() => copyCode(license.invite_code)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={reset}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          Buy more seats
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-12 -mb-12" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Buy Team Seats</h3>
            <p className="text-slate-400 text-sm">Purchase seats for your organization</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of employee seats
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={loading || verifying}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={seats}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 1000) setSeats(val);
                }}
                disabled={loading || verifying}
                min={1}
                max={1000}
                className="w-24 text-center text-xl font-bold bg-slate-800 border border-slate-700 rounded-lg py-2 outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={() => setSeats((s) => Math.min(1000, s + 1))}
                disabled={loading || verifying}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="ml-2 text-sm text-slate-400">
                KES {pricePerSeat.toLocaleString()} / seat / month
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <span className="text-slate-300 text-sm">Total monthly cost</span>
            <span className="text-2xl font-bold text-white">
              KES {total.toLocaleString()}
              <span className="text-base text-slate-400 font-normal">/mo</span>
            </span>
          </div>

          <button
            onClick={() => startTeamCheckout(seats)}
            disabled={loading || verifying || seats < 1}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening payment...
              </>
            ) : verifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying payment...
              </>
            ) : (
              <>
                <Ticket className="w-5 h-5" />
                Buy {seats} {seats === 1 ? 'seat' : 'seats'} for KES {total.toLocaleString()}
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {existingLicenses.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Your active invite codes</h4>
            <div className="space-y-2">
              {existingLicenses.map((lic) => (
                <div
                  key={lic.id}
                  className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-emerald-400 tracking-wider">
                      {lic.invite_code}
                    </span>
                    <span className="text-xs text-slate-400">
                      {lic.seats} seats
                    </span>
                  </div>
                  <button
                    onClick={() => copyCode(lic.invite_code)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
