'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'
import { BARVY } from '@/lib/barvy'

function formatTime(dateStr: string) {
  return new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

export default function ChatWindow({
  clientId,
  myRole,
}: {
  clientId: string
  myRole: 'client' | 'advisor'
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Posouváme jen seznam zpráv. scrollIntoView by rolovalo i všechny předky,
  // tedy celou stránku a kartu s overflow-hidden, které pak uřízne hlavičku.
  const scrollToBottom = useCallback(() => {
    const list = listRef.current
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [])

  // Načti zprávy
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
      setMessages((data as Message[]) ?? [])
      setLoading(false)

      // Označit nepřečtené jako přečtené
      const unreadSenderRole = myRole === 'client' ? 'advisor' : 'client'
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('client_id', clientId)
        .eq('sender_role', unreadSenderRole)
        .eq('is_read', false)
    }
    load()
  }, [clientId, myRole, supabase])

  // Živé doručování zpráv
  useEffect(() => {
    let kanal: ReturnType<typeof supabase.channel> | null = null
    let zruseno = false

    async function pripojSe() {
      /**
       * Realtime posuzuje RLS podle tokenu na socketu, ne podle toho, čím se
       * posílají běžné dotazy. Bez `setAuth` se odběr tváří jako anonym:
       * `subscribe()` vrátí SUBSCRIBED, ale žádná událost nedorazí, protože
       * anonym na cizí řádky nevidí. Chat tím tiše přestal být živý –
       * zprávy se ukládaly správně a objevily se až po obnovení stránky.
       */
      const { data: { session } } = await supabase.auth.getSession()
      if (zruseno) return
      await supabase.realtime.setAuth(session?.access_token)

      kanal = supabase
        .channel(`chat:${clientId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `client_id=eq.${clientId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            // Vlastní odeslanou zprávu už v seznamu máme z odpovědi insertu.
            setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]))

            // Automaticky označit jako přečtené
            if (newMsg.sender_role !== myRole) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id)
            }
          },
        )
        .subscribe()
    }

    pripojSe()

    return () => {
      zruseno = true
      if (kanal) supabase.removeChannel(kanal)
    }
  }, [clientId, myRole, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const { error } = await supabase.from('messages').insert({
      client_id: clientId,
      sender_role: myRole,
      content: text,
    })

    // Zprávu od poradce klient uvidí jen v aplikaci – dáme mu vědět e-mailem.
    // Kdy e-mail opravdu odejde (ne u každé zprávy), rozhoduje server.
    if (!error && myRole === 'advisor') {
      fetch('/api/advisor/upozorneni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ udalost: 'nova_zprava', client_id: clientId }),
      }).catch(() => console.warn('[chat] upozornění klienta nedoručeno'))
    }

    setSending(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    // Obrys konverzace místo kolečka: uživatel vidí, kam zprávy dorazí,
    // a stránka při dočtení neposkočí.
    return (
      <div className="flex-1 min-h-0 p-5 space-y-3" aria-busy aria-label="Načítám konverzaci">
        {[
          'w-3/5 self-start',
          'w-2/5 ml-auto',
          'w-1/2 self-start',
        ].map((tvar) => (
          <div
            key={tvar}
            className={`h-12 rounded-2xl bg-line/70 animate-pulse ${tvar}`}
          />
        ))}
      </div>
    )
  }

  // min-h-0: flex položka jinak nesmí být nižší než svůj obsah. U delší
  // konverzace na nízké obrazovce by chat přetekl kartu o výšku její hlavičky.
  return (
    <div className="flex flex-col h-full min-h-0 bg-cream">
      <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-mint/10 border border-mint/25 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3
              className="font-display text-navy mb-1 text-h3"
            >
              Zahajte konverzaci
            </h3>
            <p className="text-base text-slate max-w-xs">
              {myRole === 'client'
                ? 'Máte otázky? Napište poradci – odpovídá zpravidla do 24 hodin.'
                : 'Napište klientovi zprávu nebo odpovězte na jeho dotazy.'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_role === myRole
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg || new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center text-[11px] tracking-wider uppercase text-slate my-3">
                  {formatTime(msg.created_at)}
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 shrink-0 mt-1"
                    style={{ background: BARVY.navy }}
                  >
                    P
                  </div>
                )}
                {/* Strop šířky: na kontejneru 1 600 px by 75 % dalo řádky přes 1 000 px */}
                <div
                  className={`max-w-[min(75%,40rem)] px-4 py-2.5 rounded-2xl text-base leading-relaxed ${
                    isMe
                      ? 'rounded-br-sm text-white shadow-sm'
                      : 'rounded-bl-sm bg-surface border border-line text-navy'
                  }`}
                  style={isMe ? { background: BARVY.navy } : {}}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {isMe && (
                    <p className="text-[11px] mt-1 opacity-70 text-right">
                      {msg.is_read ? 'Přečteno' : 'Odesláno'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-line p-4 bg-surface">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={myRole === 'client' ? 'Napište poradci…' : 'Odpovědět klientovi…'}
            className="chat-input flex-1 px-4 py-3 bg-cream border border-line rounded-2xl text-base text-navy placeholder:text-slate focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/10 transition-all"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-cream transition-colors disabled:opacity-40 hover:bg-navy-deep shrink-0"
            style={{ background: BARVY.navy }}
            aria-label="Odeslat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-slate mt-2 tracking-wide">Enter = odeslat · Shift+Enter = nový řádek</p>
      </div>
    </div>
  )
}
