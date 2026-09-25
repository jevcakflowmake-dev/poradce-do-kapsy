'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, Link2, Loader2, Mail } from 'lucide-react'
import { BARVY } from '@/lib/barvy'

/** Proč poradce přístup řeší – podle toho se vysvětluje, co odkaz udělá. */
export type SituacePristupu = 'prihlasen' | 'heslo_z_analyzy' | 'analyza_bez_hesla' | 'zalozil_poradce' | 'pozvan' | 'neprihlasen'

const POPIS: Record<SituacePristupu, string> = {
  prihlasen: 'Klient se do aplikace už přihlásil. Odkaz níž mu nechá nastavit nové heslo – hodí se, když to staré zapomněl.',
  heslo_z_analyzy:
    'Klient si při vyplnění analýzy zvolil heslo, takže se po potvrzení e-mailu přihlásit může. Odkaz níž mu heslo nechá nastavit znovu – hodí se, když ho zapomněl.',
  analyza_bez_hesla:
    'Klient vyplnil analýzu bez hesla, takže se zatím přihlásit nemůže. Pošlete mu odkaz na nastavení hesla, až bude finanční plán hotový.',
  zalozil_poradce:
    'Účet jste klientovi založili vy, takže heslo zatím nemá a přihlásit se nemůže. Pošlete mu odkaz na nastavení hesla, třeba až bude finanční plán hotový.',
  pozvan:
    'Klientovi odešla pozvánka, ale zatím si nenastavil heslo. Když mu odkaz vypršel nebo e-mail nenašel, pošlete mu nový.',
  neprihlasen:
    'Klient se zaregistroval, ale do aplikace se ještě nepřihlásil. Když mu přihlášení nejde, pošlete mu odkaz na nastavení hesla.',
}

interface Props {
  clientId: string
  situace: SituacePristupu
}

/**
 * Přístup do aplikace pro klienta. Poradce ho může klientovi poslat e-mailem
 * (Supabase přes vlastní SMTP, šablona „Nastavení hesla“), nebo si nechat
 * vygenerovat odkaz a poslat ho sám – třeba přes WhatsApp.
 *
 * Platí vždy jen nejnovější odkaz: e-mail i vygenerovaný odkaz ten
 * předchozí zneplatní, proto to pod tlačítky stojí napsané.
 */
export default function AccessLinkButton({ clientId, situace }: Props) {
  const [nacita, setNacita] = useState<'email' | 'odkaz' | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [odeslanoNa, setOdeslanoNa] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function vyzadat(poslat: boolean) {
    setNacita(poslat ? 'email' : 'odkaz')
    setError(null)
    try {
      const res = await fetch('/api/advisor/pristup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, poslat }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || (poslat ? 'E-mail se nepodařilo odeslat.' : 'Odkaz se nepodařilo vygenerovat.'))
        return
      }
      // Novější odkaz ten předchozí zneplatnil – starý ze stavu pryč.
      if (poslat) {
        setOdeslanoNa(payload.email)
        setLink(null)
      } else {
        setLink(payload.link)
        setOdeslanoNa(null)
      }
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
    } finally {
      setNacita(null)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Zkopírování selhalo – označte odkaz myší a zkopírujte ho ručně.')
    }
  }

  return (
    <div className="rounded-card bg-surface border border-line p-6 md:p-7">
      <div className="flex items-start gap-3 mb-4">
        <KeyRound className="w-5 h-5 text-navy shrink-0 mt-0.5" strokeWidth={1.8} />
        <div>
          <h3
            className="font-display text-navy mb-1 text-h3"
          >
            Přístup do aplikace
          </h3>
          <p className="text-sm text-slate leading-relaxed">{POPIS[situace]}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-card bg-danger/10 border border-danger/30 text-sm text-danger">
          {error}
        </div>
      )}

      {odeslanoNa && (
        <div role="status" className="mb-4 p-3 rounded-card bg-mint/10 border border-mint/30 text-sm text-navy">
          E-mail s odkazem na nastavení hesla odešel na {odeslanoNa}.
        </div>
      )}

      {link && (
        <div className="mb-4 flex items-center gap-2 rounded-card bg-cream border border-line px-3 py-2.5">
          <input
            readOnly
            value={link}
            onFocus={e => e.currentTarget.select()}
            aria-label="Odkaz pro nastavení hesla"
            className="flex-1 min-w-0 bg-transparent text-sm text-navy focus:outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-sm text-navy hover:text-navy transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Zkopírováno' : 'Kopírovat'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => vyzadat(true)}
          disabled={nacita !== null}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-mint/25"
          style={{ background: BARVY.navy }}
        >
          {nacita === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Poslat klientovi e-mailem
        </button>
        <button
          type="button"
          onClick={() => vyzadat(false)}
          disabled={nacita !== null}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card font-semibold text-navy text-sm border border-line bg-surface transition-colors disabled:opacity-50 hover:border-navy/40"
        >
          {nacita === 'odkaz' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Vygenerovat odkaz ke zkopírování
        </button>
      </div>
      <p className="mt-3 text-xs text-slate leading-relaxed">
        Odkaz je jednorázový a platí omezenou dobu (výchozí v Supabase je hodina). Platí vždy jen
        nejnovější – když pošlete e-mail a pak vygenerujete odkaz, ten z e-mailu už nefunguje.
      </p>
    </div>
  )
}
