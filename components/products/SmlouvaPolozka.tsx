'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileText, ExternalLink } from 'lucide-react'
import StoredFileLink from '@/components/files/StoredFileLink'
import SmlouvaDetail from '@/components/products/SmlouvaDetail'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import { IKONA_DRUHU } from '@/components/products/ikony'
import { ctiSmlouvu, kotvaSmlouvy, spolecnostSmlouvy } from '@/lib/smlouvy'
import { createClient } from '@/lib/supabase/client'

/**
 * Jedna smlouva v sekci Moje smlouvy: zavřená ukazuje jen název a datum,
 * po rozkliknutí krytí, platbu, kontakty a soubor.
 *
 * Rozbalená smlouva je dlouhá (krytí po skupinách, QR platba) a dvě tři
 * pod sebou se nedaly přehlédnout. Zavřený seznam slouží jako přehled,
 * detail si klient otevře, když ho potřebuje – třeba kvůli kontaktu na
 * hlášení pojistné události.
 */

export interface Product {
  id: string
  type: 'insurance' | 'pension' | 'invest'
  title: string
  content: string | null
  file_url: string | null
  link_url: string | null
  created_at: string
  /** Klient smlouvu otevřel. Přehled do té doby ukazuje „Ke kontrole“, poradce „Nepřečteno“. */
  is_read: boolean | null
}

function sledujKotvu(zmena: () => void) {
  window.addEventListener('hashchange', zmena)
  return () => window.removeEventListener('hashchange', zmena)
}

