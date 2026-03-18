import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save token to profile
 */
export async function registerForPushNotifications(userId) {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    if (userId && token) {
      await supabase.from('profiles').update({
        push_token: token,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
    }

    // Android notification channels
    if (Platform.OS === 'android') {
      await Promise.all([
        Notifications.setNotificationChannelAsync('rides', {
          name: 'Courses',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        }),
        Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 150],
          sound: 'default',
        }),
      ]);
    }

    return token;
  } catch (e) {
    console.warn('Push token error:', e);
    return null;
  }
}

// ── Helper: send push via Expo Push API ──
async function sendPush(tokens, { title, body, data, channelId = 'rides', priority = 'high' }) {
  const list = Array.isArray(tokens) ? tokens : [tokens];
  const messages = list.filter(Boolean).map(to => ({
    to,
    sound: 'default',
    title,
    body,
    data,
    priority,
    channelId,
  }));
  if (messages.length === 0) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    });
  } catch (e) {
    console.warn('Push send error:', e);
  }
}

// ── Get push token for a user ──
async function getToken(userId) {
  try {
    const { data } = await supabase.from('profiles')
      .select('push_token').eq('id', userId).single();
    return data?.push_token || null;
  } catch { return null; }
}

// ── DRIVER NOTIFICATIONS ──

/**
 * Notify all online drivers of a new ride request
 */
export async function notifyDriversOfNewRide(ride) {
  try {
    const { data: drivers } = await supabase.from('profiles')
      .select('push_token')
      .eq('role', 'chauffeur')
      .eq('is_online', true)
      .not('push_token', 'is', null);
    if (!drivers?.length) return;
    const tokens = drivers.map(d => d.push_token).filter(Boolean);
    await sendPush(tokens, {
      title: 'Nouvelle course !',
      body: `${ride.pickup_address} → ${ride.dropoff_address} · ${ride.price?.toLocaleString()} FCFA`,
      data: { rideId: ride.id, type: 'new_ride' },
    });
  } catch (e) {
    console.warn('Notify drivers error:', e);
  }
}

/**
 * Notify driver when passenger cancels
 */
export async function notifyDriverRideCancelled(ride) {
  if (!ride.driver_id) return;
  const token = await getToken(ride.driver_id);
  if (!token) return;
  await sendPush(token, {
    title: 'Course annulee',
    body: `Le passager a annule la course vers ${ride.dropoff_address}`,
    data: { rideId: ride.id, type: 'ride_cancelled' },
  });
}

/**
 * Notify driver of a new message
 */
export async function notifyDriverNewMessage(driverId, senderName, preview) {
  const token = await getToken(driverId);
  if (!token) return;
  await sendPush(token, {
    title: senderName || 'Nouveau message',
    body: preview.length > 80 ? preview.slice(0, 80) + '…' : preview,
    data: { type: 'new_message' },
    channelId: 'messages',
  });
}

// ── PASSENGER NOTIFICATIONS ──

/**
 * Notify passenger when driver accepts ride
 */
export async function notifyPassengerDriverAccepted(ride, driverName) {
  const token = await getToken(ride.passenger_id);
  if (!token) return;
  await sendPush(token, {
    title: 'Chauffeur trouve !',
    body: `${driverName} est en route vers vous`,
    data: { rideId: ride.id, type: 'driver_accepted' },
  });
}

/**
 * Notify passenger when driver is arriving
 */
export async function notifyPassengerDriverArriving(ride, driverName) {
  const token = await getToken(ride.passenger_id);
  if (!token) return;
  await sendPush(token, {
    title: 'Chauffeur arrive !',
    body: `${driverName} est arrive a votre point de depart`,
    data: { rideId: ride.id, type: 'driver_arriving' },
  });
}

/**
 * Notify passenger when ride starts
 */
export async function notifyPassengerRideStarted(ride) {
  const token = await getToken(ride.passenger_id);
  if (!token) return;
  await sendPush(token, {
    title: 'Course demarree',
    body: `En route vers ${ride.dropoff_address}`,
    data: { rideId: ride.id, type: 'ride_started' },
  });
}

/**
 * Notify passenger when ride is completed
 */
export async function notifyPassengerRideCompleted(ride) {
  const token = await getToken(ride.passenger_id);
  if (!token) return;
  await sendPush(token, {
    title: 'Course terminee !',
    body: `${ride.price?.toLocaleString()} FCFA · 0% commission\nMerci d'avoir choisi Yokh Laa`,
    data: { rideId: ride.id, type: 'ride_completed' },
  });
}

/**
 * Notify passenger of a new message
 */
export async function notifyPassengerNewMessage(passengerId, senderName, preview) {
  const token = await getToken(passengerId);
  if (!token) return;
  await sendPush(token, {
    title: senderName || 'Nouveau message',
    body: preview.length > 80 ? preview.slice(0, 80) + '…' : preview,
    data: { type: 'new_message' },
    channelId: 'messages',
  });
}

// ── LOCAL NOTIFICATIONS (in-app schedule) ──

/**
 * Schedule a local notification (e.g., subscription expiring)
 */
export async function scheduleLocalNotification({ title, body, data, seconds = 1 }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: { seconds },
    });
  } catch (e) {
    console.warn('Local notification error:', e);
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount() {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch { return 0; }
}

/**
 * Clear badge
 */
export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}

// ── LISTENERS ──

export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}
