'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronUp, ChevronDown, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { uploadAnalysisFile } from '@/lib/storage'
import type {
  Questionnaire,
  Question,
  Condition,
  Answers,
} from '@/src/questionnaires/zajisteni-prijmu.questionnaire'

type Hodnota = string | number | boolean | string[] | UploadRef[] | null | undefined
type UploadRef = { name: string; path: string }

/** Splňuje odpověď VŠECHNY podmínky showIf? Prázdné showIf = otázka se ukáže vždy. */
function podminkySplneny(showIf: Condition[] | undefined, answers: Answers): boolean {
  if (!showIf || showIf.length === 0) return true
  return showIf.every((c) => {
    const v = answers[c.key]
    switch (c.op) {
      case 'eq':
        return Array.isArray(c.value) ? JSON.stringify(v) === JSON.stringify(c.value) : v === c.value
      case 'neq':
        return Array.isArray(c.value) ? JSON.stringify(v) !== JSON.stringify(c.value) : v !== c.value
      case 'in':
        return Array.isArray(c.value) && c.value.includes(v as string)
      case 'includes':
        return Array.isArray(v) && (v as string[]).includes(c.value as string)
      case 'gt':
        return typeof v === 'number' && v > (c.value as number)
      case 'gte':
        return typeof v === 'number' && v >= (c.value as number)
      case 'lt':
        return typeof v === 'number' && v < (c.value as number)
      default:
        return true
    }
  })
}

/** Je odpověď „vyplněná"? Prázdný řetězec, prázdné pole a undefined = ne. */
function vyplneno(v: Hodnota): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'boolean') return true
  if (typeof v === 'number') return !Number.isNaN(v)
  return false
}

// Možnosti, které v multi-otázce znamenají „nic z toho" a ruší ostatní.
const VYLUCNE = new Set(['nic', 'ne', 'zadne'])

