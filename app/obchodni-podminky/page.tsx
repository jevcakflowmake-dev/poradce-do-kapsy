import type { Metadata } from 'next'
import { PravniStranka, Section, P, B, List, Callout, Odkaz } from '@/components/legal/PravniStranka'
import { PORADCE } from '@/lib/poradce'

export const metadata: Metadata = {
  title: 'Obchodní podmínky',
  description:
    'Kdo službu Poradce do kapsy provozuje, co za ni platíte, jak probíhá spolupráce a jak řešit případný spor.',
  alternates: { canonical: '/obchodni-podminky' },
}

/**
 * TODO (Jakub): znění je můj návrh a popisuje to, co aplikace dneska dělá —
 * projdi ho, než web spustíš, a ideálně si ho nech potvrdit právníkem.
 * Zkontroluj hlavně:
 *   · bod 01 – jménem koho jednáš (ProfiFP / OVB) a číslo registrace u ČNB,
 *   · bod 04 – formulaci o provizi, ať sedí se smlouvou se sítí,
 *   · bod 05 – lhůtu 48 hodin, je to závazek, který dáváš i na úvodní stránce,
 *   · bod 09 – kam přesně patří spory z tvé činnosti (finanční arbitr vs. ČOI).
 */
const UCINNOST_OD = '21. září 2026'

