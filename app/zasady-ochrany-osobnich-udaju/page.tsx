import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Zásady ochrany osobních údajů',
  description:
    'Jaké osobní údaje Poradce do kapsy zpracovává, proč, jak dlouho a jaká máte práva.',
  alternates: { canonical: '/zasady-ochrany-osobnich-udaju' },
}

/**
 * Údaje správce doplněny 31. 8. 2026. IČO a sídlo ověřeny proti ARES
 * (Jakub Jevčák, aktivní OSVČ od 30. 6. 2017) – ne opsány z paměti.
 *
 * Pozor při změnách: `email` je na veřejné stránce viditelný komukoliv včetně
 * sběračů adres a je to kontakt, přes který subjekt údajů uplatňuje svá práva.
 * Doména `ovbmail.cz` patří OVB, ne správci – kdyby spolupráce skončila,
 * schránka zanikne a zásady budou odkazovat naprázdno. Pak sem dát adresu
 * na vlastní doméně.
 */
const SPRAVCE = {
  jmeno: 'Jakub Jevčák',
  ico: '06241557',
  adresa: 'Čížová 59, 398 31 Čížová',
  email: 'jakub.jevcak@ovbmail.cz',
} as const

// Datum, kdy zásady poprvé skutečně identifikovaly správce. Do 31. 8. 2026
// byly na jeho místě zástupné texty, takže dokument nebyl úplný.
const UCINNOST_OD = '31. srpna 2026'

export default function ZasadyPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <div className="px-6 md:px-10 lg:px-16 xl:px-20 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#66708C] hover:text-[#162459] transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět na úvod
          </Link>

          <p className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#66708C] mb-6">
            <span className="inline-block w-10 h-px bg-[#009EE2]" />
            Ochrana soukromí
          </p>

          <h1
            className="font-display text-[#162459] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            Zásady zpracování
            <br />
            osobních <span style={{ color: '#009EE2' }}>údajů</span>
          </h1>

          <p className="text-lg text-[#66708C] leading-relaxed mb-4">
            Abychom vám mohli připravit finanční plán na míru, potřebujeme o vás
            vědět docela dost – včetně údajů o zdraví. Tady je přehledně, co
            sbíráme, proč, jak dlouho si to necháváme a co s tím můžete udělat.
          </p>
          <p className="text-sm text-[#66708C]/80 mb-14">Účinné od {UCINNOST_OD}</p>

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
                className="text-[#0079AD] hover:text-[#162459] font-semibold transition-colors"
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
                  className="text-[#0079AD] hover:text-[#162459] font-semibold transition-colors"
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
              Používáme výhradně technicky nezbytné cookies, které udržují vaše
              přihlášení. Bez nich by aplikace nefungovala, a proto k nim není
              potřeba souhlas ani cookies lišta. Analytické, marketingové ani
              cookies třetích stran nepoužíváme.
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
                className="text-[#0079AD] hover:text-[#162459] font-semibold transition-colors"
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
                className="text-[#0079AD] hover:text-[#162459] font-semibold transition-colors"
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

          <div className="mt-16 pt-8 border-t border-[#E4DFD2]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#66708C] hover:text-[#162459] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět na úvod
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline gap-4 mb-5 pb-4 border-b border-[#E4DFD2]">
        <span className="text-xs tabular-nums tracking-[0.2em] text-[#009EE2]">{number}</span>
        <h2
          className="font-display text-[#162459]"
          style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-[#66708C] leading-relaxed">{children}</p>
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-[#162459]">{children}</strong>
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] text-[#66708C] leading-relaxed">
          <span className="mt-2.5 w-1 h-1 rounded-full bg-[#009EE2] flex-shrink-0" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FDFCF8] border border-[#E4DFD2] border-l-2 border-l-[#009EE2] p-5 md:p-6 space-y-4">
      {children}
    </div>
  )
}
