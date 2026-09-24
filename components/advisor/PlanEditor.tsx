'use client'

import { useState, useCallback, useId } from 'react'
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp, X,
  Shield, Home, Clock, Baby, TrendingUp, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { BARVY } from '@/lib/barvy'
import { plural } from '@/lib/utils'
import { ctiProdukt, type ProduktVarianty } from '@/lib/produkt-varianty'
import { partnerPodleNazvu } from '@/lib/partneri'
import { SECTIONS as OTAZKY_ANALYZY, popisOdpovedi } from '@/lib/analysis-sections'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import SeznamPartneru from '@/components/partneri/SeznamPartneru'

const SECTIONS = [
  { id: 'income', title: 'Zajištění příjmů', label: 'Zajištění příjmů', icon: Shield },
  { id: 'housing', title: 'Bydlení', label: 'Bydlení', icon: Home },
  { id: 'retirement', title: 'Důchod', label: 'Důchod', icon: Clock },
  { id: 'children', title: 'Děti', label: 'Děti', icon: Baby },
  { id: 'investing', title: 'Investice', label: 'Investice', icon: TrendingUp },
  { id: 'property', title: 'Majetek', label: 'Majetek', icon: Building2 },
] as const

type SectionId = typeof SECTIONS[number]['id']

interface Variant {
  id: string
  client_id: string
  section: string
  company: string
  logo: string
  monthly_payment: string
  sort_order: number
  /** jsonb – u zajištění příjmu čísla rizik, pod klíčem `produkt` detail produktu */
  details?: unknown
}

interface Param {
  id: string
  variant_id: string
  param_key: string
  param_label: string
  value: string
  note: string
  sort_order: number
}

interface Recommendation {
  id: string
  client_id: string
  section: string
  status: 'ok' | 'recommendation' | 'action'
  items: string[]
}

interface PlanEditorProps {
  clientId: string
  initialVariants: Variant[]
  initialParams: Param[]
  initialRecommendations: Recommendation[]
  analysisResponses: Record<string, Record<string, string>>
}

