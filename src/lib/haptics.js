import { Platform } from 'react-native';

let Haptics = null;

// Lazy load expo-haptics (no-op on web)
async function getHaptics() {
  if (Platform.OS === 'web') return null;
  if (Haptics) return Haptics;
  try {
    Haptics = await import('expo-haptics');
    return Haptics;
  } catch {
    return null;
  }
}

/**
 * Light tap feedback — buttons, toggles, selections
 */
export async function tapLight() {
  const h = await getHaptics();
  h?.impactAsync?.(h.ImpactFeedbackStyle.Light);
}

/**
 * Medium tap feedback — confirmations, important actions
 */
export async function tapMedium() {
  const h = await getHaptics();
  h?.impactAsync?.(h.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy tap feedback — ride accepted, payment confirmed
 */
export async function tapHeavy() {
  const h = await getHaptics();
  h?.impactAsync?.(h.ImpactFeedbackStyle.Heavy);
}

/**
 * Success notification — ride completed, OTP verified
 */
export async function notifySuccess() {
  const h = await getHaptics();
  h?.notificationAsync?.(h.NotificationFeedbackType.Success);
}

/**
 * Error notification — payment failed, invalid code
 */
export async function notifyError() {
  const h = await getHaptics();
  h?.notificationAsync?.(h.NotificationFeedbackType.Error);
}

/**
 * Warning notification — surge pricing, low battery
 */
export async function notifyWarning() {
  const h = await getHaptics();
  h?.notificationAsync?.(h.NotificationFeedbackType.Warning);
}

/**
 * Selection change — filters, tabs, pickers
 */
export async function selectionChanged() {
  const h = await getHaptics();
  h?.selectionAsync?.();
}
