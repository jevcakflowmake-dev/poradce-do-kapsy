import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

/**
 * Závěrečné CTA opakuje hero doslova — kdo dočetl až sem, má před sebou
 * stejný slib i stejné tlačítko, ne novou variantu, kterou musí znovu vážit.
 */
export default function CtaSection() {
  return (
    <section className="bg-navy text-cream py-20 md:py-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="max-w-3xl">
          <h2 className="font-display text-h2 text-cream text-balance">
            Finanční poradce, kterého máte v mobilu.
          </h2>
          <p className="mt-6 text-lead text-cream/80">
            Vyplníte analýzu za 15 minut, do 48 hodin dostanete návrh na míru. Bez schůzek, bez tlaku.
          </p>
          <div className="mt-8">
            <Link href="/analyza" className={buttonVariants({ size: 'lg' })}>
              Vyplnit analýzu zdarma
            </Link>
          </div>
          <p className="mt-6 text-base text-cream/60">
            Zdarma a nezávazně · Nic nepodepisujete · Data v EU
          </p>
        </div>
      </div>
    </section>
  )
}
