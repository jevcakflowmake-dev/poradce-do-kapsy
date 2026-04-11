'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Upload, Shield, Home, Clock, Baby,
  TrendingUp, Building2, ChevronDown, ChevronUp, FileText, X
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface SectionData { [key: string]: string }
interface UploadedFile { name: string; size: number; section: string }

const sections = [
  {
    id: 'income', title: 'Zajištění příjmů', icon: Shield, color: 'from-blue-600 to-indigo-700',
    questions: [
      { id: 'employment', label: 'Jaký je váš pracovní poměr?', type: 'select', options: ['Zaměstnanec', 'OSVČ', 'Kombinace', 'Student', 'Důchodce'] },
      { id: 'monthly_income', label: 'Čistý měsíční příjem (Kč)', type: 'number', placeholder: '35 000' },
      { id: 'partner_income', label: 'Příjem partnera/ky (Kč)', type: 'number', placeholder: '0' },
      { id: 'sick_leave', label: 'Máte zajištěný příjem při pracovní neschopnosti?', type: 'select', options: ['Ano, pojištěním', 'Ano, úsporami', 'Ne'] },
      { id: 'life_insurance', label: 'Máte životní pojištění?', type: 'select', options: ['Ano', 'Ne', 'Nevím'] },
    ],
  },
  {
    id: 'housing', title: 'Bydlení', icon: Home, color: 'from-emerald-600 to-teal-700',
    questions: [
      { id: 'housing_type', label: 'Typ bydlení', type: 'select', options: ['Vlastní byt', 'Vlastní dům', 'Nájem', 'Družstevní', 'U rodičů'] },
      { id: 'mortgage', label: 'Máte hypotéku?', type: 'select', options: ['Ano', 'Ne', 'Plánuji'] },
      { id: 'mortgage_payment', label: 'Měsíční splátka hypotéky (Kč)', type: 'number', placeholder: '0' },
      { id: 'rent', label: 'Měsíční nájem (Kč)', type: 'number', placeholder: '0' },
      { id: 'property_insurance', label: 'Máte pojištění nemovitosti/domácnosti?', type: 'select', options: ['Ano, obojí', 'Jen nemovitost', 'Jen domácnost', 'Ne'] },
    ],
  },
  {
    id: 'retirement', title: 'Příprava na důchod', icon: Clock, color: 'from-amber-500 to-orange-600',
    questions: [
      { id: 'age', label: 'Váš věk', type: 'number', placeholder: '35' },
      { id: 'retirement_savings', label: 'Máte penzijní spoření?', type: 'select', options: ['Ano, doplňkové', 'Ano, transformované', 'Ne'] },
      { id: 'pension_contribution', label: 'Měsíční příspěvek na penzijko (Kč)', type: 'number', placeholder: '1 000' },
      { id: 'employer_contribution', label: 'Přispívá zaměstnavatel?', type: 'select', options: ['Ano', 'Ne', 'Nevím'] },
      { id: 'expected_retirement', label: 'Plánovaný věk odchodu do důchodu', type: 'number', placeholder: '65' },
    ],
  },
  {
    id: 'children', title: 'Děti', icon: Baby, color: 'from-pink-500 to-rose-600',
    questions: [
      { id: 'children_count', label: 'Počet dětí', type: 'number', placeholder: '0' },
      { id: 'children_ages', label: 'Věk dětí (oddělte čárkou)', type: 'text', placeholder: '5, 8, 12' },
      { id: 'children_savings', label: 'Spoříte dětem na budoucnost?', type: 'select', options: ['Ano, stavební spoření', 'Ano, investice', 'Ano, spořicí účet', 'Ne'] },
      { id: 'children_insurance', label: 'Jsou děti pojištěny?', type: 'select', options: ['Ano', 'Ne', 'Částečně'] },
    ],
  },
  {
    id: 'investing', title: 'Investice', icon: TrendingUp, color: 'from-violet-600 to-purple-700',
    questions: [
      { id: 'investing_experience', label: 'Zkušenosti s investováním', type: 'select', options: ['Žádné', 'Začátečník', 'Mírně pokročilý', 'Pokročilý'] },
      { id: 'risk_tolerance', label: 'Tolerance k riziku', type: 'select', options: ['Konzervativní', 'Vyvážený', 'Dynamický', 'Agresivní'] },
      { id: 'investment_horizon', label: 'Investiční horizont', type: 'select', options: ['1–3 roky', '3–5 let', '5–10 let', '10+ let'] },
      { id: 'monthly_invest', label: 'Kolik měsíčně chcete investovat (Kč)', type: 'number', placeholder: '3 000' },
      { id: 'current_investments', label: 'Stávající investice', type: 'select', options: ['Nemám žádné', 'Podílové fondy', 'ETF / akcie', 'Krypto', 'Kombinace'] },
    ],
  },
  {
    id: 'property', title: 'Pojištění majetku', icon: Building2, color: 'from-cyan-600 to-sky-700',
    questions: [
      { id: 'vehicle', label: 'Vlastníte automobil?', type: 'select', options: ['Ano, 1', 'Ano, 2+', 'Ne'] },
      { id: 'vehicle_insurance', label: 'Typ pojištění vozidla', type: 'select', options: ['Povinné ručení', 'Povinné ručení + havarijní', 'Nemám auto', 'Nemám pojištění'] },
      { id: 'valuable_items', label: 'Máte cenné předměty k pojištění?', type: 'select', options: ['Elektronika', 'Šperky / umění', 'Sportovní vybavení', 'Ne'] },
      { id: 'liability_insurance', label: 'Máte pojištění odpovědnosti?', type: 'select', options: ['Ano', 'Ne', 'Nevím'] },
    ],
  },
]

