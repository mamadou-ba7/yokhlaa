/**
 * Règles d'annulation Yokh Laa
 *
 * PASSAGER annule :
 *  - pending (aucun chauffeur accepté)          → 0 FCFA
 *  - accepted < 1 min après acceptation          → 0 FCFA
 *  - accepted >= 1 min après acceptation         → 500 FCFA
 *  - arriving (chauffeur sur place)              → 1000 FCFA
 *  - in_progress (course démarrée)               → interdit via UI normale (SOS only)
 *
 * CHAUFFEUR annule :
 *  - Toujours gratuit pour le passager
 *  - Incrémente driver_cancellation_count pour tracking
 *
 * SYSTÈME annule (timeout 3 min pending) :
 *  - 0 FCFA
 */

export function calculatePassengerCancellationFee(ride) {
  if (!ride) return 0;
  const status = ride.status;

  if (status === 'pending') return 0;

  if (status === 'accepted') {
    const acceptedAt = ride.accepted_at ? new Date(ride.accepted_at) : null;
    if (!acceptedAt) return 0;
    const elapsedSec = (Date.now() - acceptedAt.getTime()) / 1000;
    return elapsedSec < 60 ? 0 : 500;
  }

  if (status === 'arriving') return 1000;

  if (status === 'in_progress') return -1; // Bloque l'annulation normale

  return 0;
}

export function canPassengerCancel(ride) {
  if (!ride) return false;
  const status = ride.status;
  return status === 'pending' || status === 'accepted' || status === 'arriving';
}

export function getCancellationMessage(fee) {
  if (fee < 0) {
    return {
      title: 'Annulation impossible',
      message: 'Vous ne pouvez pas annuler une course en cours. En cas d\'urgence, utilisez le bouton SOS.',
    };
  }
  if (fee === 0) {
    return {
      title: 'Annuler la course ?',
      message: 'L\'annulation est gratuite. Voulez-vous continuer ?',
    };
  }
  return {
    title: 'Frais d\'annulation',
    message: `L\'annulation entraîne des frais de ${fee.toLocaleString()} FCFA (le chauffeur est déjà en route). Voulez-vous continuer ?`,
  };
}