export default function SmlouvaPolozka({ product }: { product: Product }) {
  const kotva = kotvaSmlouvy(product.id)
  /**
   * Přehled odkazuje na konkrétní smlouvu přes #kotvu. Seznam se načítá až
   * v prohlížeči, takže Next při navigaci cíl ještě nenajde a neposune se –
   * otevření i posun proto obstará smlouva sama, jakmile se vykreslí.
   */
  const zKotvy = useSyncExternalStore(
    sledujKotvu,
    () => window.location.hash === `#${kotva}`,
    () => false,
  )
  // Dokud klient sám neklikne, řídí se otevření kotvou.
  const [rucne, setRucne] = useState<boolean | null>(null)
  const otevreno = rucne ?? zKotvy

  const idDetailu = useId()
  const smlouva = ctiSmlouvu(product.content)
  const spolecnost = spolecnostSmlouvy(product.content)
  const Ikona = IKONA_DRUHU[product.type] ?? IKONA_DRUHU.insurance
  // Starší řádek bez obsahu i přílohy nemá co rozbalit – šipka by nic neslibovala.
  const maDetail = Boolean(product.content || product.file_url || product.link_url)

  useEffect(() => {
    if (!zKotvy) return
    const plynule = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(kotva)?.scrollIntoView({ block: 'start', behavior: plynule ? 'smooth' : 'auto' })
  }, [zKotvy, kotva])

  // Otevřená smlouva je přečtená: zmizí „Ke kontrole“ na přehledu a poradce
  // u klienta vidí, že si ji prošel. Jednou stačí, i když ji klient zavře.
  const oznaceno = useRef(Boolean(product.is_read))
  useEffect(() => {
    if (!otevreno || oznaceno.current) return
    oznaceno.current = true
    createClient()
      .from('proposals')
      .update({ is_read: true })
      .eq('id', product.id)
      .then(({ error }) => {
        // Nepovedlo se – zkusí se to při dalším otevření.
        if (error) oznaceno.current = false
      })
  }, [otevreno, product.id])

  const hlavicka = (
    <>
      <span className="flex items-center gap-4 min-w-0">
        {/* Logo podle společnosti, případně podle názvu smlouvy („Allianz ŽIVOT+“);
            bez něj ikona druhu, ať názvy v seznamu začínají pod sebou. */}
        <LogoFirmy
          firma={[spolecnost, product.title]}
          nahrada={<Ikona className="w-5 h-5 text-slate" strokeWidth={1.8} />}
        />
        <span className="min-w-0">
          <span className={`block font-display text-lead ${smlouva?.ukonceno ? 'text-slate' : 'text-navy'}`}>
            {product.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-slate mt-1">
            <span>
              {spolecnost && `${spolecnost} · `}
              {new Date(product.created_at).toLocaleDateString('cs-CZ')}
            </span>
            {smlouva?.ukonceno && (
              <span className="rounded-pill border border-line bg-cream px-2.5 py-0.5 text-sm text-slate">Ukončená</span>
            )}
          </span>
        </span>
      </span>
      {maDetail && (
        <ChevronDown
          aria-hidden
          strokeWidth={1.8}
          className={`w-5 h-5 shrink-0 text-slate transition-transform duration-300 ${otevreno ? 'rotate-180 text-navy' : ''}`}
        />
      )}
    </>
  )

  return (
    <div
      id={kotva}
      // Na mobilu je nahoře lepkavá lišta (64 px), posun ji nesmí podjet.
      className={`scroll-mt-24 lg:scroll-mt-8 bg-surface rounded-card border transition-colors ${
        otevreno ? 'border-mint/40' : 'border-line hover:border-mint/30'
      }`}
    >
      {maDetail ? (
        <button
          type="button"
          onClick={() => setRucne(!otevreno)}
          aria-expanded={otevreno}
          aria-controls={idDetailu}
          className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left rounded-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          {hlavicka}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-4 p-5 md:p-6">{hlavicka}</div>
      )}

      <AnimatePresence initial={false}>
        {otevreno && maDetail && (
          <motion.div
            id={idDetailu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              {smlouva ? (
                <SmlouvaDetail smlouva={smlouva} fileUrl={product.file_url} />
              ) : (
                <InsuranceDetail content={product.content} />
              )}

              {/* Soubor u nové smlouvy vypisuje SmlouvaDetail sám; tady zbývá
                  starší příloha a případný odkaz. */}
              {(product.link_url || (!smlouva && product.file_url)) && (
                <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-x-6 gap-y-2">
                  {!smlouva && product.file_url && (
                    <StoredFileLink
                      bucket="proposals"
                      path={product.file_url}
                      className="inline-flex items-center gap-2 text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                    >
                      <FileText className="w-4 h-4" aria-hidden />
                      Příloha ke stažení
                    </StoredFileLink>
                  )}
                  {product.link_url && (
                    <a
                      href={product.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden />
                      Otevřít odkaz
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Starší tvar obsahu (odrážky s částkami), dokud existují takové řádky ── */

const SECTION_LABELS: Record<string, string> = {
  daily_compensation: 'Denní odškodné',
  hospitalization: 'Hospitalizace',
  disability: 'Invalidita',
  permanent_consequences: 'Trvalé následky',
  serious_illness: 'Závažná onemocnění',
  work_incapacity: 'Pracovní neschopnost',
  death: 'Smrt',
  death_accident: 'Smrt úrazem',
  long_term_care: 'Dlouhodobá péče',
}

type InsuranceContent = {
  logo?: string
  company?: string
  monthly_price?: number | string
  sections?: Array<{ id: string; amount: number }>
  description?: string
}

function InsuranceDetail({ content }: { content: string | null }) {
  if (!content) return null

  // V try/catch je jen parsování. React JSX nevyhodnocuje hned při vytvoření,
  // takže chyba při renderu by tímhle catch stejně jen propadla dál.
  let parsed: InsuranceContent | null = null
  try {
    parsed = JSON.parse(content) as InsuranceContent
  } catch {
    parsed = null
  }

  if (!parsed?.sections) {
    return <p className="text-base text-slate mt-2">{content}</p>
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3">
        {parsed.logo && <span className="text-lg">{parsed.logo}</span>}
        {parsed.company && <span className="text-base font-semibold text-navy">{parsed.company}</span>}
        {parsed.monthly_price && (
          <span className="ml-auto text-base font-bold text-navy">
            {parsed.monthly_price} Kč/měsíc
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {parsed.sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-base">
            <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" />
            <span className="text-slate">{SECTION_LABELS[s.id] || s.id}</span>
            <span className="font-medium text-navy ml-auto tabular-nums">
              {s.amount?.toLocaleString('cs-CZ')} Kč
            </span>
          </div>
        ))}
      </div>
      {parsed.description && <p className="text-base text-slate mt-3">{parsed.description}</p>}
    </div>
  )
}
