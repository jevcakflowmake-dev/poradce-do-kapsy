'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react'

interface Props {
  clientId: string
  /** Zvolil si klient heslo hned ve veřejné analýze? Pak přístup už má. */
  hasPassword: boolean
}

/**
 * Vygeneruje odkaz, kterým si klient nastaví heslo a dostane se ke svému
 * plánu. Odkaz se zobrazí ke zkopírování — poradce ho pošle sám, protože
 * na doručení e-mailu ze Supabase se dokud není vlastní SMTP spolehnout nedá.
 */
export default function AccessLinkButton({ clientId, hasPassword }: Props) {
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/advisor/pristup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'Odkaz se nepodařilo vygenerovat.')
        return
      }
      setLink(payload.link)
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Zkopírování selhalo — označte odkaz myší a zkopírujte ho ručně.')
    }
  }

  return (
    <div className="bg-[#FDFCF8] border border-[#E4DFD2] p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <KeyRound className="w-5 h-5 text-[#009EE2] shrink-0 mt-0.5" strokeWidth={1.8} />
        <div>
          <h3
            className="font-display text-[#162459] mb-1"
            style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}
          >
            Přístup do aplikace
          </h3>
          <p className="text-sm text-[#66708C] leading-relaxed">
            {hasPassword
              ? 'Klient si při vyplnění analýzy zvolil heslo, takže se přihlásit může. Odkaz níž mu heslo nechá nastavit znovu — hodí se, když ho zapomněl.'
              : 'Klient vyplnil analýzu bez hesla, takže se zatím přihlásit nemůže. Vygenerujte mu odkaz a pošlete ho, až bude finanční plán hotový.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] text-sm text-[#c2410c]">
          {error}
        </div>
      )}

      {link ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#F6F4EE] border border-[#E4DFD2] px-3 py-2.5">
            <input
              readOnly
              value={link}
              onFocus={e => e.currentTarget.select()}
              aria-label="Odkaz pro nastavení hesla"
              className="flex-1 min-w-0 bg-transparent text-sm text-[#162459] focus:outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 text-sm text-[#0079AD] hover:text-[#162459] transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Zkopírováno' : 'Kopírovat'}
            </button>
          </div>
          <p className="text-xs text-[#66708C] leading-relaxed">
            Odkaz je jednorázový a časově omezený (výchozí platnost v Supabase je
            1 hodina). Pošlete ho klientovi rovnou — když vyprší, vygenerujte nový.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25"
          style={{ background: '#162459' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Vygenerovat odkaz pro přístup
        </button>
      )}
    </div>
  )
}
