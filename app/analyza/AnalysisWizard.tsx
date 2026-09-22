'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Paperclip, Plus, X } from 'lucide-react'
import {
  SECTIONS,
  HEALTH_SECTION_ID,
  viditelneOtazky,
  uklidSkryteOdpovedi,
  rozdelHodnoty,
  spojHodnoty,
  rozdelSkupinu,
  spojSkupinu,
  type Question,
  type SectionData,
} from '@/lib/analysis-sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Rozepsaná analýza přežije zavření karty – čtvrt hodiny práce se nesmí ztratit. */
const DRAFT_KEY = 'pdk-analyza-draft'
const STEP_KEY = 'pdk-analyza-krok'
/** Náhodný klíč konceptu. Podle něj se na serveru přepisuje jeden a ten samý řádek. */
const KEY_KLIC = 'pdk-analyza-klic'

type PendingFile = { name: string; size: number; section: string; file: File }

export default function AnalysisWizard() {
  const router = useRouter()
  const [krok, setKrok] = useState(0)
  const [data, setData] = useState<Record<string, SectionData>>({})
  const [files, setFiles] = useState<PendingFile[]>([])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const klicRef = useRef('')
  const ulozTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const nadpisRef = useRef<HTMLHeadingElement>(null)
  const draftLoaded = useRef(false)

  const sekce = SECTIONS[krok]
  const posledni = krok === SECTIONS.length - 1

  // Načtení rozepsaného konceptu včetně kroku, u kterého člověk skončil
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage na serveru není, koncept jde obnovit až po připojení
      if (raw) setData(JSON.parse(raw))
      const ulozenyKrok = Number(localStorage.getItem(STEP_KEY))
      if (ulozenyKrok > 0 && ulozenyKrok < SECTIONS.length) setKrok(ulozenyKrok)

      let klic = localStorage.getItem(KEY_KLIC)
      if (!klic) {
        klic = crypto.randomUUID()
        localStorage.setItem(KEY_KLIC, klic)
      }
      klicRef.current = klic
    } catch {
      // Poškozený koncept není důvod nepustit člověka k formuláři.
    }
    draftLoaded.current = true
  }, [])

  useEffect(() => {
    if (!draftLoaded.current) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
      localStorage.setItem(STEP_KEY, String(krok))
    } catch {
      // Plný nebo zakázaný localStorage – formulář musí fungovat i tak.
    }
  }, [data, krok])

  // Kopie u poradce vzniká až od posledního kroku, kdy je znám e-mail a člověk
  // na obrazovce vidí, že odpovědi ukládáme. Dřív by se zdravotní údaje ocitly
  // na serveru dřív, než k tomu dá souhlas.
  useEffect(() => {
    if (!draftLoaded.current || !posledni || !klicRef.current) return
    const email = data[HEALTH_SECTION_ID]?.email?.trim()
    if (!email) return

    if (ulozTimeout.current) clearTimeout(ulozTimeout.current)
    ulozTimeout.current = setTimeout(() => {
      fetch('/api/analyza/koncept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftKey: klicRef.current, responses: data, step: krok, email }),
        // Hlavní kopie leží v localStorage, takže selhání jen ignorujeme.
      }).catch(() => {})
    }, 1500)

    return () => {
      if (ulozTimeout.current) clearTimeout(ulozTimeout.current)
    }
  }, [data, krok, posledni])

  function uprav(questionId: string, hodnota: string) {
    setData((prev) => {
      const nove = { ...prev[sekce.id], [questionId]: hodnota }
      // Odpověď, která se právě schovala, nemá odejít poradci.
      return { ...prev, [sekce.id]: uklidSkryteOdpovedi(sekce, nove) }
    })
  }

  function prejdi(smer: 1 | -1) {
    const cil = krok + smer
    if (cil < 0 || cil >= SECTIONS.length) return
    setError(null)
    setKrok(cil)
    window.scrollTo({ top: 0 })
    // Po přepnutí kroku patří ohnisko na nový nadpis, jinak čtečka zůstane dole u tlačítka.
    requestAnimationFrame(() => nadpisRef.current?.focus())
  }

  function vyberSoubory(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const vybrane = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size,
      section: sekce.id,
      file: f,
    }))
    setFiles((prev) => [...prev, ...vybrane])
    e.target.value = ''
  }

  async function odesli() {
    const osobni = data[HEALTH_SECTION_ID] ?? {}
    if (!osobni.full_name?.trim() || !osobni.email?.trim()) {
      setError('Vyplňte prosím jméno a e-mail – bez nich vám nemám kam poslat návrh.')
      return
    }

    setLoading(true)
    setError(null)

    const form = new FormData()
    form.set('responses', JSON.stringify(data))
    form.set('password', password)
    form.set('website', honeypotRef.current?.value ?? '')
    for (const f of files) {
      form.append('files', f.file)
      form.append('fileSections', f.section)
    }

    try {
      const res = await fetch('/api/analyza/odeslat', { method: 'POST', body: form })
      const payload = await res.json()

      if (!res.ok) {
        setError(payload.error || 'Odeslání se nepodařilo. Zkuste to prosím znovu.')
        setLoading(false)
        return
      }

      try {
        localStorage.removeItem(DRAFT_KEY)
        localStorage.removeItem(STEP_KEY)
        localStorage.removeItem(KEY_KLIC)
      } catch {}

      // Odpovědi jsou u poradce v public_submissions, koncept už nemá důvod žít.
      fetch('/api/analyza/koncept', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftKey: klicRef.current }),
      }).catch(() => {})

      const stav = payload.status === 'existing' ? 'existujici' : 'novy'
      const heslo = payload.hasPassword ? '&heslo=1' : ''
      router.push(`/dekujeme?stav=${stav}${heslo}`)
    } catch {
      setError('Chyba připojení. Zkontrolujte internet a zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  const postup = Math.round(((krok + 1) / SECTIONS.length) * 100)

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="sticky top-0 z-20 bg-cream border-b border-line">
        <div className="mx-auto w-full max-w-4xl px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Poradce do kapsy — úvodní stránka"
            className="flex items-center gap-2.5 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <span aria-hidden className="w-8 h-8 rounded-input bg-navy flex items-end justify-end p-1.5">
              <span className="block w-1.5 h-1.5 rounded-pill bg-mint" />
            </span>
            <span className="font-display text-navy hidden sm:block">Poradce do kapsy</span>
          </Link>
          <p className="text-base text-slate tabular-nums" aria-live="polite">
            Krok {krok + 1} ze {SECTIONS.length}
          </p>
        </div>
        <div className="h-1 bg-line" role="presentation">
          <div className="h-full bg-mint transition-[width] duration-300" style={{ width: `${postup}%` }} />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10 md:py-14">
        <h1
          ref={nadpisRef}
          tabIndex={-1}
          className="font-display text-h2 text-navy focus-visible:outline-none"
        >
          {sekce.title}
        </h1>

        {posledni && (
          <p className="mt-3 text-base text-slate max-w-2xl">
            Od téhle chvíle si rozepsané odpovědi ukládám i u sebe, abyste o ně nepřišli.
            Po odeslání analýzy je smažu.
          </p>
        )}

        <div className="mt-8 md:mt-10 space-y-8">
          {viditelneOtazky(sekce, data[sekce.id]).map((q) => (
            <Otazka
              key={q.id}
              otazka={q}
              hodnota={data[sekce.id]?.[q.id] ?? ''}
              onChange={(v) => uprav(q.id, v)}
              povinne={sekce.id === HEALTH_SECTION_ID && (q.id === 'full_name' || q.id === 'email')}
            />
          ))}
        </div>

        <div className="mt-10 rounded-card border border-dashed border-line bg-surface p-5">
          <p className="text-base text-navy">Máte k téhle oblasti smlouvu nebo pojistku?</p>
          <p className="text-base text-slate mt-1">
            Přiložte ji a já ji projdu. PDF nebo fotka, klidně víc souborů.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={vyberSoubory}
          />
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => fileRef.current?.click()}>
            <Paperclip className="w-4 h-4" aria-hidden /> Přiložit dokument
          </Button>

          {files.filter((f) => f.section === sekce.id).length > 0 && (
            <ul className="mt-4 space-y-2">
              {files
                .filter((f) => f.section === sekce.id)
                .map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-3 text-base text-navy">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                      className="text-slate hover:text-navy rounded-pill p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                      aria-label={`Odebrat ${f.name}`}
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {posledni && (
          <div className="mt-8 rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-h3 text-navy">Chcete plán sledovat online?</h2>
            <p className="text-base text-slate mt-2">
              Nepovinné. Zvolte si heslo a hned po odeslání se budete moct přihlásit do svého
              prostoru. Když heslo nevyplníte, přístup vám pošlu, jakmile bude plán hotový.
            </p>
            <div className="mt-4 max-w-sm">
              <Label htmlFor="password">Heslo (nepovinné)</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Alespoň 8 znaků"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy rounded-pill p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
              </div>
            </div>

            <p className="text-base text-slate mt-6">
              Odesláním berete na vědomí{' '}
              <Link
                href="/obchodni-podminky"
                className="text-navy underline underline-offset-4 hover:text-mint-dark"
              >
                obchodní podmínky
              </Link>{' '}
              a{' '}
              <Link
                href="/zasady-ochrany-osobnich-udaju"
                className="text-navy underline underline-offset-4 hover:text-mint-dark"
              >
                zásady zpracování osobních údajů
              </Link>
              . Vyplněním údajů o zdraví zároveň udělujete výslovný souhlas s jejich zpracováním.
            </p>
          </div>
        )}

        {/* Honeypot – skrytý před lidmi, viditelný pro jednoduché boty. */}
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute w-px h-px -left-[9999px] opacity-0"
        />

        {error && (
          <p role="alert" className="mt-6 rounded-input border border-danger/30 bg-danger/5 p-4 text-base text-danger">
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          {krok > 0 ? (
            <button
              type="button"
              onClick={() => prejdi(-1)}
              className="text-base text-slate hover:text-navy underline underline-offset-4 rounded-pill px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              Zpět
            </button>
          ) : (
            <span />
          )}

          {posledni ? (
            <Button type="button" size="lg" onClick={odesli} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Odesílám…
                </>
              ) : (
                'Chci svůj plán'
              )}
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={() => prejdi(1)}>
              Pokračovat
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

/** Jedna otázka. Výběr z možností jsou velké karty, ne drobné přepínače. */
function Otazka({
  otazka,
  hodnota,
  onChange,
  povinne,
  idPrefix = '',
  kompaktni = false,
}: {
  otazka: Question
  hodnota: string
  onChange: (v: string) => void
  povinne: boolean
  /** Odlišuje pole uvnitř opakovatelné skupiny – jinak by si přepínače
   *  u druhé položky přebíraly výběr té první (stejný `name`). */
  idPrefix?: string
  kompaktni?: boolean
}) {
  const popisTrida = kompaktni ? 'text-base font-medium text-navy' : 'text-lead text-navy'

  if (otazka.type === 'group' && otazka.itemQuestions) {
    const podotazky = otazka.itemQuestions
    const polozky = rozdelSkupinu(hodnota)
    const upravPolozku = (i: number, podId: string, v: string) =>
      onChange(spojSkupinu(polozky.map((p, idx) => (idx === i ? { ...p, [podId]: v } : p))))

    return (
      <div>
        <p className="text-lead text-navy">{otazka.label}</p>
        {otazka.help && <p className="mt-1 text-base text-slate">{otazka.help}</p>}

        <div className="mt-4 space-y-4">
          {polozky.map((polozka, i) => (
            <div key={i} className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-navy">
                  {otazka.itemLabel ?? 'Položka'} {i + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(spojSkupinu(polozky.filter((_, idx) => idx !== i)))}
                  aria-label={`Odebrat ${(otazka.itemLabel ?? 'položku').toLowerCase()} ${i + 1}`}
                  className="rounded-pill p-1 text-slate transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>

              <div className="mt-4 space-y-5">
                {podotazky.map((pod) => (
                  <Otazka
                    key={pod.id}
                    otazka={pod}
                    hodnota={polozka[pod.id] ?? ''}
                    onChange={(v) => upravPolozku(i, pod.id, v)}
                    povinne={false}
                    idPrefix={`${otazka.id}-${i}-`}
                    kompaktni
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => onChange(spojSkupinu([...polozky, {}]))}
        >
          <Plus className="w-4 h-4" aria-hidden /> {otazka.addLabel ?? 'Přidat'}
        </Button>
      </div>
    )
  }

  if (otazka.type === 'select' && otazka.options) {
    return (
      <fieldset>
        <legend className={popisTrida}>{otazka.label}</legend>
        {otazka.help && <p className="mt-1 text-base text-slate">{otazka.help}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {otazka.options.map((moznost) => (
            <Karta
              key={moznost}
              nazev={`${idPrefix}${otazka.id}`}
              typ="radio"
              popisek={moznost}
              zaskrtnuto={hodnota === moznost}
              onChange={() => onChange(hodnota === moznost ? '' : moznost)}
            />
          ))}
        </div>
      </fieldset>
    )
  }

  if (otazka.type === 'checkbox' && otazka.options) {
    const vybrane = rozdelHodnoty(hodnota, otazka.options)
    return (
      <fieldset>
        <legend className={popisTrida}>{otazka.label}</legend>
        {otazka.help && <p className="mt-1 text-base text-slate">{otazka.help}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {otazka.options.map((moznost) => (
            <Karta
              key={moznost}
              nazev={`${idPrefix}${otazka.id}`}
              typ="checkbox"
              popisek={moznost}
              zaskrtnuto={vybrane.includes(moznost)}
              onChange={() =>
                onChange(
                  spojHodnoty(
                    vybrane.includes(moznost)
                      ? vybrane.filter((v) => v !== moznost)
                      : [...vybrane, moznost],
                  ),
                )
              }
            />
          ))}
        </div>
      </fieldset>
    )
  }

  return (
    <div>
      <Label htmlFor={`${idPrefix}${otazka.id}`} className={kompaktni ? undefined : 'text-lead'}>
        {otazka.label}
        {povinne && <span className="text-slate"> · povinné</span>}
      </Label>
      {otazka.help && <p className="mt-1 text-base text-slate">{otazka.help}</p>}
      <Input
        id={`${idPrefix}${otazka.id}`}
        type={otazka.type === 'number' ? 'number' : 'text'}
        inputMode={otazka.type === 'number' ? 'numeric' : undefined}
        value={hodnota}
        onChange={(e) => onChange(e.target.value)}
        placeholder={otazka.placeholder}
        required={povinne}
        className="mt-3 max-w-md"
      />
    </div>
  )
}

/** Velká klikatelná karta místo přepínače. Vstup zůstává v DOM kvůli klávesnici. */
function Karta({
  nazev,
  typ,
  popisek,
  zaskrtnuto,
  onChange,
}: {
  nazev: string
  typ: 'radio' | 'checkbox'
  popisek: string
  zaskrtnuto: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 cursor-pointer transition-colors hover:border-slate has-[:checked]:border-mint has-[:checked]:bg-mint/8 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-mint/40">
      <input
        type={typ}
        name={nazev}
        checked={zaskrtnuto}
        onChange={onChange}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`w-5 h-5 shrink-0 border-2 border-line flex items-center justify-center ${typ === 'radio' ? 'rounded-pill' : 'rounded-[6px]'} peer-checked:border-mint peer-checked:bg-mint`}
      >
        <span className={`w-2 h-2 bg-navy ${typ === 'radio' ? 'rounded-pill' : 'rounded-[2px]'} ${zaskrtnuto ? 'block' : 'hidden'}`} />
      </span>
      <span className="text-base text-navy">{popisek}</span>
    </label>
  )
}
