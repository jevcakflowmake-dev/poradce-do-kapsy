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
import { Label } from '@/components/ui/label'
import { FREKVENCE_PLATEB, castkaZTextu, naIban, type TypSmlouvy } from '@/lib/smlouvy'
import { sanitizeFileName, sTypem } from '@/lib/storage'

/**
 * Formulář převodu varianty na smlouvu. Předvyplněný z varianty; poradce
 * doplní, co vzniklo podpisem: číslo smlouvy, platbu a případně PDF.
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
  cisloSmlouvy: z.string().trim().max(40, 'Číslo smlouvy je moc dlouhé.'),
  castka: z.string().trim().refine((v) => castkaZTextu(v) !== null, 'Zadejte předpis v korunách, třeba 1 340.'),
  frekvence: z.enum(FREKVENCE_PLATEB),
  ucet: z
    .string()
    .trim()
    .refine((v) => !v || naIban(v) !== null, 'Číslo účtu nevypadá platně – zkontrolujte ho, QR platba by vedla jinam.'),
  vs: z.string().trim().regex(/^\d{0,10}$/, 'Variabilní symbol má nejvýš 10 číslic.'),
  zprava: z.string().trim().max(60, 'Zpráva pro příjemce může mít nejvýš 60 znaků.'),
})

type Formular = z.infer<typeof schema>

export interface VychoziSmlouvy {
  title: string
  typ: TypSmlouvy
  frekvence: (typeof FREKVENCE_PLATEB)[number]
  castka: number | null
}

const poleTridy =
  'w-full h-12 rounded-input border border-line bg-surface px-4 text-base text-navy transition-colors focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20'

export default function SmlouvaZVariantyForm({
  clientId,
  variantId,
  vychozi,
}: {
  clientId: string
  variantId: string
  vychozi: VychoziSmlouvy
}) {
  const id = useId()
  const [soubor, setSoubor] = useState<File | null>(null)
  const [chybaSouboru, setChybaSouboru] = useState<string | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  const [hotovo, setHotovo] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Formular>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      title: vychozi.title,
      typ: vychozi.typ,
      cisloSmlouvy: '',
      castka: vychozi.castka ? String(vychozi.castka).replace('.', ',') : '',
      frekvence: vychozi.frekvence,
      ucet: '',
      vs: '',
      zprava: '',
    },
  })

  const ucet = useWatch({ control, name: 'ucet' })
  const cisloSmlouvy = useWatch({ control, name: 'cisloSmlouvy' })
  const frekvence = useWatch({ control, name: 'frekvence' })
  const iban = ucet ? naIban(ucet) : null
  // Hláška jen u převodu z českého zápisu – u IBANu by jen opakovala, co tam je.
  const prevedeno = iban && ucet.replace(/\s/g, '').toUpperCase() !== iban.replace(/\s/g, '')
  const vychoziVs = cisloSmlouvy.replace(/\D/g, '').slice(0, 10)

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

    let fileUrl: string | null = null
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        variant_id: variantId,
        ...data,
        castka: castkaZTextu(data.castka),
        file_url: fileUrl,
      }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      setChyba(payload.error ?? 'Smlouvu se nepodařilo uložit.')
      return
    }
    // Bez router.refresh(): obnovená stránka by nad potvrzením hned ukázala
    // varování „z této varianty už smlouva existuje“. Detail klienta, kam se
    // poradce vrací, si čerstvá data načte sám.
    setHotovo(true)
  }

  if (hotovo) {
    return (
      <div role="status" className="rounded-card border border-mint/30 bg-mint/10 p-6">
        <p className="flex items-center gap-2 font-display text-lead text-navy">
          <CheckCircle2 className="w-5 h-5 text-mint-dark" aria-hidden /> Smlouva je v sekci Moje smlouvy
        </p>
        <p className="mt-2 text-base text-slate text-pretty">
          Klient ji uvidí na přehledu se štítkem „Ke kontrole“ – s krytím, platbou a QR kódem. Až si ji
          otevře, u smlouvy uvidíte „Přečteno“.
        </p>
        <Link href={`/advisor/${clientId}`} className={`${buttonVariants({ variant: 'outline' })} mt-5`}>
          Zpět na detail klienta
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(odeslat)} noValidate className="space-y-5">
      <Pole id={`${id}-nazev`} popisek="Název smlouvy" chyba={errors.title?.message}>
        <Input id={`${id}-nazev`} aria-describedby={`${id}-nazev-popis`} {...register('title')} aria-invalid={errors.title ? true : undefined} />
      </Pole>

      <div className="grid gap-5 sm:grid-cols-2">
        <Pole id={`${id}-typ`} popisek="V sekci Moje smlouvy mezi">
          <select id={`${id}-typ`} aria-describedby={`${id}-typ-popis`} {...register('typ')} className={poleTridy}>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Pole
          id={`${id}-castka`}
          popisek="Předpis platby (Kč)"
          napoveda={frekvence === 'Měsíčně' ? 'Kolik se platí měsíčně.' : `Kolik se platí ${frekvence.toLowerCase()}, ne za měsíc.`}
          chyba={errors.castka?.message}
        >
          <Input id={`${id}-castka`} aria-describedby={`${id}-castka-popis`} inputMode="decimal" {...register('castka')} aria-invalid={errors.castka ? true : undefined} />
        </Pole>
        <Pole id={`${id}-frekvence`} popisek="Jak často se platí">
          <select id={`${id}-frekvence`} aria-describedby={`${id}-frekvence-popis`} {...register('frekvence')} className={poleTridy}>
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
        popisek="Číslo účtu pojišťovny"
        napoveda={
          prevedeno
            ? `Převedeno na IBAN: ${iban}`
            : 'IBAN, nebo český zápis 123456789/0800. Bez účtu se klientovi QR platba neukáže.'
        }
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

      <Pole id={`${id}-pdf`} popisek="Smlouva v PDF" napoveda="Nepovinné. Klient si ji pak stáhne u smlouvy." chyba={chybaSouboru ?? undefined}>
        <label
          htmlFor={`${id}-pdf`}
          className="flex items-center gap-3 rounded-input border border-dashed border-line bg-cream px-4 py-3 text-base text-navy cursor-pointer hover:border-navy/40 transition-colors"
        >
          <FileText className="w-5 h-5 shrink-0" aria-hidden />
          <span className="truncate">{soubor ? soubor.name : 'Vybrat PDF…'}</span>
        </label>
        <input id={`${id}-pdf`} aria-describedby={`${id}-pdf-popis`} type="file" accept=".pdf,application/pdf" onChange={vyberSoubor} className="sr-only" />
      </Pole>

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
        ) : (
          'Uložit do sekce Moje smlouvy'
        )}
      </Button>
    </form>
  )
}

function Pole({
  id,
  popisek,
  napoveda,
  chyba,
  children,
}: {
  id: string
  popisek: string
  napoveda?: string
  chyba?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={id}>{popisek}</Label>
      <div className="mt-2">{children}</div>
      {chyba ? (
        <p id={`${id}-popis`} className="mt-1.5 text-base text-danger">
          {chyba}
        </p>
      ) : (
        napoveda && (
          <p id={`${id}-popis`} className="mt-1.5 text-sm text-slate text-pretty">
            {napoveda}
          </p>
        )
      )}
    </div>
  )
}
