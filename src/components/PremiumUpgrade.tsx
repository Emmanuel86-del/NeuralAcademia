import { Crown, Check, Sparkles, Loader2, Lock } from 'lucide-react';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';

interface PremiumUpgradeProps {
  onClose?: () => void;
  compact?: boolean;
}

const PRO_PRICE_KES = 1900;

const premiumFeatures = [
  'Unlock all advanced courses',
  'Unlimited AI tutor sessions',
  'Exclusive assessments with detailed analytics',
  'Priority access to new content',
  'Downloadable certificates of completion',
];

export default function PremiumUpgrade({ onClose, compact }: PremiumUpgradeProps) {
  const { loading, verifying, success, error, startCheckout } = usePaystackCheckout();

  if (compact) {
    return (
      <button
        onClick={startCheckout}
        disabled={loading || verifying || success}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60"
      >
        {loading || verifying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Crown className="w-4 h-4" />
        )}
        Go Premium
      </button>
    );
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 lg:p-8 text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to Pro!</h3>
        <p className="text-slate-600 text-sm">Your premium subscription is now active. All course modules are unlocked.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -ml-12 -mb-12" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">NeuralAcademy Pro</h3>
            <p className="text-slate-400 text-sm">Unlock the full learning experience</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div>
            <p className="text-3xl font-bold">
              KES {PRO_PRICE_KES.toLocaleString()}<span className="text-lg text-slate-400 font-normal">/month</span>
            </p>
            <p className="text-slate-400 text-sm mt-1">Cancel anytime</p>

            <button
              onClick={startCheckout}
              disabled={loading || verifying}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                  <Sparkles className="w-5 h-5" />
                  Upgrade to Pro
                </>
              )}
            </button>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="mt-2 w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {premiumFeatures.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-xs font-semibold">
      <Crown className="w-3 h-3" />
      Pro
    </span>
  );
}

export function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
      <div className="text-center p-6">
        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-white font-semibold mb-1">Premium Course</p>
        <p className="text-slate-300 text-sm mb-4">Upgrade to Pro to unlock this course</p>
        <button
          onClick={onUpgrade}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 mx-auto"
        >
          <Crown className="w-4 h-4" />
          Go Premium
        </button>
      </div>
    </div>
  );
}
