import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yokh Laa — Conduis. Garde 100% de tes gains.',
  description:
    "Yokh Laa est le premier service de transport sans commission à Dakar. Abonnement fixe 18 500 FCFA/mois. Rejoins les 50 premiers chauffeurs et obtiens ton 1er mois gratuit + prix garanti à vie.",
  keywords: [
    'Yokh Laa',
    'Dakar',
    'chauffeur VTC',
    'taxi Dakar',
    '0% commission',
    'Sénégal transport',
    'abonnement chauffeur',
  ],
  authors: [{ name: 'Yokh Laa' }],
  openGraph: {
    title: 'Yokh Laa — Conduis. Garde 100% de tes gains.',
    description:
      '0% de commission sur tes courses. Abonnement fixe 18 500 FCFA/mois. Les 50 premiers chauffeurs : 1er mois gratuit + prix garanti à vie.',
    locale: 'fr_SN',
    type: 'website',
    siteName: 'Yokh Laa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yokh Laa — Conduis. Garde 100% de tes gains.',
    description:
      '0% de commission. 18 500 FCFA/mois fixe. Pré-inscris-toi.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#080A0D" />
      </head>
      <body className="bg-bg text-ink font-sans antialiased selection:bg-accent/30 selection:text-ink">
        {children}
      </body>
    </html>
  );
}
