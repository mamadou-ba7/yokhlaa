'use client';

import { Button } from './ui/Button';
import { useInView } from '@/lib/useInView';

export function Hero() {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, threshold: 0.05 });

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden pt-[120px] pb-24 lg:pt-[160px] lg:pb-40 noise"
    >
      {/* Ambient glow + grid */}
      <div className="glow-hero" aria-hidden />
      <div className="grid-lines" aria-hidden />

      <div className="container-site relative">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className={`reveal ${inView ? 'in-view' : ''}`}>
            {/* Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3.5 py-1.5 text-[12px] font-medium text-accent mb-8">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              Lancement Dakar 2026 · Pré-inscriptions ouvertes
            </div>

            {/* Headline */}
            <h1 className="text-display">
              Conduis.<br />
              <span className="relative inline-block">
                Garde
                <span className="text-accent"> 100%</span>
              </span>
              <br />
              de tes gains.
            </h1>

            {/* Subhead */}
            <p className="text-subhead max-w-xl mt-7">
              Yokh Laa est le premier service de transport <strong className="text-ink font-semibold">sans commission</strong> à Dakar.
              Un abonnement fixe de{' '}
              <span className="font-mono text-ink font-semibold whitespace-nowrap">18&nbsp;500&nbsp;FCFA</span>/mois.
              Zéro prélèvement sur tes courses.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-10">
              <Button as="a" href="#inscription" variant="primary" size="lg">
                Réserver ma place
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
              <Button as="a" href="#avantages" variant="secondary" size="lg">
                Voir comment ça marche
              </Button>
            </div>

            {/* Social proof strip */}
            <div className="mt-14 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-bg bg-gradient-to-br from-accent/60 to-accent/20"
                    style={{ zIndex: 4 - i }}
                  />
                ))}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink">
                  <span className="font-mono">27</span> chauffeurs déjà inscrits
                </div>
                <div className="text-[12px] text-dim">23 places restantes sur les 50 premières</div>
              </div>
            </div>
          </div>

          {/* Right — visual phone mockup */}
          <div className={`reveal reveal-delay-2 ${inView ? 'in-view' : ''}`}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto max-w-sm lg:max-w-none lg:justify-self-end">
      {/* Backdrop orb */}
      <div
        className="absolute -inset-16 rounded-full blur-3xl opacity-40 animate-pulse-soft"
        style={{
          background:
            'radial-gradient(circle, rgba(34,197,94,0.45) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      {/* Phone frame */}
      <div className="relative aspect-[9/19] w-full max-w-[320px] rounded-[2.75rem] bg-[#1a1c20] p-2.5 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] animate-float">
        {/* Screen */}
        <div className="relative h-full w-full rounded-[2.25rem] overflow-hidden bg-[#080a0d]">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[22px] bg-black rounded-b-2xl z-20" />

          {/* Status bar */}
          <div className="absolute top-1.5 inset-x-0 flex justify-between px-6 text-[10px] font-semibold text-ink z-10">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2 bg-ink/80 rounded-sm" />
            </div>
          </div>

          {/* Map with subtle grid — SVG abstract */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 320 680"
            aria-hidden
          >
            <defs>
              <pattern id="hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
                <path
                  d="M20 0L40 11.5v23L20 46 0 34.5v-23z"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="0.7"
                />
              </pattern>
              <radialGradient id="heroGlow" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="320" height="680" fill="#0a0c11" />
            <rect width="320" height="680" fill="url(#hex)" />
            <rect width="320" height="680" fill="url(#heroGlow)" />
            {/* Fake route line */}
            <path
              d="M 30 520 C 100 460, 140 420, 180 360 S 260 200, 290 140"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="0 0"
              opacity="0.85"
            />
            <circle cx="30" cy="520" r="7" fill="#22c55e" />
            <circle cx="30" cy="520" r="13" fill="none" stroke="#22c55e" strokeOpacity="0.3" strokeWidth="2" />
            <circle cx="290" cy="140" r="7" fill="#f5f6f7" />
          </svg>

          {/* Top badge */}
          <div className="absolute top-12 left-4 right-4 z-10">
            <div className="bg-[#12141a]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-dim">Statut</div>
                  <div className="text-[13px] font-semibold text-accent">EN LIGNE</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-dim uppercase tracking-wider">Courses</div>
                  <div className="text-[14px] font-bold text-ink font-mono">7</div>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings card */}
          <div className="absolute bottom-[120px] left-4 right-4 z-10">
            <div className="bg-[#12141a]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-dim mb-1">Gains du jour</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-bold text-ink font-mono">34 250</span>
                <span className="text-[12px] text-dim font-semibold">FCFA</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] text-accent font-semibold flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 10l3-3 3 3 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Commission : 0 FCFA
                </span>
                <span className="text-[10px] text-dim font-mono">+22%</span>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-3 left-4 right-4 flex gap-2 z-10">
            <div className="flex-1 bg-[#12141a]/90 backdrop-blur-md border border-white/10 rounded-xl py-3 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-accent" />
            </div>
            <div className="flex-1 bg-[#12141a]/90 backdrop-blur-md border border-white/10 rounded-xl py-3 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-dim2" />
            </div>
            <div className="flex-1 bg-[#12141a]/90 backdrop-blur-md border border-white/10 rounded-xl py-3 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-dim2" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat card */}
      <div className="absolute -left-4 top-1/3 lg:-left-10 bg-card border border-line rounded-xl p-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-sm w-[165px]">
        <div className="text-[10px] uppercase tracking-wider text-dim mb-1">Ce mois-ci</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-bold font-mono text-ink">892 400</span>
        </div>
        <div className="text-[10px] text-accent mt-0.5 font-semibold">FCFA · 0% commission</div>
      </div>

      {/* Floating rating card */}
      <div className="absolute -right-2 bottom-1/4 lg:-right-6 bg-card border border-line rounded-xl p-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#FFB800" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-[13px] font-bold font-mono text-ink">4.9</span>
        </div>
        <div className="text-[10px] text-dim mt-0.5">132 avis · Top chauffeur</div>
      </div>
    </div>
  );
}
