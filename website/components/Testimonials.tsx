'use client';

import { useInView } from '@/lib/useInView';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  zone: string;
}

const items: Testimonial[] = [
  {
    name: 'Moussa D.',
    role: 'Chauffeur, 8 ans d\'expérience',
    zone: 'Plateau',
    quote:
      "Avec Yango, je laisse 250 000 FCFA par mois en commissions. Chez Yokh Laa, je récupère tout. Je passe cash.",
  },
  {
    name: 'Aïssatou N.',
    role: 'Chauffeur indépendant',
    zone: 'Almadies',
    quote:
      "Ce qui me convainc, c'est le prix bloqué à vie. Dans 5 ans, les autres auront augmenté. Moi je paierai toujours 18 500.",
  },
  {
    name: 'Ibrahima S.',
    role: 'Chauffeur + taxi',
    zone: 'Ouakam',
    quote:
      "Enfin une app où on parle français et wolof avec le support. C'est fait par des Sénégalais, pour des Sénégalais.",
  },
];

export function Testimonials() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.1 });

  return (
    <section ref={ref} className="relative py-28 lg:py-40">
      <div className="container-site">
        <div className={`reveal ${inView ? 'in-view' : ''} max-w-2xl mb-16`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold">
              Ils rejoignent Yokh Laa
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/30 px-2.5 py-0.5 text-[10px] font-semibold text-warning uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-warning animate-pulse" />
              À venir
            </span>
          </div>
          <h2 className="text-display-sm">
            Les premiers chauffeurs
            <br />
            <span className="text-dim">ont déjà choisi.</span>
          </h2>
          <p className="text-subhead mt-6 max-w-xl">
            Témoignages à venir après le lancement. Inscris-toi pour être parmi les premiers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {items.map((t, i) => (
            <div
              key={t.name}
              className={`reveal reveal-delay-${i + 1} ${inView ? 'in-view' : ''}`}
            >
              <article className="relative h-full rounded-2xl bg-card border border-line p-7 lg:p-8 hover:border-white/15 transition-colors">
                {/* Quote mark */}
                <svg
                  width="32"
                  height="24"
                  viewBox="0 0 32 24"
                  fill="none"
                  className="text-accent/40 mb-5"
                  aria-hidden
                >
                  <path
                    d="M0 24V15.6C0 10.933 1.067 6.933 3.2 3.6 5.333 0.4 8.133 -1.2 11.6 -1.2L13.6 2.8C10.8 3.733 8.667 5.2 7.2 7.2 5.867 9.067 5.2 11.2 5.2 13.6H13.6V24H0ZM18.4 24V15.6C18.4 10.933 19.467 6.933 21.6 3.6 23.733 0.4 26.533 -1.2 30 -1.2L32 2.8C29.2 3.733 27.067 5.2 25.6 7.2 24.267 9.067 23.6 11.2 23.6 13.6H32V24H18.4Z"
                    transform="translate(0, 1)"
                    fill="currentColor"
                  />
                </svg>

                <p className="text-[15px] leading-relaxed text-ink mb-8 italic">
                  “{t.quote}”
                </p>

                <div className="flex items-center gap-3 pt-6 border-t border-line">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/50 to-accent/10 border border-accent/20 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-accent">
                      {t.name.split(' ').map((w) => w[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{t.name}</div>
                    <div className="text-[11px] text-dim truncate">{t.role}</div>
                  </div>
                  <span className="text-[10px] font-mono text-dim">{t.zone}</span>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
