'use client';

import { useInView } from '@/lib/useInView';

interface Row {
  feature: string;
  yokhlaa: { value: string; good: boolean };
  uber: { value: string; good: boolean };
  yango: { value: string; good: boolean };
  bolt: { value: string; good: boolean };
}

const rows: Row[] = [
  {
    feature: 'Commission sur course',
    yokhlaa: { value: '0%', good: true },
    uber: { value: '25%', good: false },
    yango: { value: '20%', good: false },
    bolt: { value: '18%', good: false },
  },
  {
    feature: 'Abonnement mensuel',
    yokhlaa: { value: '18 500 FCFA', good: true },
    uber: { value: '—', good: true },
    yango: { value: '—', good: true },
    bolt: { value: '—', good: true },
  },
  {
    feature: 'Paiement direct au chauffeur',
    yokhlaa: { value: 'Oui', good: true },
    uber: { value: 'Non', good: false },
    yango: { value: 'Non', good: false },
    bolt: { value: 'Partiel', good: false },
  },
  {
    feature: 'Support local français/wolof',
    yokhlaa: { value: 'Oui', good: true },
    uber: { value: 'Non', good: false },
    yango: { value: 'Partiel', good: false },
    bolt: { value: 'Partiel', good: false },
  },
  {
    feature: 'Siège au Sénégal',
    yokhlaa: { value: 'Oui', good: true },
    uber: { value: 'Non', good: false },
    yango: { value: 'Non', good: false },
    bolt: { value: 'Non', good: false },
  },
  {
    feature: 'Prix bloqué à vie (50 premiers)',
    yokhlaa: { value: 'Oui', good: true },
    uber: { value: 'Non', good: false },
    yango: { value: 'Non', good: false },
    bolt: { value: 'Non', good: false },
  },
];

function Cell({ value, good, highlight }: { value: string; good: boolean; highlight?: boolean }) {
  return (
    <td className={`px-5 py-4 text-[14px] font-medium ${highlight ? 'text-accent' : good ? 'text-ink' : 'text-dim'}`}>
      <div className="flex items-center gap-2">
        {value === 'Oui' ? (
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${highlight || good ? 'bg-accent/20' : 'bg-dim2'}`}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 8l3 3 7-7" stroke={highlight || good ? '#22c55e' : '#4a5160'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : value === 'Non' ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger/10">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
        ) : null}
        <span className="font-mono">{value}</span>
      </div>
    </td>
  );
}

export function Comparison() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.1 });

  return (
    <section id="comparaison" ref={ref} className="relative py-28 lg:py-40">
      <div className="container-site">
        <div className={`reveal ${inView ? 'in-view' : ''} max-w-2xl mb-16`}>
          <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold mb-4">
            Yokh Laa vs la concurrence
          </div>
          <h2 className="text-display-sm">
            Le seul à ne rien prendre
            <br />
            <span className="text-dim">sur tes courses.</span>
          </h2>
        </div>

        <div className={`reveal reveal-delay-1 ${inView ? 'in-view' : ''}`}>
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-5 py-5 text-left text-[12px] uppercase tracking-wider text-dim font-semibold w-[32%]">
                    Critère
                  </th>
                  <th className="px-5 py-5 text-left bg-accent/[0.04] border-x border-accent/20 relative">
                    <div className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">
                      Recommandé
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-accent text-black">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                        </svg>
                      </span>
                      <span className="text-[15px] font-bold text-ink">Yokh Laa</span>
                    </div>
                  </th>
                  <th className="px-5 py-5 text-left text-[14px] font-semibold text-dim">Uber</th>
                  <th className="px-5 py-5 text-left text-[14px] font-semibold text-dim">Yango</th>
                  <th className="px-5 py-5 text-left text-[14px] font-semibold text-dim">Bolt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.feature} className={i !== rows.length - 1 ? 'border-b border-line' : ''}>
                    <td className="px-5 py-4 text-[14px] font-medium text-ink">{row.feature}</td>
                    <td className="bg-accent/[0.04] border-x border-accent/20">
                      <Cell value={row.yokhlaa.value} good={row.yokhlaa.good} highlight />
                    </td>
                    <Cell value={row.uber.value} good={row.uber.good} />
                    <Cell value={row.yango.value} good={row.yango.good} />
                    <Cell value={row.bolt.value} good={row.bolt.good} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[12px] text-dim mt-4 max-w-2xl">
            Commissions indicatives basées sur les taux publics annoncés par les plateformes en Afrique
            de l'Ouest en 2024-2025. Peuvent varier selon les villes et offres promotionnelles.
          </p>
        </div>
      </div>
    </section>
  );
}
