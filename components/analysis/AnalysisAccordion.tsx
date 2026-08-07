'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, FileText, Shield, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import StoredFileLink from '@/components/files/StoredFileLink'
import {
  SECTIONS,
  HEALTH_SECTION_ID,
  sectionProgress,
  type SectionData,
} from '@/lib/analysis-sections'

/** Příloha vybraná v prohlížeči, ještě neodeslaná. */
export interface PendingFile {
  name: string
  size: number
  section: string
  file: File
}

/** Příloha, která už leží ve storage. */
export interface StoredAnalysisFile {
  id: string
  section: string
  file_name: string
  file_url: string
  file_size: number
}

interface Props {
  data: Record<string, SectionData>
  onChange: (sectionId: string, questionId: string, value: string) => void
  expanded: string[]
  onToggle: (sectionId: string) => void
  pendingFiles: PendingFile[]
  onPickFiles: (sectionId: string) => void
  onRemoveFile: (name: string) => void
  /** Jen pro přihlášené — anonymní návštěvník žádné uložené přílohy nemá. */
  storedFiles?: StoredAnalysisFile[]
}

/**
 * Rozbalovací sekce finanční analýzy. Sdílí ji veřejný formulář na /analyza
 * i verze pro přihlášené na /dashboard/analyza — jinak by se obě kopie
 * postupem času rozešly.
 */
