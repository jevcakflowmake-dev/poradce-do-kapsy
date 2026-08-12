/**
 * Ambientní podklad hero sekce.
 *
 * Hero stojí na papírové ploše a inkoustové typografii, takže video nesmí
 * fungovat jako obraz – jen jako měkká textura pod textem. Proto:
 *
 * - barva je stažená už v souboru (desaturace + zesvětlení v ffmpeg), ne
 *   v CSS: `filter` na přehrávaném videu stojí GPU a na mobilu se to pozná
 * - přes video leží papírový závoj, který je nejhustší vlevo, kde sedí
 *   nadpis a CTA, a řídne doprava; kontrast textu tím zůstává plný
 * - dole gradient do papíru, aby hero nekončil viditelnou hranou
 *
 * Pořadí vrstev: video (z-0) → papírový závoj (z-1) → azurový dech
 * a zrno (z-1, v HeroSection) → obsah (z-10).
 *
 * Při zapnutém omezení animací se video schová přes CSS a zůstane poster,
 * viz `.hero-video` v globals.css.
 */
export default function HeroVideo() {
  return (
    <div className="hero-video-frame absolute inset-0 overflow-hidden" aria-hidden>
      <video
        className="hero-video absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/images/hero-poster.webp"
      >
        <source src="/video/hero.webm" type="video/webm" />
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Papírový závoj – hustý pod textem, řídne doprava */}
      <div
        className="absolute inset-0"
        style={{
          // Text sedí ve sloupci 9/12, tedy zhruba v levých 70 %. Tam drží
          // závoj skoro plný; uvolňuje se až za textem, aby scéna vůbec byla
          // znát. Naměřený kontrast inkoustu na nejsvětlejším místě pod
          // nadpisem je 12,9:1, tedy hluboko nad AA.
          background:
            'linear-gradient(100deg, #F6F4EE 0%, rgba(246,244,238,0.97) 30%, rgba(246,244,238,0.9) 55%, rgba(246,244,238,0.5) 100%)',
        }}
      />
      {/* Přechod do papíru dole, ať hero nekončí hranou */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: 'linear-gradient(to bottom, rgba(246,244,238,0), #F6F4EE)' }}
      />
    </div>
  )
}
