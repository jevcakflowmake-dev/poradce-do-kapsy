'use client'

import { useMemo } from 'react'
import { Shield } from 'lucide-react'
import { type RiskKey, type VolbyKryti } from '@/lib/income-risks'
import SrovnaniVariant, { VyberVarianty } from './SrovnaniVariant'
import ScenarePojistky from './ScenarePojistky'
import { ctiProdukt } from '@/lib/produkt-varianty'

type IncomeDetails = {
  payout_60?: number | null
  payout_50?: number | null
  waiting_period_days?: number | null
  max_payout_years?: number | null
  accident_pn_combine?: boolean
  /** Volby plnění – „od 29. dne“, „pevná pojistná částka“… */
  volby?: VolbyKryti | null
} & Partial<Record<RiskKey, number | null>>

export interface IncomeVariant {
  id: string
  company: string
  logo: string
  monthly_payment: string
  details: IncomeDetails | null
}

interface Props {
  monthlyIncomeNet: number | null
  variants: IncomeVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
  /** Zbývá doplatit na hypotéce – kotva u plnění při úmrtí. */
  zbytekHypoteky: number | null
}


function fmtCzk(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

export default function IncomeLifeChart({
  monthlyIncomeNet,
  variants,
  selectedVariantId,
  onSelect,
  zbytekHypoteky,
}: Props) {

  // Selected variant payout summary
  const selected = useMemo(
    () => (selectedVariantId ? variants.find((v) => v.id === selectedVariantId) : null),
    [selectedVariantId, variants],
  )

  // Až za hooky: dřív tu byl brzký návrat a `useMemo` výš se pak volaly
  // podmíněně – při prvním naplnění dat by se pořadí hooků změnilo.
  if (!monthlyIncomeNet || variants.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line p-8 text-center">
        <p className="text-sm text-slate">
          {!monthlyIncomeNet
            ? 'Poradce zatím nenastavil váš příjem v plánu.'
            : 'Žádná varianta zatím není k dispozici.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Dřív tu byl sloupcový graf poklesu příjmu. Sloupce ale přesahovaly
          čáru stoprocentního příjmu, takže to vypadalo, že nemocný klient
          bude mít víc peněz než zdravý, a legenda nesouhlasila s barvami.
          Stejná čísla jsou ve srovnání níž; tady stačí říct, z čeho vychází. */}
      <div>
        <h3 className="text-navy font-display text-base font-semibold">Co se stane, když vám klesne příjem?</h3>
        <p className="text-base text-slate mt-1.5 max-w-2xl text-pretty">
          Váš čistý příjem je <strong className="text-navy">{fmtCzk(monthlyIncomeNet)}</strong> měsíčně.
          Při nemoci nebo úrazu klesne – počítáme se dvěma situacemi, poklesem na 60 %
          ({fmtCzk(monthlyIncomeNet * 0.6)}) a na 50 % ({fmtCzk(monthlyIncomeNet * 0.5)}). Kolik k tomu
          měsíčně doplatí která pojistka, je ve srovnání níž.
        </p>
      </div>

      {/* Srovnání parametr po parametru a pod ním volba. Dřív měla každá
          varianta vlastní kartu s pěti údaji a porovnávat se muselo očima. */}
      <SrovnaniVariant variants={variants} selectedId={selectedVariantId} />
      <VyberVarianty
        variants={variants.map((v) => ({ ...v, produkt: ctiProdukt(v.details)?.nazev }))}
        selectedId={selectedVariantId}
        onSelect={onSelect}
      />

      {/* Vybraná varianta – sumář */}
      {selected && (
        <div className="rounded-card bg-mint/8 border border-mint/25 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-navy mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy">
                Vybraná varianta: {selected.company}
              </p>
              <p className="text-xs text-navy/80 mt-1 leading-relaxed">
                Při výpadku příjmu na 60 % vám pojistka pošle <strong>{fmtCzk(selected.details?.payout_60 ?? 0)}</strong> měsíčně,
                při 50 % až <strong>{fmtCzk(selected.details?.payout_50 ?? 0)}</strong> měsíčně.
                Měsíční pojistné: <strong>{selected.monthly_payment}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Místo osy rizik a bloku krytí: co vybraná varianta znamená v penězích.
          Dokud klient nevybral, ukáže se první varianta jako náhled. */}
      <ScenarePojistky
        variant={selected ?? variants[0]}
        jeNahled={!selected}
        zbytekHypoteky={zbytekHypoteky}
        cistyPrijem={monthlyIncomeNet}
      />
    </div>
  )
}
