import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'yokhlaa_search_history';
const MAX_HISTORY = 10;

// Popular Dakar destinations
export const POPULAR_PLACES = [
  { name: 'Aeroport Blaise Diagne', area: 'Diass, Thies', lat: 14.6697, lng: -17.0731, icon: 'airplane' },
  { name: 'Place de l\'Independance', area: 'Plateau, Dakar', lat: 14.6697, lng: -17.4362, icon: 'flag' },
  { name: 'Universite Cheikh Anta Diop', area: 'Fann, Dakar', lat: 14.6937, lng: -17.4616, icon: 'school' },
  { name: 'Gare des Baux Maraichers', area: 'Pikine', lat: 14.7558, lng: -17.3894, icon: 'bus' },
  { name: 'Marche Sandaga', area: 'Plateau, Dakar', lat: 14.6723, lng: -17.4394, icon: 'cart' },
  { name: 'Hopital Principal', area: 'Plateau, Dakar', lat: 14.6703, lng: -17.4325, icon: 'medkit' },
  { name: 'Monument de la Renaissance', area: 'Ouakam, Dakar', lat: 14.7225, lng: -17.4950, icon: 'trophy' },
  { name: 'Plage de Ngor', area: 'Ngor, Dakar', lat: 14.7491, lng: -17.5157, icon: 'umbrella' },
  { name: 'Sea Plaza', area: 'Corniche, Dakar', lat: 14.6968, lng: -17.4693, icon: 'storefront' },
  { name: 'Almadies', area: 'Pointe des Almadies', lat: 14.7453, lng: -17.5225, icon: 'restaurant' },
];

/**
 * Load search history from storage
 */
export async function getSearchHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save a destination to search history
 */
export async function addToSearchHistory(place) {
  try {
    const history = await getSearchHistory();
    // Remove duplicate if exists
    const filtered = history.filter(
      h => !(Math.abs(h.lat - place.lat) < 0.001 && Math.abs(h.lng - place.lng) < 0.001)
    );
    // Add to front
    const updated = [
      { name: place.name, area: place.area || '', lat: place.lat, lng: place.lng, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear search history
 */
export async function clearSearchHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}
