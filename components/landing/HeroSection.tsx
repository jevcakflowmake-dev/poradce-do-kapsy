import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import PhoneMockup from '@/components/landing/PhoneMockup'

/**
 * Hero má jediný úkol: dostat člověka do dotazníku. Text vlevo, produkt vpravo.
 * Na mobilu text nahoře a telefon pod ním. Bez animací a bez videa — hero se
 * musí vykreslit hned, ne až doběhne skript.
 */
export default function HeroSection() {
  return (
    <section className="bg-navy text-cream">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 pt-14 pb-16 md:pt-20 md:pb-24 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <div>
          <h1 className="font-display text-display text-cream text-balance">
            Finanční poradce, kterého máte v mobilu.
          </h1>
          <p className="mt-6 text-lead text-cream/80 max-w-xl">
            Vyplníte analýzu za 15 minut, do 48 hodin dostanete návrh na míru. Bez schůzek, bez tlaku.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/analyza" className={buttonVariants({ size: 'lg' })}>
              Vyplnit analýzu zdarma
            </Link>
            <a href="#jak-to-funguje" className={buttonVariants({ variant: 'onDark', size: 'lg' })}>
              Jak to funguje
            </a>
          </div>
          <p className="mt-6 text-base text-cream/60">
            Zdarma a nezávazně · Nic nepodepisujete · Data v EU
          </p>
        </div>

        <PhoneMockup />
      </div>
    </section>
  )
}
