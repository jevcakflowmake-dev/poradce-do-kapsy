import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Sparkles, FileText, Send, CalendarClock, Inbox, UserPlus, HelpCircle, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { plural, CLIENT_STATUS_VALUES } from '@/lib/utils'
import { ctiSmlouvu, dalsiVyroci, TYP_SMLOUVY_PODLE_SEKCE } from '@/lib/smlouvy'
import { sestavKonverzace } from '@/lib/konverzace'
import { stavDoporuceni } from '@/lib/doporuceni'
import { nactiKlienty, neprecteneOdKlientu } from '@/lib/panel-poradce'
import NoveZpravy from '@/components/advisor/NoveZpravy'
import KVyrizeni, { type Ukol } from '@/components/advisor/KVyrizeni'
import PipelineSouhrn from '@/components/advisor/PipelineSouhrn'

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>
}

/** Teď v ms – mimo komponentu, React Compiler nechce Date.now() v renderu. */
function ted() {
  return Date.now()
}

const DEN = 24 * 60 * 60 * 1000
/** Jak dlouho zůstává reakce na plán v „K vyřízení“. */
const REAKCE_DNI = 14
/** Za kolik dní dopředu hlídat výročí smluv. */
const VYROCI_DNI = 30
/** Kolik konverzací ukázat v Přehledu – zbytek je ve Zprávách. */
const ZPRAV_V_PREHLEDU = 4

/**
 * Přehled panelu poradce: co čeká na vyřízení, poslední zprávy a kolik
 * klientů je v kterém stavu. Seznam klientů je v sekci Klienti, chat ve
 * Zprávách – dřív bylo všechno na jedné stránce a nedalo se v tom vyznat.
 */
