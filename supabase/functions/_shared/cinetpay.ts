const CINETPAY_API_KEY = Deno.env.get('CINETPAY_API_KEY')!;
const CINETPAY_SITE_ID = Deno.env.get('CINETPAY_SITE_ID')!;
const CINETPAY_BASE_URL = Deno.env.get('CINETPAY_BASE_URL') || 'https://api-checkout.cinetpay.com/v2';

interface CinetPayPaymentRequest {
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  notify_url: string;
  return_url: string;
  channels: string;
  customer_name?: string;
  customer_phone_number?: string;
  metadata?: string;
}

interface CinetPayResponse {
  code: string;
  message: string;
  description: string;
  data: {
    payment_token?: string;
    payment_url?: string;
    amount?: string;
    currency?: string;
    status?: string;
    payment_method?: string;
    operator_id?: string;
  };
  api_response_id?: string;
}

/**
 * Initialise un paiement CinetPay
 * Doc: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
 */
export async function createPayment(params: CinetPayPaymentRequest): Promise<CinetPayResponse> {
  const response = await fetch(`${CINETPAY_BASE_URL}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      ...params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CinetPay API error ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * Verifie le statut d'un paiement CinetPay
 * Doc: https://docs.cinetpay.com/api/1.0-fr/checkout/check
 * code '00' = succes
 */
export async function checkPayment(transactionId: string): Promise<CinetPayResponse> {
  const response = await fetch(`${CINETPAY_BASE_URL}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CinetPay check error ${response.status}: ${text}`);
  }

  return response.json();
}
