import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  phone: string;
  type: 'otp' | 'ride_accepted' | 'driver_arriving' | 'ride_completed' | 'custom';
  data?: Record<string, string>;
}

// Templates SMS en français
function getSmsBody(type: string, data: Record<string, string> = {}): string {
  switch (type) {
    case 'otp':
      return `YokhLaa - Votre code de verification: ${data.code}. Valable 5 minutes. Ne partagez ce code avec personne.`;
    case 'ride_accepted':
      return `YokhLaa - ${data.driver_name} a accepte votre course. Vehicule: ${data.vehicule} (${data.plaque}). Il arrive dans ~${data.eta} min.`;
    case 'driver_arriving':
      return `YokhLaa - Votre chauffeur est arrive au point de depart. Rejoignez-le !`;
    case 'ride_completed':
      return `YokhLaa - Course terminee ! Montant: ${data.price} FCFA. Merci d'utiliser YokhLaa.`;
    case 'custom':
      return data.message || '';
    default:
      return '';
  }
}

async function sendTwilioSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Twilio error:', result);
    return { success: false, error: result.message || 'Erreur envoi SMS' };
  }

  return { success: true, sid: result.sid };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'autorisation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone, type, data } = await req.json() as SmsRequest;

    // Validation du numéro sénégalais
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned.match(/^\+221[0-9]{9}$/)) {
      return new Response(
        JSON.stringify({ error: 'Numero invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = getSmsBody(type, data);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Type de message invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendTwilioSms(cleaned, body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
