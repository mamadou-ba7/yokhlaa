'use client';

import { useState, type FormEvent } from 'react';
import { useInView } from '@/lib/useInView';
import { Button } from './ui/Button';
import { submitWaitlistEntry } from '@/lib/supabase';

const ZONES = [
  'Dakar Plateau',
  'Almadies',
  'Mermoz',
  'Ouakam',
  'Yoff',
  'Parcelles Assainies',
  'Keur Massar',
  'Pikine',
  'Guédiawaye',
  'Rufisque',
  'Autre',
];

const VEHICLES = ['Berline', 'SUV', 'Monospace', 'Taxi', 'Autre'];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function SignupForm() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.1 });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    nom: '',
    phone: '',
    zone: '',
    vehicule: '',
    annee: '',
    accepted: false,
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation basique
    if (!form.nom.trim()) return setErrorMsg('Ton nom est requis');
    if (!form.phone.match(/^(\+221)?[\s]?[0-9]{2}[\s]?[0-9]{3}[\s]?[0-9]{2}[\s]?[0-9]{2}$/)) {
      return setErrorMsg('Format téléphone invalide. Exemple : +221 77 123 45 67');
    }
    if (!form.zone) return setErrorMsg('Choisis une zone de travail');
    if (!form.vehicule) return setErrorMsg('Choisis un type de véhicule');
    if (!form.accepted) return setErrorMsg('Tu dois accepter les conditions');

    setStatus('submitting');

    const result = await submitWaitlistEntry({
      nom: form.nom.trim(),
      whatsapp: form.phone.replace(/\s/g, ''),
      role: 'chauffeur',
      zone: form.zone,
      vehicule: `${form.vehicule}${form.annee ? ` ${form.annee}` : ''}`,
    });

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Une erreur est survenue. Réessaie dans un instant.');
    }
  };

  if (status === 'success') {
    return (
      <section id="inscription" className="relative py-28 lg:py-40">
        <div className="container-site">
          <div className="max-w-lg mx-auto text-center rounded-3xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/30 p-10 lg:p-14">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12l5 5L20 7" stroke="#080a0d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-headline mb-3">C'est validé !</h2>
            <p className="text-subhead mb-8">
              Tu es dans les <strong className="text-ink">50 premiers chauffeurs</strong>. Notre équipe te contacte sous 48h pour valider tes documents et confirmer ton 1er mois gratuit.
            </p>
            <Button as="a" href="#top" variant="secondary" size="lg">
              Retour en haut
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="inscription" ref={ref} className="relative py-28 lg:py-40">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(34,197,94,0.15) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      <div className="container-site relative">
        <div className="max-w-2xl mx-auto">
          <div className={`reveal ${inView ? 'in-view' : ''} text-center mb-12`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3.5 py-1.5 text-[12px] font-medium text-accent mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Offre early-bird limitée à 50 chauffeurs
            </div>
            <h2 className="text-display-sm">
              Réserve ta place
              <br />
              <span className="text-dim">maintenant.</span>
            </h2>
            <p className="text-subhead mt-6">
              1<sup>er</sup> mois gratuit + prix garanti à vie à 18 500 FCFA/mois.
              Inscription en 2 minutes.
            </p>
          </div>

          <div className={`reveal reveal-delay-1 ${inView ? 'in-view' : ''}`}>
            <form
              onSubmit={onSubmit}
              className="rounded-3xl bg-card border border-line p-7 lg:p-10 space-y-6"
            >
              {/* Nom */}
              <Field
                label="Nom complet"
                required
                input={
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => update('nom', e.target.value)}
                    placeholder="Ex : Moussa Diop"
                    className="form-input"
                    disabled={status === 'submitting'}
                  />
                }
              />

              {/* Téléphone */}
              <Field
                label="Téléphone WhatsApp"
                required
                hint="On t'appellera sur ce numéro pour valider ta candidature"
                input={
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+221 77 123 45 67"
                    className="form-input"
                    disabled={status === 'submitting'}
                  />
                }
              />

              {/* Zone + véhicule */}
              <div className="grid sm:grid-cols-2 gap-6">
                <Field
                  label="Zone de travail"
                  required
                  input={
                    <select
                      value={form.zone}
                      onChange={(e) => update('zone', e.target.value)}
                      className="form-input"
                      disabled={status === 'submitting'}
                    >
                      <option value="">Choisir…</option>
                      {ZONES.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  }
                />
                <Field
                  label="Type de véhicule"
                  required
                  input={
                    <select
                      value={form.vehicule}
                      onChange={(e) => update('vehicule', e.target.value)}
                      className="form-input"
                      disabled={status === 'submitting'}
                    >
                      <option value="">Choisir…</option>
                      {VEHICLES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  }
                />
              </div>

              {/* Année */}
              <Field
                label="Année du véhicule"
                hint="Optionnel"
                input={
                  <input
                    type="number"
                    min={1990}
                    max={2026}
                    value={form.annee}
                    onChange={(e) => update('annee', e.target.value)}
                    placeholder="2018"
                    className="form-input"
                    disabled={status === 'submitting'}
                  />
                }
              />

              {/* Accept */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.accepted}
                  onChange={(e) => update('accepted', e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    form.accepted
                      ? 'bg-accent border-accent'
                      : 'border-line group-hover:border-accent/50'
                  }`}
                >
                  {form.accepted && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8l3 3 7-7" stroke="#080a0d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[13px] leading-relaxed text-dim">
                  J'accepte d'être contacté·e par l'équipe Yokh Laa et j'ai lu les{' '}
                  <a href="#" className="text-accent hover:underline">conditions d'utilisation</a> et la{' '}
                  <a href="#" className="text-accent hover:underline">politique de confidentialité</a>.
                </span>
              </label>

              {/* Error */}
              {errorMsg && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-[13px] text-danger">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    Réserver ma place
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-dim">
                Aucun paiement requis. Tu peux te désinscrire à tout moment.
              </p>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background: #080a0d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 15px;
          color: #f5f6f7;
          transition: all 200ms;
          font-family: inherit;
        }
        :global(.form-input::placeholder) {
          color: #4a5160;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        :global(.form-input:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
        :global(select.form-input) {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%234a5160' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  input,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[13px] font-semibold text-ink">
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
        {hint && <span className="text-[11px] text-dim">{hint}</span>}
      </div>
      {input}
    </div>
  );
}
