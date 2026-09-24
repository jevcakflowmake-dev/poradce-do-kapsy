import { createAdminClient } from '@/lib/supabase/admin'
import { findUserByEmail } from '@/lib/submissions'
import { ipPozadavku, vytvorLimit } from '@/lib/rate-limit'
import { createPublicClient } from '@/lib/supabase/verejny'
import { absoluteUrl } from '@/lib/site'
import { hlaskaKHeslu } from '@/lib/hesla'
import { NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_REGEX = /\d/g

/** Pět registrací za deset minut z jedné adresy. Každá posílá poradci notifikaci. */
const prekroceno = vytvorLimit({ oknoMs: 10 * 60 * 1000, max: 5 })

export async function POST(request: Request) {
  try {
    if (prekroceno(ipPozadavku(request))) {
      return NextResponse.json(
        { error: 'Příliš mnoho pokusů z jedné adresy. Zkuste to prosím za chvíli.' },
        { status: 429 },
      )
    }

    const body = await request.json()
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Vyplňte všechna pole' }, { status: 400 })
    }

    if (full_name.length < 2) {
      return NextResponse.json({ error: 'Jméno musí mít alespoň 2 znaky' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Zadejte platný e-mail' }, { status: 400 })
    }

    const phoneDigits = phone.match(PHONE_DIGITS_REGEX)
    if (!phoneDigits || phoneDigits.length < 9) {
      return NextResponse.json({ error: 'Telefonní číslo musí obsahovat alespoň 9 číslic' }, { status: 400 })
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json({ error: 'Heslo musí mít 8 až 72 znaků' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Stránkovaně: listUsers() bez stránky vrací jen prvních 50 účtů, takže
    // u dalších klientů kontrola tiše propadla až na chybu z createUser.
    const existingUser = await findUserByEmail(supabase, email)

    if (existingUser) {
      // Jen příznak. Dřív se vracelo i ID účtu, takže kdokoliv zjistil
      // interní ID libovolného klienta podle e-mailu.
      return NextResponse.json({ exists: true })
    }

    // Nepotvrzený účet: přihlásit se půjde až po kliknutí na odkaz v e-mailu.
    // S email_confirm: true se kdokoliv mohl zaregistrovat na cizí e-mail se
    // svým heslem a rovnou se do účtu přihlásit.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name, phone },
      // role patří do app_metadata – do user_metadata si zapíše uživatel sám
      app_metadata: { role: 'client' },
    })

    if (error || !data.user) {
      if (error?.code === 'email_exists') return NextResponse.json({ exists: true })
      const hlaska = hlaskaKHeslu(error)
      if (hlaska) return NextResponse.json({ error: hlaska }, { status: 400 })
      // Hlášku Supabase do prohlížeče neposíláme, jen do logu.
      console.error('[register] založení účtu selhalo:', error?.message)
      return NextResponse.json(
        { error: 'Účet se nepodařilo založit. Zkuste to prosím znovu.' },
        { status: 500 },
      )
    }

    await supabase.from('profiles').update({ full_name, phone }).eq('id', data.user.id)

    // Notifikace poradci přes n8n (bez hesla). MUSÍ se awaitovat – v serverless
    // prostředí (Vercel) by fire-and-forget fetch nemusel před ukončením funkce
    // vůbec odejít. Selhání webhoóku registraci neblokuje, jen se zaloguje
    // (viditelné ve Vercel logs), aby výpadek n8n nebyl neviditelný.
    try {
      const webhookRes = await fetch('https://n8n.jevcakn8n.com/webhook/novy-klient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, created_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      })
      if (!webhookRes.ok) {
        console.error(`[register] n8n webhook novy-klient selhal: HTTP ${webhookRes.status} – poradce se o klientovi ${email} nedozví z notifikace`)
      }
    } catch (err) {
      console.error('[register] n8n webhook novy-klient nedostupný:', err instanceof Error ? err.message : err)
    }

    // Admin API potvrzovací e-mail samo nepošle, resend ano (šablona Confirm sign up).
    const { error: odeslani } = await createPublicClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: absoluteUrl('/login?potvrzeno=1') },
    })
    if (odeslani) {
      // Účet stojí, odkaz si klient nechá poslat znovu z přihlášení.
      console.error('[register] potvrzovací e-mail neodešel:', odeslani.message)
    }

    return NextResponse.json({ email, potvrdit: true })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
