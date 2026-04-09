import { supabase } from './supabase';
import { Linking } from 'react-native';

/**
 * Crée un paiement d'abonnement via CinetPay (Edge Function)
 * Retourne { payment_url, transaction_id }
 */
export async function createSubscriptionPayment({ paymentMethod }) {
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { amount: 18500, payment_method: paymentMethod },
  });

  if (error) throw new Error(error.message || 'Erreur initialisation paiement');
  if (!data?.payment_url) throw new Error('Reponse CinetPay invalide');

  return data;
}

/**
 * Ouvre l'URL de paiement CinetPay dans le navigateur
 */
export async function openPaymentUrl(url) {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) throw new Error("Impossible d'ouvrir le lien de paiement");
  await Linking.openURL(url);
}

/**
 * Poll le statut de la subscription jusqu'à active/failed ou timeout (3 min)
 */
export async function waitForPaymentConfirmation(transactionId, { timeoutMs = 180000, intervalMs = 3000 } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, ends_at, error_message')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (data?.status === 'active') {
      return { success: true, subscription: data };
    }
    if (data?.status === 'failed') {
      return { success: false, error: data.error_message || 'Paiement refuse' };
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return { success: false, error: 'Delai depasse — verifiez votre application mobile money' };
}
