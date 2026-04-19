'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'

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
  advisorName = 'Váš poradce',
}: {
  clientId: string
  myRole: 'client' | 'advisor'
  advisorName?: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
  }, [clientId, myRole])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
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
          setMessages(prev => [...prev, newMsg])

          // Automaticky označit jako přečtené
          if (newMsg.sender_role !== myRole) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId, myRole])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    await supabase.from('messages').insert({
      client_id: clientId,
      sender_role: myRole,
      content: text,
    })

    setSending(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zprávy */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#eff6ff' }}>
              <svg className="w-8 h-8" style={{ color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Zahajte konverzaci</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {myRole === 'client'
                ? 'Máte otázky? Napište poradci — odpovídá zpravidla do 24 hodin.'
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
                <div className="text-center text-xs text-slate-400 my-3">
                  {formatTime(msg.created_at)}
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 shrink-0 mt-1" style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}>
                    P
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm bg-white border border-slate-100 text-slate-800 shadow-sm'
                  }`}
                  style={isMe ? { background: 'linear-gradient(135deg, #162459, #243471)' } : {}}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {isMe && !msg.is_read && (
                    <p className="text-xs mt-1 opacity-60 text-right">Odesláno</p>
                  )}
                  {isMe && msg.is_read && (
                    <p className="text-xs mt-1 opacity-60 text-right">Přečteno</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={myRole === 'client' ? 'Napište poradci...' : 'Odpovědět klientovi...'}
            className="chat-input flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': '#162459' } as React.CSSProperties}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90 shrink-0"
            style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Enter = odeslat · Shift+Enter = nový řádek</p>
      </div>
    </div>
  )
}
