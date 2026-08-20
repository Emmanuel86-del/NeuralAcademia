/// <reference types="vite/client" />

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

interface PaystackPopupOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  label?: string;
  onClose?: () => void;
  callback?: (response: PaystackResponse) => void;
}

interface PaystackPopup {
  setup: (options: PaystackPopupOptions) => { openIframe: () => void };
}

interface Window {
  PaystackPop: PaystackPopup;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