export default function PlanEditor({
  clientId,
  initialVariants,
  initialParams,
  initialRecommendations,
  analysisResponses,
}: PlanEditorProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [params, setParams] = useState<Param[]>(initialParams)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)
  const [activeSection, setActiveSection] = useState<SectionId>('income')
  const [showAddVariant, setShowAddVariant] = useState(false)
  // Detail produktu se edituje po jedné variantě, ať je jasné, co se ukládá.
  const [produktProVariantu, setProduktProVariantu] = useState<string | null>(null)
  const [produktForm, setProduktForm] = useState<ProduktVarianty>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // New variant form
  const [newCompany, setNewCompany] = useState('')
  const [newLogo, setNewLogo] = useState('')
  const [newPayment, setNewPayment] = useState('')
  const idPartneru = useId()
  // Partnera klient uvidí s logem; zkratka se pak vyplňovat nemusí.
  const novyPartner = partnerPodleNazvu(newCompany)

  // Editing param state – čte se jen setter, hodnota nikde potřeba není
  const [, setEditingParam] = useState<string | null>(null)
  const [addingParamForVariant, setAddingParamForVariant] = useState<string | null>(null)
  const [paramForm, setParamForm] = useState({ param_label: '', value: '', note: '' })

  const sectionVariants = variants.filter(v => v.section === activeSection)

  const [recText, setRecText] = useState('')
  const [recStatus, setRecStatus] = useState<'ok' | 'recommendation' | 'action'>('recommendation')

  // Sync rec text when section changes
  const updateRecText = useCallback((sectionId: SectionId) => {
    const rec = recommendations.find(r => r.section === sectionId)
    if (rec) {
      setRecText((rec.items || []).join('\n'))
      setRecStatus(rec.status)
    } else {
      setRecText('')
      setRecStatus('recommendation')
    }
  }, [recommendations])

  const handleSectionChange = (sectionId: SectionId) => {
    setActiveSection(sectionId)
    setShowAddVariant(false)
    setShowAnswers(false)
    setAddingParamForVariant(null)
    setEditingParam(null)
    updateRecText(sectionId)
  }

  // Initialize rec text on mount
  useState(() => {
    updateRecText(activeSection)
  })

  async function apiCall(body: Record<string, unknown>) {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/advisor/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chyba')
      return data
    } catch (err) {
      setFeedback((err as Error).message)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProdukt(variantId: string) {
    const result = await apiCall({ action: 'update_variant', variant_id: variantId, produkt: produktForm })
    if (result) {
      setVariants(prev =>
        prev.map(v =>
          v.id === variantId
            ? { ...v, details: { ...((v.details as Record<string, unknown>) ?? {}), produkt: produktForm } }
            : v,
        ),
      )
      setProduktProVariantu(null)
      setFeedback('Detail produktu uložen')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleAddVariant() {
    if (!newCompany.trim() || !newPayment.trim()) return
    const result = await apiCall({
      action: 'create_variant',
      client_id: clientId,
      section: activeSection,
      company: newCompany.trim(),
      logo: newLogo.trim() || newCompany.trim()[0],
      monthly_payment: newPayment.trim(),
      sort_order: sectionVariants.length,
    })
    if (result && result.id) {
      setVariants(prev => [...prev, result])
      setNewCompany('')
      setNewLogo('')
      setNewPayment('')
      setShowAddVariant(false)
      setFeedback('Varianta přidána')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleDeleteVariant(variantId: string) {
    const result = await apiCall({ action: 'delete_variant', variant_id: variantId })
    if (result) {
      setVariants(prev => prev.filter(v => v.id !== variantId))
      setParams(prev => prev.filter(p => p.variant_id !== variantId))
      setFeedback('Varianta smazána')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleAddParam(variantId: string) {
    if (!paramForm.param_label.trim() || !paramForm.value.trim()) return
    const variantParams = params.filter(p => p.variant_id === variantId)
    const newParams = [
      ...variantParams.map(p => ({
        param_key: p.param_key || p.param_label.toLowerCase().replace(/\s+/g, '_'),
        param_label: p.param_label,
        value: p.value,
        note: p.note,
      })),
      {
        param_key: paramForm.param_label.toLowerCase().replace(/\s+/g, '_'),
        param_label: paramForm.param_label.trim(),
        value: paramForm.value.trim(),
        note: paramForm.note.trim(),
      },
    ]
    const result = await apiCall({ action: 'upsert_params', variant_id: variantId, params: newParams })
    if (result) {
      // Reload params for this variant - add locally
      const newParamObjects: Param[] = newParams.map((p, i) => ({
        id: `temp-${variantId}-${i}-${Date.now()}`,
        variant_id: variantId,
        param_key: p.param_key,
        param_label: p.param_label,
        value: p.value,
        note: p.note,
        sort_order: i,
      }))
      setParams(prev => [...prev.filter(p => p.variant_id !== variantId), ...newParamObjects])
      setParamForm({ param_label: '', value: '', note: '' })
      setAddingParamForVariant(null)
      setFeedback('Parametr přidán')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleDeleteParam(variantId: string, paramId: string) {
    const remaining = params.filter(p => p.variant_id === variantId && p.id !== paramId)
    const newParams = remaining.map(p => ({
      param_key: p.param_key || p.param_label.toLowerCase().replace(/\s+/g, '_'),
      param_label: p.param_label,
      value: p.value,
      note: p.note,
    }))
    const result = await apiCall({ action: 'upsert_params', variant_id: variantId, params: newParams })
    if (result) {
      setParams(prev => prev.filter(p => p.id !== paramId))
      setFeedback('Parametr smazán')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleSaveRecommendation() {
    const items = recText.split('\n').filter(line => line.trim())
    const result = await apiCall({
      action: 'upsert_recommendation',
      client_id: clientId,
      section: activeSection,
      status: recStatus,
      items,
    })
    if (result) {
      const existing = recommendations.find(r => r.section === activeSection)
      if (existing) {
        setRecommendations(prev =>
          prev.map(r => r.section === activeSection ? { ...r, status: recStatus, items } : r)
        )
      } else {
        setRecommendations(prev => [
          ...prev,
          { id: `temp-${Date.now()}`, client_id: clientId, section: activeSection, status: recStatus, items },
        ])
      }
      setFeedback('Doporučení uloženo')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  // Jen odpovědi na otázky, které analýza pořád má – osiřelé (přejmenované,
  // zrušené) by se vypsaly jako holé id. Stejně jako v detailu klienta.
  const otazkySekce = OTAZKY_ANALYZY.find((s) => s.id === activeSection)?.questions ?? []
  const sectionAnswers = Object.fromEntries(
    Object.entries(analysisResponses[activeSection] || {}).filter(([qId]) => otazkySekce.some((q) => q.id === qId)),
  )

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SECTIONS.map(section => {
          const isActive = activeSection === section.id
          const SectionIcon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-card text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-surface text-slate border border-surface hover:border-mint/40 hover:text-navy'
              }`}
              style={isActive ? { backgroundColor: BARVY.navy } : undefined}
            >
              <SectionIcon className="w-4 h-4" />
              {section.title}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="px-4 py-2.5 rounded-card text-sm font-medium bg-mint/10 text-navy border border-mint/30">
          {feedback}
        </div>
      )}

      {/* Client answers collapsible */}
      <div className="bg-surface rounded-card border border-surface overflow-hidden">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface/30 transition-colors"
        >
          <span className="font-semibold text-navy">Odpovědi klienta</span>
          <span className="flex items-center gap-2 text-slate text-sm">
            {Object.keys(sectionAnswers).length} {plural(Object.keys(sectionAnswers).length, 'odpověď', 'odpovědi', 'odpovědí')}
            {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
        {showAnswers && (
          <div className="px-5 pb-5">
            <Separator className="mb-4" />
            {Object.keys(sectionAnswers).length === 0 ? (
              <p className="text-sm text-slate">Klient zatím nevyplnil tuto sekci.</p>
            ) : (
              <dl className="space-y-3">
                {Object.entries(sectionAnswers).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <dt className="text-slate font-medium">{otazkySekce.find((q) => q.id === key)?.label ?? key}</dt>
                    <dd className="text-navy font-semibold sm:text-right">{popisOdpovedi(activeSection, key, value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy text-lg">Varianty</h3>
          <Button
            onClick={() => setShowAddVariant(!showAddVariant)}
            size="sm"
            className="text-white gap-1.5 rounded-card"
            style={{ backgroundColor: BARVY.mint }}
          >
            <Plus className="w-4 h-4" />
            Přidat variantu
          </Button>
        </div>

        {/* Add variant form */}
        {showAddVariant && (
          <div className="bg-surface rounded-card border-2 border-mint/40 p-5 mb-4 space-y-4">
            <h4 className="font-medium text-navy">Nová varianta</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-slate mb-1">Společnost</span>
                <Input
                  list={idPartneru}
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="Začněte psát, třeba Allianz"
                />
                <SeznamPartneru id={idPartneru} />
              </label>
              {novyPartner ? (
                <div>
                  <span className="block text-sm font-medium text-slate mb-1">Logo</span>
                  <div className="flex items-center gap-3">
                    <LogoFirmy firma={newCompany} />
                    <span className="text-sm text-slate text-pretty">Klient uvidí logo společnosti {novyPartner.nazev}.</span>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="block text-sm font-medium text-slate mb-1">Zkratka místo loga</span>
                  <Input
                    value={newLogo}
                    onChange={e => setNewLogo(e.target.value)}
                    placeholder="K"
                  />
                </label>
              )}
              <label className="block">
                <span className="block text-sm font-medium text-slate mb-1">Měsíční platba</span>
                <Input
                  value={newPayment}
                  onChange={e => setNewPayment(e.target.value)}
                  placeholder="1 500 Kč"
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddVariant(false)}
                className="rounded-card"
              >
                Zrušit
              </Button>
              <Button
                size="sm"
                onClick={handleAddVariant}
                disabled={saving || !newCompany.trim() || !newPayment.trim()}
                className="text-white rounded-card"
                style={{ backgroundColor: BARVY.navy }}
              >
                {saving ? 'Ukládám…' : 'Uložit'}
              </Button>
            </div>
          </div>
        )}

        {/* Variant cards */}
        {sectionVariants.length === 0 && !showAddVariant ? (
          <div className="bg-surface rounded-card border border-surface p-8 text-center text-slate text-sm">
            Zatím žádné varianty pro tuto sekci.
          </div>
        ) : (
          <div className="space-y-4">
            {sectionVariants.map(variant => {
              const variantParams = params.filter(p => p.variant_id === variant.id).sort((a, b) => a.sort_order - b.sort_order)
              return (
                <div key={variant.id} className="bg-surface rounded-card border border-surface overflow-hidden">
                  {/* Variant header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Stejná dlaždice, jakou uvidí klient v plánu. */}
                    <LogoFirmy firma={variant.company} nahrada={variant.logo || variant.company[0]} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-navy">{variant.company}</h4>
                      <p className="text-sm text-slate">
                        {variant.monthly_payment} / měsíc
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const otevrit = produktProVariantu === variant.id ? null : variant.id
                        setProduktProVariantu(otevrit)
                        if (otevrit) setProduktForm(ctiProdukt(variant.details) ?? {})
                      }}
                      className="px-3 py-2 text-sm text-slate hover:text-navy transition-colors rounded-card hover:bg-cream"
                      title="Co to je za produkt a kam volat při pojistné události"
                    >
                      {ctiProdukt(variant.details) ? 'Detail produktu ✓' : 'Detail produktu'}
                    </button>
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="p-2 text-slate hover:text-red-500 transition-colors rounded-card hover:bg-red-50"
                      title="Smazat variantu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {produktProVariantu === variant.id && (
                    <div className="px-5 pb-4 space-y-3 border-t border-line pt-4">
                      <p className="text-sm text-slate">
                        Co klient uvidí v rozbaleném detailu varianty a co mu zůstane ve vytištěném
                        plánu. Prázdná pole se nezobrazí; smazáním všech detail zmizí.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <PoleProduktu label="Název produktu" value={produktForm.nazev ?? ''} placeholder="BelMondo 20"
                          onChange={(v) => setProduktForm(f => ({ ...f, nazev: v }))} />
                        <PoleProduktu label="Běží do" value={produktForm.doVeku ?? ''} placeholder="do 65 let"
                          onChange={(v) => setProduktForm(f => ({ ...f, doVeku: v }))} />
                        <PoleProduktu label="Platí se" value={produktForm.frekvence ?? ''} placeholder="Měsíčně"
                          onChange={(v) => setProduktForm(f => ({ ...f, frekvence: v }))} />
                        <PoleProduktu label="Hlášení pojistné události" value={produktForm.hlaseni ?? ''} placeholder="800 105 105 nebo odkaz"
                          onChange={(v) => setProduktForm(f => ({ ...f, hlaseni: v }))} />
                        <PoleProduktu label="Platby a změny" value={produktForm.kontakt ?? ''} placeholder="telefon, e-mail nebo odkaz"
                          onChange={(v) => setProduktForm(f => ({ ...f, kontakt: v }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate mb-1.5">Co produkt dělá</label>
                        <textarea
                          value={produktForm.popis ?? ''}
                          onChange={(e) => setProduktForm(f => ({ ...f, popis: e.target.value }))}
                          rows={2}
                          placeholder="Dvě věty, kterým klient rozumí i za tři roky."
                          className="w-full px-4 py-3 border border-line rounded-card text-sm text-navy focus:outline-none focus:ring-4 focus:ring-mint/20 resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setProduktProVariantu(null)} variant="outline" className="rounded-card">
                          Zrušit
                        </Button>
                        <Button
                          onClick={() => handleSaveProdukt(variant.id)}
                          disabled={saving}
                          className="text-white gap-2 rounded-card"
                          style={{ backgroundColor: BARVY.navy }}
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Ukládám…' : 'Uložit detail'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Params */}
                  {variantParams.length > 0 && (
                    <div className="px-5 pb-3">
                      <Separator className="mb-3" />
                      <div className="space-y-2">
                        {variantParams.map(param => (
                          <div key={param.id} className="flex items-center gap-2 bg-surface/50 rounded-card px-4 py-2.5 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-navy">{param.param_label}</span>
                                <span className="text-sm font-bold text-navy bg-surface px-2.5 py-0.5 rounded-card shadow-sm">
                                  {param.value}
                                </span>
                              </div>
                              {param.note && (
                                <p className="text-xs text-slate mt-0.5">{param.note}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteParam(variant.id, param.id)}
                              className="p-1 text-slate hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              title="Smazat parametr"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add param */}
                  <div className="px-5 pb-4">
                    {addingParamForVariant === variant.id ? (
                      <div className="border border-mint/30 rounded-card p-4 mt-2 space-y-3 bg-mint/8">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate mb-1">Název parametru</label>
                            <Input
                              value={paramForm.param_label}
                              onChange={e => setParamForm(prev => ({ ...prev, param_label: e.target.value }))}
                              placeholder="Denní odškodné"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate mb-1">Hodnota</label>
                            <Input
                              value={paramForm.value}
                              onChange={e => setParamForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="300 Kč/den"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate mb-1">Poznámka (volitelné)</label>
                          <Input
                            value={paramForm.note}
                            onChange={e => setParamForm(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Vysvětlivka…"
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddingParamForVariant(null)
                              setParamForm({ param_label: '', value: '', note: '' })
                            }}
                            className="rounded-card text-xs"
                          >
                            Zrušit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddParam(variant.id)}
                            disabled={saving || !paramForm.param_label.trim() || !paramForm.value.trim()}
                            className="text-white rounded-card text-xs"
                            style={{ backgroundColor: BARVY.mint }}
                          >
                            Přidat
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingParamForVariant(variant.id)
                          setParamForm({ param_label: '', value: '', note: '' })
                        }}
                        className="flex items-center gap-1.5 text-sm text-navy hover:text-mint-dark transition-colors mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Přidat parametr
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className="bg-surface rounded-card border border-surface p-5 space-y-4">
        <h3 className="font-semibold text-navy text-lg">Doporučení</h3>
        <div>
          <label className="block text-sm font-medium text-slate mb-1.5">Status</label>
          <select
            value={recStatus}
            onChange={e => setRecStatus(e.target.value as 'ok' | 'recommendation' | 'action')}
            className="w-full h-10 rounded-card border border-line bg-surface px-3 text-sm text-navy focus:outline-none focus:ring-4 focus:ring-mint/20"
          >
            <option value="ok">V pořádku</option>
            <option value="recommendation">Doporučení</option>
            <option value="action">Vyžaduje akci</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate mb-1.5">Body doporučení (každý řádek = 1 bod)</label>
          <textarea
            value={recText}
            onChange={e => setRecText(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-line rounded-card text-sm text-navy focus:outline-none focus:ring-4 focus:ring-mint/20 resize-none"
            placeholder="Doporučujeme sjednat životní pojištění…&#10;Zvážit navýšení krytí invalidní renty…&#10;…"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSaveRecommendation}
            disabled={saving}
            className="text-white gap-2 rounded-card"
            style={{ backgroundColor: BARVY.navy }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Ukládám…' : 'Uložit doporučení'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PoleProduktu({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-card border border-line bg-surface px-3 text-sm text-navy focus:outline-none focus:ring-4 focus:ring-mint/20"
      />
    </div>
  )
}