export default function QuestionnaireForm({
  definice,
  dotaznikId,
  initialAnswers,
  initialStatus,
}: {
  definice: Questionnaire
  dotaznikId: string
  initialAnswers: Answers
  initialStatus: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [answers, setAnswers] = useState<Answers>(initialAnswers)
  const [krok, setKrok] = useState(0)
  const [chyby, setChyby] = useState<Record<string, boolean>>({})
  const [stavUlozeni, setStavUlozeni] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [odeslano, setOdeslano] = useState(initialStatus !== 'draft')
  const [odesilani, setOdesilani] = useState(false)
  const [chybaOdeslani, setChybaOdeslani] = useState<string | null>(null)

  const nadpisRef = useRef<HTMLHeadingElement>(null)
  const ulozeniTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prvniRender = useRef(true)

  const sekce = definice.sections[krok]
  const posledni = krok === definice.sections.length - 1
  const postup = Math.round(((krok + 1) / definice.sections.length) * 100)

  // Průběžné ukládání odpovědí do draftu (debounce). Neběží na prvním renderu
  // ani po odeslání.
  useEffect(() => {
    if (prvniRender.current) {
      prvniRender.current = false
      return
    }
    if (odeslano) return
    if (ulozeniTimer.current) clearTimeout(ulozeniTimer.current)
    // 'saving' se nastavuje v `uprav` při editaci, ne tady – efekt jen plánuje
    // uložení a hlásí výsledek, aby nesetoval stav synchronně při renderu.
    ulozeniTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from('questionnaires')
        .update({ answers: answers as never })
        .eq('id', dotaznikId)
      setStavUlozeni(error ? 'error' : 'saved')
    }, 1200)
    return () => {
      if (ulozeniTimer.current) clearTimeout(ulozeniTimer.current)
    }
  }, [answers, odeslano, supabase, dotaznikId])

  const uprav = useCallback((key: string, v: Hodnota) => {
    setAnswers((prev) => ({ ...prev, [key]: v as Answers[string] }))
    setChyby((prev) => (prev[key] ? { ...prev, [key]: false } : prev))
    setStavUlozeni('saving')
  }, [])

  // Aktivní (viditelné) otázky sekce podle showIf.
  function aktivniOtazky(sekceIndex: number): Question[] {
    return definice.sections[sekceIndex].questions.filter((q) => podminkySplneny(q.showIf, answers))
  }

  function chybejiciVSekci(sekceIndex: number): string[] {
    return aktivniOtazky(sekceIndex)
      .filter((q) => q.required && !vyplneno(answers[q.key] as Hodnota))
      .map((q) => q.key)
  }

  function dal() {
    const chybejici = chybejiciVSekci(krok)
    if (chybejici.length > 0) {
      setChyby(Object.fromEntries(chybejici.map((k) => [k, true])))
      return
    }
    if (posledni) {
      void odeslat()
      return
    }
    setKrok((k) => Math.min(k + 1, definice.sections.length - 1))
    nadpisRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function zpet() {
    setKrok((k) => Math.max(k - 1, 0))
    nadpisRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function odeslat() {
    // Kontrola všech sekcí (i těch, kam uživatel nedošel).
    for (let i = 0; i < definice.sections.length; i++) {
      const chybejici = chybejiciVSekci(i)
      if (chybejici.length > 0) {
        setChyby(Object.fromEntries(chybejici.map((k) => [k, true])))
        setKrok(i)
        nadpisRef.current?.focus()
        return
      }
    }

    setOdesilani(true)
    setChybaOdeslani(null)

    // Napřed dopiš odpovědi, ať submit neproběhne nad starým stavem.
    const ulozeni = await supabase
      .from('questionnaires')
      .update({ answers: answers as never })
      .eq('id', dotaznikId)
    if (ulozeni.error) {
      setChybaOdeslani(ulozeni.error.message)
      setOdesilani(false)
      return
    }

    const { error } = await supabase
      .from('questionnaires')
      .update({ status: 'submitted' })
      .eq('id', dotaznikId)
    if (error) {
      setChybaOdeslani(error.message)
      setOdesilani(false)
      return
    }

    // Vyhodnocení pro poradce běží pod service role (klient do reviews nesmí).
    // Selhání nezdrží klienta – doplní se dá spustit znovu.
    try {
      await fetch('/api/dotaznik/vyhodnotit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dotaznikId }),
      })
    } catch {
      // ticho: odpovědi jsou uložené, vyhodnocení není blokující
    }

    setOdeslano(true)
    setOdesilani(false)
  }

  if (odeslano) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-pill bg-mint/12 border border-mint/30">
          <Check className="h-7 w-7 text-navy" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mt-6 font-display text-h2 text-navy">Dotazník odeslán</h1>
        <p className="mt-3 text-lead text-slate text-pretty">
          Poradce má vaše odpovědi a připraví návrh. Ozve se vám do 48 hodin.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-pill bg-navy px-6 text-base font-semibold text-cream transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Zpět na přehled
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Průběh */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-base text-slate tabular-nums" aria-live="polite">
            Krok {krok + 1} ze {definice.sections.length}
          </p>
          {stavUlozeni !== 'idle' && (
            <span className="flex items-center gap-2 text-base text-slate">
              <span
                className={`h-2 w-2 rounded-pill ${
                  stavUlozeni === 'saving' ? 'bg-amber' : stavUlozeni === 'saved' ? 'bg-mint' : 'bg-danger'
                }`}
                aria-hidden
              />
              {stavUlozeni === 'saving' ? 'Ukládám…' : stavUlozeni === 'saved' ? 'Uloženo' : 'Chyba ukládání'}
            </span>
          )}
        </div>
        <div className="mt-3 h-1 rounded-pill bg-line" role="presentation">
          <div className="h-full rounded-pill bg-mint transition-[width] duration-300" style={{ width: `${postup}%` }} />
        </div>
      </div>

      <h1 ref={nadpisRef} tabIndex={-1} className="font-display text-h2 text-navy focus-visible:outline-none">
        {sekce.title}
      </h1>
      {sekce.intro && <p className="mt-3 text-lead text-slate text-pretty">{sekce.intro}</p>}

      <div className="mt-8 space-y-8">
        {aktivniOtazky(krok).map((q) => (
          <OtazkaPole
            key={q.key}
            otazka={q}
            hodnota={answers[q.key] as Hodnota}
            chyba={chyby[q.key]}
            onChange={(v) => uprav(q.key, v)}
            supabase={supabase}
            dotaznikId={dotaznikId}
            definiceKey={definice.key}
          />
        ))}
      </div>

      {chybaOdeslani && (
        <p role="alert" className="mt-8 rounded-input border border-danger/30 bg-danger/5 p-4 text-base text-danger">
          Odeslání se nepovedlo: {chybaOdeslani}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={zpet}
          disabled={krok === 0}
          className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-base font-medium text-slate transition-colors hover:text-navy disabled:invisible focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Zpět
        </button>
        <Button type="button" size="lg" onClick={dal} disabled={odesilani}>
          {posledni ? (odesilani ? 'Odesílám…' : 'Odeslat dotazník') : 'Pokračovat'}
          {!posledni && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------

function OtazkaPole({
  otazka,
  hodnota,
  chyba,
  onChange,
  supabase,
  dotaznikId,
  definiceKey,
}: {
  otazka: Question
  hodnota: Hodnota
  chyba?: boolean
  onChange: (v: Hodnota) => void
  supabase: ReturnType<typeof createClient>
  dotaznikId: string
  definiceKey: string
}) {
  const popisId = otazka.help ? `${otazka.key}-help` : undefined

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-lg font-medium text-navy">
        {otazka.label}
        {otazka.required && <span className="text-mint-dark"> *</span>}
      </legend>
      {otazka.help && (
        <p id={popisId} className="mt-1 text-base text-slate">
          {otazka.help}
        </p>
      )}

      <div className="mt-4">
        {renderVstup(otazka, hodnota, onChange, { supabase, dotaznikId, definiceKey })}
      </div>

      {chyba && (
        <p className="mt-2 text-base text-danger" role="alert">
          Tuto otázku prosím vyplňte.
        </p>
      )}
    </fieldset>
  )
}

function renderVstup(
  q: Question,
  v: Hodnota,
  onChange: (v: Hodnota) => void,
  ctx: { supabase: ReturnType<typeof createClient>; dotaznikId: string; definiceKey: string },
) {
  switch (q.type) {
    case 'single':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(q.options ?? []).map((o) => (
            <Vyber
              key={o.value}
              typ="radio"
              nazev={q.key}
              label={o.label}
              hint={o.hint}
              zaskrtnuto={v === o.value}
              onChange={() => onChange(o.value)}
            />
          ))}
        </div>
      )

    case 'yesno':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Vyber typ="radio" nazev={q.key} label="Ano" zaskrtnuto={v === true} onChange={() => onChange(true)} />
          <Vyber typ="radio" nazev={q.key} label="Ne" zaskrtnuto={v === false} onChange={() => onChange(false)} />
        </div>
      )

    case 'multi': {
      const pole = Array.isArray(v) ? (v as string[]) : []
      const prepni = (val: string) => {
        if (VYLUCNE.has(val)) {
          onChange(pole.includes(val) ? [] : [val])
          return
        }
        const bezVylucnych = pole.filter((x) => !VYLUCNE.has(x))
        onChange(
          bezVylucnych.includes(val)
            ? bezVylucnych.filter((x) => x !== val)
            : [...bezVylucnych, val],
        )
      }
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(q.options ?? []).map((o) => (
            <Vyber
              key={o.value}
              typ="checkbox"
              nazev={q.key}
              label={o.label}
              hint={o.hint}
              zaskrtnuto={pole.includes(o.value)}
              onChange={() => prepni(o.value)}
            />
          ))}
        </div>
      )
    }

    case 'number':
    case 'currency':
    case 'slider': {
      const cislo = typeof v === 'number' ? v : ''
      return (
        <div className="flex items-center gap-3 max-w-xs">
          <Input
            type="number"
            inputMode="numeric"
            value={cislo}
            min={q.min}
            max={q.max}
            step={q.step}
            placeholder={q.placeholder}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            aria-describedby={q.help ? `${q.key}-help` : undefined}
          />
          {q.unit && <span className="text-base text-slate whitespace-nowrap">{q.unit}</span>}
        </div>
      )
    }

    case 'text':
      return (
        <textarea
          value={typeof v === 'string' ? v : ''}
          placeholder={q.placeholder}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-base text-navy placeholder:text-slate transition-colors focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/20"
        />
      )

    case 'rank':
      return <Poradi options={q.options ?? []} hodnota={Array.isArray(v) ? (v as string[]) : []} onChange={onChange} />

    case 'upload':
      return <Nahrat hodnota={Array.isArray(v) ? (v as UploadRef[]) : []} onChange={onChange} otazkaKey={q.key} {...ctx} />

    default:
      return null
  }
}

