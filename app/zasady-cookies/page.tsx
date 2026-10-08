import type { Metadata } from 'next'
import { PravniStranka, Section, P, B, List, Callout, Odkaz } from '@/components/legal/PravniStranka'
import NastaveniCookies from '@/components/cookies/NastaveniCookies'
import { MERENI, MERENI_OD } from '@/lib/souhlas'

export const metadata: Metadata = {
  title: 'Zásady používání cookies',
  description:
    'Které cookies a úložiště prohlížeče Poradce do kapsy používá, proč a jak souhlas kdykoliv změnit.',
  alternates: { canonical: '/zasady-cookies' },
}

/**
 * TODO (Jakub): znění si projdi, je to můj návrh. Měření má dvě znění a
 * přepíná je `NEXT_PUBLIC_GA4_ID`: bez ID stránka popisuje web, který nic
 * neměří, s ID popisuje Google Analytics. Meta Pixel napojený není; až
 * přibude, projdi sekci 02 znovu.
 */
const GA4 = MERENI.ga4
const UCINNOST_OD = GA4 ? MERENI_OD : '21. září 2026'

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
        {GA4 ? (
          <>
            <P>
              <B>Měření návštěvnosti</B> – jen s vaším souhlasem. Používáme Google
              Analytics od společnosti Google Ireland Limited. Vidíme díky němu,
              kolik lidí na web přišlo a odkud, které části úvodní stránky si
              prošli, na co klikli a u kterého kroku dotazníku skončili.
            </P>
            <List
              items={[
                <>
                  <B>Cookies _ga a _ga_{GA4.slice(2)}</B> – podle nich Analytics
                  pozná, že jde o stejný prohlížeč a stejnou návštěvu. Platí
                  nejdéle dva roky.
                </>,
                <>
                  <B>Co do Analytics neposíláme</B> – odpovědi z dotazníku, jméno
                  ani e-mail. V klientské zóně se neměří nic.
                </>,
                <>
                  <B>Bez souhlasu</B> – skript Analytics se vůbec nenačte a žádná
                  jeho cookie nevznikne.
                </>,
              ]}
            />
            <P>
              Google údaje zpracovává jako náš zpracovatel a může je ukládat i mimo
              EU. Předání do USA se opírá o rozhodnutí Evropské komise o odpovídající
              ochraně (EU–US Data Privacy Framework). Kdyby někdy přibyla další
              kategorie, zeptáme se znovu.
            </P>
          </>
        ) : (
          <P>
            <B>Měření návštěvnosti</B> – jen s vaším souhlasem. Web je připravený na
            Google Analytics a Meta Pixel, ale <B>dokud souhlas nedáte, žádný jejich
            skript se nenačte</B> a nic se do nich neodesílá. Kdyby někdy přibyla další
            kategorie, zeptáme se znovu.
          </P>
        )}
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
          jste ho dali.{GA4 && ' Po odvolání cookies Analytics z prohlížeče smažeme a měření se vypne.'}
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
