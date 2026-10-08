'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MERENI } from '@/lib/souhlas'
import { useSouhlas, useVProhlizeci } from '@/lib/pouzijSouhlas'
import { vypniMereni, zapniMereni, zmer } from '@/lib/mereni'

/**
 * Napojení Google Analytics na web. Nic nevykresluje.
 *
 * Události se v kódu stránek nepíšou, stačí atribut s názvem události:
 *
 *   data-mereni-klik="klik_hero_analyza"   kliknutí na odkaz nebo tlačítko
 *   data-mereni-videno="sekce_partneri"    sekce se dostala na obrazovku
 *   data-mereni-otevreno="faq_zdarma"      rozbalení prvku <details>
 *
 * Atribut funguje i v serverových komponentách, takže kvůli měření nemusí
 * být žádná část úvodní stránky klientská. Co se měří jinak než atributem
 * (kroky dotazníku), volá `zmer()` z `lib/mereni.ts` přímo.
 */
export default function Mereni() {
  // Bez ID měření tu není co dělat a web žádný cizí skript nenačítá.
  if (!MERENI.ga4) return null
  return <MereniGa4 />
}

function MereniGa4() {
  const vProhlizeci = useVProhlizeci()
  const povoleno = useSouhlas()?.volba === 'vse'
  const cesta = usePathname()

  // Při každé změně stránky znovu: v klientské zóně a v portálu se měření vypíná.
  useEffect(() => {
    // Při hydrataci se souhlas ještě tváří jako nedaný (server ho nezná).
    // Vypnutí v tu chvíli by smazalo cookies měření a z každého načtení
    // stránky by udělalo nového návštěvníka.
    if (!vProhlizeci) return
    if (povoleno) zapniMereni()
    else vypniMereni()
  }, [vProhlizeci, povoleno, cesta])

  useEffect(() => {
    if (!povoleno) return

    function naKlik(e: MouseEvent) {
      if (!(e.target instanceof Element)) return
      const udalost = e.target.closest('[data-mereni-klik]')?.getAttribute('data-mereni-klik')
      if (udalost) zmer(udalost)
    }

    // `toggle` nebublá, proto se chytá cestou dolů.
    function naRozbaleni(e: Event) {
      if (!(e.target instanceof HTMLDetailsElement) || !e.target.open) return
      const udalost = e.target.getAttribute('data-mereni-otevreno')
      if (udalost) zmer(udalost)
    }

    document.addEventListener('click', naKlik, true)
    document.addEventListener('toggle', naRozbaleni, true)
    return () => {
      document.removeEventListener('click', naKlik, true)
      document.removeEventListener('toggle', naRozbaleni, true)
    }
  }, [povoleno])

  // Kam až člověk na stránce došel: každá označená sekce jednou za zobrazení stránky.
  useEffect(() => {
    if (!povoleno) return

    // Hlídá se nadpis sekce, ne sekce celá: z té předchozí bývá po prokliku
    // na kotvu vidět prázdný spodní okraj a započítala by se taky.
    const udalosti = new Map<Element, string>()
    document.querySelectorAll('[data-mereni-videno]').forEach((sekce) => {
      const udalost = sekce.getAttribute('data-mereni-videno')
      if (udalost) udalosti.set(sekce.querySelector('h1, h2, h3') ?? sekce, udalost)
    })
    if (udalosti.size === 0) return

    // Sekce se počítá, až když na ní člověk vteřinu zůstane. Proklik z menu na
    // konec stránky projede všechny sekce cestou a ty se započítat nemají.
    const casovace = new Map<Element, number>()
    const pozorovatel = new IntersectionObserver(
      (zaznamy) => {
        for (const zaznam of zaznamy) {
          const prvek = zaznam.target
          if (!zaznam.isIntersecting) {
            window.clearTimeout(casovace.get(prvek))
            casovace.delete(prvek)
            continue
          }
          if (casovace.has(prvek)) continue
          casovace.set(
            prvek,
            window.setTimeout(() => {
              casovace.delete(prvek)
              pozorovatel.unobserve(prvek)
              const udalost = udalosti.get(prvek)
              if (udalost) zmer(udalost)
            }, 1000),
          )
        }
      },
      // Nahoře se odečítá přilepená hlavička (80 px), dole pruh, kde nadpis
      // teprve vykukuje.
      { rootMargin: '-80px 0px -15% 0px' },
    )
    udalosti.forEach((_, prvek) => pozorovatel.observe(prvek))
    return () => {
      pozorovatel.disconnect()
      casovace.forEach((casovac) => window.clearTimeout(casovac))
    }
  }, [povoleno, cesta])

  return null
}
