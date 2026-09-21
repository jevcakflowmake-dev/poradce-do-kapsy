import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MotionProvider from '@/components/providers/MotionProvider'
import CookieBar from '@/components/cookies/CookieBar'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site'

// Jedna rodina na celý web: nadpisy nese váha, ne jiný řez.
// latin-ext kvůli české diakritice, variable řez kvůli jedinému stažení.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  // metadataBase dělá z relativních cest (OG obrázek, canonical) absolutní URL –
  // bez něj Next při buildu varuje a odkazy v náhledech vedou na localhost.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'finanční poradce',
    'finanční plán',
    'životní pojištění',
    'penzijní spoření',
    'investice',
    'hypotéka',
    'online poradenství',
  ],
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} – ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full">
        {/* TODO (až řekne Jakub): sem přijde základní kód Meta Pixelu a GA4.
            Konverzní událost má své místo na /dekujeme – ta stránka je cíl
            kampaní. Do té doby web nenačítá žádný měřicí skript. */}
        <MotionProvider>{children}</MotionProvider>
        <CookieBar />
      </body>
    </html>
  )
}
