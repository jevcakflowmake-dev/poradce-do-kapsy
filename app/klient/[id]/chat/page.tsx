'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <Link href={`/klient/${id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Váš finanční poradce</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="text-xs text-slate-400">Odpovídá do 24 hodin</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Chat s poradcem</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Máte dotaz k vašemu finančnímu plánu? Napište nám a poradce vám odpoví do 24 hodin.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
