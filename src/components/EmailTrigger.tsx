import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function EmailTrigger() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendTestEmail() {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error('You must be logged in with an email to receive a test email.');
      }

      const { data, error: functionError } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          subject: 'Welcome to Neural Academy! 🚀',
          html: '<h1>Welcome to Neural Academy!</h1><p>We are thrilled to have you on board. Your learning journey starts now.</p>'
        }
      });

      if (functionError) throw functionError;
      console.log('Email sent successfully:', data);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(err.message || 'Failed to send test email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Email Notification Test</h4>
          <p className="text-xs text-slate-500">Send a test welcome email via Supabase Edge Functions</p>
        </div>
      </div>

      <button
        onClick={handleSendTestEmail}
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending Email...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" /> Send Test Email
          </>
        )}
      </button>

      {success && (
        <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Test email sent successfully! Check your inbox.</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}