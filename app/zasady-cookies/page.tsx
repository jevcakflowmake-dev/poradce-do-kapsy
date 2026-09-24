import type { Metadata } from 'next'
import { PravniStranka, Section, P, B, List, Callout, Odkaz } from '@/components/legal/PravniStranka'
import NastaveniCookies from '@/components/cookies/NastaveniCookies'

export const metadata: Metadata = {
  title: 'Zásady používání cookies',
  description:
    'Které cookies a úložiště prohlížeče Poradce do kapsy používá, proč a jak souhlas kdykoliv změnit.',
  alternates: { canonical: '/zasady-cookies' },
}

/**
 * TODO (Jakub): znění si projdi, je to můj návrh. Popisuje stav, ve kterém
 * web žádné měření nenačítá. Až doplníš ID pro GA4 nebo Meta Pixel, projdi
 * sekci 02 a 03 znovu — přibude tím kategorie, na kterou se lišta ptá.
 */
const UCINNOST_OD = '21. září 2026'

export default function ZasadyCookiesPage() {
  return (
    <PravniStranka
      nadrazene="Cookies"
      nadpis={<>Zásady používání cookies</>}
      ucinnostOd={UCINNOST_OD}
      perex={
        <p>
          Cookies a úložiště prohlížeče používáme střídmě. Tady je seznam všeho, co
          si web ve vašem prohlížeči nechává, proč to tam je a jak to zrušíte.
        </p>
      }
    >
      <Section number="01" title="Co jsou cookies">
        <P>
          Cookie je malý soubor, který si web uloží ve vašem prohlížeči a při další
          návštěvě si ho přečte. Vedle cookies používáme i <B>úložiště prohlížeče</B>{' '}
          (localStorage) – funguje podobně, jen data neputují na server.
        </P>
        <P>
          Cookies dělíme na <B>technicky nezbytné</B>, bez kterých by aplikace
          nefungovala, a na ostatní, k nimž potřebujeme váš souhlas.
        </P>
      </Section>

      <Section number="02" title="Co konkrétně ukládáme">
        <P>
          <B>Technicky nezbytné</B> – bez souhlasu, protože bez nich by služba
          nefungovala:
        </P>
        <List
          items={[
            <>
              <B>Přihlášení</B> – cookie, ve které je vaše relace v aplikaci. Bez ní
              byste se po každém kliknutí přihlašovali znovu. Platí, dokud se
              neodhlásíte nebo dokud relace nevyprší.
            </>,
            <>
              <B>Rozepsaná analýza</B> – v úložišti prohlížeče si držíme vaše
              odpovědi a číslo kroku, abyste mohli dotazník dokončit později a
              nezačínali znovu. Zůstávají ve vašem zařízení, dokud analýzu
              neodešlete nebo si prohlížeč nevyčistíte.
            </>,
            <>
              <B>Vaše volba u cookies</B> – abychom se neptali při každém načtení
              stránky.
            </>,
          ]}
        />
        <P>
          <B>Měření návštěvnosti</B> – jen s vaším souhlasem. Web je připravený na
          Google Analytics a Meta Pixel, ale <B>dokud souhlas nedáte, žádný jejich
          skript se nenačte</B> a nic se do nich neodesílá. Kdyby někdy přibyla další
          kategorie, zeptáme se znovu.
        </P>
        <Callout>
          <P>
            Reklamní cookies třetích stran, sdílení profilů s inzertními sítěmi ani
            prodej dat nepoužíváme.
          </P>
        </Callout>
      </Section>

      <Section number="03" title="Jak souhlas změnit">
        <P>
          Rozhodnutí můžete kdykoliv změnit – souhlas odvoláte stejně snadno, jako
          jste ho dali.
        </P>
        <NastaveniCookies />
      </Section>

      <Section number="04" title="Jak cookies zakázat v prohlížeči">
        <P>
          Cookies můžete zakázat nebo smazat přímo v nastavení prohlížeče, obvykle v
          sekci soukromí. Počítejte s tím, že po zákazu technicky nezbytných cookies
          se nepůjde přihlásit do klientské zóny.
        </P>
      </Section>

      <Section number="05" title="Souvislosti">
        <P>
          Co děláme s osobními údaji mimo cookies, popisují{' '}
          <Odkaz href="/zasady-ochrany-osobnich-udaju">
            zásady ochrany osobních údajů
          </Odkaz>
          . Pravidla samotné služby najdete v{' '}
          <Odkaz href="/obchodni-podminky">obchodních podmínkách</Odkaz>.
        </P>
      </Section>
    </PravniStranka>
  )
}
