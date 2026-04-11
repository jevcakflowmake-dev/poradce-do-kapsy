import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { full_name, email } = await request.json()

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Vyplňte jméno a email' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check if user with this email already exists
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingUser = users?.find(u => u.email === email)

  if (existingUser) {
    return NextResponse.json({ id: existingUser.id })
  }

  // Create user with auto-confirm (no email verification)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name, role: 'client' },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update profile with full_name (trigger creates profile but with empty name)
  if (data.user) {
    await supabase.from('profiles').update({ full_name }).eq('id', data.user.id)
  }

  return NextResponse.json({ id: data.user.id })
}
