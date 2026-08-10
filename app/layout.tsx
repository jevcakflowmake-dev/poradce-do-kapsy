import type { Metadata } from 'next'
import { IBM_Plex_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import LenisProvider from '@/components/providers/LenisProvider'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

// Display – Instrument Serif má jen regular (400); váhu neřešíme řezem,
// ale velikostí a barvou. Kurzívní řez nestahujeme, kurzíva je zakázaná.
// latin-ext kvůli české diakritice.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  // metadataBase dělá z relativních cest (OG obrázek, canonical) absolutní URL –
  // bez něj Next při buildu varuje a odkazy v náhledech vedou na localhost.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – finanční plán pro celý život`,
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
    title: `${SITE_NAME} – finanční plán pro celý život`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} – finanční plán pro celý život`,
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
    <html lang="cs" className={`h-full antialiased ${ibmPlex.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-full">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  )
}
