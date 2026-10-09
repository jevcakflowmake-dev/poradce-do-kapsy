import TemaStranka, { type ObsahTematu } from '@/components/landing/TemaStranka'
import { metadataTematu } from '@/lib/temata'
import { TRANSPARENTNOST } from '@/lib/poradce'

export const metadata = metadataTematu({
  titulek: 'Pojištění nemovitosti a domácnosti',
  popis:
    'Pojištění nemovitosti a domácnosti, odpovědnosti i auta s kontrolou starších smluv. Analýzu vyplníte za 15 minut, návrh dostanete do 48 hodin. Zdarma.',
  cesta: '/pojisteni-majetku',
})

/**
 * TODO (Jakub): text je můj návrh. Je to regulovaný obor, proto v něm nejsou
 * žádné ceny, částky ani sliby typu „nejlevnější“ – nic takového nedoplňuj
 * bez podkladu. Zkontroluj hlavně výklad podpojištění a to, jestli smíš
 * zprostředkovat všechno, o čem stránka mluví (včetně pojištění aut).
 */
const OBSAH: ObsahTematu = {
  cesta: '/pojisteni-majetku',
  udalostCta: 'klik_majetek_analyza',
  h1: 'Pojištění nemovitosti a domácnosti podle toho, co vlastníte',
  perex:
    'Stavba, vybavení domácnosti, odpovědnost a auto jsou čtyři různé pojistky. Z analýzy zjistím, co máte, co chybí a co je nastavené na staré ceny, a do 48 hodin pošlu návrh. Bez schůzek, bez tlaku.',
  uvod: {
    nadpis: 'Co všechno pojištění majetku znamená',
    odstavce: [
      'Pod pojištěním majetku se schovává několik různých smluv. Pojištění nemovitosti kryje samotnou stavbu: zdi, střechu a vše, co je s ní pevně spojené. Pojištění domácnosti kryje vybavení, tedy nábytek, elektroniku, kola nebo nářadí, a dává smysl i v nájmu.',
      'Třetí je pojištění odpovědnosti. Platí škodu, kterou způsobíte někomu jinému, například vytopenému sousedovi. Čtvrté je auto: povinné ručení a případně havarijní pojištění.',
      'Častý problém není chybějící smlouva, ale stará smlouva. Ceny nemovitostí i stavebních prací vzrostly, pojistné částky ve starších smlouvách ale zůstaly. Pojišťovna pak při škodě uhradí jen část. Říká se tomu podpojištění a člověk se o něm většinou dozví až při škodě.',
      'V analýze se proto ptám, co vlastníte, jestli nemovitost pronajímáte a kdy jste pojistku naposledy přepočítávali. Pro pronajímanou nemovitost platí jiné podmínky než pro tu, ve které bydlíte. Z odpovědí vyjde, co stačí upravit a co je potřeba sjednat nově.',
    ],
    souvisi: {
      veta: 'Nemovitost teprve kupujete, nebo vám končí fixace? Podívejte se i na stránku',
      cesta: '/hypoteka',
      odkaz: 'Hypotéka a refinancování',
    },
  },
  situace: {
    nadpis: 'Kdy se na pojištění majetku podívat',
    karty: [
      {
        titul: 'Kupujete nebo jste dostavěli',
        popis: 'K hypotéce banka pojištění nemovitosti vyžaduje. Vyplatí se ho vybrat podle krytí, ne jen podle toho, co je zrovna po ruce.',
      },
      {
        titul: 'Smlouva běží roky beze změny',
        popis: 'Zkontroluji, jestli pojistná částka odpovídá dnešní hodnotě a jestli ve smlouvě nechybí běžná rizika.',
      },
      {
        titul: 'Bydlíte v nájmu',
        popis: 'Stavbu řeší majitel. Vaše vybavení a odpovědnost za škody jsou ale na vás.',
      },
    ],
  },
  postup: [
    {
      titul: 'Vyplníte online analýzu.',
      popis: 'Patnáct minut. Ptám se, co vlastníte, jak to máte pojištěné a co chcete vyřešit. Smlouvy můžete přiložit.',
    },
    {
      titul: 'Projdu krytí a porovnám nabídky.',
      popis: 'Do 48 hodin dostanete návrh s vysvětlením, co je v pořádku, co chybí a co se dá upravit.',
    },
    {
      titul: 'Vše máte v aplikaci.',
      popis: 'Smlouvy a platby máte na jednom místě. Kdyby se něco stalo, napíšete mi.',
    },
  ],
  proc: {
    nadpis: 'Proč přes poradce, a ne rovnou v pojišťovně',
    perex: 'Pojišťovna vám nabídne svůj produkt. Já začínám u toho, co vlastníte a co by vás škoda stála.',
    karty: [
      {
        titul: 'Porovnání',
        popis: 'Nejsem vázaný na jednu pojišťovnu, takže nabídky porovnám mezi sebou.',
      },
      {
        titul: 'Kontrola částek',
        popis: 'Podívám se, jestli pojistné částky odpovídají dnešní hodnotě vašeho majetku.',
      },
      TRANSPARENTNOST,
      {
        titul: 'Všechno dohromady',
        popis: 'Nemovitost, domácnost, odpovědnost i auto řeším najednou, aby se krytí nepřekrývalo.',
      },
    ],
  },
  dotazy: [
    {
      udalost: 'faq_majetek_rozdil',
      otazka: 'Jaký je rozdíl mezi pojištěním nemovitosti a domácnosti?',
      odpoved:
        'Nemovitost je stavba a to, co je s ní pevně spojené. Domácnost je vybavení, které byste si při stěhování odvezli. Jsou to dvě pojistky. Vlastník obvykle potřebuje obě, nájemník jen tu druhou.',
    },
    {
      udalost: 'faq_majetek_podpojisteni',
      otazka: 'Co je podpojištění?',
      odpoved:
        'Stav, kdy je pojistná částka nižší než skutečná hodnota majetku. Pojišťovna pak škodu hradí jen v odpovídajícím poměru. Proto se v analýze ptám, kdy jste smlouvu naposledy přepočítávali.',
    },
    {
      udalost: 'faq_majetek_odpovednost',
      otazka: 'Potřebuji pojištění odpovědnosti?',
      odpoved:
        'Kryje škody, které způsobíte jiným lidem, a ty mohou být vyšší než škoda na vašem vlastním majetku. Někdy už ho máte jako součást jiné smlouvy. To zjistím při kontrole.',
    },
    {
      udalost: 'faq_majetek_auto',
      otazka: 'Můžete mi přepočítat i pojištění auta?',
      odpoved:
        'Ano. V analýze uvedete, jak ho máte pojištěné, a zaškrtnete, že chcete přepočet. V návrhu pak uvidíte srovnání s tím, co platíte teď.',
    },
  ],
}

export default function PojisteniMajetkuPage() {
  return <TemaStranka obsah={OBSAH} />
}
