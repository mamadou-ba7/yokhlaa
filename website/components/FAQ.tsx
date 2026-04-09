'use client';

import { useState } from 'react';
import { useInView } from '@/lib/useInView';

interface QA {
  q: string;
  a: React.ReactNode;
}

const items: QA[] = [
  {
    q: "Comment fonctionne l'abonnement mensuel ?",
    a: (
      <>
        Tu paies <strong className="text-ink">18 500 FCFA</strong> au début de chaque mois via Wave,
        Orange Money ou Free Money. C'est tout. Pas de commission, pas de frais
        cachés. Tu peux résilier à tout moment — ton abonnement s'arrête à la fin
        du mois en cours, sans engagement.
      </>
    ),
  },
  {
    q: 'Quels documents dois-je fournir ?',
    a: (
      <>
        <div className="space-y-1.5">
          {[
            'Carte nationale d\'identité (recto/verso)',
            'Permis de conduire (recto/verso)',
            'Carte grise du véhicule',
            'Certificat d\'assurance à jour',
            'Photos du véhicule (4 angles)',
            'Casier judiciaire de moins de 3 mois',
          ].map((d) => (
            <div key={d} className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" className="text-accent mt-1 shrink-0" aria-hidden>
                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="text-[14px]">{d}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-dim">Validation sous 48h par notre équipe.</p>
      </>
    ),
  },
  {
    q: 'Comment les passagers me paient-ils ?',
    a: (
      <>
        Directement à toi, en espèces, Wave ou Orange Money selon ce que le
        passager préfère. Yokh Laa n'intervient jamais dans la transaction entre
        toi et le passager — l'app affiche juste le prix calculé à l'avance, et
        tu récupères <strong className="text-ink">100% du montant</strong>.
      </>
    ),
  },
  {
    q: "Que se passe-t-il si je rate un mois d'abonnement ?",
    a: (
      <>
        Tu reçois une notification 3 jours avant l'échéance. Si tu ne renouvelles
        pas, ton compte est mis en pause — tu ne reçois plus de courses jusqu'au
        paiement. Aucune pénalité, ton compte reste ouvert. Tu peux reprendre
        quand tu veux.
      </>
    ),
  },
  {
    q: "Pourquoi seulement 50 chauffeurs pour l'offre ?",
    a: (
      <>
        On veut démarrer avec une équipe solide qu'on peut accompagner
        individuellement : formation, assistance, retours produit. Les 50 premiers
        bénéficient du <strong className="text-ink">1er mois gratuit</strong> et
        du <strong className="text-ink">prix bloqué à vie à 18 500 FCFA</strong>,
        même quand on augmentera le tarif à l'avenir.
      </>
    ),
  },
  {
    q: "Quand l'app sera-t-elle disponible ?",
    a: (
      <>
        Lancement prévu début <strong className="text-ink">2026 à Dakar</strong>.
        En t'inscrivant maintenant, tu reçois un accès prioritaire à la bêta
        privée et tu fais partie des premiers à recevoir des courses dès
        l'ouverture officielle.
      </>
    ),
  },
];

function AccordionItem({
  qa,
  isOpen,
  onToggle,
  index,
}: {
  qa: QA;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-6 py-7 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-5 flex-1">
          <span className="text-[11px] font-mono text-dim mt-1.5">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={`text-[17px] lg:text-[19px] font-semibold leading-snug transition-colors ${
            isOpen ? 'text-accent' : 'text-ink group-hover:text-accent'
          }`}>
            {qa.q}
          </h3>
        </div>
        <span
          className={`shrink-0 mt-1 h-7 w-7 rounded-full border transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'bg-accent border-accent rotate-45' : 'border-line group-hover:border-accent'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 3v10M3 8h10"
              stroke={isOpen ? '#080a0d' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-[44px] pr-12 text-[15px] leading-relaxed text-dim">
            {qa.a}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.05 });

  return (
    <section id="faq" ref={ref} className="relative py-28 lg:py-40 bg-surface/40 border-y border-line">
      <div className="container-site">
        <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-12 lg:gap-16">
          <div className={`reveal ${inView ? 'in-view' : ''}`}>
            <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold mb-4">
              Questions fréquentes
            </div>
            <h2 className="text-display-sm">
              Tout ce qu'il faut
              <br />
              savoir.
            </h2>
            <p className="text-subhead mt-6 max-w-md">
              Tu as une autre question ? Contacte-nous directement sur
              WhatsApp ou par email, on répond vite.
            </p>
            <a
              href="mailto:contact@yokhlaa.com"
              className="inline-flex items-center gap-2 mt-8 text-[14px] font-semibold text-accent hover:underline"
            >
              contact@yokhlaa.com
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className={`reveal reveal-delay-1 ${inView ? 'in-view' : ''}`}>
            <div className="rounded-2xl bg-card border border-line px-8 lg:px-10">
              {items.map((qa, i) => (
                <AccordionItem
                  key={qa.q}
                  qa={qa}
                  index={i}
                  isOpen={open === i}
                  onToggle={() => setOpen(open === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
