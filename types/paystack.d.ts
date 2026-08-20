interface PaystackPopResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

interface PaystackPopHandler {
  openIframe: () => void;
}

interface PaystackPopConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  label?: string;
  onClose: () => void;
  callback: (response: PaystackPopResponse) => void;
}

interface PaystackPop {
  setup: (config: PaystackPopConfig) => PaystackPopHandler;
}

interface Window {
  PaystackPop?: PaystackPop;
}
