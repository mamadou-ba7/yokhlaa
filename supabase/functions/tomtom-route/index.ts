import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const TOMTOM_API_KEY = Deno.env.get('TOMTOM_API_KEY')!;
const TOMTOM_BASE = 'https://api.tomtom.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
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

    const { action, from_lat, from_lng, to_lat, to_lng } = await req.json();

    // Validation Dakar bounding box (-17.55,14.63 → -17.25,14.81)
    const inDakar = (lat: number, lng: number) =>
      lat >= 14.6 && lat <= 14.85 && lng >= -17.6 && lng <= -17.2;

    if (action === 'route') {
      if (!inDakar(from_lat, from_lng) || !inDakar(to_lat, to_lng)) {
        return new Response(
          JSON.stringify({ error: 'Coordonnees hors Dakar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = `${TOMTOM_BASE}/routing/1/calculateRoute/${from_lat},${from_lng}:${to_lat},${to_lng}/json` +
        `?key=${TOMTOM_API_KEY}` +
        `&traffic=true` +
        `&travelMode=car` +
        `&departAt=now`;

      const tomtomRes = await fetch(url);
      const data = await tomtomRes.json();

      if (!data.routes?.[0]) {
        return new Response(
          JSON.stringify({ error: 'Aucun itineraire trouve' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const route = data.routes[0].summary;
      const distanceKm = Math.round((route.lengthInMeters / 1000) * 10) / 10;
      const etaMinutes = Math.max(3, Math.round(route.travelTimeInSeconds / 60));
      const trafficDelaySec = route.trafficDelayInSeconds || 0;
      const etaNoTraffic = route.noTrafficTravelTimeInSeconds
        ? Math.round(route.noTrafficTravelTimeInSeconds / 60)
        : Math.max(1, Math.round((route.travelTimeInSeconds - trafficDelaySec) / 60));
      const congestionRatio = etaNoTraffic > 0 ? etaMinutes / etaNoTraffic : 1;

      return new Response(
        JSON.stringify({
          distanceKm,
          etaMinutes,
          etaNoTraffic,
          congestionRatio,
          trafficDelay: Math.max(0, etaMinutes - etaNoTraffic),
          source: 'tomtom',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'incidents') {
      const bbox = '-17.55,14.63,-17.25,14.81';
      const url = `${TOMTOM_BASE}/traffic/services/5/incidentDetails` +
        `?key=${TOMTOM_API_KEY}` +
        `&bbox=${bbox}` +
        `&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},from,to}}}` +
        `&language=fr-FR`;

      const tomtomRes = await fetch(url);
      const data = await tomtomRes.json();

      return new Response(
        JSON.stringify({
          incidents: (data.incidents || []).map((inc: any) => ({
            type: inc.properties?.iconCategory,
            delay: inc.properties?.magnitudeOfDelay,
            description: inc.properties?.events?.[0]?.description || '',
            from: inc.properties?.from,
            to: inc.properties?.to,
          })),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action invalide' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TomTom proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
