import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { checkPayment } from '../_shared/cinetpay.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // CinetPay peut envoyer GET ou POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    let transactionId: string | null = null;

    // CinetPay envoie les donnees en POST (form-urlencoded ou JSON selon config)
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const body = await req.json();
        transactionId = body.cpm_trans_id || body.transaction_id;
      } else {
        // form-urlencoded
        const formData = await req.formData();
        transactionId = formData.get('cpm_trans_id') as string;
      }
    } else {
      // GET — CinetPay peut aussi notifier via query params
      const url = new URL(req.url);
      transactionId = url.searchParams.get('cpm_trans_id') || url.searchParams.get('transaction_id');
    }

    if (!transactionId) {
      console.error('Webhook: no transaction_id found');
      return new Response(
        JSON.stringify({ error: 'transaction_id manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Webhook received for transaction: ${transactionId}`);

    // SECURITE: ne PAS faire confiance au webhook directement
    // Toujours verifier le statut via l'API CinetPay /v2/payment/check
    const checkResult = await checkPayment(transactionId);

    console.log(`CinetPay check result: code=${checkResult.code}, status=${checkResult.data?.status}`);

    // Client admin (service role) pour bypass RLS
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifier que la subscription existe
    const { data: subscription, error: fetchError } = await adminClient
      .from('subscriptions')
      .select('id, status, driver_id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (fetchError || !subscription) {
      console.error('Subscription not found for transaction:', transactionId);
      return new Response(
        JSON.stringify({ error: 'Abonnement non trouve' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ne pas re-traiter une subscription deja active
    if (subscription.status === 'active') {
      console.log(`Subscription already active for transaction: ${transactionId}`);
      return new Response(
        JSON.stringify({ ok: true, message: 'Deja traite' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // code '00' = paiement reussi chez CinetPay
    if (checkResult.code === '00') {
      const { error: updateError } = await adminClient
        .from('subscriptions')
        .update({
          status: 'active',
          webhook_confirmed_at: new Date().toISOString(),
          provider_operator_id: checkResult.data?.operator_id || null,
          webhook_payload: checkResult,
        })
        .eq('transaction_id', transactionId);

      if (updateError) {
        console.error('Update subscription error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erreur mise a jour abonnement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Le trigger SQL sync_profile_subscription gere automatiquement
      // profiles.subscription_active = TRUE + subscription_ends_at

      console.log(`Payment confirmed for driver ${subscription.driver_id}`);
    } else {
      // Paiement echoue ou en attente
      const errorMsg = checkResult.message || `Code: ${checkResult.code}`;

      await adminClient
        .from('subscriptions')
        .update({
          status: 'failed',
          error_message: errorMsg,
          webhook_payload: checkResult,
        })
        .eq('transaction_id', transactionId);

      console.log(`Payment failed for transaction ${transactionId}: ${errorMsg}`);
    }

    // CinetPay attend un 200 OK
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
