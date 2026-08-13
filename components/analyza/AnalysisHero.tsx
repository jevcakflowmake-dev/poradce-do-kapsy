import Image from 'next/image'

/**
 * Podklad hlavičky analýzy.
 *
 * Stránka je dlouhý formulář, takže fotka nesmí ležet pod poli – pod
 * vstupy by ničila čitelnost a při scrollu rušila. Leží proto jen za
 * úvodním blokem a dole se rozplyne do papíru, takže formulář sám
 * začíná na čisté ploše.
 *
 * Umístění řídí čitelnost, ne estetika: šedý text #66708C má na papíru
 * 4,47:1, tedy prakticky na hraně AA – za ním nesmí být vůbec nic.
 * Odtud dvě varianty:
 *
 * - `responsive` (veřejná analýza): do lg pruh nad sazbou, od lg fotka
 *   přilepená v pravém okraji vedle textového sloupce. Sloupec je tam
 *   `max-w-4xl`, takže vpravo zbývá dost místa, kam řádky nedosáhnou.
 * - `band` (přihlášená analýza): vždycky jen pruh nad sazbou. Tamní
 *   sloupec je `max-w-7xl` a na 1440 px zbývá po stranách 80 px –
 *   na fotku vedle textu tam prostor není.
 *
 * Každá varianta má vlastní snímek. Do úzkého pruhu přes celou šířku
 * by se běžný záběr ořízl na proužek, proto je pro něj panoramatická
 * verze s prázdným polem vlevo (v souboru bezešvě dotažené pozadí).
 *
 * Barva je stažená rovněž už v souboru (ffmpeg: desaturace, posun
 * k papíru), ne CSS filtrem – ten by se přepočítával při každém
 * překreslení; stejný princip jako u `HeroVideo` na úvodní stránce.
 *
 * Pořadí vrstev: fotka (z-0) → závoj (z-1) → zrno (z-1)
 * → obsah hlavičky (z-10 v rodiči; obal fotky má `-z-10`).
 *
 * Foto: Kamil (@kamil916) na Unsplash, licence Unsplash (volné i pro
 * komerční užití, bez povinné atribuce – uvedeno z korektnosti).
 */
type Props = {
  /** `band` = vždy pruh nad sazbou, `responsive` = od lg pravý okraj. */
  variant?: 'responsive' | 'band'
}

export default function AnalysisHero({ variant = 'responsive' }: Props) {
  const band = variant === 'band'

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Šířku i umístění řídí obal, tady už jen vyplňujeme. */}
      <div className={`absolute inset-0 ${band ? 'analysis-hero-band' : 'analysis-hero-media'}`}>
        <Image
          src={band ? '/images/analyza-hero-wide.webp' : '/images/analyza-hero.webp'}
          alt=""
          fill
          priority
          sizes={band ? '100vw' : '(max-width: 1023px) 100vw, 34vw'}
          // Mince sedí u spodní hrany snímku a nejvyšší sloupce vpravo –
          // při ořezu je musíme udržet v záběru, jinak zbude prázdný stůl.
          className={
            band
              ? 'object-cover object-bottom'
              : 'object-cover object-bottom lg:object-right-bottom'
          }
        />
        {/* Fotka je podklad, ne obraz – závoj jí ubere důraz. V pruhu na ní
            nic neleží, takže smí být vidět víc než v panelu vedle sazby. */}
        <div
          className={
            band
              ? 'absolute inset-0 bg-[#F6F4EE]/35'
              : 'absolute inset-0 bg-[#F6F4EE]/35 lg:bg-[#F6F4EE]/55'
          }
        />
      </div>

      {/* Zrno jako na zbytku webu, aby fotka nepůsobila nalepeně */}
      <div className="noise-paper" />
    </div>
  )
}
