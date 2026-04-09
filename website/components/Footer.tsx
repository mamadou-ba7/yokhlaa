export function Footer() {
  return (
    <footer className="relative border-t border-line bg-surface/30 pt-20 pb-10">
      <div className="container-site">
        <div className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="h-9 w-9 rounded-lg bg-accent text-black inline-flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z" />
                </svg>
              </span>
              <span className="text-[18px] font-bold tracking-tight">
                Yokh<span className="text-accent">Laa</span>
              </span>
            </div>
            <p className="text-[14px] text-dim leading-relaxed max-w-sm mb-6">
              Le premier service de transport sans commission à Dakar.
              0% prélevé sur tes courses. Abonnement fixe 18 500 FCFA/mois.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://wa.me/221xxxxxxxx" label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://instagram.com/yokhlaa" label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </SocialLink>
              <SocialLink href="https://facebook.com/yokhlaa" label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M22 12a10 10 0 10-11.6 9.88V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.44h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.9h-2.33v6.98A10 10 0 0022 12z" />
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* Links */}
          <FooterCol
            title="Produit"
            links={[
              ['#avantages', 'Avantages'],
              ['#calculateur', 'Calculateur'],
              ['#comparaison', 'Comparaison'],
              ['#faq', 'FAQ'],
            ]}
          />
          <FooterCol
            title="Entreprise"
            links={[
              ['#', 'À propos'],
              ['#', 'Équipe'],
              ['mailto:contact@yokhlaa.com', 'Contact'],
              ['mailto:press@yokhlaa.com', 'Presse'],
            ]}
          />
          <FooterCol
            title="Légal"
            links={[
              ['#', 'Mentions légales'],
              ['#', "Conditions d'utilisation"],
              ['#', 'Politique de confidentialité'],
              ['#', 'Cookies'],
            ]}
          />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px] text-dim">
          <div>
            © {new Date().getFullYear()} Yokh Laa. Fait à Dakar, Sénégal 🇸🇳 — tous droits réservés.
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span>Status : en construction · Lancement 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[12px] uppercase tracking-[0.15em] text-dim font-semibold mb-5">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map(([href, label]) => (
          <li key={label}>
            <a href={href} className="text-[14px] text-ink/70 hover:text-accent transition-colors">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="h-9 w-9 rounded-lg border border-line bg-bg inline-flex items-center justify-center text-ink/60 hover:text-accent hover:border-accent/30 transition-all"
    >
      {children}
    </a>
  );
}
