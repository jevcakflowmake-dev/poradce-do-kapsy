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
 * odešle (šablona k importu: n8n/upozorneni-klienta.json). Když webhook
 * neodpoví, akce se neruší – smlouva nebo plán jsou uložené, jen se to
 * klient dozví až v aplikaci. Selhání jde do logu.
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

/** Stejná podoba jako e-maily ze Supabase (supabase/templates). */
function html(z: Zprava, pozdrav: string, odkaz: string): string {
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
${odstavec(pozdrav)}
${z.odstavce.map(odstavec).join('\n')}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td style="border-radius:999px;background-color:#1FB58F;"><a href="${escapuj(odkaz)}" style="display:inline-block;padding:14px 28px;font-family:${PISMO};font-size:16px;font-weight:600;color:#0F2A44;text-decoration:none;border-radius:999px;">${escapuj(z.tlacitko)}</a></td>
</tr></table>
<p style="margin:0;font-family:${PISMO};font-size:14px;line-height:1.6;color:#64707D;">${escapuj(PORADCE.jmeno)}</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;"><tr>
<td style="padding:16px 4px 0;font-family:${PISMO};font-size:12px;line-height:1.5;color:#64707D;">Tento e-mail vám poslala aplikace Poradce do kapsy (poradcedokapsy.cz). Na e-mail neodpovídejte, s poradcem se spojíte v aplikaci.</td>
</tr></table>
</td></tr></table>
</body>
</html>`
}

/** Pošle upozornění; vrací, jestli ho n8n převzalo. Nikdy nevyhazuje chybu. */
export async function upozornitKlienta(
  udalost: UdalostKlienta,
  klientId: string,
  data: { smlouvaId?: string; nazev?: string } = {},
): Promise<boolean> {
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

    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        udalost,
        client_id: klientId,
        email,
        jmeno,
        predmet: z.predmet,
        text,
        html: html(z, pozdrav, odkaz),
        odkaz,
        created_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.warn(`[upozorneni] ${udalost}: n8n odpovědělo HTTP ${res.status}`)
    return res.ok
  } catch (err) {
    console.warn(`[upozorneni] ${udalost}: nedoručeno –`, err instanceof Error ? err.message : err)
    return false
  }
}
