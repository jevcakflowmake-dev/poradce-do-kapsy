'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notifyAdvisor } from '@/lib/notify'
import { BARVY } from '@/lib/barvy'

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  section: string
  sectionLabel: string
  onSent: () => void
}


export default function AskModal({ open, onClose, clientId, section, sectionLabel, onSent }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- úklid formuláře po zavření; komponenta zůstává kvůli výjezdové animaci připojená
      setText('')
      setError(null)
      setSending(false)
    }
  }, [open])

  // ESC close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = text.trim()
    if (clean.length < 5) {
      setError('Dotaz je moc krátký – napište alespoň pár slov.')
      return
    }
    setSending(true)
    setError(null)

    const supabase = createClient()

    // 1. Označit sekci jako "question"
    await supabase.from('plan_section_interest').upsert(
      {
        client_id: clientId,
        section,
        status: 'question',
        note: clean.slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,section' },
    )

    // 2. Poslat do chatu jako zprávu – viditelné v conversationě s poradcem
    const { error: msgError } = await supabase.from('messages').insert({
      client_id: clientId,
      sender_role: 'client',
      content: `📋 Dotaz k plánu – ${sectionLabel}\n\n${clean}`,
    })

    if (msgError) {
      setError('Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.')
      setSending(false)
      return
    }

    // 3. Webhook
    notifyAdvisor({
      event: 'section_question',
      client_id: clientId,
      section,
      section_label: sectionLabel,
      question: clean,
    })

    setSending(false)
    onSent()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-navy-deep/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-surface rounded-card border border-line shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navy proužek nahoře – bez gradientu, jen plocha */}
            <div
              className="absolute top-0 inset-x-0 h-1"
              style={{ background: BARVY.navy }}
              aria-hidden
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-cream hover:bg-line flex items-center justify-center text-slate hover:text-navy transition-all"
              aria-label="Zavřít"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={onSubmit} className="p-7 md:p-8">
              <p className="text-[11px] tracking-[0.25em] uppercase text-slate mb-2">
                Dotaz · {sectionLabel}
              </p>
              <h2
                className="font-display text-navy mb-2 text-h3"
              >
                Co vás zajímá?
              </h2>
              <p className="text-base text-slate mb-6 leading-relaxed">
                Napište poradci, čemu u této oblasti nerozumíte nebo co byste chtěli upravit. Zpráva
                půjde do vašeho chatu – odpověď dostanete obvykle do 24 hodin.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Např. Proč zrovna 3 miliony? Mám pocit že tolik nepotřebuju."
                className="w-full px-4 py-3 rounded-card border border-line bg-cream text-navy text-base placeholder:text-slate/70 focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all resize-none leading-relaxed"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate">
                <span>{error ? <span className="text-danger">{error}</span> : 'Enter = nový řádek'}</span>
                <span>{text.length} / 500</span>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  className="px-5 py-2.5 rounded-card text-base font-medium text-slate hover:text-navy hover:bg-cream transition-all"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={sending || text.trim().length < 5}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card text-base font-semibold text-cream transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: BARVY.navy }}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Odesílám…
                    </>
                  ) : (
                    <>
                      Odeslat <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
