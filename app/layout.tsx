import type { Metadata } from 'next'
import { IBM_Plex_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import LenisProvider from '@/components/providers/LenisProvider'

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

// Display — Instrument Serif má jen regular (400); váhu neřešíme řezem,
// ale velikostí a barvou. latin-ext kvůli české diakritice.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Poradce do kapsy',
  description: 'Pojištění, investice a důchod z pohodlí domova. Vyplňte dotazník a dostanete osobní návrh.',
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
