import { supabase } from './supabase';

/**
 * Envoyer un SMS via l'Edge Function Twilio
 * Types: 'ride_accepted', 'driver_arriving', 'ride_completed', 'custom'
 * Note: les OTP sont gérés directement par Supabase Auth + Twilio (dashboard config)
 */
export async function sendSms(phone, type, data = {}) {
  const { data: result, error } = await supabase.functions.invoke('send-sms', {
    body: { phone, type, data },
  });

  if (error) {
    console.warn('Erreur envoi SMS:', error.message);
    throw new Error(error.message || "Impossible d'envoyer le SMS");
  }

  return result;
}

// Notifications SMS prédéfinies pour les courses
export const SmsNotifications = {
  // Notifier le passager que le chauffeur a accepté
  rideAccepted: (passengerPhone, { driverName, vehicule, plaque, eta }) =>
    sendSms(passengerPhone, 'ride_accepted', {
      driver_name: driverName,
      vehicule,
      plaque,
      eta: String(eta),
    }),

  // Notifier le passager que le chauffeur arrive
  driverArriving: (passengerPhone) =>
    sendSms(passengerPhone, 'driver_arriving'),

  // Notifier la fin de course
  rideCompleted: (passengerPhone, { price }) =>
    sendSms(passengerPhone, 'ride_completed', {
      price: String(price),
    }),

  // SMS personnalisé
  custom: (phone, message) =>
    sendSms(phone, 'custom', { message }),
};
