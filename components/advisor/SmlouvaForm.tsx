'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import SeznamPartneru from '@/components/partneri/SeznamPartneru'
import { Pole, poleTridy } from '@/components/advisor/PoleFormulare'
import { partnerPodleNazvu } from '@/lib/partneri'
import {
  FREKVENCE_PLATEB,
  POLOZKY_KRYTI,
  castkaZTextu,
  naIban,
  type PolozkaKryti,
  type TypSmlouvy,
} from '@/lib/smlouvy'
import { sanitizeFileName, sTypem } from '@/lib/storage'

/**
 * Ručně zadaná smlouva a úprava existující smlouvy. Stejný tvar jako smlouva
 * převedená z varianty – klient ji uvidí i s QR platbou a kontakty.
 *
 * U smlouvy převedené z varianty se produkt a krytí berou z varianty, takže
 * je formulář při úpravě nenabízí; mění se jen to, co vzniklo podpisem.
 */

const TYPY: Array<{ id: TypSmlouvy; popisek: string }> = [
  { id: 'insurance', popisek: 'Pojištění' },
  { id: 'pension', popisek: 'Penzijní produkt' },
  { id: 'invest', popisek: 'Investice' },
]

/** Bucket smluv bere nejvýš 50 MB (migrace 016). */
const MAX_PDF = 50 * 1024 * 1024

/** Cesta v bucketu smluv. Složka = ID klienta, jinak by mu soubor politika storage nepustila. */
function cestaPdf(clientId: string, nazev: string) {
  return `${clientId}/${Date.now()}_${sanitizeFileName(nazev)}`
}

const schema = z.object({
  title: z.string().trim().min(2, 'Vyplňte název smlouvy.').max(120, 'Název je moc dlouhý.'),
  typ: z.enum(['insurance', 'pension', 'invest']),
  spolecnost: z.string().trim().max(120, 'Název společnosti je moc dlouhý.'),
  produkt: z.string().trim().max(120, 'Název produktu je moc dlouhý.'),
  cisloSmlouvy: z.string().trim().max(40, 'Číslo smlouvy je moc dlouhé.'),
  pocatek: z.string().trim(),
  castka: z.string().trim().refine((v) => !v || castkaZTextu(v) !== null, 'Zadejte předpis v korunách, třeba 1 340.'),
  frekvence: z.enum(FREKVENCE_PLATEB),
  ucet: z
    .string()
    .trim()
    .refine((v) => !v || naIban(v) !== null, 'Číslo účtu nevypadá platně – zkontrolujte ho, QR platba by vedla jinam.'),
  vs: z.string().trim().regex(/^\d{0,10}$/, 'Variabilní symbol má nejvýš 10 číslic.'),
  zprava: z.string().trim().max(60, 'Zpráva pro příjemce může mít nejvýš 60 znaků.'),
  doVeku: z.string().trim().max(60, 'Text je moc dlouhý.'),
  hlaseni: z.string().trim().max(200, 'Text je moc dlouhý.'),
  kontakt: z.string().trim().max(200, 'Text je moc dlouhý.'),
  popis: z.string().trim().max(1000, 'Popis může mít nejvýš 1 000 znaků.'),
  link_url: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'Odkaz musí začínat http:// nebo https://.'),
})

type Formular = z.infer<typeof schema>

/** Co formulář potřebuje o existující smlouvě; bez `id` jde o novou. */
export interface SmlouvaProFormular {
  id?: string
  title: string
  typ: TypSmlouvy
  /** Převedená z varianty – produkt a krytí se neupravují. */
  zVarianty?: boolean
  spolecnost?: string
  produkt?: string
  popis?: string
  doVeku?: string
  hlaseni?: string
  kontakt?: string
  cisloSmlouvy?: string
  pocatek?: string
  castka?: number | null
  frekvence?: (typeof FREKVENCE_PLATEB)[number]
  ucet?: string
  vs?: string
  zprava?: string
  polozkyKryti?: PolozkaKryti[]
  fileUrl?: string | null
  linkUrl?: string | null
}

type StavPolozky = { zapnuto: boolean; castka: string; moznost: string }

