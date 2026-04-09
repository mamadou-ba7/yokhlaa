'use client';

import { useInView } from '@/lib/useInView';

interface Prop {
  kicker: string;
  title: string;
  description: string;
  figure: string;
  figureSuffix?: string;
  icon: React.ReactNode;
}

const props: Prop[] = [
  {
    kicker: 'Commission',
    title: '0% sur chaque course',
    description:
      "Contrairement aux plateformes traditionnelles qui prélèvent 20 à 25%, Yokh Laa ne prend rien sur tes courses. Le montant affiché au passager, c'est exactement ce qui arrive dans ta poche.",
    figure: '0',
    figureSuffix: '%',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    kicker: 'Abonnement',
    title: '18 500 FCFA/mois. Fin de l\'histoire.',
    description:
      "Un forfait mensuel unique, transparent. Inclut courses illimitées, chat passager, dashboard analytics, support prioritaire. Pas de frais cachés, pas de paliers, pas de mauvaises surprises.",
    figure: '18 500',
    figureSuffix: 'FCFA',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10h18M7 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    kicker: 'Garantie à vie',
    title: 'Prix bloqué pour toujours',
    description:
      "Les 50 premiers chauffeurs gardent leur prix d'abonnement à 18 500 FCFA même après augmentation. Si un jour on passe à 25 000 FCFA, toi tu paies toujours 18 500. Pour toujours.",
    figure: '∞',
    figureSuffix: 'ans',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function ValueProps() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.1 });

  return (
    <section id="avantages" ref={ref} className="relative py-28 lg:py-40">
      <div className="container-site">
        {/* Section label */}
        <div className={`reveal ${inView ? 'in-view' : ''} max-w-2xl mb-16 lg:mb-24`}>
          <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold mb-4">
            Pourquoi Yokh Laa
          </div>
          <h2 className="text-display-sm">
            Trois promesses.
            <br />
            <span className="text-dim">Zéro astérisque.</span>
          </h2>
          <p className="text-subhead mt-6 max-w-xl">
            Un modèle économique inversé : tu paies un abonnement fixe, et tout ce que tu gagnes t'appartient.
          </p>
        </div>

        {/* Props grid */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {props.map((p, i) => (
            <div
              key={p.title}
              className={`reveal reveal-delay-${i + 1} ${inView ? 'in-view' : ''}`}
            >
              <article className="group relative h-full rounded-2xl bg-card border border-line p-8 lg:p-9 hover:border-accent/30 transition-all duration-500 hover:-translate-y-1">
                {/* Top row */}
                <div className="flex items-start justify-between mb-10">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
                    {p.icon}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-dim font-semibold">
                    {p.kicker}
                  </span>
                </div>

                {/* Figure */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[clamp(2.5rem,5vw,3.5rem)] font-bold font-mono leading-none text-ink tracking-tight">
                      {p.figure}
                    </span>
                    {p.figureSuffix && (
                      <span className="text-[13px] text-dim font-semibold">
                        {p.figureSuffix}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-[20px] font-bold text-ink leading-tight mb-3">{p.title}</h3>
                <p className="text-[14px] leading-relaxed text-dim">{p.description}</p>

                {/* Bottom hairline accent */}
                <div className="absolute bottom-0 left-9 right-9 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
