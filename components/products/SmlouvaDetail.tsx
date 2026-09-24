'use client'

import { QRCodeSVG } from 'qrcode.react'
import { FileText } from 'lucide-react'
import KrytiPojistky from '@/components/pojisteni/KrytiPojistky'
import StoredFileLink from '@/components/files/StoredFileLink'
import { spaydRetezec, type ObsahSmlouvy } from '@/lib/smlouvy'
import { odkazNaKontakt } from '@/lib/produkt-varianty'
import { BARVY } from '@/lib/barvy'

/**
 * Uzavřená smlouva popsaná stejně jako v finančním plánu: sjednané krytí
 * po skupinách, k tomu údaje o placení a kontakty.
 *
 * QR platba je tu naopak i na obrazovce — klient ji čte telefonem z monitoru,
 * aby nemusel přepisovat číslo účtu a variabilní symbol.
 */
export default function SmlouvaDetail({
  smlouva,
  fileUrl,
}: {
  smlouva: ObsahSmlouvy
  fileUrl: string | null
}) {
  const spayd = spaydRetezec(smlouva.platba)
  const kc = (n: number) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč'

  const udaje = [
    smlouva.cisloSmlouvy && (['Číslo smlouvy', smlouva.cisloSmlouvy] as const),
    smlouva.doVeku && (['Běží do', smlouva.doVeku] as const),
    smlouva.frekvence && (['Platí se', smlouva.frekvence] as const),
  ].filter(Boolean) as ReadonlyArray<readonly [string, string]>

  const kontakty = [
    smlouva.hlaseni && (['Hlášení pojistné události', smlouva.hlaseni] as const),
    smlouva.kontakt && (['Platby a změny', smlouva.kontakt] as const),
  ].filter(Boolean) as ReadonlyArray<readonly [string, string]>

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-5">
      {(smlouva.spolecnost || smlouva.produkt) && (
        <div>
          {smlouva.spolecnost && <p className="text-base text-slate">{smlouva.spolecnost}</p>}
          {smlouva.produkt && <p className="font-display text-navy text-lead">{smlouva.produkt}</p>}
          {smlouva.popis && (
            <p className="text-base text-slate mt-1.5 max-w-2xl text-pretty">{smlouva.popis}</p>
          )}
        </div>
      )}

      {udaje.length > 0 && (
        <dl className="flex flex-wrap gap-x-8 gap-y-1.5">
          {udaje.map(([popisek, hodnota]) => (
            <div key={popisek} className="flex items-baseline gap-2">
              <dt className="text-base text-slate">{popisek}</dt>
              <dd className="text-base text-navy">{hodnota}</dd>
            </div>
          ))}
        </dl>
      )}

      {smlouva.kryti && (
        <KrytiPojistky castky={smlouva.kryti} titulek="Co máte sjednané" zvyraznit />
      )}

      {smlouva.platba && (smlouva.platba.castka || smlouva.platba.ucet) && (
        <div className="rounded-card border border-line bg-cream p-4 md:p-5">
          <h4 className="font-display text-navy">Platba</h4>
          <div className="mt-3 flex flex-wrap gap-6 items-start">
            <dl className="space-y-1.5 min-w-0">
              {smlouva.platba.castka && (
                <Radek popisek="Předpis" hodnota={kc(smlouva.platba.castka)} />
              )}
              {smlouva.platba.ucet && <Radek popisek="Účet" hodnota={smlouva.platba.ucet} />}
              {smlouva.platba.vs && <Radek popisek="Variabilní symbol" hodnota={smlouva.platba.vs} />}
            </dl>

            {spayd ? (
              <figure className="shrink-0">
                <QRCodeSVG value={spayd} size={104} level="M" bgColor={BARVY.surface} fgColor={BARVY.navy} />
                <figcaption className="text-base text-slate mt-1.5">QR platba</figcaption>
              </figure>
            ) : (
              /* Bez čísla účtu a částky by QR vedl neznámo kam. */
              <p className="text-base text-slate max-w-xs text-pretty">
                QR platbu doplním, jakmile od pojišťovny přijdou platební údaje.
              </p>
            )}
          </div>
        </div>
      )}

      {kontakty.length > 0 && (
        <ul className="space-y-1.5">
          {kontakty.map(([popisek, hodnota]) => {
            const odkaz = odkazNaKontakt(hodnota)
            return (
              <li key={popisek} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-base text-slate">{popisek}:</span>
                {odkaz ? (
                  <a
                    href={odkaz.href}
                    target={odkaz.href.startsWith('http') ? '_blank' : undefined}
                    rel={odkaz.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 break-all"
                  >
                    {odkaz.popisek}
                  </a>
                ) : (
                  <span className="text-base text-navy break-all">{hodnota}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Bez souboru jen tehdy, když poradce popisek zadal výslovně – samotné
          „ke stažení zde“ bez odkazu by klienta mátlo. */}
      {(fileUrl || smlouva.souborPopisek) && (
      <div className="pt-4 border-t border-line">
        {fileUrl ? (
          <StoredFileLink
            bucket="proposals"
            path={fileUrl}
            className="inline-flex items-center gap-2 text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <FileText className="w-4 h-4" aria-hidden />
            {smlouva.souborPopisek ?? 'Smlouva a podmínky ke stažení'}
          </StoredFileLink>
        ) : (
          <p className="inline-flex items-center gap-2 text-base text-slate">
            <FileText className="w-4 h-4" aria-hidden />
            {smlouva.souborPopisek}
          </p>
        )}
      </div>
      )}
    </div>
  )
}

function Radek({ popisek, hodnota }: { popisek: string; hodnota: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-base text-slate w-40 shrink-0">{popisek}</dt>
      <dd className="text-base text-navy tabular-nums break-all">{hodnota}</dd>
    </div>
  )
}