export default function SmlouvaForm({ clientId, smlouva }: { clientId: string; smlouva?: SmlouvaProFormular }) {
  const id = useId()
  const uprava = Boolean(smlouva?.id)
  const zVarianty = Boolean(smlouva?.zVarianty)
  const [soubor, setSoubor] = useState<File | null>(null)
  const [chybaSouboru, setChybaSouboru] = useState<string | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  const [hotovo, setHotovo] = useState(false)
  const [kryti, setKryti] = useState<Record<string, StavPolozky>>(() =>
    Object.fromEntries(
      POLOZKY_KRYTI.map((p) => {
        const ulozena = smlouva?.polozkyKryti?.find((x) => x.id === p.id)
        return [p.id, { zapnuto: Boolean(ulozena), castka: ulozena ? String(ulozena.castka) : '', moznost: ulozena?.moznost ?? '' }]
      }),
    ),
  )

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formular>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      title: smlouva?.title ?? '',
      typ: smlouva?.typ ?? 'insurance',
      spolecnost: smlouva?.spolecnost ?? '',
      produkt: smlouva?.produkt ?? '',
      cisloSmlouvy: smlouva?.cisloSmlouvy ?? '',
      pocatek: smlouva?.pocatek ?? '',
      castka: smlouva?.castka ? String(smlouva.castka).replace('.', ',') : '',
      frekvence: smlouva?.frekvence ?? 'Měsíčně',
      ucet: smlouva?.ucet ?? '',
      vs: smlouva?.vs ?? '',
      zprava: smlouva?.zprava ?? '',
      doVeku: smlouva?.doVeku ?? '',
      hlaseni: smlouva?.hlaseni ?? '',
      kontakt: smlouva?.kontakt ?? '',
      popis: smlouva?.popis ?? '',
      link_url: smlouva?.linkUrl ?? '',
    },
  })

  const typ = useWatch({ control, name: 'typ' })
  const spolecnost = useWatch({ control, name: 'spolecnost' })
  const ucet = useWatch({ control, name: 'ucet' })
  const cisloSmlouvy = useWatch({ control, name: 'cisloSmlouvy' })
  const frekvence = useWatch({ control, name: 'frekvence' })
  const iban = ucet ? naIban(ucet) : null
  // Hláška jen u převodu z českého zápisu – u IBANu by jen opakovala, co tam je.
  const prevedeno = iban && ucet.replace(/\s/g, '').toUpperCase() !== iban.replace(/\s/g, '')
  const vychoziVs = cisloSmlouvy.replace(/\D/g, '').slice(0, 10)
  const partner = partnerPodleNazvu(spolecnost)
  const idPartneru = `${id}-partneri`

  function upravPolozku(polozkaId: string, zmena: Partial<StavPolozky>) {
    setKryti((k) => ({ ...k, [polozkaId]: { ...k[polozkaId], ...zmena } }))
  }

  function vyberSoubor(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setChybaSouboru(null)
    if (f && !(f.type === 'application/pdf' || (!f.type && f.name.toLowerCase().endsWith('.pdf')))) {
      setChybaSouboru('Smlouva musí být v PDF.')
      setSoubor(null)
      return
    }
    if (f && f.size > MAX_PDF) {
      setChybaSouboru('PDF je větší než 50 MB.')
      setSoubor(null)
      return
    }
    setSoubor(f)
  }

  async function odeslat(data: Formular) {
    setChyba(null)
    if (!zVarianty && !data.spolecnost && !data.produkt) {
      setError('spolecnost', { message: 'Vyplňte společnost nebo aspoň produkt.' })
      return
    }

    // Krytí jen u pojištění; zaškrtnutá položka bez částky by se tiše ztratila.
    const polozkyKryti: PolozkaKryti[] = []
    if (!zVarianty && data.typ === 'insurance') {
      const bezCastky: string[] = []
      for (const p of POLOZKY_KRYTI) {
        const stav = kryti[p.id]
        if (!stav.zapnuto) continue
        const castka = castkaZTextu(stav.castka)
        if (castka === null) bezCastky.push(p.popisek)
        else polozkyKryti.push({ id: p.id, castka, ...(stav.moznost ? { moznost: stav.moznost } : {}) })
      }
      if (bezCastky.length > 0) {
        setChyba(`Doplňte částku u položky ${bezCastky.join(', ')}, nebo ji odškrtněte.`)
        return
      }
    }

    let fileUrl = ''
    if (soubor) {
      const cesta = cestaPdf(clientId, soubor.name)
      const { error } = await createClient().storage.from('proposals').upload(cesta, sTypem(soubor))
      if (error) {
        setChyba(`PDF se nepodařilo nahrát: ${error.message}`)
        return
      }
      fileUrl = cesta
    }

    const res = await fetch('/api/advisor/smlouvy', {
      method: uprava ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(uprava ? { id: smlouva?.id } : { client_id: clientId }),
        ...data,
        castka: data.castka ? castkaZTextu(data.castka) : null,
        polozkyKryti,
        file_url: fileUrl,
      }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      setChyba(payload.error ?? 'Smlouvu se nepodařilo uložit.')
      return
    }
    setHotovo(true)
  }

  if (hotovo) {
    return (
      <div role="status" className="rounded-card border border-mint/30 bg-mint/10 p-6">
        <p className="flex items-center gap-2 font-display text-lead text-navy">
          <CheckCircle2 className="w-5 h-5 text-mint-dark" aria-hidden />
          {uprava ? 'Změny jsou uložené' : 'Smlouva je v sekci Moje smlouvy'}
        </p>
        <p className="mt-2 text-base text-slate text-pretty">
          {uprava
            ? 'Klient smlouvu uvidí upravenou hned při dalším otevření.'
            : 'Klient ji uvidí na přehledu se štítkem „Ke kontrole“ a dostane o ní e-mail. Až si ji otevře, u smlouvy uvidíte „Přečteno“.'}
        </p>
        <Link href={`/advisor/${clientId}`} className={`${buttonVariants({ variant: 'outline' })} mt-5`}>
          Zpět na detail klienta
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(odeslat)} noValidate className="space-y-8">
      <fieldset className="space-y-5">
        <legend className="font-display text-navy text-lead mb-4">Smlouva</legend>
        <Pole id={`${id}-nazev`} popisek="Název smlouvy" napoveda="Tak ji klient uvidí v přehledu, třeba „Životní pojištění ŽIVOT+“." chyba={errors.title?.message}>
          <Input id={`${id}-nazev`} aria-describedby={`${id}-nazev-popis`} {...register('title')} aria-invalid={errors.title ? true : undefined} />
        </Pole>

        <div className="grid gap-5 sm:grid-cols-2">
          <Pole id={`${id}-typ`} popisek="V sekci Moje smlouvy mezi">
            <select id={`${id}-typ`} {...register('typ')} className={poleTridy}>
              {TYPY.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.popisek}
                </option>
              ))}
            </select>
          </Pole>
          <Pole id={`${id}-cislo`} popisek="Číslo smlouvy" napoveda="Nepovinné, ale klient ho potřebuje při hlášení události." chyba={errors.cisloSmlouvy?.message}>
            <Input id={`${id}-cislo`} aria-describedby={`${id}-cislo-popis`} {...register('cisloSmlouvy')} autoComplete="off" />
          </Pole>
        </div>

        {/* Společnost přes celou šířku – vedle ní se ukáže logo, v půlce řádku by se pole zúžilo. */}
        {!zVarianty && (
          <Pole
            id={`${id}-spolecnost`}
            popisek="Společnost"
            napoveda={partner ? `Klient uvidí logo společnosti ${partner.nazev}.` : 'Začněte psát, nabídnou se partneři.'}
            chyba={errors.spolecnost?.message}
          >
            <div className="flex items-center gap-3">
              <Input
                id={`${id}-spolecnost`}
                list={idPartneru}
                aria-describedby={`${id}-spolecnost-popis`}
                {...register('spolecnost')}
                autoComplete="off"
                aria-invalid={errors.spolecnost ? true : undefined}
              />
              {partner && <LogoFirmy firma={spolecnost} />}
            </div>
            <SeznamPartneru id={idPartneru} />
          </Pole>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {!zVarianty && (
            <Pole id={`${id}-produkt`} popisek="Produkt" napoveda="Nepovinné, třeba ŽIVOT+ nebo Horizont Invest." chyba={errors.produkt?.message}>
              <Input id={`${id}-produkt`} aria-describedby={`${id}-produkt-popis`} {...register('produkt')} autoComplete="off" />
            </Pole>
          )}
          <Pole id={`${id}-pocatek`} popisek="Počátek smlouvy" napoveda="Nepovinné. Podle něj vám přehled připomene výročí.">
            <Input id={`${id}-pocatek`} aria-describedby={`${id}-pocatek-popis`} type="date" {...register('pocatek')} />
          </Pole>
          {!zVarianty && (
            <Pole id={`${id}-dovekou`} popisek="Běží do" napoveda="Nepovinné, třeba „do 65 let“." chyba={errors.doVeku?.message}>
              <Input id={`${id}-dovekou`} aria-describedby={`${id}-dovekou-popis`} {...register('doVeku')} />
            </Pole>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-navy text-lead mb-4">Platba</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Pole
            id={`${id}-castka`}
            popisek="Předpis platby (Kč)"
            napoveda={frekvence === 'Měsíčně' ? 'Kolik se platí měsíčně. Bez částky se smlouva nezapočítá do plateb.' : `Kolik se platí ${frekvence.toLowerCase()}, ne za měsíc.`}
            chyba={errors.castka?.message}
          >
            <Input id={`${id}-castka`} aria-describedby={`${id}-castka-popis`} inputMode="decimal" {...register('castka')} aria-invalid={errors.castka ? true : undefined} />
          </Pole>
          <Pole id={`${id}-frekvence`} popisek="Jak často se platí">
            <select id={`${id}-frekvence`} {...register('frekvence')} className={poleTridy}>
              {FREKVENCE_PLATEB.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Pole>
        </div>

        <Pole
          id={`${id}-ucet`}
          popisek="Číslo účtu společnosti"
          napoveda={prevedeno ? `Převedeno na IBAN: ${iban}` : 'IBAN, nebo český zápis 123456789/0800. Bez účtu se klientovi QR platba neukáže.'}
          chyba={errors.ucet?.message}
        >
          <Input id={`${id}-ucet`} aria-describedby={`${id}-ucet-popis`} {...register('ucet')} autoComplete="off" aria-invalid={errors.ucet ? true : undefined} />
        </Pole>

        <div className="grid gap-5 sm:grid-cols-2">
          <Pole
            id={`${id}-vs`}
            popisek="Variabilní symbol"
            napoveda={vychoziVs ? `Prázdné = ${vychoziVs} z čísla smlouvy.` : 'Obvykle číslo smlouvy.'}
            chyba={errors.vs?.message}
          >
            <Input id={`${id}-vs`} aria-describedby={`${id}-vs-popis`} inputMode="numeric" {...register('vs')} placeholder={vychoziVs} autoComplete="off" />
          </Pole>
          <Pole id={`${id}-zprava`} popisek="Zpráva pro příjemce" napoveda="Nepovinné, objeví se v QR platbě." chyba={errors.zprava?.message}>
            <Input id={`${id}-zprava`} aria-describedby={`${id}-zprava-popis`} {...register('zprava')} autoComplete="off" />
          </Pole>
        </div>
      </fieldset>

      {!zVarianty && typ === 'insurance' && (
        <fieldset>
          <legend className="font-display text-navy text-lead">Krytí</legend>
          <p className="text-sm text-slate mt-1 mb-4 text-pretty">
            Zaškrtněte, co smlouva kryje, a doplňte částku. Volba u položky říká, od kdy nebo jak se plní.
          </p>
          <ul className="space-y-2">
            {POLOZKY_KRYTI.map((p) => {
              const stav = kryti[p.id]
              const idPolozky = `${id}-kryti-${p.id}`
              return (
                <li
                  key={p.id}
                  className={`rounded-card border px-4 py-3 transition-colors ${
                    stav.zapnuto ? 'border-mint bg-mint/5 inset-ring-1 inset-ring-mint' : 'border-line bg-surface'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <label htmlFor={idPolozky} className="flex items-center gap-3 flex-1 min-w-40 cursor-pointer">
                      <input
                        id={idPolozky}
                        type="checkbox"
                        checked={stav.zapnuto}
                        onChange={(e) => upravPolozku(p.id, { zapnuto: e.target.checked })}
                        className="w-4 h-4 rounded border-line accent-mint"
                      />
                      <span className="text-base font-medium text-navy">{p.popisek}</span>
                    </label>
                    {stav.zapnuto && (
                      <div className="flex flex-wrap items-center gap-2">
                        {p.moznosti && (
                          <select
                            aria-label={`${p.popisek} – volba`}
                            value={stav.moznost}
                            onChange={(e) => upravPolozku(p.id, { moznost: e.target.value })}
                            className="h-10 rounded-input border border-line bg-surface px-3 text-sm text-navy focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
                          >
                            <option value="">Vyberte…</option>
                            {p.moznosti.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          aria-label={`${p.popisek} – částka v ${p.jednotka}`}
                          inputMode="decimal"
                          value={stav.castka}
                          onChange={(e) => upravPolozku(p.id, { castka: e.target.value })}
                          placeholder="0"
                          className="w-32 h-10 rounded-input border border-line bg-surface px-3 text-sm text-right text-navy tabular-nums focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
                        />
                        <span className="w-16 text-xs font-semibold uppercase tracking-[0.1em] text-slate whitespace-nowrap">
                          {p.jednotka}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      {!zVarianty && (
        <fieldset className="space-y-5">
          <legend className="font-display text-navy text-lead mb-4">Kontakty a popis</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Pole id={`${id}-hlaseni`} popisek="Hlášení pojistné události" napoveda="Telefon nebo odkaz, nepovinné." chyba={errors.hlaseni?.message}>
              <Input id={`${id}-hlaseni`} aria-describedby={`${id}-hlaseni-popis`} {...register('hlaseni')} />
            </Pole>
            <Pole id={`${id}-kontakt`} popisek="Platby a změny" napoveda="Telefon, e-mail nebo odkaz, nepovinné." chyba={errors.kontakt?.message}>
              <Input id={`${id}-kontakt`} aria-describedby={`${id}-kontakt-popis`} {...register('kontakt')} />
            </Pole>
          </div>
          <Pole id={`${id}-popis`} popisek="Co smlouva dělá" napoveda="Dvě věty, kterým klient rozumí i za tři roky. Nepovinné." chyba={errors.popis?.message}>
            <textarea
              id={`${id}-popis`}
              aria-describedby={`${id}-popis-popis`}
              rows={3}
              {...register('popis')}
              className="w-full rounded-input border border-line bg-surface px-4 py-3 text-base text-navy transition-colors focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20 resize-y"
            />
          </Pole>
        </fieldset>
      )}

      <fieldset className="space-y-5">
        <legend className="font-display text-navy text-lead mb-4">Soubor a odkaz</legend>
        <Pole
          id={`${id}-pdf`}
          popisek="Smlouva v PDF"
          napoveda={smlouva?.fileUrl ? 'PDF už je nahrané. Nový soubor ho nahradí.' : 'Nepovinné. Klient si ji pak stáhne u smlouvy.'}
          chyba={chybaSouboru ?? undefined}
        >
          <label
            htmlFor={`${id}-pdf`}
            className="flex items-center gap-3 rounded-input border border-dashed border-line bg-cream px-4 py-3 text-base text-navy cursor-pointer hover:border-navy/40 transition-colors"
          >
            <FileText className="w-5 h-5 shrink-0" aria-hidden />
            <span className="truncate">{soubor ? soubor.name : smlouva?.fileUrl ? 'Nahradit PDF…' : 'Vybrat PDF…'}</span>
          </label>
          <input id={`${id}-pdf`} aria-describedby={`${id}-pdf-popis`} type="file" accept=".pdf,application/pdf" onChange={vyberSoubor} className="sr-only" />
        </Pole>
        <Pole id={`${id}-odkaz`} popisek="Odkaz" napoveda="Nepovinné, třeba na klientskou zónu společnosti." chyba={errors.link_url?.message}>
          <Input id={`${id}-odkaz`} aria-describedby={`${id}-odkaz-popis`} type="url" placeholder="https://…" {...register('link_url')} />
        </Pole>
      </fieldset>

      {chyba && (
        <p role="alert" className="rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
          {chyba}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} size="lg">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Ukládám…
          </>
        ) : uprava ? (
          'Uložit změny'
        ) : (
          'Uložit do sekce Moje smlouvy'
        )}
      </Button>
    </form>
  )
}
