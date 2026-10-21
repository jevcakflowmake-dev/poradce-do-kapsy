import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import CtaSection from '@/components/landing/CtaSection'
import { datumNovinky, minutCteni, nactiNovinku, nactiNovinky, rozdelObsah } from '@/lib/novinky'
import { metadataStranky } from '@/lib/temata'
import { PORADCE } from '@/lib/poradce'
import { SITE_NAME, absoluteUrl } from '@/lib/site'

/**
 * Článek z Novinek. Statický – vznikne při buildu nebo při první návštěvě
 * a obnoví ho /api/novinky po zveřejnění (hodina je pojistka).
 */
export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await nactiNovinky()).map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const novinka = await nactiNovinku((await params).slug)
  if (!novinka) return {}
  const zaklad = metadataStranky({ titulek: novinka.titulek, popis: novinka.perex, cesta: `/novinky/${novinka.slug}` })
  return {
    ...zaklad,
    openGraph: { ...zaklad.openGraph, type: 'article', publishedTime: novinka.zverejneno_at, authors: [PORADCE.jmeno] },
  }
}

const OBAL = 'max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20'

export default async function NovinkaPage({ params }: Props) {
  const novinka = await nactiNovinku((await params).slug)
  if (!novinka) notFound()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: novinka.titulek,
    description: novinka.perex,
    datePublished: novinka.zverejneno_at,
    mainEntityOfPage: absoluteUrl(`/novinky/${novinka.slug}`),
    author: { '@type': 'Person', name: PORADCE.jmeno, url: absoluteUrl('/') },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader naUvod />
      <main>
        <article className={`${OBAL} pt-10 pb-20 md:pt-14 md:pb-28`}>
          <div className="max-w-3xl">
            <Link
              href="/novinky"
              className="inline-flex items-center gap-1.5 text-base font-semibold text-navy rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden /> Všechny novinky
            </Link>

            <p className="mt-8 text-base text-slate">
              <time dateTime={novinka.zverejneno_at}>{datumNovinky(novinka.zverejneno_at)}</time> · {minutCteni(novinka)} min čtení
            </p>
            <h1 className="mt-3 font-display text-h2 text-navy text-balance">{novinka.titulek}</h1>
            <p className="mt-6 text-lead text-navy font-medium text-pretty">{novinka.perex}</p>

            <div className="mt-8 space-y-5 text-lead text-navy text-pretty">
              {rozdelObsah(novinka.obsah).map((blok, i) =>
                blok.typ === 'nadpis' ? (
                  <h2 key={i} className="pt-4 font-display text-h3 text-navy">
                    {blok.text}
                  </h2>
                ) : blok.typ === 'seznam' ? (
                  <ul key={i} className="list-disc pl-6 space-y-2 marker:text-slate">
                    {blok.polozky.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{blok.text}</p>
                ),
              )}
            </div>

            {novinka.zdroje.length > 0 && (
              <div className="mt-12 pt-6 border-t border-line">
                <h2 className="text-base font-semibold text-navy">Zdroje</h2>
                <ul className="mt-3 space-y-2 text-base">
                  {novinka.zdroje.map((z) => (
                    <li key={z.url}>
                      <a
                        href={z.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                      >
                        {z.nazev}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-10 rounded-card border border-line bg-surface p-5 text-base text-slate text-pretty">
              Článek je informativní a nenahrazuje osobní poradenství. Nejde o investiční doporučení ani o nabídku
              konkrétního produktu. Co z toho platí pro vás, probereme nad vaší analýzou.
            </p>
          </div>
        </article>

        <CtaSection />
      </main>
      <SiteFooter naUvod />
      {/* „<“ escapované, ať text článku nemůže ukončit značku script. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    </div>
  )
}
