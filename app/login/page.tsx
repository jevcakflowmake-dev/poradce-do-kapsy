export const dynamic = 'force-dynamic'

import LoginForm, { type Upozorneni } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ potvrzeno?: string; chyba?: string; error?: string }>
}) {
  const { potvrzeno, chyba, error } = await searchParams
  // potvrzeno – návrat ze staré šablony po potvrzení e-mailu; chyba/error – neplatný odkaz
  const upozorneni: Upozorneni =
    chyba === 'odkaz' || error === 'auth_callback_failed' ? 'odkaz' : potvrzeno === '1' ? 'potvrzeno' : null
  return <LoginForm upozorneni={upozorneni} />
}
