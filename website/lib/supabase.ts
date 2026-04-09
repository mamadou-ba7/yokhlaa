import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fpjyfctwjiivusbzxmrg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwanlmY3R3amlpdnVzYnp4bXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTc4MzEsImV4cCI6MjA4ODI3MzgzMX0.3V3wVWPPHwyrBojrsWKt_PXwT6KSu4iHlyefHcf2H_M';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/**
 * Compte le nombre de chauffeurs inscrits sur la liste d'attente.
 * Appele au SSR pour afficher le compteur live sur le ScarcityBar.
 */
export async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'chauffeur');

    if (error) {
      console.error('[waitlist] count error:', error.message);
      return 27; // fallback
    }
    return count ?? 27;
  } catch (err) {
    console.error('[waitlist] count exception:', err);
    return 27;
  }
}

/**
 * Insere une nouvelle entree dans la waitlist.
 * Appele par le SignupForm (client-side).
 */
export async function submitWaitlistEntry(payload: {
  nom: string;
  whatsapp: string;
  role: 'chauffeur' | 'passager';
  zone?: string;
  vehicule?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('waitlist').insert({
      nom: payload.nom,
      whatsapp: payload.whatsapp,
      role: payload.role,
      zone: payload.zone ?? null,
      vehicule: payload.vehicule ?? null,
      flyer: false,
    });

    if (error) {
      console.error('[waitlist] insert error:', error.message);
      return { success: false, error: 'Impossible d\'enregistrer votre inscription. Réessayez.' };
    }
    return { success: true };
  } catch (err) {
    console.error('[waitlist] insert exception:', err);
    return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' };
  }
}
