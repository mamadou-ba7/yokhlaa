/**
 * TomTom Traffic API + Routing intelligent pour Dakar
 * - ETA temps réel avec trafic (proxifié via Edge Function pour protéger la clé)
 * - Surge pricing basé sur la congestion
 * - Fallback OSRM si TomTom indisponible
 */

import { supabase } from './supabase';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// Zones connues de congestion à Dakar (lat, lng, rayon en km)
const CONGESTION_ZONES = [
  { name: 'VDN', lat: 14.7247, lng: -17.4753, radius: 2 },
  { name: 'Route de Rufisque', lat: 14.7434, lng: -17.3587, radius: 3 },
  { name: 'Keur Massar', lat: 14.7833, lng: -17.3167, radius: 2 },
  { name: 'Plateau', lat: 14.6697, lng: -17.4406, radius: 1.5 },
  { name: 'Almadies', lat: 14.7453, lng: -17.5229, radius: 1.5 },
  { name: 'Parcelles Assainies', lat: 14.7614, lng: -17.4318, radius: 2 },
];

// Heures de pointe Dakar
const PEAK_HOURS = {
  morning: { start: 7, end: 9 },   // 7h-9h
  evening: { start: 17, end: 20 },  // 17h-20h
};

/**
 * Calculer l'ETA avec le trafic TomTom (via Edge Function proxy)
 * Fallback sur OSRM si TomTom échoue
 */
export async function getRouteWithTraffic(fromLat, fromLng, toLat, toLng) {
  try {
    const result = await fetchTomTomRoute(fromLat, fromLng, toLat, toLng);
    if (result) return result;
  } catch (e) {
    console.warn('TomTom fallback to OSRM:', e.message);
  }

  // Fallback OSRM + estimation trafic locale
  return fetchOSRMWithTrafficEstimate(fromLat, fromLng, toLat, toLng);
}

/**
 * TomTom Routing API via Edge Function proxy (clé côté serveur)
 */
async function fetchTomTomRoute(fromLat, fromLng, toLat, toLng) {
  const { data, error } = await supabase.functions.invoke('tomtom-route', {
    body: {
      action: 'route',
      from_lat: fromLat,
      from_lng: fromLng,
      to_lat: toLat,
      to_lng: toLng,
    },
  });

  if (error) throw new Error(error.message || 'TomTom proxy error');
  if (!data || data.error) return null;

  return data;
}

/**
 * OSRM + estimation de trafic basée sur les données locales Dakar
 */
async function fetchOSRMWithTrafficEstimate(fromLat, fromLng, toLat, toLng) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();

    if (!data.routes?.[0]) throw new Error('No route');

    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const baseEta = Math.max(3, Math.round(route.duration / 60));

    // Appliquer le multiplicateur de trafic local
    const trafficMult = getLocalTrafficMultiplier(fromLat, fromLng, toLat, toLng);
    const etaMinutes = Math.round(baseEta * trafficMult);

    return {
      distanceKm,
      etaMinutes,
      etaNoTraffic: baseEta,
      congestionRatio: trafficMult,
      trafficDelay: etaMinutes - baseEta,
      source: 'osrm+local',
    };
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('OSRM error:', e);
    // Fallback haversine
    const R = 6371;
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLon = (toLng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    const trafficMult = getLocalTrafficMultiplier(fromLat, fromLng, toLat, toLng);
    const etaMinutes = Math.max(3, Math.round(distanceKm * 4 * trafficMult));

    return {
      distanceKm,
      etaMinutes,
      etaNoTraffic: Math.round(distanceKm * 4),
      congestionRatio: trafficMult,
      trafficDelay: 0,
      source: 'haversine',
    };
  }
}

/**
 * Multiplicateur de trafic basé sur les données locales Dakar
 * Combine : heure de pointe + zone de congestion + jour de la semaine
 */
function getLocalTrafficMultiplier(fromLat, fromLng, toLat, toLng) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=dimanche

  let multiplier = 1.0;

  // Heures de pointe
  if (day >= 1 && day <= 5) { // Lundi-Vendredi
    if (hour >= PEAK_HOURS.morning.start && hour < PEAK_HOURS.morning.end) {
      multiplier *= 1.6; // +60% le matin
    } else if (hour >= PEAK_HOURS.evening.start && hour < PEAK_HOURS.evening.end) {
      multiplier *= 1.8; // +80% le soir (pire)
    } else if (hour >= 12 && hour < 14) {
      multiplier *= 1.2; // +20% pause déjeuner
    }
  } else {
    // Weekend : trafic léger
    if (hour >= 10 && hour < 18) {
      multiplier *= 1.15;
    }
  }

  // Vendredi après-midi (prière + retour)
  if (day === 5 && hour >= 13 && hour < 15) {
    multiplier *= 1.3;
  }

  // Zones de congestion
  const inCongestionZone = CONGESTION_ZONES.some(zone => {
    const distFrom = haversineDist(fromLat, fromLng, zone.lat, zone.lng);
    const distTo = haversineDist(toLat, toLng, zone.lat, zone.lng);
    return distFrom < zone.radius || distTo < zone.radius;
  });

  if (inCongestionZone) {
    multiplier *= 1.25; // +25% dans les zones congestionnées
  }

  return Math.round(multiplier * 100) / 100;
}

function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcul du prix avec surge pricing basé sur le trafic
 * Prix de base : 500 FCFA + 400 FCFA/km
 */
export function calculatePrice(distanceKm, congestionRatio, rideClassMult = 1) {
  const basePrice = 500 + distanceKm * 400;

  // Surge pricing : appliqué seulement si congestion > 1.4
  let surgeMult = 1.0;
  if (congestionRatio >= 2.0) {
    surgeMult = 1.5;      // x1.5 en congestion extrême
  } else if (congestionRatio >= 1.6) {
    surgeMult = 1.3;      // x1.3 en forte congestion
  } else if (congestionRatio >= 1.4) {
    surgeMult = 1.15;     // x1.15 en congestion modérée
  }

  const finalPrice = Math.round(basePrice * rideClassMult * surgeMult);

  return {
    basePrice: Math.round(basePrice),
    surgeMult,
    surgeActive: surgeMult > 1,
    classPrice: Math.round(basePrice * rideClassMult),
    finalPrice,
    savings: surgeMult > 1 ? Math.round(basePrice * rideClassMult * (surgeMult - 1)) : 0,
  };
}

/**
 * Obtenir le niveau de trafic actuel (pour affichage UI)
 */
export function getTrafficLevel(congestionRatio) {
  if (congestionRatio >= 2.0) return { level: 'severe', label: 'Trafic tres dense', color: '#EF4444' };
  if (congestionRatio >= 1.6) return { level: 'heavy', label: 'Trafic dense', color: '#F97316' };
  if (congestionRatio >= 1.3) return { level: 'moderate', label: 'Trafic modere', color: '#FFB800' };
  return { level: 'light', label: 'Trafic fluide', color: '#22C55E' };
}

/**
 * Récupérer les incidents de trafic TomTom pour Dakar (via Edge Function)
 */
export async function getTrafficIncidents() {
  try {
    const { data, error } = await supabase.functions.invoke('tomtom-route', {
      body: { action: 'incidents' },
    });

    if (error || !data?.incidents) return [];
    return data.incidents;
  } catch (e) {
    console.warn('Traffic incidents error:', e);
    return [];
  }
}
