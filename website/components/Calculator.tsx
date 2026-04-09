'use client';

import { useMemo, useState } from 'react';
import { useInView } from '@/lib/useInView';

const SUBSCRIPTION = 18500;
const COMPETITOR_COMMISSION = 0.20; // 20%
const DAYS_PER_MONTH = 26; // days worked per month
const formatFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 1, format, onChange }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-[13px] uppercase tracking-wider text-dim font-semibold">
          {label}
        </label>
        <span className="text-[20px] font-bold font-mono text-ink">
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="calculator-slider w-full"
          style={{
            // @ts-expect-error CSS variable
            '--fill': `${percent}%`,
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-dim font-mono">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

export function Calculator() {
  const [coursesPerDay, setCoursesPerDay] = useState(12);
  const [avgPrice, setAvgPrice] = useState(2500);
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.15 });

  const { yokhlaaRevenue, competitorRevenue, saving } = useMemo(() => {
    const gross = coursesPerDay * avgPrice * DAYS_PER_MONTH;
    const yokhlaa = gross - SUBSCRIPTION;
    const competitor = gross * (1 - COMPETITOR_COMMISSION);
    return {
      yokhlaaRevenue: Math.max(0, yokhlaa),
      competitorRevenue: Math.max(0, competitor),
      saving: Math.max(0, yokhlaa - competitor),
    };
  }, [coursesPerDay, avgPrice]);

  return (
    <>
      <section id="calculateur" ref={ref} className="relative py-28 lg:py-40 bg-surface/40 border-y border-line">
        <div className="container-site">
          <div className={`reveal ${inView ? 'in-view' : ''} max-w-2xl mb-16`}>
            <div className="text-[12px] uppercase tracking-[0.2em] text-accent font-semibold mb-4">
              Calcule tes gains
            </div>
            <h2 className="text-display-sm">
              Combien tu économises
              <br />
              <span className="text-dim">chaque mois ?</span>
            </h2>
            <p className="text-subhead mt-6 max-w-xl">
              Bouge les curseurs pour voir ce que Yokh Laa te fait gagner par rapport à une plateforme qui prend 20% de commission.
            </p>
          </div>

          <div className={`reveal reveal-delay-1 ${inView ? 'in-view' : ''} grid lg:grid-cols-[1fr_1.2fr] gap-5 lg:gap-8`}>
            {/* Sliders */}
            <div className="rounded-2xl bg-card border border-line p-8 lg:p-10">
              <div className="space-y-10">
                <Slider
                  label="Courses par jour"
                  value={coursesPerDay}
                  min={4}
                  max={25}
                  onChange={setCoursesPerDay}
                />
                <Slider
                  label="Prix moyen par course"
                  value={avgPrice}
                  min={1500}
                  max={5000}
                  step={100}
                  format={(n) => `${formatFCFA(n)} F`}
                  onChange={setAvgPrice}
                />
              </div>

              <div className="mt-10 pt-8 border-t border-line grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-dim mb-1">Jours/mois</div>
                  <div className="text-[15px] font-mono font-bold text-ink">{DAYS_PER_MONTH}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-dim mb-1">Courses/mois</div>
                  <div className="text-[15px] font-mono font-bold text-ink">
                    {formatFCFA(coursesPerDay * DAYS_PER_MONTH)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-dim mb-1">CA brut</div>
                  <div className="text-[15px] font-mono font-bold text-ink">
                    {formatFCFA(coursesPerDay * avgPrice * DAYS_PER_MONTH)}
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.06] to-transparent p-8 lg:p-10 relative overflow-hidden">
              <div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
                aria-hidden
              />

              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold mb-4">
                  Ton résultat
                </div>

                {/* Yokh Laa */}
                <div className="mb-6">
                  <div className="text-[12px] text-dim mb-1.5">Avec Yokh Laa</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[clamp(2.5rem,6vw,4rem)] font-bold font-mono leading-none text-accent tracking-tight">
                      {formatFCFA(yokhlaaRevenue)}
                    </span>
                    <span className="text-[14px] text-dim font-semibold">FCFA / mois</span>
                  </div>
                  <div className="text-[11px] text-dim mt-1.5 font-mono">
                    (CA brut − 18 500 FCFA d'abonnement)
                  </div>
                </div>

                <div className="h-px bg-line my-6" />

                {/* Competitor */}
                <div className="mb-6">
                  <div className="text-[12px] text-dim mb-1.5">Avec Uber / Yango (20% commission)</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[clamp(1.8rem,4vw,2.5rem)] font-bold font-mono leading-none text-ink/60 tracking-tight line-through decoration-ink/30">
                      {formatFCFA(competitorRevenue)}
                    </span>
                    <span className="text-[13px] text-dim/70 font-semibold">FCFA / mois</span>
                  </div>
                </div>

                {/* Saving */}
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-5 mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">
                        Tu gagnes en plus
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold font-mono leading-none text-accent">
                          +{formatFCFA(saving)}
                        </span>
                        <span className="text-[13px] text-ink/80 font-semibold">FCFA / mois</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-dim mb-1">soit</div>
                      <div className="text-[15px] font-mono font-bold text-ink">
                        {formatFCFA(saving * 12)}
                      </div>
                      <div className="text-[10px] text-dim font-mono">/ an</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-dim mt-6 leading-relaxed">
                  Estimation basée sur {DAYS_PER_MONTH} jours travaillés par mois et
                  une commission concurrente de 20%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .calculator-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            #22c55e 0%,
            #22c55e var(--fill),
            #2a2e35 var(--fill),
            #2a2e35 100%
          );
          outline: none;
          cursor: pointer;
        }
        .calculator-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f5f6f7;
          border: 3px solid #22c55e;
          cursor: grab;
          transition: transform 150ms;
          box-shadow: 0 4px 14px -2px rgba(34, 197, 94, 0.6);
        }
        .calculator-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .calculator-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .calculator-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f5f6f7;
          border: 3px solid #22c55e;
          cursor: grab;
          box-shadow: 0 4px 14px -2px rgba(34, 197, 94, 0.6);
        }
      `}</style>
    </>
  );
}