export default async function PrehledPage({ searchParams }: PageProps) {
  // Starší odkazy na seznam (/advisor?status=…, /advisor?q=…) vedou do Klientů.
  const sp = await searchParams
  if (sp.status || sp.q) {
    const qs = new URLSearchParams()
    if (sp.status) qs.set('status', sp.status)
    if (sp.q) qs.set('q', sp.q)
    redirect(`/advisor/klienti?${qs}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')
  const nyni = ted()

  const [
    { klienti, jmeno },
    { data: zpravy },
    { data: planInterests },
    { data: planVariantSel },
    { data: variantyRaw },
    { data: doporuceniPlanu },
    { data: smlouvyRaw },
    { data: podani },
    { data: bodyRaw },
  ] = await Promise.all([
    nactiKlienty(supabase, user.id),
    supabase
      .from('messages')
      .select('client_id, sender_role, content, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(3000),
    supabase.from('plan_section_interest').select('client_id, section, status, updated_at').in('status', ['interested', 'question']),
    supabase.from('plan_variant_selection').select('client_id, variant_id, selected_at'),
    supabase.from('plan_variants').select('id, client_id, company, section'),
    // Plán může stát i jen na doporučeních – i ten jde zveřejnit.
    supabase.from('plan_recommendations').select('client_id'),
    supabase.from('proposals').select('id, client_id, title, content'),
    supabase.from('public_submissions').select('id, matched_client_id, created_at').eq('status', 'pending'),
    // Věrnostní body za doporučení – k proplacení jsou, když doporučený má smlouvu.
    supabase.from('doporuceni').select('doporuceny_id, doporucitel_id, odmena_kc, vyplaceno_at'),
  ])

  const neprectene = neprecteneOdKlientu(zpravy ?? [])
  const konverzace = sestavKonverzace(zpravy ?? [], neprectene, jmeno, nyni)
  const neprecteneCelkem = konverzace.reduce((s, k) => s + k.neprectene, 0)

  // ── K vyřízení ─────────────────────────────────────────────
  const ukoly: Ukol[] = []
  const jeKlient = (id: string | null | undefined): id is string => Boolean(id && jmeno.has(id))

  for (const [id, pocet] of Object.entries(neprectene)) {
    if (!jeKlient(id)) continue
    ukoly.push({
      klientId: id,
      text: `${pocet} ${plural(pocet, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`,
      odkaz: `/advisor/zpravy?klient=${id}`,
      akce: 'Odpovědět',
      ikona: MessageCircle,
    })
  }

  const cerstve = (iso: string | null) => Boolean(iso) && nyni - new Date(iso as string).getTime() < REAKCE_DNI * DEN
  const dotazy = new Map<string, number>()
  const zajem = new Map<string, number>()
  for (const r of planInterests ?? []) {
    if (!jeKlient(r.client_id) || !cerstve(r.updated_at)) continue
    const mapa = r.status === 'question' ? dotazy : zajem
    mapa.set(r.client_id, (mapa.get(r.client_id) ?? 0) + 1)
  }
  for (const [id, pocet] of dotazy) {
    ukoly.push({
      klientId: id,
      text: `Dotaz k plánu (${pocet} ${plural(pocet, 'oblast', 'oblasti', 'oblastí')})`,
      odkaz: `/advisor/${id}#reakce`,
      akce: 'Podívat se',
      ikona: HelpCircle,
    })
  }
  for (const [id, pocet] of zajem) {
    ukoly.push({
      klientId: id,
      text: `Zájem o plán (${pocet} ${plural(pocet, 'oblast', 'oblasti', 'oblastí')})`,
      odkaz: `/advisor/${id}#reakce`,
      akce: 'Ozvat se',
      ikona: Sparkles,
    })
  }

  const sPlanem = new Set<string>((doporuceniPlanu ?? []).map((d) => d.client_id))
  const varianty = new Map<string, { company: string; section: string }>()
  for (const v of variantyRaw ?? []) {
    sPlanem.add(v.client_id)
    varianty.set(v.id, { company: v.company, section: v.section })
  }
  for (const c of klienti) {
    const maPlan = sPlanem.has(c.id)
    if (c.onboarding_completed && !maPlan && c.status !== 'archiv') {
      ukoly.push({ klientId: c.id, text: 'Analýza je vyplněná, plán zatím není', odkaz: `/advisor/${c.id}/plan`, akce: 'Připravit plán', ikona: FileText })
    } else if (maPlan && !c.plan_zverejnen_at && c.status !== 'archiv') {
      ukoly.push({ klientId: c.id, text: 'Plán je rozdělaný, klient ho nevidí', odkaz: `/advisor/${c.id}/plan`, akce: 'Zveřejnit', ikona: Send })
    }
  }

  const prevedene = new Set<string>()
  for (const s of smlouvyRaw ?? []) {
    const z = ctiSmlouvu(s.content)?.zVarianty
    if (z) prevedene.add(z)
  }
  for (const v of planVariantSel ?? []) {
    const varianta = varianty.get(v.variant_id)
    // Bydlení se na smlouvu nepřevádí – úkol by nešel nikdy splnit.
    if (!jeKlient(v.client_id) || prevedene.has(v.variant_id) || !varianta || !TYP_SMLOUVY_PODLE_SEKCE[varianta.section]) continue
    ukoly.push({
      klientId: v.client_id,
      text: `Vybraná varianta ${varianta.company}, smlouva zatím není`,
      odkaz: `/advisor/${v.client_id}/smlouva?varianta=${v.variant_id}`,
      akce: 'Převést na smlouvu',
      ikona: FileText,
    })
  }

  for (const p of podani ?? []) {
    if (!jeKlient(p.matched_client_id)) continue
    ukoly.push({
      klientId: p.matched_client_id,
      text: 'Nová analýza z formuláře čeká na vaše rozhodnutí',
      odkaz: `/advisor/${p.matched_client_id}`,
      akce: 'Rozhodnout',
      ikona: Inbox,
    })
  }

  const sSmlouvou = new Set((smlouvyRaw ?? []).map((s) => s.client_id))
  const kProplaceni = new Map<string, { pocet: number; kc: number }>()
  for (const d of bodyRaw ?? []) {
    if (!jeKlient(d.doporucitel_id) || stavDoporuceni(d, sSmlouvou.has(d.doporuceny_id)) !== 'k_proplaceni') continue
    const soucet = kProplaceni.get(d.doporucitel_id) ?? { pocet: 0, kc: 0 }
    kProplaceni.set(d.doporucitel_id, { pocet: soucet.pocet + 1, kc: soucet.kc + d.odmena_kc })
  }
  for (const [id, { pocet, kc }] of kProplaceni) {
    ukoly.push({
      klientId: id,
      text: `Za doporučení ${pocet} ${plural(pocet, 'poukázka', 'poukázky', 'poukázek')} k proplacení (${kc.toLocaleString('cs-CZ')} Kč)`,
      odkaz: `/advisor/${id}#doporuceni`,
      akce: 'Poslat poukázku',
      ikona: Gift,
    })
  }

  const dnes = new Date(nyni)
  for (const s of smlouvyRaw ?? []) {
    const obsah = ctiSmlouvu(s.content)
    if (!jeKlient(s.client_id) || !obsah?.pocatek || obsah.ukonceno) continue
    const vyroci = dalsiVyroci(obsah.pocatek, dnes)
    if (!vyroci) continue
    const zaDni = Math.round((vyroci.getTime() - Date.UTC(dnes.getUTCFullYear(), dnes.getUTCMonth(), dnes.getUTCDate())) / DEN)
    if (zaDni > VYROCI_DNI) continue
    ukoly.push({
      klientId: s.client_id,
      text: `Výročí smlouvy ${s.title} ${zaDni === 0 ? 'dnes' : `za ${zaDni} ${plural(zaDni, 'den', 'dny', 'dní')}`} (${vyroci.toLocaleDateString('cs-CZ', { timeZone: 'UTC' })})`,
      odkaz: `/advisor/${s.client_id}/smlouva/${s.id}`,
      akce: 'Otevřít smlouvu',
      ikona: CalendarClock,
    })
  }

  // ── Pipeline ───────────────────────────────────────────────
  const vStavu: Record<string, number> = Object.fromEntries(CLIENT_STATUS_VALUES.map((s) => [s, 0]))
  for (const c of klienti) vStavu[c.status] = (vStavu[c.status] || 0) + 1
  const aktivnich = klienti.length - (vStavu.archiv ?? 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-h2 text-navy">Přehled</h1>
          <p className="mt-1 text-base text-slate">
            {aktivnich} {plural(aktivnich, 'aktivní klient', 'aktivní klienti', 'aktivních klientů')}
            {ukoly.length > 0 && ` · ${ukoly.length} ${plural(ukoly.length, 'věc', 'věci', 'věcí')} k vyřízení`}
          </p>
        </div>
        <Link
          href="/advisor/novy"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <UserPlus className="w-4 h-4" aria-hidden /> Přidat klienta
        </Link>
      </div>

      {/* K vyřízení je hlavní – vedle něj zprávy a pipeline, na mobilu pod ním.
          items-start: karty se nenatahují na výšku té delší. Sloupec i na
          mobilu výslovně minmax(0,1fr): jinak ho zkrácený náhled zprávy
          (truncate = nezalomitelný text) roztáhne přes okraj obrazovky. */}
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 items-start lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <KVyrizeni ukoly={ukoly} jmeno={jmeno} />

        <div className="min-w-0 space-y-6">
          <NoveZpravy konverzace={konverzace.slice(0, ZPRAV_V_PREHLEDU)} neprecteneCelkem={neprecteneCelkem} />

          <PipelineSouhrn vStavu={vStavu} />
        </div>
      </div>
    </div>
  )
}
