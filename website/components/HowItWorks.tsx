'use client';

import { useInView } from '@/lib/useInView';

interface Step {
  num: string;
  title: string;
  description: string;
  eta: string;
}

const steps: Step[] = [
  {
    num: '01',
    title: 'Inscris-toi sur la liste',
    description:
      "Remplis le formulaire en bas de page avec ton nom, ton téléphone et les infos de ton véhicule. 2 minutes chrono.",
    eta: '~ 2 min',
  },
  {
    num: '02',
    title: 'Valide tes documents',
    description:
      "On te contacte pour la vérification : CNI, permis de conduire, carte grise, assurance, photos du véhicule. Notre équipe valide sous 48h.",
    eta: '~ 48 h',
  },
  {
    num: '03',
    title: 'Commence à gagner',
    description:
      "Télécharge l'app Yokh Laa Chauffeur, passe en ligne, et garde 100% de ce que tu gagnes. Ton 1er mois d'abonnement est offert.",
    eta: 'Jour J',
  },
];

export function HowItWorks() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.1 });

  return (
    <section ref={ref} className="relative py-28 lg:py-40 bg-surface/40 border-y border-line">
      <div className="container-site">
        <div className={`reveal ${inView ? 'in-view' : ''} max-w-2xl mb-16`}>
          <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold mb-4">
            Comment ça marche
          </div>
          <h2 className="text-display-sm">
            Trois étapes.
            <br />
            <span className="text-dim">C'est tout.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[68px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 relative">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i + 1} ${inView ? 'in-view' : ''}`}
              >
                <div className="relative">
                  {/* Big num */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-bg border border-line flex items-center justify-center">
                        <span className="text-[17px] font-bold font-mono text-accent">
                          {step.num}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-dim font-mono">
                      {step.eta}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-[22px] font-bold text-ink mb-3 leading-tight">{step.title}</h3>
                  <p className="text-[14px] leading-relaxed text-dim">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
