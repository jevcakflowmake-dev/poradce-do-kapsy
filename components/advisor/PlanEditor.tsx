'use client'

import { useState, useCallback } from 'react'
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp, Edit3, X, Check,
  Shield, Home, Clock, Baby, TrendingUp, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const SECTIONS = [
  { id: 'income', title: 'Zajisteni prijmu', label: 'Zajisteni prijmu', icon: Shield },
  { id: 'housing', title: 'Bydleni', label: 'Bydleni', icon: Home },
  { id: 'retirement', title: 'Duchod', label: 'Duchod', icon: Clock },
  { id: 'children', title: 'Deti', label: 'Deti', icon: Baby },
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

const SECTION_LABELS: Record<string, string> = {
  income: 'Zajisteni prijmu',
  housing: 'Bydleni',
  retirement: 'Duchod',
  children: 'Deti',
  investing: 'Investice',
  property: 'Majetek',
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
  const [showAnswers, setShowAnswers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // New variant form
  const [newCompany, setNewCompany] = useState('')
  const [newLogo, setNewLogo] = useState('')
  const [newPayment, setNewPayment] = useState('')

  // Editing param state
  const [editingParam, setEditingParam] = useState<string | null>(null)
  const [addingParamForVariant, setAddingParamForVariant] = useState<string | null>(null)
  const [paramForm, setParamForm] = useState({ param_label: '', value: '', note: '' })

  const sectionVariants = variants.filter(v => v.section === activeSection)
  const sectionRec = recommendations.find(r => r.section === activeSection)

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
      setFeedback('Varianta pridana')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  async function handleDeleteVariant(variantId: string) {
    const result = await apiCall({ action: 'delete_variant', variant_id: variantId })
    if (result) {
      setVariants(prev => prev.filter(v => v.id !== variantId))
      setParams(prev => prev.filter(p => p.variant_id !== variantId))
      setFeedback('Varianta smazana')
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
      setFeedback('Parametr pridan')
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
      setFeedback('Parametr smazan')
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
      setFeedback('Doporuceni ulozeno')
      setTimeout(() => setFeedback(null), 2000)
    }
  }

  const sectionAnswers = analysisResponses[activeSection] || {}

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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-white text-muted border border-surface hover:border-accent/30 hover:text-navy'
              }`}
              style={isActive ? { backgroundColor: '#162459' } : undefined}
            >
              <SectionIcon className="w-4 h-4" />
              {section.title}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent border border-accent/20">
          {feedback}
        </div>
      )}

      {/* Client answers collapsible */}
      <div className="bg-white rounded-xl border border-surface overflow-hidden">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface/30 transition-colors"
        >
          <span className="font-semibold text-navy">Odpovedi klienta</span>
          <span className="flex items-center gap-2 text-muted text-sm">
            {Object.keys(sectionAnswers).length} odpovedi
            {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>
        {showAnswers && (
          <div className="px-5 pb-5">
            <Separator className="mb-4" />
            {Object.keys(sectionAnswers).length === 0 ? (
              <p className="text-sm text-muted">Klient zatim nevyplnil tuto sekci.</p>
            ) : (
              <dl className="space-y-3">
                {Object.entries(sectionAnswers).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <dt className="text-muted font-medium">{key}</dt>
                    <dd className="text-navy font-semibold sm:text-right">{value}</dd>
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
            className="text-white gap-1.5 rounded-xl"
            style={{ backgroundColor: '#009EE2' }}
          >
            <Plus className="w-4 h-4" />
            Pridat variantu
          </Button>
        </div>

        {/* Add variant form */}
        {showAddVariant && (
          <div className="bg-white rounded-xl border-2 border-accent/30 p-5 mb-4 space-y-4">
            <h4 className="font-medium text-navy">Nova varianta</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Spolecnost</label>
                <Input
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="Kooperativa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Logo (emoji)</label>
                <Input
                  value={newLogo}
                  onChange={e => setNewLogo(e.target.value)}
                  placeholder="K"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Mesicni platba</label>
                <Input
                  value={newPayment}
                  onChange={e => setNewPayment(e.target.value)}
                  placeholder="1 500 Kc"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddVariant(false)}
                className="rounded-xl"
              >
                Zrusit
              </Button>
              <Button
                size="sm"
                onClick={handleAddVariant}
                disabled={saving || !newCompany.trim() || !newPayment.trim()}
                className="text-white rounded-xl"
                style={{ backgroundColor: '#162459' }}
              >
                {saving ? 'Ukladam...' : 'Ulozit'}
              </Button>
            </div>
          </div>
        )}

        {/* Variant cards */}
        {sectionVariants.length === 0 && !showAddVariant ? (
          <div className="bg-white rounded-xl border border-surface p-8 text-center text-muted text-sm">
            Zatim zadne varianty pro tuto sekci.
          </div>
        ) : (
          <div className="space-y-4">
            {sectionVariants.map(variant => {
              const variantParams = params.filter(p => p.variant_id === variant.id).sort((a, b) => a.sort_order - b.sort_order)
              return (
                <div key={variant.id} className="bg-white rounded-xl border border-surface overflow-hidden">
                  {/* Variant header */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: '#162459' }}
                    >
                      {variant.logo || variant.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-navy">{variant.company}</h4>
                      <p className="text-sm text-muted">
                        {variant.monthly_payment} / mesic
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="p-2 text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Smazat variantu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Params */}
                  {variantParams.length > 0 && (
                    <div className="px-5 pb-3">
                      <Separator className="mb-3" />
                      <div className="space-y-2">
                        {variantParams.map(param => (
                          <div key={param.id} className="flex items-center gap-2 bg-surface/50 rounded-lg px-4 py-2.5 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-navy">{param.param_label}</span>
                                <span className="text-sm font-bold text-navy bg-white px-2.5 py-0.5 rounded-md shadow-sm">
                                  {param.value}
                                </span>
                              </div>
                              {param.note && (
                                <p className="text-xs text-muted mt-0.5">{param.note}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteParam(variant.id, param.id)}
                              className="p-1 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
                      <div className="border border-accent/20 rounded-lg p-4 mt-2 space-y-3 bg-accent/5">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-muted mb-1">Nazev parametru</label>
                            <Input
                              value={paramForm.param_label}
                              onChange={e => setParamForm(prev => ({ ...prev, param_label: e.target.value }))}
                              placeholder="Denni odskodne"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted mb-1">Hodnota</label>
                            <Input
                              value={paramForm.value}
                              onChange={e => setParamForm(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="300 Kc/den"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">Poznamka (volitelne)</label>
                          <Input
                            value={paramForm.note}
                            onChange={e => setParamForm(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Vysvetlivka..."
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
                            className="rounded-lg text-xs"
                          >
                            Zrusit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddParam(variant.id)}
                            disabled={saving || !paramForm.param_label.trim() || !paramForm.value.trim()}
                            className="text-white rounded-lg text-xs"
                            style={{ backgroundColor: '#009EE2' }}
                          >
                            Pridat
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingParamForVariant(variant.id)
                          setParamForm({ param_label: '', value: '', note: '' })
                        }}
                        className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Pridat parametr
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
      <div className="bg-white rounded-xl border border-surface p-5 space-y-4">
        <h3 className="font-semibold text-navy text-lg">Doporuceni</h3>
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Status</label>
          <select
            value={recStatus}
            onChange={e => setRecStatus(e.target.value as 'ok' | 'recommendation' | 'action')}
            className="w-full h-10 rounded-xl border border-surface bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="ok">V poradku</option>
            <option value="recommendation">Doporuceni</option>
            <option value="action">Vyzaduje akci</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Body doporuceni (kazdy radek = 1 bod)</label>
          <textarea
            value={recText}
            onChange={e => setRecText(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-surface rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            placeholder="Doporucujeme sjednat zivotni pojisteni...&#10;Zvazit navyseni krytí invalidni renty...&#10;..."
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSaveRecommendation}
            disabled={saving}
            className="text-white gap-2 rounded-xl"
            style={{ backgroundColor: '#162459' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Ukladam...' : 'Ulozit doporuceni'}
          </Button>
        </div>
      </div>
    </div>
  )
}
