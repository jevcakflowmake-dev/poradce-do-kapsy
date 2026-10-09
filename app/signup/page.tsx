export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import SignupForm from './SignupForm'

// Registrační formulář nemá unikátní obsah pro výsledky vyhledávání –
// bez noindexu duplikuje title/description homepage.
export const metadata: Metadata = {
  title: 'Registrace',
  robots: { index: false, follow: true },
}

export default function SignupPage() {
  return <SignupForm />
}