export default function AnalysisAccordion({
  data,
  onChange,
  expanded,
  onToggle,
  pendingFiles,
  onPickFiles,
  onRemoveFile,
  storedFiles = [],
}: Props) {
  return (
    <div className="space-y-4">
      {SECTIONS.map((section, sIdx) => {
        const isExpanded = expanded.includes(section.id)
        const progress = sectionProgress(section, data[section.id])
        const sectionFiles = pendingFiles.filter(f => f.section === section.id)
        const sectionStored = storedFiles.filter(f => f.section === section.id)

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
            className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] overflow-hidden transition-all hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.12)]"
          >
            <button
              type="button"
              onClick={() => onToggle(section.id)}
              aria-expanded={isExpanded}
              className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
            >
              <div
                className={`w-11 h-11 rounded-none bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
              >
                <section.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-display text-[#162459]"
                  style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}
                >
                  {section.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-28 h-1 bg-[#E4DFD2] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: '#009EE2' }}
                    />
                  </div>
                  <span className="text-xs text-[#66708C] tabular-nums">{progress}%</span>
                </div>
              </div>
              {progress === 100 && (
                <div className="w-7 h-7 bg-[#16a34a]/10 border border-[#16a34a]/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-[#15803d]" />
                </div>
              )}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#66708C] flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#66708C] flex-shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="h-px bg-[#E4DFD2]" />
                  <div className="p-5 md:p-7 space-y-5">
                    {section.id === HEALTH_SECTION_ID && <HealthDataNotice />}

                    {section.questions.map(q => (
                      <div key={q.id}>
                        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#66708C] mb-2">
                          {q.label}
                        </label>
                        {q.type === 'select' ? (
                          <select
                            value={data[section.id]?.[q.id] || ''}
                            onChange={e => onChange(section.id, q.id, e.target.value)}
                            className="w-full h-11 rounded-none border border-[#E4DFD2] bg-[#FDFCF8] px-4 text-[15px] text-[#162459] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
                          >
                            <option value="">Vyberte…</option>
                            {q.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : q.type === 'checkbox' ? (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {q.options?.map(opt => {
                              const current = (data[section.id]?.[q.id] || '').split(',').filter(Boolean)
                              const checked = current.includes(opt)
                              return (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-none border cursor-pointer transition-all text-sm ${
                                    checked
                                      ? 'border-[#009EE2] bg-[#009EE2]/8 text-[#0079AD] shadow-[inset_0_0_0_1px_#009EE2]'
                                      : 'border-[#E4DFD2] bg-[#FDFCF8] text-[#162459] hover:border-[#009EE2]/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked
                                        ? current.filter(c => c !== opt)
                                        : [...current, opt]
                                      onChange(section.id, q.id, next.join(','))
                                    }}
                                    className="accent-[#009EE2]"
                                  />
                                  {opt}
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          <Input
                            type={q.type}
                            placeholder={q.placeholder}
                            value={data[section.id]?.[q.id] || ''}
                            onChange={e => onChange(section.id, q.id, e.target.value)}
                          />
                        )}
                      </div>
                    ))}

                    <div className="h-px bg-[#E4DFD2]" />

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#66708C] mb-2">
                        Přílohy (PDF, foto smluv)
                      </label>
                      <button
                        type="button"
                        onClick={() => onPickFiles(section.id)}
                        className="w-full border border-dashed border-[#E4DFD2] rounded-none p-5 text-center hover:border-[#009EE2] hover:bg-[#009EE2]/5 transition-all group"
                      >
                        <Upload className="w-5 h-5 text-[#66708C] mx-auto mb-1.5 group-hover:text-[#0079AD]" />
                        <span className="text-sm text-[#66708C] group-hover:text-[#162459]">
                          Klikněte pro nahrání PDF nebo fotky
                        </span>
                      </button>

                      {sectionFiles.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {sectionFiles.map(f => (
                            <div
                              key={f.name}
                              className="flex items-center gap-2 bg-[#F6F4EE] rounded-none px-3 py-2.5 text-sm border border-[#E4DFD2]"
                            >
                              <FileText className="w-4 h-4 text-[#66708C]" />
                              <span className="flex-1 text-[#162459] truncate">{f.name}</span>
                              <span className="text-xs text-[#66708C]">{(f.size / 1024).toFixed(0)} KB</span>
                              <button
                                type="button"
                                onClick={() => onRemoveFile(f.name)}
                                aria-label={`Odebrat ${f.name}`}
                                className="text-[#66708C] hover:text-[#c2410c]"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Už nahrané přílohy — otevírají se přes signed URL */}
                      {sectionStored.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {sectionStored.map(f => (
                            <div
                              key={f.id}
                              className="flex items-center gap-2 bg-[#009EE2]/5 rounded-none px-3 py-2.5 text-sm border border-[#009EE2]/25"
                            >
                              <Check className="w-4 h-4 text-[#0079AD] shrink-0" />
                              <StoredFileLink
                                bucket="analysis"
                                path={f.file_url}
                                className="flex-1 min-w-0 text-left text-[#162459] truncate hover:text-[#0079AD] transition-colors"
                              >
                                {f.file_name}
                              </StoredFileLink>
                              <span className="text-xs text-[#66708C] shrink-0">nahráno</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

/**
 * Výška, váha, nemoci a úrazy jsou zvláštní kategorie osobních údajů
 * (čl. 9 GDPR) — na jejich zpracování je potřeba výslovný souhlas, ne pouhá
 * informace. Sdělujeme ho tedy před vyplněním sekce, ne až v patičce.
 */
function HealthDataNotice() {
  return (
    <div className="bg-[#F6F4EE] border border-[#E4DFD2] border-l-2 border-l-[#009EE2] p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#009EE2] flex-shrink-0 mt-0.5" strokeWidth={1.8} />
        <div className="text-[13px] text-[#66708C] leading-relaxed space-y-2">
          <p>
            Tahle sekce se ptá i na <strong className="font-semibold text-[#162459]">údaje o zdraví</strong>{' '}
            (výška, váha, nemoci, úrazy). Pojišťovny je vyžadují pro výpočet ceny
            a rozsahu krytí — bez nich vám návrh životního pojištění nespočítáme.
          </p>
          <p>
            Vyplněním a odesláním sekce udělujete výslovný souhlas s jejich
            zpracováním. Je dobrovolný, kdykoliv ho můžete odvolat a sekci
            můžete i přeskočit. Podrobnosti v{' '}
            <Link
              href="/zasady-ochrany-osobnich-udaju"
              className="underline underline-offset-2 hover:text-[#162459] transition-colors"
            >
              zásadách ochrany osobních údajů
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
