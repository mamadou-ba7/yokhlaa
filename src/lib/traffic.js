/**
 * TomTom Traffic API + Routing intelligent pour Dakar
 * - ETA temps réel avec trafic
 * - Surge pricing basé sur la congestion
 * - Fallback OSRM si TomTom indisponible
 */

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'VOTRE_CLE_TOMTOM';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const TOMTOM_BASE = 'https://api.tomtom.com';

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
 * Calculer l'ETA avec le trafic TomTom
 * Fallback sur OSRM si TomTom échoue
 */
export async function getRouteWithTraffic(fromLat, fromLng, toLat, toLng) {
  // Essayer TomTom d'abord
  if (TOMTOM_API_KEY !== 'VOTRE_CLE_TOMTOM') {
    try {
      const result = await fetchTomTomRoute(fromLat, fromLng, toLat, toLng);
      if (result) return result;
    } catch (e) {
      console.warn('TomTom fallback to OSRM:', e.message);
    }
  }

  // Fallback OSRM + estimation trafic locale
  return fetchOSRMWithTrafficEstimate(fromLat, fromLng, toLat, toLng);
}

/**
 * TomTom Routing API avec trafic temps réel
 */
async function fetchTomTomRoute(fromLat, fromLng, toLat, toLng) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const url = `${TOMTOM_BASE}/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json` +
    `?key=${TOMTOM_API_KEY}` +
    `&traffic=true` +
    `&travelMode=car` +
    `&departAt=now`;

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  const data = await res.json();

  if (!data.routes?.[0]) return null;

  const route = data.routes[0].summary;
  const distanceKm = Math.round((route.lengthInMeters / 1000) * 10) / 10;
  const etaMinutes = Math.max(3, Math.round(route.travelTimeInSeconds / 60));

  // TomTom peut retourner noTrafficTravelTimeInSeconds ou trafficDelayInSeconds
  const trafficDelaySec = route.trafficDelayInSeconds || 0;
  const etaNoTraffic = route.noTrafficTravelTimeInSeconds
    ? Math.round(route.noTrafficTravelTimeInSeconds / 60)
    : Math.max(1, Math.round((route.travelTimeInSeconds - trafficDelaySec) / 60));

  // Ratio de congestion : temps avec trafic / temps sans trafic
  const congestionRatio = etaNoTraffic > 0 ? etaMinutes / etaNoTraffic : 1;

  return {
    distanceKm,
    etaMinutes,
    etaNoTraffic,
    congestionRatio,
    trafficDelay: Math.max(0, etaMinutes - etaNoTraffic),
    source: 'tomtom',
  };
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
 * Récupérer les incidents de trafic TomTom pour la zone de Dakar
 */
export async function getTrafficIncidents() {
  if (TOMTOM_API_KEY === 'VOTRE_CLE_TOMTOM') return [];

  try {
    // Bounding box de Dakar
    const bbox = '-17.55,14.63,-17.25,14.81';
    const url = `${TOMTOM_BASE}/traffic/services/5/incidentDetails` +
      `?key=${TOMTOM_API_KEY}` +
      `&bbox=${bbox}` +
      `&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},from,to}}}` +
      `&language=fr-FR`;

    const res = await fetch(url);
    const data = await res.json();

    return (data.incidents || []).map(inc => ({
      type: inc.properties?.iconCategory,
      delay: inc.properties?.magnitudeOfDelay,
      description: inc.properties?.events?.[0]?.description || '',
      from: inc.properties?.from,
      to: inc.properties?.to,
    }));
  } catch (e) {
    console.warn('Traffic incidents error:', e);
    return [];
  }
}
