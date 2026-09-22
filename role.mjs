import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((r) => r.includes('='))
    .map((r) => [r.slice(0, r.indexOf('=')), r.slice(r.indexOf('=') + 1).trim()]),
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const TEST = '3efc35e8-6796-466d-b12a-1ca2d782452d'
const role = process.argv[2] === 'advisor' ? 'advisor' : 'client'

const { data: u } = await admin.auth.admin.getUserById(TEST)
const { data, error } = await admin.auth.admin.updateUserById(TEST, {
  app_metadata: { ...u.user.app_metadata, role },
})
console.log(error ? 'CHYBA ' + error.message : 'app_metadata.role = ' + data.user.app_metadata.role)
