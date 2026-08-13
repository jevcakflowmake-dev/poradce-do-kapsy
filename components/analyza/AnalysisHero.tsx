import Image from 'next/image'

/**
 * Podklad hlavičky analýzy.
 *
 * Stránka je dlouhý formulář, takže fotka nesmí ležet pod poli – pod
 * vstupy by ničila čitelnost a při scrollu rušila. Leží proto jen za
 * úvodním blokem (nadpis, popis, ukazatel postupu) a dole se rozplyne
 * do papíru, takže formulář sám začíná na čisté ploše.
 *
 * Šířky nejsou zvolené od oka. Sazba sedí ve sloupci `max-w-4xl`
 * s odsazením `px-16` a odstavec je `max-w-xl`, takže jeho pravá hrana
 * leží na `(100vw − 896px)/2 + 640px`. Fotka musí začínat až za ní –
 * jinak řádky padnou na měď a šedý text (#66708C) tam měří 2,25:1
 * místo požadovaných 4,5:1 (změřeno vzorkováním pixelů pod řádky).
 * Odtud limit `šířka ≤ 50 % − 192px`, tedy zhruba 31 % při 1024px
 * a 37 % při 1440px; níž jsou hodnoty s rezervou.
 *
 * Na úzkých displejích text zabírá celou šířku a žádné „vedle“ neexistuje,
 * proto tam fotka jen prosvítá jako textura za nadpisem (hustší závoj).
 *
 * Barva je stažená už v souboru (ffmpeg: desaturace, posun k papíru), ne
 * CSS filtrem – ten by se přepočítával při každém překreslení; stejný
 * princip jako u `HeroVideo` na úvodní stránce.
 *
 * Pořadí vrstev: fotka (z-0) → závoj (z-1) → zrno (z-1)
 * → obsah hlavičky (z-10, v PublicAnalysisForm).
 *
 * Foto: Kamil (@kamil916) na Unsplash, licence Unsplash (volné i pro
 * komerční užití, bez povinné atribuce – uvedeno z korektnosti).
 */

export default function AnalysisHero() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Do lg pruh přes celou šířku nad sazbou, od lg jen pravý okraj
          vedle ní. Masky k tomu jsou v `.analysis-hero-media`. */}
      <div className="analysis-hero-media absolute inset-y-0 right-0 w-full lg:w-[30%] xl:w-[34%]">
        <Image
          src="/images/analyza-hero.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 34vw"
          // Mince sedí u spodní hrany snímku a nejvyšší sloupce vpravo –
          // při ořezu je musíme udržet v záběru, jinak zbude prázdný stůl.
          className="object-cover object-bottom lg:object-right-bottom"
        />
        {/* Fotka je podklad, ne obraz – závoj jí ubere důraz. V pruhu nad
            sazbou na ní nic neleží, takže smí být vidět víc. */}
        <div className="absolute inset-0 bg-[#F6F4EE]/35 lg:bg-[#F6F4EE]/55" />
      </div>

      {/* Zrno jako na zbytku webu, aby fotka nepůsobila nalepeně */}
      <div className="noise-paper" />
    </div>
  )
}
