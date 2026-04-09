import { supabase } from './supabase';

/**
 * Lance le matching pour une course (cote passager, apres avoir insere la ride)
 * Retourne { success, offer_id, driver_id, eta_minutes, expires_at, ... }
 */
export async function requestMatch(rideId, { excludeDriverIds = [] } = {}) {
  const { data, error } = await supabase.functions.invoke('match-ride', {
    body: { ride_id: rideId, exclude_driver_ids: excludeDriverIds },
  });
  if (error) {
    console.warn('match-ride error:', error);
    throw new Error(error.message || 'Erreur matching');
  }
  return data;
}

/**
 * Repondre a une offre de course (cote chauffeur)
 */
export async function respondToOffer(offerId, response) {
  if (!['accepted', 'declined'].includes(response)) {
    throw new Error('Reponse invalide');
  }
  const { data, error } = await supabase.functions.invoke('respond-offer', {
    body: { offer_id: offerId, response },
  });
  if (error) {
    console.warn('respond-offer error:', error);
    throw new Error(error.message || 'Erreur reponse offre');
  }
  return data;
}

/**
 * S'abonner aux offres pour un chauffeur donne (realtime).
 * Retourne une fonction de cleanup.
 */
export function subscribeToDriverOffers(driverId, onOffer) {
  const channel = supabase.channel(`driver-offers-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_offers',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        if (payload.new) onOffer(payload.new);
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * S'abonner aux updates d'offres d'une course (cote passager)
 * Permet de voir quand une offre est creee/acceptee/refusee
 */
export function subscribeToRideOffers(rideId, onChange) {
  const channel = supabase.channel(`ride-offers-${rideId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ride_offers',
        filter: `ride_id=eq.${rideId}`,
      },
      (payload) => onChange(payload)
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