function Vyber({
  typ,
  nazev,
  label,
  hint,
  zaskrtnuto,
  onChange,
}: {
  typ: 'radio' | 'checkbox'
  nazev: string
  label: string
  hint?: string
  zaskrtnuto: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 cursor-pointer transition-colors hover:border-slate has-[:checked]:border-mint has-[:checked]:bg-mint/8 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-mint/40">
      <input
        type={typ}
        name={nazev}
        checked={zaskrtnuto}
        onChange={onChange}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-line ${
          typ === 'radio' ? 'rounded-pill' : 'rounded-[6px]'
        } peer-checked:border-mint peer-checked:bg-mint`}
      >
        <Check className="h-3 w-3 text-navy opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      <span className="min-w-0">
        <span className="block text-base text-navy">{label}</span>
        {hint && <span className="block text-base text-slate">{hint}</span>}
      </span>
    </label>
  )
}

function Poradi({
  options,
  hodnota,
  onChange,
}: {
  options: { value: string; label: string }[]
  hodnota: string[]
  onChange: (v: string[]) => void
}) {
  // Výchozí pořadí = pořadí v definici; drž i položky, které ještě nejsou v hodnotě.
  const poradi = useMemo(() => {
    const zbytek = options.map((o) => o.value).filter((val) => !hodnota.includes(val))
    return [...hodnota.filter((val) => options.some((o) => o.value === val)), ...zbytek]
  }, [hodnota, options])

  const labely = Object.fromEntries(options.map((o) => [o.value, o.label]))

  function posun(index: number, smer: -1 | 1) {
    const cil = index + smer
    if (cil < 0 || cil >= poradi.length) return
    const nove = [...poradi]
    ;[nove[index], nove[cil]] = [nove[cil], nove[index]]
    onChange(nove)
  }

  return (
    <ol className="space-y-2">
      {poradi.map((val, i) => (
        <li
          key={val}
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-navy text-base font-semibold text-cream tabular-nums">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 text-base text-navy">{labely[val]}</span>
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => posun(i, -1)}
              disabled={i === 0}
              aria-label={`Posunout „${labely[val]}" nahoru`}
              className="rounded-input p-2 text-slate transition-colors hover:bg-cream-deep hover:text-navy disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <ChevronUp className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => posun(i, 1)}
              disabled={i === poradi.length - 1}
              aria-label={`Posunout „${labely[val]}" dolů`}
              className="rounded-input p-2 text-slate transition-colors hover:bg-cream-deep hover:text-navy disabled:opacity-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </span>
        </li>
      ))}
    </ol>
  )
}

