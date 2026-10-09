import TemaStranka, { type ObsahTematu } from '@/components/landing/TemaStranka'
import { metadataTematu } from '@/lib/temata'
import { TRANSPARENTNOST } from '@/lib/poradce'

export const metadata = metadataTematu({
  titulek: 'Penzijní spoření a pravidelné investování',
  popis:
    'Penzijní spoření a pravidelné investování s plánem podle vašich cílů. Analýzu vyplníte online za 15 minut, návrh s vysvětlením dostanete do 48 hodin. Zdarma.',
  cesta: '/sporeni-a-investice',
})

/**
 * TODO (Jakub): text je můj návrh. Je to regulovaný obor, proto v něm nejsou
 * žádné výnosy, příspěvky v korunách ani sliby zhodnocení – nic takového
 * nedoplňuj bez podkladu. Upozornění na riziko pod úvodním textem tu má
 * zůstat. Zkontroluj, jestli smíš zprostředkovat všechno, o čem stránka mluví
 * (doplňkové penzijní spoření i investice do fondů).
 */
const OBSAH: ObsahTematu = {
  cesta: '/sporeni-a-investice',
  udalostCta: 'klik_sporeni_analyza',
  h1: 'Penzijní spoření a pravidelné investování s plánem na míru',
  perex:
    'Kolik odkládat, kam a na jak dlouho. Z analýzy sestavím plán na důchod i na bližší cíle a do 48 hodin vám ho pošlu s vysvětlením. Bez schůzek, bez tlaku.',
  uvod: {
    nadpis: 'Proč nestačí nechat peníze na účtu',
    odstavce: [
      'Peníze, které leží na běžném účtu, ujídá inflace. Spořicí účet je dobré místo pro rezervu, na cíle vzdálené mnoho let ale obvykle nestačí.',
      'Penzijní spoření a investice řeší totéž z různých stran. U penzijního spoření můžete získat státní příspěvek, daňovou úlevu a někdy i příspěvek od zaměstnavatele, peníze jsou ale vázané do důchodového věku. Investice do fondů jsou volnější a hodí se i na dřívější cíle: vlastní bydlení, studium dětí nebo větší rezervu.',
      'Jaká kombinace dává smysl, záleží na tom, kolik můžete odkládat, na jak dlouho a jaké výkyvy hodnoty unesete. Kdo má do důchodu daleko, může si dovolit jiné složení než ten, kdo bude peníze potřebovat brzy.',
      'Plán proto začíná rezervou na nečekané výdaje. Teprve to, co zbývá, se dělí mezi penzijní spoření a investice, a každá část má svůj účel a dobu, po kterou na peníze nesáhnete. Když víte, k čemu která část slouží, snáz vydržíte i období, kdy hodnota klesne.',
    ],
    poznamka:
      'Investování je spojené s rizikem. Hodnota investice může růst i klesat a návratnost vložených peněz není zaručena.',
    souvisi: {
      veta: 'Spoříte dětem? Tomu se věnuje stránka',
      cesta: '/zajisteni-deti',
      odkaz: 'Zajištění dětí',
    },
  },
  situace: {
    nadpis: 'Kdy to řešit',
    karty: [
      {
        titul: 'Máte penzijko a nevíte, jak je nastavené',
        popis: 'Podívám se na strategii, výši příspěvku a na to, jestli využíváte všechno, na co máte nárok.',
      },
      {
        titul: 'Chcete začít investovat',
        popis: 'Nevíte, kde začít ani kolik dávat stranou. Projdeme to od rezervy po první pravidelnou investici.',
      },
      {
        titul: 'Spoříte dětem nebo na bydlení',
        popis: 'Cíl má termín. Podle něj se volí, jak opatrně nebo odvážně peníze uložit.',
      },
    ],
  },
  postup: [
    {
      titul: 'Vyplníte online analýzu.',
      popis: 'Patnáct minut. Ptám se na příjmy, rezervu, cíle a na to, jak snášíte výkyvy.',
    },
    {
      titul: 'Sestavím plán.',
      popis: 'Do 48 hodin dostanete návrh: kolik odkládat, kam a proč. S ukázkou, jak by se úspory mohly vyvíjet.',
    },
    {
      titul: 'Sledujete to v aplikaci.',
      popis: 'Smlouvy, platby i plán máte na jednom místě. Když se vám změní situace, napíšete mi.',
    },
  ],
  proc: {
    nadpis: 'Proč přes poradce, a ne rovnou u jedné společnosti',
    perex: 'Penzijní nebo investiční společnost vám nabídne své fondy. Já začínám u vašich cílů.',
    karty: [
      {
        titul: 'Porovnání',
        popis: 'Spolupracuji s více penzijními a investičními společnostmi, takže jejich nabídky postavím vedle sebe.',
      },
      {
        titul: 'Plán, ne produkt',
        popis: 'Začínám u cílů a rezervy. Konkrétní produkt přichází až jako poslední krok.',
      },
      TRANSPARENTNOST,
      {
        titul: 'Srozumitelnost',
        popis: 'Vysvětlím, co znamenají poplatky, strategie a riziko. Obyčejnou češtinou.',
      },
    ],
  },
  dotazy: [
    {
      udalost: 'faq_sporeni_castka',
      otazka: 'Kolik bych měl měsíčně odkládat?',
      odpoved:
        'Univerzální částka neexistuje. Vychází se z příjmu, výdajů a z toho, na co a na kdy peníze chcete. V návrhu uvidíte doporučení pro svoji situaci.',
    },
    {
      udalost: 'faq_sporeni_penzijko_nebo_investice',
      otazka: 'Je lepší penzijní spoření, nebo investice?',
      odpoved:
        'Většinou dává smysl obojí, jen v různém poměru. Penzijní spoření má státní podporu, ale peníze jsou vázané. Investice jsou dostupnější. Poměr navrhnu podle vašich cílů.',
    },
    {
      udalost: 'faq_sporeni_dip',
      otazka: 'Co je lepší: DIP, nebo penzijní spoření?',
      odpoved:
        'Obojí má daňovou podporu a u obojího jsou peníze vázané na dlouhou dobu. Penzijní spoření má navíc státní příspěvek, dlouhodobý investiční produkt (DIP) nabízí širší výběr toho, do čeho investovat. Jedno druhé nevylučuje. Co se hodí vám, vyjde z analýzy.',
    },
    {
      udalost: 'faq_sporeni_riziko',
      otazka: 'Můžu o peníze přijít?',
      odpoved:
        'Hodnota investice kolísá a může i klesnout, zvlášť krátkodobě. Plán proto začíná rezervou a riziko se volí podle toho, kdy peníze budete potřebovat. Výnos zaručit nejde.',
    },
    {
      udalost: 'faq_sporeni_stare_penzijko',
      otazka: 'Mám staré penzijní připojištění. Mám ho měnit?',
      odpoved:
        'Záleží na smlouvě. Starší typ má jiná pravidla než dnešní doplňkové penzijní spoření a přechod má své výhody i nevýhody. Projdu vaši smlouvu a napíšu vám, co z toho vychází.',
    },
  ],
}

export default function SporeniAInvesticePage() {
  return <TemaStranka obsah={OBSAH} />
}
