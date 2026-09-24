import type { Metadata } from 'next'
import { PravniStranka, Section, P, B, List, Callout, Odkaz } from '@/components/legal/PravniStranka'
import { PORADCE } from '@/lib/poradce'

export const metadata: Metadata = {
  title: 'Zásady ochrany osobních údajů',
  description:
    'Jaké osobní údaje Poradce do kapsy zpracovává, proč, jak dlouho a jaká máte práva.',
  alternates: { canonical: '/zasady-ochrany-osobnich-udaju' },
}

/**
 * Údaje správce žijí v `lib/poradce.ts` – stejné IČO, sídlo i e-mail používají
 * obchodní podmínky, takže se nesmí rozejít.
 */
const SPRAVCE = PORADCE

// Datum, kdy zásady poprvé skutečně identifikovaly správce. Do 31. 8. 2026
// byly na jeho místě zástupné texty, takže dokument nebyl úplný.
const UCINNOST_OD = '31. srpna 2026'

export default function ZasadyPage() {
  return (
    <PravniStranka
      nadrazene="Ochrana soukromí"
      nadpis={<>Zásady ochrany<br />osobních údajů</>}
      ucinnostOd={UCINNOST_OD}
      perex={
        <p>
          Abychom vám mohli připravit finanční plán na míru, potřebujeme o vás
          vědět docela dost – včetně údajů o zdraví. Tady je přehledně, co
          sbíráme, proč, jak dlouho si to necháváme a co s tím můžete udělat.
        </p>
      }
    >

          <Section number="01" title="Kdo je správcem">
            <P>
              Správcem osobních údajů je {SPRAVCE.jmeno}, IČO {SPRAVCE.ico}, se
              sídlem {SPRAVCE.adresa} – certifikovaný finanční poradce
              spolupracující se sítí ProfiFP / OVB Allfinanz.
            </P>
            <P>
              S čímkoliv ohledně svých údajů se obraťte na{' '}
              <a
                href={`mailto:${SPRAVCE.email}`}
                className="text-navy hover:text-navy font-semibold transition-colors"
              >
                {SPRAVCE.email}
              </a>
              . Odpovíme nejpozději do jednoho měsíce.
            </P>
            <P>
              Jmenování pověřence pro ochranu osobních údajů (DPO) nám zákon
              neukládá, proto ho nemáme.
            </P>
          </Section>

          <Section number="02" title="Jaké údaje zpracováváme">
            <P>Podle toho, jak daleko v aplikaci dojdete:</P>
            <List
              items={[
                <>
                  <B>Při registraci</B> – jméno a příjmení, e-mail, telefon a
                  heslo (ukládá se pouze jeho nevratný otisk, samotné heslo
                  nevidíme).
                </>,
                <>
                  <B>Ve finanční analýze</B> – věk, rodinný stav, zaměstnání,
                  výše příjmů, závazky a hypotéka, počet a věk dětí, majetek
                  (nemovitost, auto), stávající pojištění a investice,
                  investiční horizont a tolerance k riziku, představa o důchodu.
                </>,
                <>
                  <B>Údaje o zdraví</B> – výška, váha, vážné nemoci a úrazy za
                  posledních 5 let. Jde o zvláštní kategorii údajů, kterou
                  řešíme zvlášť v bodě 04.
                </>,
                <>
                  <B>Dokumenty, které nahrajete</B> – např. stávající smlouvy
                  nebo výpisy. Ukládají se do soukromého úložiště přístupného
                  jen vám a vašemu poradci.
                </>,
                <>
                  <B>Komunikace</B> – zprávy v chatu s poradcem, dotazy
                  a reakce k finančnímu plánu.
                </>,
                <>
                  <B>Technické údaje</B> – údaje nutné pro přihlášení a
                  zabezpečení účtu (relace, čas přihlášení). Nesledujeme vaše
                  chování na webu a nepoužíváme analytické nástroje.
                </>,
              ]}
            />
            <P>
              Vyplnění analýzy je dobrovolné. Bez ní vám ale nedokážeme
              připravit smysluplný návrh – čím méně vyplníte, tím obecnější
              doporučení dostanete.
            </P>
          </Section>

          <Section number="03" title="Proč údaje zpracováváme a na jakém základě">
            <List
              items={[
                <>
                  <B>Vedení účtu a poskytnutí služby</B> – abyste se mohli
                  přihlásit, vyplnit analýzu a dostat návrh. Právní základ:
                  plnění smlouvy, resp. opatření před jejím uzavřením (čl. 6
                  odst. 1 písm. b GDPR).
                </>,
                <>
                  <B>Zpracování finanční analýzy a příprava návrhu</B> –
                  posouzení vašich potřeb a nabídka vhodných produktů. Právní
                  základ: plnění smlouvy (čl. 6 odst. 1 písm. b GDPR).
                </>,
                <>
                  <B>Zprostředkování konkrétní smlouvy</B> – pokud si některý
                  produkt vyberete, předáme potřebné údaje partnerské
                  společnosti. Právní základ: plnění smlouvy, dále plnění
                  právních povinností zprostředkovatele podle zákona
                  o distribuci pojištění a zajištění a zákona o spotřebitelském
                  úvěru (čl. 6 odst. 1 písm. c GDPR).
                </>,
                <>
                  <B>Zabezpečení a ochrana před zneužitím</B> – právní základ:
                  oprávněný zájem na bezpečném provozu aplikace (čl. 6 odst. 1
                  písm. f GDPR).
                </>,
              ]}
            />
            <P>
              Neprovádíme automatizované rozhodování ani profilování s právními
              účinky. Návrh vždy posuzuje a schvaluje člověk – váš poradce.
            </P>
          </Section>

          <Section number="04" title="Údaje o zdraví – jen s vaším souhlasem">
            <Callout>
              <P>
                Výška, váha, prodělané nemoci a úrazy patří mezi zvláštní
                kategorie osobních údajů (čl. 9 GDPR). Zpracováváme je{' '}
                <B>výhradně na základě vašeho výslovného souhlasu</B>, který
                udělujete odesláním sekce „Osobní údaje“ ve finanční analýze.
              </P>
              <P>
                Bez těchto údajů nelze spočítat cenu a rozsah životního nebo
                úrazového pojištění – pojišťovny je vyžadují. Souhlas je ale
                dobrovolný: sekci můžete přeskočit a využít zbytek aplikace.
              </P>
              <P>
                Souhlas můžete kdykoliv odvolat e-mailem na{' '}
                <a
                  href={`mailto:${SPRAVCE.email}`}
                  className="text-navy hover:text-navy font-semibold transition-colors"
                >
                  {SPRAVCE.email}
                </a>
                . Zdravotní údaje pak smažeme. Odvoláním není dotčena zákonnost
                zpracování před odvoláním.
              </P>
            </Callout>
          </Section>

          <Section number="05" title="Komu se údaje dostanou">
            <P>
              Údaje neprodáváme a nepředáváme k marketingovým účelům. Přístup
              k nim mají:
            </P>
            <List
              items={[
                <>
                  <B>Váš poradce</B> – vidí vaši analýzu, dokumenty a chat,
                  aby vám mohl připravit návrh.
                </>,
                <>
                  <B>Poskytovatelé technického zázemí</B> (zpracovatelé, vázaní
                  smlouvou o zpracování): Supabase – databáze a úložiště
                  souborů, servery v EU (Stockholm); Vercel – provoz webové
                  aplikace; poskytovatel e-mailové brány pro odeslání
                  transakčních zpráv (obnovení hesla).
                </>,
                <>
                  <B>Partnerské finanční instituce</B> – pojišťovny, banky
                  a investiční společnosti, ale výhradně tehdy, když si
                  konkrétní produkt vyberete a zadáte pokyn ke sjednání.
                  V takovém případě vystupují jako samostatní správci.
                </>,
                <>
                  <B>Orgány veřejné moci</B> – pokud nám to ukládá zákon
                  (např. ČNB, finanční správa).
                </>,
              ]}
            />
            <P>
              Někteří poskytovatelé technického zázemí sídlí mimo EU. Předání se
              v takovém případě opírá o standardní smluvní doložky Evropské
              komise, případně o rozhodnutí o odpovídající ochraně.
            </P>
          </Section>

          <Section number="06" title="Jak dlouho je uchováváme">
            <List
              items={[
                <>
                  <B>Aktivní účet</B> – po celou dobu, co ho používáte. Kdykoliv
                  můžete požádat o jeho zrušení.
                </>,
                <>
                  <B>Neaktivní účet bez sjednané smlouvy</B> – 3 roky od
                  poslední aktivity, pak údaje smažeme.
                </>,
                <>
                  <B>Zdravotní údaje</B> – do odvolání souhlasu, nejdéle však po
                  dobu platnosti účtu.
                </>,
                <>
                  <B>Sjednané smlouvy</B> – po dobu trvání smlouvy a dále po
                  dobu, kterou ukládá zákon (u distribuce pojištění a úvěrů
                  zpravidla 5–10 let od zániku smlouvy).
                </>,
                // TODO (Jakub): znění si projdi, je to můj návrh. Odpovídá tomu,
                // co reálně dělá /api/analyza/koncept a migrace 010.
                <>
                  <B>Rozepsaná analýza</B> – ukládá se až od chvíle, kdy v
                  posledním kroku vyplníte kontakt, abyste o odpovědi nepřišli.
                  Po odeslání analýzy ji mažeme, nejpozději po 60 dnech.
                </>,
              ]}
            />
          </Section>

          <Section number="07" title="Zabezpečení">
            <List
              items={[
                'Veškerá komunikace s aplikací je šifrovaná (HTTPS).',
                'Přístup k datům je v databázi vynucen na úrovni řádků – vaše záznamy nevidí jiný klient, technicky to nejde.',
                'Nahrané dokumenty leží v soukromém úložišti; otevírají se přes dočasné odkazy s omezenou platností.',
                'Hesla jsou uložena pouze jako nevratný otisk (hash).',
              ]}
            />
          </Section>

          <Section number="08" title="Cookies">
            <P>
              Dnes používáme výhradně technicky nezbytné cookies a úložiště
              prohlížeče – drží vaše přihlášení a rozepsanou analýzu. Bez nich by
              aplikace nefungovala, a proto k nim není potřeba souhlas. Analytické
              ani marketingové cookies zatím nepoužíváme; kdyby přibyly, zeptáme se
              napřed a bez souhlasu se jejich skripty nenačtou.
            </P>
            <P>
              Podrobný seznam najdete v{' '}
              <Odkaz href="/zasady-cookies">zásadách používání cookies</Odkaz>, kde
              také kdykoliv změníte svoje rozhodnutí.
            </P>
          </Section>

          <Section number="09" title="Vaše práva">
            <P>Ve vztahu ke svým údajům máte právo:</P>
            <List
              items={[
                <>
                  <B>na přístup</B> – chtít kopii toho, co o vás vedeme;
                </>,
                <>
                  <B>na opravu</B> – nechat opravit nepřesné údaje (většinu
                  si opravíte sami přímo v aplikaci);
                </>,
                <>
                  <B>na výmaz</B> – nechat údaje smazat, pokud nebrání zákonná
                  povinnost je uchovat;
                </>,
                <>
                  <B>na omezení zpracování</B> a <B>na přenositelnost</B> –
                  dostat údaje ve strojově čitelném formátu;
                </>,
                <>
                  <B>vznést námitku</B> proti zpracování na základě oprávněného
                  zájmu;
                </>,
                <>
                  <B>odvolat souhlas</B> se zpracováním zdravotních údajů,
                  kdykoliv a bez udání důvodu.
                </>,
              ]}
            />
            <P>
              Stačí napsat na{' '}
              <a
                href={`mailto:${SPRAVCE.email}`}
                className="text-navy hover:text-navy font-semibold transition-colors"
              >
                {SPRAVCE.email}
              </a>
              . Pokud budete mít pocit, že s vašimi údaji nenakládáme správně,
              můžete podat stížnost u Úřadu pro ochranu osobních údajů, Pplk.
              Sochora 27, 170 00 Praha 7,{' '}
              <a
                href="https://www.uoou.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy hover:text-navy font-semibold transition-colors"
              >
                uoou.cz
              </a>
              .
            </P>
          </Section>

          <Section number="10" title="Změny těchto zásad">
            <P>
              Pokud se způsob zpracování změní, aktualizujeme tento dokument
              a posuneme datum účinnosti nahoře. U podstatných změn vás
              upozorníme e-mailem nebo přímo v aplikaci.
            </P>
          </Section>

    </PravniStranka>
  )
}