function Nahrat({
  hodnota,
  onChange,
  otazkaKey,
  supabase,
  dotaznikId,
  definiceKey,
}: {
  hodnota: UploadRef[]
  onChange: (v: UploadRef[]) => void
  otazkaKey: string
  supabase: ReturnType<typeof createClient>
  dotaznikId: string
  definiceKey: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [nahravam, setNahravam] = useState(false)
  const [chyba, setChyba] = useState<string | null>(null)

  async function pridej(e: React.ChangeEvent<HTMLInputElement>) {
    const soubory = e.target.files
    if (!soubory || soubory.length === 0) return
    setNahravam(true)
    setChyba(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setChyba('Nejste přihlášeni.')
      setNahravam(false)
      return
    }
    const nove: UploadRef[] = []
    for (const file of Array.from(soubory)) {
      const res = await uploadAnalysisFile(supabase, user.id, `${definiceKey}/${otazkaKey}`, file)
      if (res.ok) nove.push({ name: file.name, path: res.path })
      else setChyba(res.error)
    }
    onChange([...hodnota, ...nove])
    setNahravam(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function odeber(ref: UploadRef) {
    onChange(hodnota.filter((f) => f.path !== ref.path))
    await supabase.storage.from('analysis').remove([ref.path])
    await supabase.from('analysis_files').delete().eq('file_url', ref.path)
  }

  void dotaznikId

  return (
    <div className="rounded-card border border-dashed border-line bg-surface p-5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={pridej}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={nahravam}>
        <Paperclip className="h-4 w-4" aria-hidden /> {nahravam ? 'Nahrávám…' : 'Přiložit soubor'}
      </Button>
      {chyba && <p className="mt-3 text-base text-danger">{chyba}</p>}
      {hodnota.length > 0 && (
        <ul className="mt-4 space-y-2">
          {hodnota.map((f) => (
            <li key={f.path} className="flex items-center justify-between gap-3 text-base text-navy">
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => odeber(f)}
                aria-label={`Odebrat ${f.name}`}
                className="rounded-pill p-1 text-slate transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
