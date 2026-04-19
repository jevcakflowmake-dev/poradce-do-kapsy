import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_DIGITS_REGEX = /\d/g

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!full_name || !email || !phone) {
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

    const supabase = createAdminClient()

    // Check existing user
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      // User exists - send magic link to login
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      return NextResponse.json({
        exists: true,
        message: 'Na váš e-mail jsme odeslali přihlašovací odkaz.'
      })
    }

    // Create new user (no password, will use magic link)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, phone, role: 'client' },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update profile
    if (data.user) {
      await supabase.from('profiles').update({ full_name, phone }).eq('id', data.user.id)
    }

    // Send magic link for first login
    await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    // Notify advisor via n8n webhook (fire and forget)
    try {
      await fetch('https://n8n.jevcakn8n.com/webhook/novy-klient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, created_at: new Date().toISOString() }),
      })
    } catch {
      // fire and forget
    }

    return NextResponse.json({
      id: data.user.id,
      message: 'Registrace proběhla úspěšně. Na váš e-mail jsme odeslali přihlašovací odkaz.'
    })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
