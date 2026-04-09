'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-bg/80 backdrop-blur-xl border-b border-line'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="container-site flex items-center justify-between h-[68px]">
          <a href="#top" className="group flex items-center gap-2.5" aria-label="Yokh Laa accueil">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-black shadow-[0_4px_20px_-4px_rgba(34,197,94,0.6)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Yokh<span className="text-accent">Laa</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-10 text-[14px] text-ink/70">
            <a href="#avantages" className="hover:text-ink transition-colors">Avantages</a>
            <a href="#calculateur" className="hover:text-ink transition-colors">Calculateur</a>
            <a href="#comparaison" className="hover:text-ink transition-colors">Comparaison</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button as="a" href="#inscription" variant="primary" size="md">
              Rejoindre les 50 premiers
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
            <button
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg border border-line text-ink"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 top-[68px] z-40 bg-bg/95 backdrop-blur-xl lg:hidden">
          <nav className="container-site pt-10 flex flex-col gap-2 text-lg">
            {[
              ['#avantages', 'Avantages'],
              ['#calculateur', 'Calculateur'],
              ['#comparaison', 'Comparaison'],
              ['#faq', 'FAQ'],
              ['#inscription', 'S\'inscrire'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-4 border-b border-line font-semibold"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
