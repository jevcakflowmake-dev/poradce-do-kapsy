import TemaStranka, { type ObsahTematu } from '@/components/landing/TemaStranka'
import { metadataTematu } from '@/lib/temata'
import { TRANSPARENTNOST } from '@/lib/poradce'

export const metadata = metadataTematu({
  titulek: 'Spoření pro děti a úrazové pojištění dětí',
  popis:
    'Spoření pro děti a pojištění dítěte podle jeho věku. Analýzu vyplníte za 15 minut a do 48 hodin dostanete návrh pro každé dítě zvlášť, s vysvětlením. Zdarma.',
  cesta: '/zajisteni-deti',
})

/**
 * TODO (Jakub): text je můj návrh. Je to regulovaný obor, proto v něm nejsou
 * žádné částky, výnosy ani sliby – nic takového nedoplňuj bez podkladu.
 * Zkontroluj hlavně odstavec o tom, že zajištění dítěte začíná u rodičů
 * (je to rada, ne fakt), a odpověď o spoření na jméno dítěte.
 */
const OBSAH: ObsahTematu = {
  cesta: '/zajisteni-deti',
  udalostCta: 'klik_deti_analyza',
  h1: 'Spoření a pojištění pro děti, nastavené podle jejich věku',
  perex:
    'U každého dítěte se ptám zvlášť, protože batole potřebuje něco jiného než středoškolák. Z analýzy navrhnu, jak mu spořit a co pojistit, a do 48 hodin vám pošlu návrh. Bez schůzek, bez tlaku.',
  uvod: {
    nadpis: 'Co zajištění dětí znamená',
    odstavce: [
      'Zajistit dítě znamená dvě různé věci. Jedna je ochrana pro případ vážného úrazu nebo nemoci, které by změnily život jemu i vám. Druhá jsou peníze do začátku, tedy spoření nebo investice pro děti: na studium, první bydlení nebo cokoli, co bude dítě jednou potřebovat.',
      'Obojí se nastavuje jinak podle věku. U malého dítěte je před vámi dlouhá doba, takže se dá spořit po menších částkách a s větší tolerancí k výkyvům. U dospívajícího je cíl blízko a víc záleží na jistotě. U pojištění rozhoduje i to, čemu se dítě věnuje, třeba jestli dělá sport, při kterém se úrazy stávají.',
      'Hlavní zajištění dítěte je ale to vaše. Dokud je na vašem příjmu závislé, dopadl by na něj váš výpadek víc než jeho vlastní úraz. Na pojištění dětí se proto dívám spolu s pojištěním rodičů, ne místo něj.',
      'Dětské smlouvy se také snadno zapomenou. Spoření založené po narození běží roky ve stejné strategii a ve stejné výši, i když se mezitím změnil váš rozpočet i to, k čemu má sloužit. V analýze proto uvedete, co už dětem platíte, a já to porovnám s tím, kam to má vést.',
    ],
    poznamka:
      'Pokud je součástí návrhu investování, platí pro ně, že hodnota investice může růst i klesat a návratnost vložených peněz není zaručena.',
    souvisi: {
      veta: 'Zajištění dětí stojí na pojištění rodičů. To popisuje stránka',
      cesta: '/pojisteni',
      odkaz: 'Životní pojištění',
    },
  },
  situace: {
    nadpis: 'Kdy to řešit',
    karty: [
      {
        titul: 'Narodilo se vám dítě',
        popis: 'Chcete mu spořit od narození a nevíte kolik, kam ani na čí jméno.',
      },
      {
        titul: 'Dítě začalo sportovat',
        popis: 'Kroužky, kolo, lyže. Chcete vědět, jestli má smysl ho pojistit a na co.',
      },
      {
        titul: 'Spoříte a nevíte, jestli dobře',
        popis: 'Smlouva běží roky. Podívám se, jak je nastavená a jestli odpovídá tomu, kdy budou peníze potřeba.',
      },
    ],
  },
  postup: [
    {
      titul: 'Vyplníte online analýzu.',
      popis: 'Patnáct minut. U každého dítěte uvedete věk, jestli ho chcete pojistit a kolik mu už spoříte.',
    },
    {
      titul: 'Navrhnu zajištění.',
      popis: 'Do 48 hodin dostanete návrh pro každé dítě zvlášť, s vysvětlením, proč zrovna takhle.',
    },
    {
      titul: 'Vše máte v aplikaci.',
      popis: 'Smlouvy dětí i své vlastní vidíte na jednom místě, včetně plateb.',
    },
  ],
  proc: {
    nadpis: 'Proč přes poradce, a ne rovnou v bance nebo pojišťovně',
    perex: 'Banka nabídne své spoření, pojišťovna svou pojistku. Já se dívám na rodinu jako na celek.',
    karty: [
      {
        titul: 'Porovnání',
        popis: 'Nejsem vázaný na jednu pojišťovnu ani na jednu investiční společnost, takže nabídky porovnám mezi sebou.',
      },
      {
        titul: 'Celá rodina',
        popis: 'Zajištění dětí řeším spolu s vaším pojištěním a rezervou, aby se krytí nepřekrývalo a nic nechybělo.',
      },
      TRANSPARENTNOST,
      {
        titul: 'Úpravy časem',
        popis: 'Dítě roste a potřeby se mění. Když mi napíšete, projdeme nastavení znovu.',
      },
    ],
  },
  dotazy: [
    {
      udalost: 'faq_deti_castka',
      otazka: 'Jak spořit dětem a kolik?',
      odpoved:
        'Záleží na vašem rozpočtu a na tom, k čemu mají peníze sloužit a kdy. Na dlouhou dobu dává smysl investování, na kratší spíš jistota. Víc než na výši částky záleží na tom, začít a vydržet. V návrhu uvidíte doporučení, které se vejde do toho, co si můžete dovolit.',
    },
    {
      udalost: 'faq_deti_pojisteni',
      otazka: 'Má smysl dítě pojišťovat?',
      odpoved:
        'Na drobné úrazy většinou stačí rezerva. Smysl má krytí vážných následků, které by znamenaly dlouhodobou péči nebo úpravu bydlení. Co z toho se týká vás, vyjde z analýzy.',
    },
    {
      udalost: 'faq_deti_jmeno',
      otazka: 'Spořit na jméno dítěte, nebo na své?',
      odpoved:
        'Obojí má své důsledky. Jde o to, kdo může s penězi nakládat a co se s nimi stane, až bude dítě dospělé. V návrhu napíšu, co doporučuji pro vaši situaci a proč.',
    },
    {
      udalost: 'faq_deti_stavajici',
      otazka: 'Dítě už pojištěné je. Mám něco měnit?',
      odpoved:
        'Nemusíte. V analýze stačí uvést, že pojistku má, a můžete ji přiložit. Podívám se, co kryje, a napíšu vám, jestli něco chybí.',
    },
  ],
}

export default function ZajisteniDetiPage() {
  return <TemaStranka obsah={OBSAH} />
}
