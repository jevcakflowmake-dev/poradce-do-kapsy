import type { Metadata } from 'next'

/** Stránka účtu – do vyhledávání nepatří a nemá se tvářit jako úvod webu. */
export const metadata: Metadata = {
  title: 'Zapomenuté heslo',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
