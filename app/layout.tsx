import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="cs" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
