import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/site'
import { kotvaSmlouvy } from '@/lib/smlouvy'
import { osloveni } from '@/lib/utils'
import { PORADCE } from '@/lib/poradce'

/**
 * E-mail klientovi, když se v aplikaci stane něco, kvůli čemu by se měl
 * přihlásit: poradce zveřejnil nebo upravil plán, přidal smlouvu, napsal
 * do chatu. Bez upozornění by se klient vrátil, jen když si sám vzpomene.
 *
 * Posílá n8n (webhook `upozorneni-klienta`), stejně jako ostatní notifikace
 * aplikace. Předmět, text i HTML skládá aplikace, workflow v n8n je jen
 * odešle (šablona k importu a návod: n8n/). Když webhook neodpoví, akce se
 * neruší – smlouva nebo plán jsou uložené, jen se to klient dozví až
 * v aplikaci. Selhání jde do logu.
 *
 * Webhook posílá e-mail na adresu z požadavku, takže bez ověření by přes
 * něj kdokoli, kdo zná adresu, rozesílal poštu naším jménem. Aplikace proto
 * přikládá tajný token (N8N_UPOZORNENI_TOKEN) v hlavičce X-Poradce-Token
 * a n8n ho ověřuje; bez tokenu se upozornění neposílá vůbec.
 *
 * Stejnou cestou chodí i e-mail opačným směrem: poradci, když mu klient
 * napíše do chatu (`upozornitPoradce`). Workflow je pro oba směry jedno –
 * pošle hotový e-mail na adresu z požadavku.
 */
const WEBHOOK = 'https://n8n.jevcakn8n.com/webhook/upozorneni-klienta'

export type UdalostKlienta = 'plan_zverejnen' | 'plan_upraven' | 'nova_smlouva' | 'nova_zprava'

interface Zprava {
  predmet: string
  nadpis: string
  odstavce: string[]
  tlacitko: string
  cesta: string
}

function slozZpravu(udalost: UdalostKlienta, data: { smlouvaId?: string; nazev?: string }): Zprava {
  switch (udalost) {
    case 'plan_zverejnen':
      return {
        predmet: 'Váš finanční plán je připravený',
        nadpis: 'Finanční plán je hotový',
        odstavce: [
          'Připravil jsem vám finanční plán podle analýzy. U každé oblasti najdete doporučení a můžete mi rovnou dát vědět, jestli chcete pokračovat, nebo máte otázku.',
        ],
        tlacitko: 'Otevřít plán',
        cesta: '/dashboard/financni-plan',
      }
    case 'plan_upraven':
      return {
        predmet: 'Upravil jsem váš finanční plán',
        nadpis: 'V plánu jsou změny',
        odstavce: ['Finanční plán jsem upravil. Podívejte se prosím, co se změnilo, a dejte mi vědět, jak se rozhodnete.'],
        tlacitko: 'Otevřít plán',
        cesta: '/dashboard/financni-plan',
      }
    case 'nova_smlouva':
      return {
        predmet: data.nazev ? `Nová smlouva v aplikaci: ${data.nazev}` : 'Nová smlouva v aplikaci',
        nadpis: 'Máte novou smlouvu',
        odstavce: [
          `${data.nazev ? `Smlouvu „${data.nazev}“` : 'Smlouvu'} najdete v sekci Moje smlouvy i s platebními údaji a kontakty. Projděte si ji prosím, a kdyby vám něco nesedělo, napište mi.`,
        ],
        tlacitko: 'Zobrazit smlouvu',
        cesta: data.smlouvaId ? `/dashboard/produkty#${kotvaSmlouvy(data.smlouvaId)}` : '/dashboard/produkty',
      }
    case 'nova_zprava':
      return {
        predmet: 'Máte novou zprávu od poradce',
        nadpis: 'Napsal jsem vám',
        odstavce: ['V aplikaci na vás čeká nová zpráva. Odpovědět můžete přímo v chatu.'],
        tlacitko: 'Otevřít chat',
        cesta: '/dashboard/chat',
      }
  }
}