export default function AnalyzaPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Record<string, SectionData>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>([sections[0].id])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeUploadSection, setActiveUploadSection] = useState('')

  function updateField(sectionId: string, questionId: string, value: string) {
    setData(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], [questionId]: value } }))
  }
  function toggleSection(sid: string) {
    setExpandedSections(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid])
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setFiles(prev => [...prev, ...Array.from(e.target.files!).map(f => ({ name: f.name, size: f.size, section: activeUploadSection }))])
    e.target.value = ''
  }
  function removeFile(name: string) { setFiles(prev => prev.filter(f => f.name !== name)) }
  function sectionProgress(sid: string): number {
    const s = sections.find(x => x.id === sid)
    if (!s) return 0
    const answered = Object.keys(data[sid] || {}).filter(k => data[sid][k]).length
    return Math.round((answered / s.questions.length) * 100)
  }

  async function handleSubmit() {
    setLoading(true)
    // TODO: save analysis data to Supabase
    await new Promise(r => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="w-full container px-4 mx-auto max-w-3xl py-16">
        <motion.div className="text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Analýza odeslána</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Váš poradce připraví finanční plán na základě vašich odpovědí. Očekávejte výsledky do 48 hodin.</p>
          <Link href={`/klient/${id}`}>
            <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-3 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zpět na přehled
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full container px-4 mx-auto max-w-3xl py-8">
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleFileChange} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href={`/klient/${id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanční analýza</h1>
        <p className="text-slate-500">Odpovězte na otázky v každé sekci. Čím více vyplníte, tím přesnější plán dostanete.</p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, sIdx) => {
          const isExpanded = expandedSections.includes(section.id)
          const progress = sectionProgress(section.id)
          const sectionFiles = files.filter(f => f.section === section.id)
          return (
            <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.05 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
              <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{section.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${section.color} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{progress}%</span>
                  </div>
                </div>
                {progress === 100 && <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-emerald-600" /></div>}
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <Separator />
                    <div className="p-5 space-y-5">
                      {section.questions.map(q => (
                        <div key={q.id}>
                          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">{q.label}</Label>
                          {q.type === 'select' ? (
                            <select value={data[section.id]?.[q.id] || ''} onChange={e => updateField(section.id, q.id, e.target.value)} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Vyberte...</option>
                              {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <Input type={q.type} placeholder={q.placeholder} value={data[section.id]?.[q.id] || ''} onChange={e => updateField(section.id, q.id, e.target.value)} />
                          )}
                        </div>
                      ))}
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Přílohy (PDF, foto smluv)</Label>
                        <button onClick={() => { setActiveUploadSection(section.id); fileRef.current?.click() }} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 hover:bg-slate-50 transition-all group">
                          <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1 group-hover:text-slate-600" />
                          <span className="text-sm text-slate-500 group-hover:text-slate-700">Klikněte pro nahrání PDF nebo fotky</span>
                        </button>
                        {sectionFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {sectionFiles.map(f => (
                              <div key={f.name} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="flex-1 text-slate-700 truncate">{f.name}</span>
                                <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                                <button onClick={() => removeFile(f.name)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
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

      <motion.div className="mt-8 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-3 rounded-xl hover:opacity-90 shadow-lg disabled:opacity-50">
          {loading ? 'Odesílám...' : 'Odeslat analýzu'} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}
