import Image from 'next/image'
import { PORADCE } from '@/lib/poradce'

/**
 * Kdo za tím stojí. Fotka vlevo, text vpravo, v první osobě.
 *
 * TODO (Jakub): text níž je návrh — přepiš ho vlastními slovy.
 * Fotku a číslo registrace u ČNB doplň v `lib/poradce.ts`; dokud tam
 * nejsou, vykreslí se neutrální dlaždice a blok o registraci se skryje.
 */
export default function AboutSection() {
  return (
    <section className="bg-cream pb-20 md:pb-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16 items-start">
          <div className="relative aspect-4/5 w-full max-w-sm rounded-card overflow-hidden border border-line bg-navy">
            {PORADCE.fotka ? (
              <Image
                src={PORADCE.fotka}
                alt={`${PORADCE.jmeno}, finanční poradce`}
                fill
                sizes="(max-width: 1024px) 100vw, 26rem"
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center font-display text-cream/40 text-display"
              >
                JJ
              </span>
            )}
          </div>

          <div>
            <h2 className="font-display text-h2 text-navy">Kdo jsem</h2>

            <div className="mt-6 space-y-5 text-lead text-navy max-w-2xl text-pretty">
              <p>
                Jmenuji se {PORADCE.jmeno} a dělám finanční poradenství přes síť ProfiFP
                a OVB Allfinanz. Nejsem vázaný na jednu pojišťovnu, takže můžu nabídky
                porovnat mezi sebou.
              </p>
              <p>
                Většinu práce dnes zvládnu na dálku. Vy vyplníte analýzu, já projdu vaše
                smlouvy a připravím návrh, u kterého vysvětlím, proč zrovna takhle. Když
                budete chtít něco probrat, napíšete mi v aplikaci.
              </p>
              <p>
                Na schůzku se rád stavím, ale nevnucuju ji. Většina lidí, se kterými
                pracuju, ji nepotřebuje.
              </p>
            </div>

            {PORADCE.cnbCisloRegistrace && (
              <p className="mt-8 text-base text-slate">
                Registrován u České národní banky pod číslem {PORADCE.cnbCisloRegistrace}.{' '}
                <a
                  href={PORADCE.cnbRegistrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                >
                  Ověřit v registru ČNB
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
