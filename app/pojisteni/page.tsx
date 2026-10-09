import TemaStranka, { type ObsahTematu } from '@/components/landing/TemaStranka'
import { metadataTematu } from '@/lib/temata'

export const metadata = metadataTematu({
  titulek: 'Životní pojištění a pojištění příjmu',
  popis:
    'Životní pojištění a pojištění příjmu podle vaší situace. Analýzu vyplníte za 15 minut a do 48 hodin dostanete návrh krytí s vysvětlením. Zdarma, bez schůzek.',
  cesta: '/pojisteni',
})

/**
 * TODO (Jakub): text je můj návrh. Je to regulovaný obor, proto v něm nejsou
 * žádné ceny, částky ani sliby typu „nejlevnější“ – nic takového nedoplňuj
 * bez podkladu. Zkontroluj hlavně kartu „Pomoc při události“ (slibuje, že
 * poradíš s nahlášením) a odpověď o starší smlouvě.
 */
const OBSAH: ObsahTematu = {
  cesta: '/pojisteni',
  udalostCta: 'klik_pojisteni_analyza',
  h1: 'Životní pojištění a pojištění příjmu podle vaší situace',
  perex:
    'Pojistka má pokrýt chvíle, kdy přijdete o příjem: dlouhou nemoc, vážný úraz, invaliditu. Z analýzy spočítám, kolik potřebujete, a do 48 hodin pošlu návrh. Bez schůzek, bez tlaku.',
  uvod: {
    nadpis: 'K čemu životní pojištění je',
    odstavce: [
      'Životní pojištění není spoření ani sázka. Nahrazuje příjem ve chvíli, kdy nemůžete pracovat, a zajišťuje rodinu a splátky pro případ, že byste zemřeli.',
      'Hodně lidí pojistku má, ale neví, co přesně kryje. Často platí za drobná rizika, která by zvládli z úspor, a chybí jim krytí těch velkých: invalidity, dlouhé pracovní neschopnosti nebo závažné nemoci. Jiní mají částky nastavené podle příjmu, který měli před lety.',
      'Dobré nastavení vychází z vašich čísel: kolik vyděláváte, jakou máte rezervu, co dostanete od státu a kdo je na vašem příjmu závislý. U zaměstnance vypadá jinak než u podnikatele, který si neplatí nemocenské pojištění a v nemoci zůstává bez příjmu.',
      'Návrh proto nezačíná u produktu, ale u otázky, co by se stalo s vaším rozpočtem, kdybyste delší dobu nebo natrvalo nemohli pracovat. Z toho vyjde, která rizika pojistit a na jaké částky. Teprve potom porovnávám, jak je jednotlivé pojišťovny kryjí a kolik za to chtějí. Drobnosti, které zvládnete z rezervy, do návrhu nedávám.',
    ],
  },
  situace: {
    nadpis: 'Kdy se na pojištění podívat',
    karty: [
      {
        titul: 'Máte smlouvu a nevíte, co kryje',
        popis: 'Projdu ji a napíšu vám, co v ní je, co v ní chybí a co je v ní navíc.',
      },
      {
        titul: 'Změnil se vám život',
        popis: 'Hypotéka, dítě, vyšší příjem nebo začátek podnikání. Pojistka by to měla dohnat.',
      },
      {
        titul: 'Pojištění zatím nemáte',
        popis: 'Spočítám, co by pro vás znamenal výpadek příjmu, a navrhnu krytí, které se vejde do rozpočtu.',
      },
    ],
  },
  postup: [
    {
      titul: 'Vyplníte online analýzu.',
      popis: 'Patnáct minut. Ptám se na příjem, výdaje, rezervu a zdraví. Stávající smlouvy můžete přiložit.',
    },
    {
      titul: 'Navrhnu krytí.',
      popis: 'Do 48 hodin dostanete varianty od více pojišťoven s vysvětlením, co která pokryje a kolik stojí.',
    },
    {
      titul: 'Vše máte v aplikaci.',
      popis: 'Smlouvu, platby i přehled toho, co máte pojištěné. A chat se mnou, kdyby se něco stalo.',
    },
  ],
  proc: {
    nadpis: 'Proč přes poradce, a ne rovnou v pojišťovně',
    perex: 'Pojišťovna vám nabídne svůj produkt. Já začínám u toho, co potřebujete pokrýt.',
    karty: [
      {
        titul: 'Porovnání',
        popis: 'Nejsem vázaný na jednu pojišťovnu, takže nabídky porovnám mezi sebou.',
      },
      {
        titul: 'Krytí podle čísel',
        popis: 'Pojistné částky počítám z vašeho příjmu, závazků a rezervy, ne podle šablony.',
      },
      {
        titul: 'Transparentnost',
        popis: 'U každého doporučení napíšu, proč zrovna tohle a kolik za to dostanu zaplaceno.',
      },
      {
        titul: 'Pomoc při události',
        popis: 'Když se něco stane, napíšete mi v aplikaci a poradím, jak událost pojišťovně nahlásit.',
      },
    ],
  },
  dotazy: [
    {
      udalost: 'faq_pojisteni_cena',
      otazka: 'Kolik životní pojištění stojí?',
      odpoved:
        'Záleží na věku, zdraví, povolání a na tom, jaká rizika a částky si zvolíte. Ceny proto předem neuvádím. V návrhu uvidíte konkrétní varianty a můžete je porovnat.',
    },
    {
      udalost: 'faq_pojisteni_stara_smlouva',
      otazka: 'Mám starší smlouvu. Mám ji zrušit?',
      odpoved:
        'Nic nerušte, dokud nemáte sjednanou náhradu. Některé starší smlouvy má smysl jen upravit. Projdu tu vaši a napíšu vám, co doporučuji a proč.',
    },
    {
      udalost: 'faq_pojisteni_zdravi',
      otazka: 'Proč se v analýze ptáte na zdraví?',
      odpoved:
        'Pojišťovny podle zdravotního stavu určují cenu i rozsah krytí. Údaje o zdraví zpracovávám jen s vaším souhlasem a tuhle část analýzy můžete přeskočit.',
    },
    {
      udalost: 'faq_pojisteni_osvc',
      otazka: 'Jsem OSVČ. Liší se pojištění nějak?',
      odpoved:
        'Ano. Jako podnikatel máte při nemoci od státu nárok jen na to, co si sami platíte, takže výpadek příjmu dopadne tvrději. V analýze se na to ptám zvlášť.',
    },
  ],
}

export default function PojisteniPage() {
  return <TemaStranka obsah={OBSAH} />
}
