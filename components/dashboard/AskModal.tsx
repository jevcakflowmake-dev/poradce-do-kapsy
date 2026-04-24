'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  section: string
  sectionLabel: string
  onSent: () => void
}

const WEBHOOK_URL = 'https://n8n.jevcakn8n.com/webhook/klient-zajem'

export default function AskModal({ open, onClose, clientId, section, sectionLabel, onSent }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
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
      setError('Dotaz je moc krátký — napište alespoň pár slov.')
      return
    }
    setSending(true)
    setError(null)

    const supabase = createClient()

    // 1. Označit sekci jako "question"
    await (supabase.from('plan_section_interest') as any).upsert(
      {
        client_id: clientId,
        section,
        status: 'question',
        note: clean.slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,section' },
    )

    // 2. Poslat do chatu jako zprávu — viditelné v conversationě s poradcem
    const { error: msgError } = await supabase.from('messages').insert({
      client_id: clientId,
      sender_role: 'client',
      content: `📋 Dotaz k plánu — ${sectionLabel}\n\n${clean}`,
    })

    if (msgError) {
      setError('Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.')
      setSending(false)
      return
    }

    // 3. Webhook
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'section_question',
          client_id: clientId,
          section,
          section_label: sectionLabel,
          question: clean,
          created_at: new Date().toISOString(),
        }),
      })
    } catch {}

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
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#0e1a3d]/45 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E8E9EE] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient top accent */}
            <div
              className="absolute top-0 inset-x-0 h-1"
              style={{ background: 'linear-gradient(90deg, #162459 0%, #009EE2 100%)' }}
              aria-hidden
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f8f9fc] hover:bg-[#E8E9EE] flex items-center justify-center text-[#818EAF] hover:text-[#162459] transition-all"
              aria-label="Zavřít"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={onSubmit} className="p-7 md:p-8">
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#818EAF] mb-2">
                Dotaz · {sectionLabel}
              </p>
              <h2
                className="font-display text-[#162459] mb-2"
                style={{ fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Co vás <span style={{ fontStyle: 'italic', color: '#009EE2' }}>zajímá</span>?
              </h2>
              <p className="text-sm text-[#818EAF] mb-6 leading-relaxed">
                Napište poradci, čemu u této oblasti nerozumíte nebo co byste chtěli upravit. Zpráva
                půjde do vašeho chatu — odpověď dostanete obvykle do 24 hodin.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Např. Proč zrovna 3 miliony? Mám pocit že tolik nepotřebuju."
                className="w-full px-4 py-3 rounded-xl border border-[#E8E9EE] bg-[#f8f9fc] text-[#162459] text-[14px] placeholder:text-[#818EAF]/70 focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all resize-none leading-relaxed"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2 text-[11px] text-[#818EAF]">
                <span>{error ? <span className="text-[#c2410c]">{error}</span> : 'Enter = nový řádek'}</span>
                <span>{text.length} / 500</span>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#818EAF] hover:text-[#162459] hover:bg-[#f8f9fc] transition-all"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={sending || text.trim().length < 5}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
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
