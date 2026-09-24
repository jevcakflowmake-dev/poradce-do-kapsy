import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import StoredFileLink from '@/components/files/StoredFileLink'
import { formatDate } from '@/lib/utils'

/**
 * Všechny soubory na jednom místě: co nahrál klient v analýze a co mu poslal
 * poradce u návrhů. Oba buckety jsou privátní, odkaz vzniká až na kliknutí
 * jako podepsaná adresa s platností hodinu.
 */
export default async function DokumentyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: prilohy }, { data: navrhy }] = await Promise.all([
    supabase
      .from('analysis_files')
      .select('id, file_name, file_url, file_size, section, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('proposals')
      .select('id, title, file_url, created_at')
      .eq('client_id', user.id)
      .not('file_url', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  const mojePrilohy = prilohy ?? []
  const odPoradce = navrhy ?? []
  const prazdno = mojePrilohy.length === 0 && odPoradce.length === 0

  return (
    <div>
      <h1 className="font-display text-h2 text-navy">Dokumenty</h1>
      <p className="mt-3 text-lead text-slate max-w-2xl text-pretty">
        Smlouvy, které jste mi poslali, i návrhy, které jsem připravil. Odkazy platí hodinu,
        pak se vygenerují znovu.
      </p>

      {prazdno && (
        <Card className="mt-8 p-6">
          <p className="text-base text-slate">
            Zatím tu nic není. Přílohy můžete přidat v analýze, návrhy sem přibudou ode mě.
          </p>
        </Card>
      )}

      {odPoradce.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-h3 text-navy">Ode mě</h2>
          <Card className="mt-5 divide-y divide-line">
            {odPoradce.map((n) => (
              <div key={n.id} className="p-5 flex items-center gap-4">
                <FileText className="w-5 h-5 text-slate shrink-0" aria-hidden strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                  <StoredFileLink
                    bucket="proposals"
                    path={n.file_url as string}
                    className="text-base font-medium text-navy underline underline-offset-4 hover:text-mint-dark text-left truncate"
                  >
                    {n.title}
                  </StoredFileLink>
                  <p className="text-base text-slate mt-0.5">{formatDate(n.created_at)}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {mojePrilohy.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-h3 text-navy">Co jste nahráli</h2>
          <Card className="mt-5 divide-y divide-line">
            {mojePrilohy.map((p) => (
              <div key={p.id} className="p-5 flex items-center gap-4">
                <Upload className="w-5 h-5 text-slate shrink-0" aria-hidden strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                  <StoredFileLink
                    bucket="analysis"
                    path={p.file_url}
                    className="text-base font-medium text-navy underline underline-offset-4 hover:text-mint-dark text-left truncate"
                  >
                    {p.file_name}
                  </StoredFileLink>
                  <p className="text-base text-slate mt-0.5">
                    {formatDate(p.created_at)} · {(p.file_size / 1024).toFixed(0)} kB
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}