export default function ObchodniPodminkyPage() {
  return (
    <PravniStranka
      nadrazene="Podmínky služby"
      nadpis={<>Obchodní podmínky</>}
      ucinnostOd={UCINNOST_OD}
      perex={
        <p>
          Co pro vás dělám, co to stojí, co ode mě můžete čekat a co naopak čekat
          nemůžete. Psané tak, aby se to dalo přečíst.
        </p>
      }
    >
      <Section number="01" title="Kdo službu poskytuje">
        <P>
          Službu Poradce do kapsy provozuje <B>{PORADCE.jmeno}</B>, IČO {PORADCE.ico},
          se sídlem {PORADCE.adresa}, e-mail{' '}
          <Odkaz href={`mailto:${PORADCE.email}`}>{PORADCE.email}</Odkaz> (dále jen
          „poradce“).
        </P>
        <P>
          Finanční zprostředkování vykonávám jako vázaný zástupce zapsaný v registru
          České národní banky
          {PORADCE.cnbCisloRegistrace ? ` pod číslem ${PORADCE.cnbCisloRegistrace}` : ''}.
          Zápis si můžete ověřit ve{' '}
          <Odkaz href={PORADCE.cnbRegistrUrl}>veřejném registru ČNB</Odkaz>. Dohled nad
          mojí činností má Česká národní banka.
        </P>
      </Section>

      <Section number="02" title="Co je služba">
        <P>Služba má tři části:</P>
        <List
          items={[
            <>
              <B>Analýza</B> — online dotazník o vaší situaci, cílech a smlouvách.
              Vyplníte ho bez registrace.
            </>,
            <>
              <B>Návrh na míru</B> — z vašich odpovědí připravím finanční plán:
              co vám chybí, co máte zbytečně draho a jaké jsou konkrétní možnosti.
            </>,
            <>
              <B>Klientská zóna</B> — místo, kde máte plán, přehled smluv, dokumenty
              a chat se mnou.
            </>,
          ]}
        />
        <Callout>
          <P>
            <B>Návrh není uzavření smlouvy.</B> Smlouvu o pojištění, spoření nebo
            investici uzavíráte přímo s tou finanční institucí, ne se mnou. Dokud ji
            nepodepíšete, nic vás neváže.
          </P>
        </Callout>
      </Section>

      <Section number="03" title="Kdy podmínky platí">
        <P>
          Podmínky platí od chvíle, kdy odešlete analýzu nebo si založíte účet v
          klientské zóně. Tím berete na vědomí jejich znění a{' '}
          <Odkaz href="/zasady-ochrany-osobnich-udaju">
            zásady zpracování osobních údajů
          </Odkaz>
          .
        </P>
        <P>
          Službu používáte dobrovolně a můžete ji kdykoliv přestat používat. Stačí
          napsat a účet i údaje smažu, pokud mi je nemusí zákon nechat déle.
        </P>
      </Section>

      <Section number="04" title="Kolik to stojí">
        <P>
          <B>Pro vás nic.</B> Analýza, návrh i klientská zóna jsou zdarma a zdarma
          zůstávají i tehdy, když návrh odmítnete nebo se ozvete až za rok.
        </P>
        <P>
          Odměnu dostávám od finančních institucí, se kterými nakonec smlouvu
          uzavřete — formou provize z uzavřené smlouvy. Když neuzavřete nic,
          nedostanu nic. Na konkrétní výši provize se můžete kdykoliv zeptat a
          u sjednávaného produktu vám ji sdělím.
        </P>
      </Section>

      <Section number="05" title="Jak spolupráce probíhá">
        <List
          items={[
            <>Vyplníte analýzu. Zabere to kolem patnácti minut a nemusíte ji vyplnit najednou.</>,
            <>
              Projdu vaše odpovědi a připravím návrh. Zpravidla <B>do 48 hodin</B> od
              odeslání kompletní analýzy. Když budu potřebovat něco doplnit, ozvu se dřív.
            </>,
            <>
              Návrh najdete v klientské zóně. Můžete se na cokoliv zeptat v chatu a
              říct, co vás zajímá a co ne.
            </>,
            <>
              Když se pro něco rozhodnete, sjednání smlouvy s institucí vyřídíme
              společně. Schůzka není podmínkou.
            </>,
          ]}
        />
        <P>
          Kvalita návrhu stojí a padá s tím, co mi napíšete. Z neúplných nebo
          nepřesných údajů nemůže vyjít přesné doporučení.
        </P>
      </Section>

      <Section number="06" title="Účet a přístup">
        <P>
          Přístup do klientské zóny je osobní. Heslo nikomu nesdělujte a vyberte si
          takové, které nepoužíváte jinde. Kdybyste měli podezření, že se k účtu
          dostal někdo další, napište mi a přístup zablokuju.
        </P>
        <P>
          Obsah klientské zóny slouží vám. Nezveřejňujte ho ani nepředávejte třetím
          stranám jako podklad pro jejich podnikání.
        </P>
      </Section>

      <Section number="07" title="Co služba není">
        <List
          items={[
            <>
              <B>Není to investiční doporučení</B> ani analýza investičních
              příležitostí ve smyslu předpisů o podnikání na kapitálovém trhu.
            </>,
            <>
              <B>Není to daňové ani právní poradenství.</B> U složitějších situací
              vám řeknu, kdy je na místě daňový poradce nebo advokát.
            </>,
            <>
              <B>Není to záruka výnosu.</B> U investičních a spořicích produktů platí,
              že minulé výnosy nejsou zárukou budoucích a hodnota investice může klesat.
            </>,
            <>
              <B>Není to rozhodnutí za vás.</B> Návrh je podklad; jestli a co
              podepíšete, zůstává na vás.
            </>,
          ]}
        />
      </Section>

      <Section number="08" title="Dostupnost a odpovědnost">
        <P>
          Aplikaci se snažím držet v provozu nepřetržitě, ale nemůžu to zaručit —
          občas je potřeba údržba a občas vypadne služba, na které aplikace stojí.
          Za dočasnou nedostupnost neodpovídám.
        </P>
        <P>
          Odpovědnost za škodu se řídí českým právem. Neodpovídám za následky
          rozhodnutí, která uděláte na základě neúplných nebo nepravdivých údajů
          zadaných do analýzy.
        </P>
      </Section>

      <Section number="09" title="Reklamace a spory">
        <P>
          Když budete s čímkoliv nespokojení, napište mi na{' '}
          <Odkaz href={`mailto:${PORADCE.email}`}>{PORADCE.email}</Odkaz>. Odpovím
          nejpozději do 30 dnů.
        </P>
        <P>
          Jste-li spotřebitel a nedohodneme se, máte právo obrátit se na orgán pro
          mimosoudní řešení sporů:
        </P>
        <List
          items={[
            <>
              <Odkaz href="https://www.finarbitr.cz">Finanční arbitr</Odkaz> — u sporů,
              které spadají do jeho působnosti (například životní pojištění,
              spotřebitelský úvěr nebo platební služby).
            </>,
            <>
              <Odkaz href="https://adr.coi.cz">Česká obchodní inspekce</Odkaz> —
              u ostatních spotřebitelských sporů.
            </>,
            <>
              <Odkaz href="https://www.cnb.cz">Česká národní banka</Odkaz> — dohledový
              orgán nad finančním zprostředkováním; sem patří podněty k mé činnosti
              jako vázaného zástupce.
            </>,
          ]}
        />
      </Section>

      <Section number="10" title="Změny podmínek">
        <P>
          Podmínky můžu upravit, když se změní služba nebo předpisy. O změně dám vědět
          e-mailem nebo přímo v aplikaci nejméně 14 dnů předem. Když vám nová verze
          nebude vyhovovat, můžete službu přestat používat a požádat o smazání účtu.
        </P>
      </Section>

      <Section number="11" title="Rozhodné právo">
        <P>
          Vztah mezi vámi a poradcem se řídí českým právem, zejména občanským
          zákoníkem a předpisy o distribuci pojištění a spotřebitelského úvěru. Co
          neupravují tyto podmínky, řídí se těmito předpisy.
        </P>
        <P>
          Jak nakládám s osobními údaji, popisují{' '}
          <Odkaz href="/zasady-ochrany-osobnich-udaju">zásady ochrany osobních údajů</Odkaz>
          ; co si web ukládá v prohlížeči, najdete v{' '}
          <Odkaz href="/zasady-cookies">zásadách používání cookies</Odkaz>.
        </P>
      </Section>
    </PravniStranka>
  )
}
