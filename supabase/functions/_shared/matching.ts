import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreDriver, idleMinutesFrom } from './scoring.ts';

export const SEARCH_RADIUS_METERS = 5000;
export const MAX_CANDIDATES = 20;
export const OFFER_TIMEOUT_SECONDS = 20;
export const MAX_ATTEMPTS = 10;

export interface MatchResult {
  success: boolean;
  offer_id?: string;
  driver_id?: string;
  eta_minutes?: number;
  distance_km?: number;
  score?: number;
  attempt_number?: number;
  expires_at?: string;
  error?: string;
  exhausted?: boolean;
  status?: number;
}

/**
 * Core matching logic - trouve le meilleur chauffeur pour une course
 * et cree une ride_offer. Appellable depuis match-ride (HTTP) et
 * respond-offer (re-matching apres refus).
 *
 * @param admin - Supabase client avec service_role (bypass RLS)
 * @param ride_id - Course a matcher
 * @param excluded_driver_ids - IDs a exclure (en plus de ceux deja sollicites)
 */
export async function matchRide(
  admin: SupabaseClient,
  ride_id: string,
  excluded_driver_ids: string[] = []
): Promise<MatchResult> {
  // Charger la course
  const { data: ride, error: rideErr } = await admin
    .from('rides')
    .select('id, passenger_id, status, pickup_lat, pickup_lng, ride_class')
    .eq('id', ride_id)
    .maybeSingle();

  if (rideErr || !ride) {
    return { success: false, error: 'Course non trouvee', status: 404 };
  }

  if (ride.status !== 'pending') {
    return { success: false, error: `Course en statut ${ride.status}`, status: 400 };
  }

  // Compter les tentatives
  const { count: attemptCount } = await admin
    .from('ride_offers')
    .select('id', { count: 'exact', head: true })
    .eq('ride_id', ride_id);

  const attemptNumber = (attemptCount || 0) + 1;

  if (attemptNumber > MAX_ATTEMPTS) {
    await admin.from('rides')
      .update({
        status: 'cancelled',
        cancelled_by: 'system',
        cancellation_reason: 'no_driver_available',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', ride_id);
    return { success: false, error: 'Aucun chauffeur disponible', exhausted: true, status: 404 };
  }

  // Exclure les chauffeurs deja sollicites
  const { data: previousOffers } = await admin
    .from('ride_offers')
    .select('driver_id')
    .eq('ride_id', ride_id);

  const alreadyOffered = Array.from(new Set([
    ...(previousOffers || []).map((o: any) => o.driver_id),
    ...excluded_driver_ids,
  ]));

  // Requete PostGIS
  const { data: candidates, error: queryErr } = await admin.rpc('find_nearby_drivers', {
    pickup_lat: ride.pickup_lat,
    pickup_lng: ride.pickup_lng,
    radius_meters: SEARCH_RADIUS_METERS,
    max_candidates: MAX_CANDIDATES,
    excluded_ids: alreadyOffered,
  });

  if (queryErr) {
    console.error('PostGIS query error:', queryErr);
    return { success: false, error: 'Erreur recherche chauffeurs', status: 500 };
  }

  if (!candidates || candidates.length === 0) {
    if (attemptNumber >= MAX_ATTEMPTS) {
      await admin.from('rides')
        .update({
          status: 'cancelled',
          cancelled_by: 'system',
          cancellation_reason: 'no_driver_available',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', ride_id);
    }
    return { success: false, error: 'Aucun chauffeur disponible', status: 404 };
  }

  // Scorer
  const scored = candidates.map((c: any) => {
    const distanceKm = c.distance_m / 1000;
    const etaMinutes = Math.max(2, Math.round(1 + distanceKm * 2));
    const idleMin = idleMinutesFrom(c.updated_at);
    const score = scoreDriver({
      etaMinutes,
      rating: c.rating || 5,
      idleMinutes: idleMin,
      cancellations: c.driver_cancellation_count || 0,
    });
    return {
      driver_id: c.id,
      score,
      eta_minutes: etaMinutes,
      distance_km: Math.round(distanceKm * 10) / 10,
    };
  }).sort((a: any, b: any) => b.score - a.score);

  const winner = scored[0];
  const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_SECONDS * 1000).toISOString();

  const { data: offer, error: offerErr } = await admin
    .from('ride_offers')
    .insert({
      ride_id,
      driver_id: winner.driver_id,
      score: winner.score,
      eta_minutes: winner.eta_minutes,
      distance_km: winner.distance_km,
      expires_at: expiresAt,
      attempt_number: attemptNumber,
    })
    .select()
    .single();

  if (offerErr) {
    console.error('Offer insert error:', offerErr);
    return { success: false, error: 'Erreur creation offre', status: 500 };
  }

  return {
    success: true,
    offer_id: offer.id,
    driver_id: winner.driver_id,
    eta_minutes: winner.eta_minutes,
    distance_km: winner.distance_km,
    score: winner.score,
    attempt_number: attemptNumber,
    expires_at: expiresAt,
  };
}
