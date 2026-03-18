import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';

const BACKGROUND_LOCATION_TASK = 'yokhlaa-driver-location';

// Track current driver ID for the background task
let _currentDriverId = null;

/**
 * Define the background task (must be at module level, outside components)
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Background location error:', error);
    return;
  }

  if (data?.locations?.length && _currentDriverId) {
    const { latitude, longitude } = data.locations[0].coords;
    try {
      await supabase.from('profiles').update({
        latitude,
        longitude,
        is_online: true,
        updated_at: new Date().toISOString(),
      }).eq('id', _currentDriverId);
    } catch (e) {
      console.warn('Background location update error:', e);
    }
  }
});

/**
 * Start background location tracking for driver
 */
export async function startBackgroundLocation(driverId) {
  _currentDriverId = driverId;

  // Request background permission
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    throw new Error('Foreground location permission required');
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    console.warn('Background location not granted — using foreground only');
    return false; // Caller should fall back to foreground-only
  }

  // Check if already running
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    .catch(() => false);

  if (isRunning) {
    return true;
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,        // Every 10 seconds
    distanceInterval: 20,       // Or every 20 meters
    deferredUpdatesInterval: 10000,
    showsBackgroundLocationIndicator: true, // iOS blue bar
    foregroundService: {
      notificationTitle: 'Yokh Laa — En ligne',
      notificationBody: 'Vous recevez des courses',
      notificationColor: '#22C55E',
    },
  });

  return true;
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundLocation() {
  _currentDriverId = null;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    .catch(() => false);

  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

/**
 * Check if background location is currently running
 */
export async function isBackgroundLocationRunning() {
  return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    .catch(() => false);
}
