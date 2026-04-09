import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { matchRide } from '../_shared/matching.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifie' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { offer_id, response } = await req.json();

    if (!offer_id || !['accepted', 'declined'].includes(response)) {
      return new Response(
        JSON.stringify({ error: 'Parametres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Charger l'offre
    const { data: offer, error: offerErr } = await admin
      .from('ride_offers')
      .select('id, ride_id, driver_id, response, expires_at')
      .eq('id', offer_id)
      .maybeSingle();

    if (offerErr || !offer) {
      return new Response(
        JSON.stringify({ error: 'Offre non trouvee' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Seul le chauffeur destinataire peut repondre
    if (offer.driver_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Non autorise' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deja repondu
    if (offer.response) {
      return new Response(
        JSON.stringify({ error: `Offre deja ${offer.response}` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Expiree
    const expiresAt = new Date(offer.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await admin.from('ride_offers')
        .update({ response: 'timeout', responded_at: new Date().toISOString() })
        .eq('id', offer_id);
      return new Response(
        JSON.stringify({ error: 'Offre expiree', expired: true }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    if (response === 'accepted') {
      // ATOMIC : UPDATE la course seulement si encore pending (evite les races)
      const { data: rideUpdate, error: rideErr } = await admin
        .from('rides')
        .update({
          status: 'accepted',
          driver_id: offer.driver_id,
          accepted_at: now,
        })
        .eq('id', offer.ride_id)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

      if (rideErr || !rideUpdate) {
        await admin.from('ride_offers')
          .update({ response: 'timeout', responded_at: now })
          .eq('id', offer_id);
        return new Response(
          JSON.stringify({ error: 'Course non disponible' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Marquer l'offer comme acceptee
      await admin.from('ride_offers')
        .update({ response: 'accepted', responded_at: now })
        .eq('id', offer_id);

      // Marquer toute autre offer en attente sur la meme course comme timeout
      await admin.from('ride_offers')
        .update({ response: 'timeout', responded_at: now })
        .eq('ride_id', offer.ride_id)
        .is('response', null);

      return new Response(
        JSON.stringify({ success: true, ride: rideUpdate }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // response === 'declined'
    await admin.from('ride_offers')
      .update({ response: 'declined', responded_at: now })
      .eq('id', offer_id);

    // Re-matching : appel direct a la logique partagee (pas HTTP)
    const rematch = await matchRide(admin, offer.ride_id, [offer.driver_id]);

    return new Response(
      JSON.stringify({ success: true, rematch }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Respond offer error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
