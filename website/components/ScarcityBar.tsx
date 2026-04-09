'use client';

import { useInView } from '@/lib/useInView';

interface ScarcityBarProps {
  signedUp?: number;
  total?: number;
}

export function ScarcityBar({ signedUp = 27, total = 50 }: ScarcityBarProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.3 });
  const percent = Math.min(100, Math.round((signedUp / total) * 100));
  const remaining = Math.max(0, total - signedUp);

  return (
    <section className="relative py-8 border-y border-line bg-surface/60">
      <div ref={ref} className="container-site">
        <div className={`reveal ${inView ? 'in-view' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Label */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/30 blur-md animate-pulse-soft" />
                <div className="relative h-11 w-11 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2v6m0 0l-3-3m3 3l3-3M5 12h14M5 16h14M5 20h14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold">
                  Offre early-bird
                </div>
                <div className="text-[18px] font-bold text-ink">
                  Les 50 premiers chauffeurs
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="flex-1 max-w-lg">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[12px] text-dim">Places réservées</span>
                <span className="text-[14px] font-mono font-semibold text-ink">
                  <span className="text-accent">{signedUp}</span>
                  <span className="text-dim"> / {total}</span>
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-1000"
                  style={{ width: inView ? `${percent}%` : '0%' }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30 blur-sm bg-accent transition-all duration-1000"
                  style={{ width: inView ? `${percent}%` : '0%' }}
                />
              </div>
            </div>

            {/* Remaining callout */}
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-dim">Il reste</div>
              <div className="text-[32px] font-bold font-mono leading-none text-ink">
                {remaining}
                <span className="text-[14px] text-dim font-sans font-semibold ml-1">places</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
