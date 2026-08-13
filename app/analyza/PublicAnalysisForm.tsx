'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import AnalysisAccordion, { type PendingFile } from '@/components/analysis/AnalysisAccordion'
import AnalysisHero from '@/components/analyza/AnalysisHero'
import {
  SECTIONS,
  TOTAL_QUESTIONS,
  HEALTH_SECTION_ID,
  type SectionData,
} from '@/lib/analysis-sections'

/** Rozepsaná analýza přežije zavření karty – 10 minut práce se nesmí ztratit. */
const DRAFT_KEY = 'pdk-analyza-draft'

type Result =
  | { kind: 'created'; hasPassword: boolean }
  | { kind: 'existing' }

export default function PublicAnalysisForm() {
  const [data, setData] = useState<Record<string, SectionData>>({})
  const [expanded, setExpanded] = useState<string[]>([SECTIONS[0].id])
  const [files, setFiles] = useState<PendingFile[]>([])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const activeSection = useRef<string>(SECTIONS[0].id)
  const draftLoaded = useRef(false)

  // Načtení rozepsaného konceptu
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setData(JSON.parse(raw))
    } catch {
      // Poškozený koncept není důvod nepustit člověka k formuláři.
    }
    draftLoaded.current = true
  }, [])

  // Průběžné ukládání konceptu. Přílohy se uložit nedají (jsou to File
  // objekty), takže po obnovení stránky je potřeba je vybrat znovu.
  useEffect(() => {
    if (!draftLoaded.current) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    } catch {
      // Plný nebo zakázaný localStorage – formulář musí fungovat i tak.
    }
  }, [data])

  function updateField(sectionId: string, questionId: string, value: string) {
    setData(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], [questionId]: value } }))
  }

  function toggleSection(id: string) {
    setExpanded(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]))
  }

  function pickFiles(sectionId: string) {
    activeSection.current = sectionId
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const picked = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size,
      section: activeSection.current,
      file: f,
    }))
    setFiles(prev => [...prev, ...picked])
    e.target.value = ''
  }

  const answered = Object.values(data).reduce(
    (n, section) => n + Object.values(section).filter(Boolean).length,
    0,
  )
  const overallProgress = Math.round((answered / TOTAL_QUESTIONS) * 100)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const personal = data[HEALTH_SECTION_ID] ?? {}
    if (!personal.full_name?.trim() || !personal.email?.trim()) {
      setError('Otevřete sekci „Osobní údaje“ a vyplňte alespoň jméno a e-mail – bez nich vám nemáme kam poslat návrh.')
      setExpanded(prev => (prev.includes(HEALTH_SECTION_ID) ? prev : [...prev, HEALTH_SECTION_ID]))
      return
    }

    setLoading(true)

    const form = new FormData(e.currentTarget)
    form.set('responses', JSON.stringify(data))
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

      // Koncept už není k čemu – data jsou u poradce.
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}

      setResult(
        payload.status === 'existing'
          ? { kind: 'existing' }
          : { kind: 'created', hasPassword: Boolean(payload.hasPassword) },
      )
    } catch {
      setError('Chyba připojení. Zkontrolujte internet a zkuste to prosím znovu.')
    } finally {
      setLoading(false)
    }
  }

  if (result) return <SubmittedScreen result={result} />

  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <form
        onSubmit={handleSubmit}
        // Do lg tlačí `pt` obsah pod fotku, od lg se vrací k běžnému odsazení.
        className="relative max-w-4xl mx-auto px-6 md:px-10 lg:px-16 pt-[8.5rem] lg:pt-16 pb-10 md:pb-16"
      >
        {/* Fotka je vytažená přes celou šířku okna, ne jen přes max-w-4xl sloupec.
            Do lg je to pruh nad sazbou (výška ladí s `pt` formuláře), od lg
            sedí v pravém okraji vedle textu a smí být vyšší. */}
        <div className="absolute inset-x-[calc(50%-50vw)] top-0 h-[7rem] lg:h-[23rem] pointer-events-none">
          <AnalysisHero />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Honeypot – skrytý před lidmi, viditelný pro jednoduché boty. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute w-px h-px -left-[9999px] opacity-0"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mb-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[#66708C] hover:text-[#162459] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Zpět na úvod
          </Link>

          <p className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#66708C] mb-5">
            <span className="inline-block w-10 h-px bg-[#009EE2]" />
            Bez registrace · ~10 minut
          </p>

          <h1
            className="font-display text-[#162459] mb-5"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
          >
            Finanční <span style={{ color: '#009EE2' }}>analýza</span>
          </h1>

          <p className="text-[#66708C] max-w-xl leading-relaxed">
            Sedm sekcí vypadá jako hodně, ale otevřete jen ty, které se vás
            týkají – nemáte děti, přeskočte děti. Povinné jsou jenom jméno
            a e-mail, u zbytku platí, že čím víc vyplníte, tím konkrétnější
            plán vám přijde zpátky.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#66708C]/85">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#009EE2]" aria-hidden />
              Rozdělané se ukládá – můžete zavřít a vrátit se
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#009EE2]" aria-hidden />
              Nikdo vám nezavolá, dokud si to sami nevyžádáte
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#009EE2]" aria-hidden />
              Zdarma a nezávazně
            </span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 max-w-xs h-1 bg-[#E4DFD2] overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${overallProgress}%`, background: '#009EE2' }}
              />
            </div>
            <span className="text-xs text-[#66708C] tabular-nums">
              {answered} z {TOTAL_QUESTIONS} otázek
            </span>
          </div>
        </motion.div>

        <AnalysisAccordion
          data={data}
          onChange={updateField}
          expanded={expanded}
          onToggle={toggleSection}
          pendingFiles={files}
          onPickFiles={pickFiles}
          onRemoveFile={name => setFiles(prev => prev.filter(f => f.name !== name))}
        />

        {/* Nepovinné heslo – kdo si ho zvolí, přihlásí se hned, jak plán dorazí. */}
        <div className="mt-8 bg-[#FDFCF8] border border-[#E4DFD2] p-6 md:p-7">
          <h2
            className="font-display text-[#162459] mb-2"
            style={{ fontSize: '1.35rem', letterSpacing: '-0.01em' }}
          >
            Chcete plán sledovat <span style={{ color: '#009EE2' }}>online</span>?
          </h2>
          <p className="text-sm text-[#66708C] leading-relaxed mb-5">
            Nepovinné. Zvolte si heslo a hned po odeslání se budete moct přihlásit
            do svého prostoru – uvidíte tam plán, návrhy i chat s poradcem.
            Když heslo nevyplníte, nic se neděje: přístup vám pošleme, jakmile
            bude plán hotový.
          </p>

          <div className="max-w-sm">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#66708C] mb-2"
            >
              Heslo (nepovinné)
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Alespoň 8 znaků"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                className="w-full h-11 px-4 pr-11 rounded-none border border-[#E4DFD2] bg-[#FDFCF8] text-[#162459] text-[15px] placeholder:text-[#66708C] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66708C] hover:text-[#162459] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] text-sm text-[#c2410c]">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-[#66708C] leading-relaxed max-w-md">
            Odesláním berete na vědomí{' '}
            <Link
              href="/zasady-ochrany-osobnich-udaju"
              className="underline underline-offset-2 hover:text-[#162459] transition-colors"
            >
              zásady zpracování osobních údajů
            </Link>
            . Vyplnili-li jste sekci „Osobní údaje“, udělujete zároveň výslovný
            souhlas se zpracováním údajů o zdraví.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5 shrink-0"
            style={{ background: '#162459' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Odesílám…
              </>
            ) : (
              <>
                Chci svůj plán <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function SubmittedScreen({ result }: { result: Result }) {
  const existing = result.kind === 'existing'

  return (
    <div className="min-h-screen bg-[#F6F4EE] flex items-center">
      <div className="max-w-2xl mx-auto px-6 md:px-10 py-16 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-numeral text-[4rem] md:text-[6rem] mb-3">✓</div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">
            {existing ? 'Přijato · poradce se ozve' : 'Hotovo · poradce už o vás ví'}
          </p>

          <h1
            className="font-display text-[#162459] mb-5"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Analýza <span style={{ color: '#009EE2' }}>odeslána</span>.
          </h1>

          {existing ? (
            <p className="text-[#66708C] mb-10 leading-relaxed">
              S tímhle e-mailem už u nás účet existuje, takže odpovědi zatím
              nikam nepřepisujeme – projde je poradce a ozve se vám. Pokud jste
              to vy a heslo si pamatujete, můžete se rovnou přihlásit.
            </p>
          ) : result.hasPassword ? (
            <p className="text-[#66708C] mb-10 leading-relaxed">
              Poradce připraví finanční plán na základě vašich odpovědí, obvykle
              do 48 hodin. Účet už máte založený – přihlaste se e-mailem a heslem,
              které jste si zvolili, a plán uvidíte hned, jak bude hotový.
            </p>
          ) : (
            <p className="text-[#66708C] mb-10 leading-relaxed">
              Poradce připraví finanční plán na základě vašich odpovědí, obvykle
              do 48 hodin. Jakmile bude hotový, pošleme vám na e-mail odkaz,
              kterým si nastavíte heslo a plán si prohlédnete online.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {(existing || result.kind === 'created') && (
              <Link
                href={existing || result.hasPassword ? '/login' : '/'}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
                style={{ background: '#162459' }}
              >
                {existing || result.hasPassword ? 'Přihlásit se' : 'Zpět na úvod'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {(existing || result.hasPassword) && (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-none border border-[#E4DFD2] text-[#162459] text-[15px] hover:border-[#009EE2] transition-colors"
              >
                Zpět na úvod
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
