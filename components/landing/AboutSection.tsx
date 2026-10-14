import Image from 'next/image'
import { PORADCE, rokyPraxe } from '@/lib/poradce'
import { plural } from '@/lib/utils'

/** Dnešek mimo komponentu – React Compiler nechce new Date() v renderu. */
function dnes() {
  return new Date()
}

/**
 * Kdo za tím stojí. Fotka vlevo, text vpravo, v první osobě.
 *
 * Text stojí na tom, co o sobě napsal Jakub (14. 10. 2026): poradenství
 * 9 let, klienti z Jihočeského, Plzeňského a Jihomoravského kraje a z Prahy
 * (Jihomoravský doplnil týž den). Kraje jsou v textu i v řádku s fakty –
 * když se změní, mění se na obou místech.
 *
 * Číslo registrace u ČNB doplň v `lib/poradce.ts`; dokud tam není, blok
 * o registraci se skryje.
 */
export default function AboutSection() {
  const roky = rokyPraxe(dnes())
  const delkaPraxe = `${roky}\u00a0${plural(roky, 'rok', 'roky', 'let')}`

  return (
    <section data-mereni-videno="sekce_kdo_jsem" className="bg-cream pb-20 md:pb-28">
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

            {/* &nbsp; za jednopísmennými slovy a mezi číslem a jednotkou: „a z“ ani
                „9“ nesmí zůstat na konci řádku. */}
            <div className="mt-6 space-y-5 text-lead text-navy max-w-2xl text-pretty">
              <p>
                Jmenuji se {PORADCE.jmeno} a&nbsp;finančnímu poradenství se věnuji {delkaPraxe}.
                Za tu dobu jsem pracoval s&nbsp;klienty z&nbsp;Jihočeského, Plzeňského
                a&nbsp;Jihomoravského kraje a&nbsp;z&nbsp;Prahy. Pomáhám jim s&nbsp;hypotékou, pojištěním pro případ výpadku příjmu,
                investicemi, přípravou na stáří a&nbsp;spořením na důchod i&nbsp;zajištěním dětí.
              </p>
              <p>
                Pracuji přes síť ProfiFP a&nbsp;OVB Allfinanz a&nbsp;spolupracuji s&nbsp;řadou bank,
                pojišťoven a&nbsp;investičních společností. Nabídky proto můžu porovnat mezi sebou.
              </p>
              <p>
                Většinu práce dnes zvládneme na dálku. Vyplníte analýzu, já projdu vaše smlouvy
                a&nbsp;připravím návrh, u&nbsp;kterého vysvětlím, proč zrovna takhle. Když budete chtít
                něco probrat, napíšete mi v&nbsp;aplikaci. Na tom, ve kterém kraji bydlíte, pak nezáleží.
              </p>
              <p>Osobně se rád potkám, když o&nbsp;to budete stát. Spoustu věcí ale vyřešíme i&nbsp;bez schůzky.</p>
            </div>

            {/* Dvě fakta na přelétnutí očima. Číslo nahoře, popisek pod ním –
                v kódu je popisek (dt) první, aby čtečka četla „Ve finančním
                poradenství: 9 let“. */}
            <dl className="mt-10 grid grid-cols-2 gap-6 max-w-2xl border-t border-line pt-6">
              <div className="flex flex-col">
                <dt className="order-2 mt-1 text-base text-slate">ve finančním poradenství</dt>
                <dd className="order-1 font-display text-h3 text-navy">{delkaPraxe}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="order-2 mt-1 text-base text-slate text-pretty">jižní Čechy, Plzeňsko, jižní Morava a&nbsp;Praha</dt>
                <dd className="order-1 font-display text-h3 text-navy">4 kraje</dd>
              </div>
            </dl>

            {PORADCE.cnbCisloRegistrace && (
              <p className="mt-8 text-base text-slate">
                Registrován u České národní banky pod číslem {PORADCE.cnbCisloRegistrace}.{' '}
                <a
                  href={PORADCE.cnbRegistrUrl}
                  data-mereni-klik="klik_cnb_registr"
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
