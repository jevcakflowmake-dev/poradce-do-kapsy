import TemaStranka, { type ObsahTematu } from '@/components/landing/TemaStranka'
import { metadataTematu } from '@/lib/temata'
import { TRANSPARENTNOST } from '@/lib/poradce'

export const metadata = metadataTematu({
  titulek: 'Hypotéka a refinancování: poradce online',
  popis:
    'Nová hypotéka, nebo vám končí fixace? Analýzu vyplníte online za 15 minut a do 48 hodin dostanete porovnání nabídek bank s vysvětlením. Zdarma, bez schůzek.',
  cesta: '/hypoteka',
})

/**
 * TODO (Jakub): text je můj návrh. Je to regulovaný obor, proto v něm nejsou
 * žádné sazby, částky ani sliby typu „nejvýhodnější“ – nic takového nedoplňuj
 * bez podkladu. Zkontroluj hlavně odpověď o podpisu smlouvy, ať sedí s tím,
 * jak to u bank chodí. Věta o stejné odměně je společná, viz lib/poradce.ts.
 */
const OBSAH: ObsahTematu = {
  cesta: '/hypoteka',
  udalostCta: 'klik_hypoteka_analyza',
  // Unsplash (volná licence): https://unsplash.com/photos/hand-holding-keys-with-house-keychain-V7Q94jc04wQ
  fotka: { src: '/images/temata/hypoteka.webp', pozice: 'center' },
  h1: 'Hypotéka a refinancování online, bez obíhání bank',
  perex:
    'Napíšete mi, co kupujete nebo co už splácíte. Porovnám nabídky bank, se kterými spolupracuji, a do 48 hodin vám pošlu návrh s vysvětlením. Bez schůzek, bez tlaku.',
  uvod: {
    nadpis: 'Co hypotéka znamená v praxi',
    odstavce: [
      'Hypotéka je závazek na dlouhé roky. Za tu dobu se několikrát změní úroková sazba, váš příjem i to, co od bydlení čekáte. Nestačí proto vybrat nabídku, která dnes dobře vypadá v reklamě.',
      'Rozhodují i věci, které na letáku nenajdete: délka fixace, podmínky mimořádných splátek, poplatky, požadavky na pojištění nebo to, jak banka posuzuje příjem z podnikání. Každá banka je má jinak a rozdíl se projeví až časem.',
      'Stejné je to s refinancováním. Když se blíží konec fixace, banka pošle novou nabídku. Vyplatí se ji porovnat s tím, co nabízejí jinde, a spočítat, jestli přechod po započtení nákladů dává smysl.',
      'Než podáte žádost, je dobré vědět, kolik zvládnete splácet i ve chvíli, kdy sazba po skončení fixace vzroste nebo vám na čas vypadne příjem. V analýze se proto ptám i na rezervu a na ostatní závazky. Návrh pak počítá s tím, aby vám splátka nechala prostor na běžný život, ne jen s tím, co banka ještě schválí.',
    ],
    souvisi: {
      veta: 'K úvěru na bydlení patří i pojištění nemovitosti, které banka obvykle vyžaduje. Víc o něm je na stránce',
      cesta: '/pojisteni-majetku',
      odkaz: 'Pojištění majetku',
    },
  },
  situace: {
    nadpis: 'Kdy se ozvat',
    karty: [
      {
        titul: 'Kupujete nebo stavíte',
        popis: 'Chcete vědět, kolik si můžete půjčit a co k žádosti připravit, ještě než začnete hledat nemovitost.',
      },
      {
        titul: 'Končí vám fixace',
        popis: 'Banka poslala novou sazbu a vy nevíte, jestli ji přijmout, nebo se poohlédnout jinde.',
      },
      {
        titul: 'Splácíte a chcete změnu',
        popis: 'Mimořádná splátka, jiná doba splácení nebo sloučení s dalším úvěrem.',
      },
    ],
  },
  postup: [
    {
      titul: 'Vyplníte online analýzu.',
      popis: 'Patnáct minut. Ptám se na příjmy, závazky a na to, jaké bydlení řešíte. Stávající smlouvu můžete rovnou přiložit.',
    },
    {
      titul: 'Porovnám nabídky bank.',
      popis: 'Do 48 hodin dostanete návrh s vysvětlením, co která varianta znamená a proč ji doporučuji.',
    },
    {
      titul: 'Rozhodnete se sami.',
      popis: 'Návrh máte v aplikaci. Když budete chtít pokračovat, provedu vás žádostí až k podpisu.',
    },
  ],
  proc: {
    nadpis: 'Proč přes poradce, a ne rovnou v bance',
    perex: 'Banka vám nabídne to, co má sama. Já se dívám na víc bank najednou.',
    karty: [
      {
        titul: 'Porovnání',
        popis: 'Spolupracuji s více bankami, takže jejich nabídky postavím vedle sebe a ukážu, v čem se liší.',
      },
      {
        titul: 'Vysvětlení',
        popis: 'U každé varianty napíšu, co znamená pro splátku, fixaci a možnost splatit dřív. Bez bankovní hantýrky.',
      },
      TRANSPARENTNOST,
      {
        titul: 'Bez tlaku',
        popis: 'Za analýzu ani za návrh neplatíte nic. Když se rozhodnete nesjednat nic, nic mi nedlužíte.',
      },
    ],
  },
  dotazy: [
    {
      udalost: 'faq_hypoteka_cena',
      otazka: 'Platím za sjednání hypotéky přes poradce něco navíc?',
      odpoved:
        'Za analýzu ani za návrh neplatíte nic. Jsem placený provizí od banky, se kterou úvěr nakonec uzavřete. Odměnu mám u všech společností stejnou.',
    },
    {
      udalost: 'faq_hypoteka_refinancovani',
      otazka: 'Vyplatí se refinancovat, když mi končí fixace?',
      odpoved:
        'Záleží na nové sazbě, na tom, kolik ještě dlužíte, a na nákladech spojených s přechodem. Z analýzy to spočítám a napíšu vám, jestli dává smysl zůstat, nebo odejít.',
    },
    {
      udalost: 'faq_hypoteka_podklady',
      otazka: 'Jaké podklady budu potřebovat?',
      odpoved:
        'Pro první návrh stačí analýza. Doklady o příjmu a podklady k nemovitosti přijdou na řadu, až si vyberete banku. Řeknu vám předem, co a kdy dodat.',
    },
    {
      udalost: 'faq_hypoteka_schuzka',
      otazka: 'Musím kvůli hypotéce na schůzku?',
      odpoved:
        'Na schůzku se mnou ne. Analýzu vyplníte online, návrh dostanete do aplikace a doptat se můžete v chatu. Samotný podpis úvěrové smlouvy se řídí pravidly konkrétní banky a předem vám napíšu, co vás čeká.',
    },
  ],
}

export default function HypotekaPage() {
  return <TemaStranka obsah={OBSAH} />
}
