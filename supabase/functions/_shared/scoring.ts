/**
 * Score a driver for a ride.
 * Higher = better match.
 *
 * Formula:
 *   score = (1 / eta_min) * 100          // distance/time weight
 *         + rating * 10                    // driver quality weight
 *         + min(idle_min, 30) * 2          // fairness for waiting drivers (capped)
 *         - cancellations * 5              // penalty for abandonment
 */
export function scoreDriver(params: {
  etaMinutes: number;
  rating: number;
  idleMinutes: number;
  cancellations: number;
}): number {
  const { etaMinutes, rating, idleMinutes, cancellations } = params;
  const etaScore = etaMinutes > 0 ? (100 / etaMinutes) : 0;
  const ratingScore = (rating || 5) * 10;
  const idleScore = Math.min(idleMinutes || 0, 30) * 2;
  const penaltyScore = (cancellations || 0) * 5;
  return Math.round((etaScore + ratingScore + idleScore - penaltyScore) * 100) / 100;
}

/**
 * Compute idle minutes from the driver's updated_at field.
 * If it's been updated recently (GPS ping), they're active.
 */
export function idleMinutesFrom(updatedAt: string | null): number {
  if (!updatedAt) return 0;
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}
