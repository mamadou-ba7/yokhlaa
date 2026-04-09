import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createPayment } from '../_shared/cinetpay.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verifier le JWT de l'utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Creer un client Supabase avec le JWT de l'utilisateur pour obtenir son ID
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifie' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lire le body
    const { amount, payment_method } = await req.json();

    // Validation
    if (amount !== 18500) {
      return new Response(
        JSON.stringify({ error: 'Montant invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['wave', 'orange_money', 'free_money'].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: 'Methode de paiement invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generer un transaction_id unique
    const transaction_id = crypto.randomUUID();

    // Creer la subscription en statut pending (service role pour bypass RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    const { error: insertError } = await adminClient.from('subscriptions').insert({
      driver_id: user.id,
      status: 'pending',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      amount: 18500,
      payment_method,
      payment_provider: 'cinetpay',
      transaction_id,
    });

    if (insertError) {
      console.error('Insert subscription error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erreur creation abonnement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtenir le profil pour le nom du client
    const { data: profile } = await adminClient
      .from('profiles')
      .select('nom, phone')
      .eq('id', user.id)
      .single();

    // Appeler CinetPay pour creer le paiement
    const notifyUrl = `${SUPABASE_URL}/functions/v1/payment-webhook`;
    const returnUrl = `yokhlaa://payment-return?tx=${transaction_id}`;

    const cinetpayResponse = await createPayment({
      transaction_id,
      amount: 18500,
      currency: 'XOF',
      description: 'Abonnement Yokh Laa — 1 mois',
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: 'MOBILE_MONEY',
      customer_name: profile?.nom || 'Chauffeur',
      customer_phone_number: profile?.phone || '',
    });

    if (cinetpayResponse.code !== '201') {
      console.error('CinetPay error:', cinetpayResponse);

      // Marquer la subscription comme echouee
      await adminClient.from('subscriptions')
        .update({ status: 'failed', error_message: cinetpayResponse.message || 'CinetPay init failed' })
        .eq('transaction_id', transaction_id);

      return new Response(
        JSON.stringify({ error: cinetpayResponse.message || 'Erreur CinetPay' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stocker le payment_token CinetPay
    await adminClient.from('subscriptions')
      .update({ provider_token: cinetpayResponse.data.payment_token })
      .eq('transaction_id', transaction_id);

    // Retourner l'URL de paiement au mobile
    return new Response(
      JSON.stringify({
        payment_url: cinetpayResponse.data.payment_url,
        transaction_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
