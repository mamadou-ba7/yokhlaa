# Yokh Laa — Landing page

Site marketing pour recruter les 50 premiers chauffeurs Yokh Laa à Dakar.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** strict
- **Tailwind CSS** v3.4
- **Supabase** (table `waitlist` pour les inscriptions)
- **Vercel** (hébergement)

## Développement

```bash
cd website
npm install
npm run dev
# → http://localhost:3000
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fpjyfctwjiivusbzxmrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ta-cle-anon>
```

Les mêmes variables doivent être configurées dans le dashboard Vercel (Settings → Environment Variables).

## Déploiement Vercel

### Option 1 — Via le dashboard Vercel (recommandé)

1. Va sur https://vercel.com/new
2. Importe le repo `mamadou-ba7/yokhlaa`
3. **Root directory** : `website`
4. **Framework preset** : Next.js (auto-détecté)
5. Ajoute les variables d'environnement (voir ci-dessus)
6. Deploy

### Option 2 — CLI Vercel

```bash
cd website
npx vercel login
npx vercel --prod
```

## Structure

```
website/
├── app/
│   ├── layout.tsx       # Root layout avec Inter + metadata SEO
│   ├── page.tsx         # Homepage (composition de toutes les sections)
│   └── globals.css      # Tailwind + custom CSS
├── components/
│   ├── Nav.tsx          # Nav fixe avec scroll detection
│   ├── Hero.tsx         # Hero asymétrique + phone mockup SVG
│   ├── ScarcityBar.tsx  # Compteur 50 places
│   ├── ValueProps.tsx   # 3 cards valeurs
│   ├── Calculator.tsx   # Calculateur interactif
│   ├── Comparison.tsx   # Tableau comparaison concurrence
│   ├── HowItWorks.tsx   # 3 étapes
│   ├── Testimonials.tsx # Témoignages (À venir)
│   ├── FAQ.tsx          # Accordéon 6 Q/R
│   ├── SignupForm.tsx   # Formulaire d'inscription
│   ├── Footer.tsx       # Footer complet
│   └── ui/
│       ├── Button.tsx
│       └── Card.tsx
└── lib/
    ├── supabase.ts      # Client Supabase + helpers waitlist
    └── useInView.ts     # Hook IntersectionObserver
```

## Fonctionnalités

- Scroll-reveal animations (IntersectionObserver natif, zero dépendance)
- Calculator interactif (sliders) avec calcul live des gains vs concurrence
- Formulaire d'inscription qui insère dans `waitlist` Supabase
- Compteur `27/50 places` avec fetch live depuis Supabase (SSR, revalidate 60s)
- Dark mode only (matching l'app mobile)
- Responsive mobile-first
- Accessible (ARIA, keyboard nav, prefers-reduced-motion)
- SEO optimisé (metadata, OpenGraph, Twitter cards)
