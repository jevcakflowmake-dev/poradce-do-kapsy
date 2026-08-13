'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/motion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Námitky, na kterých to u finančního poradce v Česku padá nejčastěji.
 * Nechávat je nevyřčené konverzi nepomůže – člověk je má v hlavě tak jako tak,
 * jen místo zeptání zavře kartu. První dvě otázky (provize a telefonáty) jsou
 * ty skutečné; zbytek je doplňkový.
 *
 * Odpovědi musí sedět s realitou aplikace – telefon se v analýze ptá, ale
 * volání si klient řídí sám, protože celý flow běží přes chat.
 */
const FAQ = [
  {
    q: 'Proč je to zdarma? Kde je háček?',
    a: (
      <>
        Háček žádný není, ale je fér říct, jak to funguje: analýzu i plán
        dostanete zdarma a nic za ně neplatíte. Vydělávám až v momentě, kdy si
        přes mě nějakou smlouvu sjednáte – provizi mi vyplatí pojišťovna nebo
        banka, ne vy. Když si nesjednáte nic, prostě jsem si udělal práci
        zadarmo. Riziko nesu já, ne vy.
      </>
    ),
  },
  {
    q: 'Budete mi pak volat a otravovat?',
    a: (
      <>
        Ne. Celá komunikace běží přes chat v aplikaci a odpovídám tam obvykle do
        24 hodin. Telefon v analýze chci jen proto, aby šlo něco doladit, když se
        zasekne papírování – nebudu vám s ním volat kvůli „ověření zájmu“ ani ho
        nikomu nepředám. Když chcete zavolat vy, napište kdy a ozvu se.
      </>
    ),
  },
  {
    q: 'Musím něco podepsat?',
    a: (
      <>
        Ne. Vyplnění analýzy vás k ničemu nezavazuje a plán, který dostanete,
        není smlouva – je to podklad k rozhodnutí. Podepisuje se až ve chvíli,
        kdy si sami řeknete o konkrétní produkt. Do té doby můžete kdykoliv
        napsat, že to nechcete řešit, a tím to končí.
      </>
    ),
  },
  {
    q: 'Už nějaké smlouvy mám. Budete mi je chtít zrušit?',
    a: (
      <>
        Ne automaticky. Rušit fungující smlouvu jen proto, abych na nové vydělal,
        je přesně ten důvod, proč má tenhle obor pověst, jakou má. V analýze je
        proto místo na nahrání stávajících smluv – projdu je a u každé napíšu,
        jestli má smysl ji nechat být, upravit, nebo nahradit, a proč. Často
        vyjde, že to nejlepší, co můžete udělat, je nedělat nic.
      </>
    ),
  },
  {
    q: 'Kolik času to zabere?',
    a: (
      <>
        Vyplnění zabere zhruba deset minut, když budete odpovídat od boku.
        Nemusíte to ale stihnout najednou – rozepsané se ukládá ve vašem
        prohlížeči, takže můžete zavřít kartu a vrátit se večer. Povinné jsou
        jen jméno a e-mail; všechno ostatní klidně přeskočte. Čím míň vyplníte,
        tím obecnější plán zpátky dostanete, ale i tak něco dostanete.
      </>
    ),
  },
  {
    q: 'Co uděláte s mými údaji?',
    a: (
      <>
        Uloží se do databáze v EU, přístup k nim máte vy a já – nikdo jiný.
        Neprodávám je a nepředávám je k marketingu. Konkrétní pojišťovně nebo
        bance jdou jen tehdy, když si vyberete produkt a řeknete mi, ať ho
        sjednám. Podrobně a bez právničiny je to popsané v{' '}
        <Link
          href="/zasady-ochrany-osobnich-udaju"
          className="underline underline-offset-2 text-[#0079AD] hover:text-[#162459] transition-colors"
        >
          zásadách zpracování osobních údajů
        </Link>
        .
      </>
    ),
  },
]

export default function FaqSection() {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from('.faq-head > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%' },
      })
      gsap.from('.faq-row', {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: '.faq-list', start: 'top 88%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      id="otazky"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 md:py-32 bg-[#F6F4EE] overflow-hidden"
    >
      <div className="noise-paper" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="faq-head grid grid-cols-12 gap-6 items-end mb-14">
          <div className="col-span-12 md:col-span-7">
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">
              Otázky · na rovinu
            </p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.025em', lineHeight: 1.03 }}
            >
              To, na co se lidi
              <br />
              <span style={{ color: '#009EE2' }}>bojí zeptat.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 text-[#66708C] text-sm md:text-base leading-relaxed md:text-right md:pb-2">
            Finanční poradenství má v Česku pověst, kterou si zčásti zasloužilo.
            Tady jsou odpovědi, které byste ode mě dostali i po telefonu.
          </p>
        </div>

        <div className="faq-list border-t border-[#E4DFD2]">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="faq-row border-b border-[#E4DFD2]">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="group w-full flex items-start gap-5 py-6 md:py-7 text-left"
                  >
                    <span
                      className="font-display text-[#162459] flex-1 group-hover:text-[#0079AD] transition-colors"
                      style={{ fontSize: 'clamp(1.15rem, 2vw, 1.55rem)', letterSpacing: '-0.015em', lineHeight: 1.25 }}
                    >
                      {item.q}
                    </span>
                    <span className="shrink-0 mt-1 text-[#66708C] group-hover:text-[#009EE2] transition-colors">
                      {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  hidden={!isOpen}
                  className="pb-7 md:pb-8 md:pr-16"
                >
                  <p className="text-[#66708C] leading-relaxed max-w-2xl">{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