const PISMO = "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const escapuj = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Co se kolem zprávy liší podle příjemce. */
interface Obal {
  /** První řádek („Dobrý den, Petro,“). Poradce se nezdraví, píše mu jeho vlastní aplikace. */
  pozdrav: string | null
  /** Jméno pod tlačítkem. */
  podpis: string | null
  paticka: string
}

const PATICKA_KLIENTA =
  'Tento e-mail vám poslala aplikace Poradce do kapsy (poradcedokapsy.cz). Na e-mail neodpovídejte, s poradcem se spojíte v aplikaci.'
const PATICKA_PORADCE =
  'Tento e-mail vám poslala aplikace Poradce do kapsy (poradcedokapsy.cz), protože vám klient napsal do chatu. Na e-mail neodpovídejte, klientovi odpovíte v aplikaci.'

/** Stejná podoba jako e-maily ze Supabase (supabase/templates). */
function html(z: Zprava, odkaz: string, obal: Obal): string {
  const odstavec = (t: string) =>
    `<p style="margin:0 0 16px;font-family:${PISMO};font-size:16px;line-height:1.6;color:#0F2A44;">${escapuj(t)}</p>`
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapuj(z.predmet)}</title></head>
<body style="margin:0;padding:0;background-color:#F6F5F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F5F1;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid #E2E0D9;border-radius:12px;"><tr>
<td style="padding:32px 28px;font-family:${PISMO};color:#0F2A44;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="20" height="20" style="width:20px;height:20px;background-color:#1FB58F;border-radius:6px;font-size:0;line-height:0;">&nbsp;</td>
<td style="padding-left:10px;font-family:${PISMO};font-size:15px;font-weight:600;color:#0F2A44;">Poradce do kapsy</td>
</tr></table>
<h1 style="margin:28px 0 12px;font-family:${PISMO};font-size:22px;line-height:1.3;font-weight:700;color:#0F2A44;">${escapuj(z.nadpis)}</h1>
${[obal.pozdrav, ...z.odstavce].filter((t): t is string => Boolean(t)).map(odstavec).join('\n')}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td style="border-radius:999px;background-color:#1FB58F;"><a href="${escapuj(odkaz)}" style="display:inline-block;padding:14px 28px;font-family:${PISMO};font-size:16px;font-weight:600;color:#0F2A44;text-decoration:none;border-radius:999px;">${escapuj(z.tlacitko)}</a></td>
</tr></table>
${obal.podpis ? `<p style="margin:0;font-family:${PISMO};font-size:14px;line-height:1.6;color:#64707D;">${escapuj(obal.podpis)}</p>\n` : ''}</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr>
<td style="padding:16px 4px 0;font-family:${PISMO};font-size:12px;line-height:1.5;color:#64707D;">${escapuj(obal.paticka)}</td>
</tr></table>
</td></tr></table>
</body>
</html>`
}

/** Předá hotový e-mail n8n; vrací, jestli ho převzalo. */
async function predejN8n(udalost: string, token: string, telo: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Poradce-Token': token },
    body: JSON.stringify({ udalost, ...telo, created_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) console.warn(`[upozorneni] ${udalost}: n8n odpovědělo HTTP ${res.status}`)
  return res.ok
}

/** Pošle upozornění; vrací, jestli ho n8n převzalo. Nikdy nevyhazuje chybu. */
export async function upozornitKlienta(
  udalost: UdalostKlienta,
  klientId: string,
  data: { smlouvaId?: string; nazev?: string } = {},
): Promise<boolean> {
  const token = process.env.N8N_UPOZORNENI_TOKEN
  if (!token) {
    console.warn(`[upozorneni] ${udalost}: chybí N8N_UPOZORNENI_TOKEN, e-mail se neposílá`)
    return false
  }
  try {
    const admin = createAdminClient()
    const [{ data: uzivatel }, { data: profil }] = await Promise.all([
      admin.auth.admin.getUserById(klientId),
      admin.from('profiles').select('full_name').eq('id', klientId).maybeSingle(),
    ])
    const email = uzivatel?.user?.email
    if (!email) return false

    const z = slozZpravu(udalost, data)
    const jmeno = profil?.full_name?.trim() || null
    const pozdrav = jmeno ? `Dobrý den, ${osloveni(jmeno)},` : 'Dobrý den,'
    const odkaz = absoluteUrl(z.cesta)
    const text = [pozdrav, '', ...z.odstavce, '', `${z.tlacitko}: ${odkaz}`, '', PORADCE.jmeno].join('\n')

    return await predejN8n(udalost, token, {
      client_id: klientId,
      email,
      jmeno,
      predmet: z.predmet,
      text,
      html: html(z, odkaz, { pozdrav, podpis: PORADCE.jmeno, paticka: PATICKA_KLIENTA }),
      odkaz,
    })
  } catch (err) {
    console.warn(`[upozorneni] ${udalost}: nedoručeno –`, err instanceof Error ? err.message : err)
    return false
  }
}

const ZPRAVA_OD_KLIENTA = 'zprava_od_klienta'

/**
 * E-mail poradci, že mu klient napsal do chatu. Jde na přihlašovací adresu
 * každého účtu s rolí poradce.
 *
 * Text zprávy v e-mailu schválně není: klienti do chatu píšou o zdraví
 * a penězích a e-mail prochází přes n8n a Resend. Stačí jméno a odkaz.
 *
 * Kdy se má poslat (ne u každé zprávy), rozhoduje /api/zpravy/upozorneni.
 */
export async function upozornitPoradce(klientId: string): Promise<boolean> {
  const token = process.env.N8N_UPOZORNENI_TOKEN
  if (!token) {
    console.warn(`[upozorneni] ${ZPRAVA_OD_KLIENTA}: chybí N8N_UPOZORNENI_TOKEN, e-mail se neposílá`)
    return false
  }
  try {
    const admin = createAdminClient()
    const [{ data: ucty }, { data: profil }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from('profiles').select('full_name').eq('id', klientId).maybeSingle(),
    ])
    // Role je v app_metadata – do user_metadata si ji zapíše kdokoli sám.
    const adresy = (ucty?.users ?? [])
      .filter((u) => u.app_metadata?.role === 'advisor')
      .map((u) => u.email)
      .filter((e): e is string => Boolean(e))
    if (adresy.length === 0) {
      console.warn(`[upozorneni] ${ZPRAVA_OD_KLIENTA}: žádný účet poradce s e-mailem`)
      return false
    }

    const klient = profil?.full_name?.trim() || null
    const z: Zprava = {
      predmet: klient ? `Nová zpráva v chatu: ${klient}` : 'Nová zpráva v chatu',
      nadpis: klient ? `${klient} vám píše` : 'Klient vám píše',
      odstavce: ['V chatu na vás čeká nová zpráva. Její text v e-mailu není, přečtete si ho po přihlášení.'],
      tlacitko: 'Otevřít chat',
      cesta: `/advisor/${klientId}/chat`,
    }
    const odkaz = absoluteUrl(z.cesta)
    const telo = {
      client_id: klientId,
      jmeno: klient,
      predmet: z.predmet,
      text: [z.nadpis, '', ...z.odstavce, '', `${z.tlacitko}: ${odkaz}`].join('\n'),
      html: html(z, odkaz, { pozdrav: null, podpis: null, paticka: PATICKA_PORADCE }),
      odkaz,
    }
    const prevzato = await Promise.all(adresy.map((email) => predejN8n(ZPRAVA_OD_KLIENTA, token, { ...telo, email })))
    return prevzato.every(Boolean)
  } catch (err) {
    console.warn(`[upozorneni] ${ZPRAVA_OD_KLIENTA}: nedoručeno –`, err instanceof Error ? err.message : err)
    return false
  }
}
