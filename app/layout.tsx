import type { Metadata } from 'next'
import { IBM_Plex_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import LenisProvider from '@/components/providers/LenisProvider'

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
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
    <html lang="cs" className={`h-full antialiased ${ibmPlex.variable} ${fraunces.variable}`}>
      <body className="min-h-full">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  )
}
