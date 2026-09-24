/**
 * Loga partnerů pro sekci „Se kým spolupracuji“ na hlavní stránce.
 *
 * Zdrojová loga jsou malé rastry, každé jiné: většina na bílém, Raiffeisen
 * na žlutém, Česká spořitelna na světle modrém přechodu a mBank má bílá
 * písmena na barevných pruzích. Skript z každého udělá jen tvar – alfa kanál
 * na průhledném podkladu, oříznutý na obsah. Barvu dodává web maskou
 * (`bg-navy`), takže jsou všechna loga jednobarevná a sedí k paletě; změna
 * barvy je změna tokenu, ne nové obrázky.
 *
 * Spuštění z kořene repa:
 *   npx tsx scripts/partneri-loga.mts [složka se zdrojovými logy]
 * Na konci vypíše rozměry – ty patří do `lib/partneri.ts`.
 */
import { mkdirSync, readdirSync } from 'node:fs'
import sharp from 'sharp'

const ZDROJ = process.argv[2] ?? '/Users/jevci/Desktop/Práce/ProfiFP/Projekty/Loga/poradcedokapsy'
const CIL = 'public/partneri'
/** Dvojnásobek největší zobrazené šířky – na displejích s hustotou 2×. */
const MAX_SIRKA = 480

/** Krytí 0–1 podle barvy pixelu. */
type Kryti = (r: number, g: number, b: number) => number

const omez = (x: number) => Math.min(1, Math.max(0, x))

/** Bílé pozadí: krytí podle nejslabšího kanálu („color to alpha“ proti bílé). */
const naBile: Kryti = (r, g, b) => 1 - Math.min(r, g, b) / 255

/** Jednobarevné pozadí jiné než bílé – stejný výpočet proti zadané barvě. */
const naBarve =
  ([pr, pg, pb]: [number, number, number]): Kryti =>
  (r, g, b) => {
    const kanal = (c: number, p: number) => (c > p ? (c - p) / (255 - p) : c < p ? (p - c) / p : 0)
    return Math.max(kanal(r, pr), kanal(g, pg), kanal(b, pb))
  }

/** Pozadí s přechodem: krytí podle jasu – co je tmavší než pozadí, je logo. */
const podleJasu =
  (jasPozadi: number, jasLoga: number): Kryti =>
  (r, g, b) =>
    omez((jasPozadi - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) / (jasPozadi - jasLoga))

/** mBank: logo tvoří bílá písmena, barevné pruhy kolem jsou pozadí. */
const bilaPismena: Kryti = (r, g, b) => omez((Math.min(r, g, b) / 255 - 0.45) / 0.4)

/** AXA: červené lomítko přes modrý čtverec je v jedné barvě vidět jen jako mezera. */
const axa: Kryti = (r, g, b) => (r > 140 && r - g > 80 && r - b > 80 ? 0 : naBile(r, g, b))

// Šum JPEGu u bílé zahodit; co kryje aspoň 60 %, je plné – světlé části log
// (stříbrná smyčka UNIQA, zelená MetLife) by jinak v jedné barvě vybledly.
const PRAH_SUMU = 0.04
const PRAH_PLNE = 0.6

const LOGA: Array<{ soubor: string; slug: string; kryti?: Kryti; plne?: number }> = [
  { soubor: 'Allianz.png', slug: 'allianz' },
  { soubor: 'amundi.png', slug: 'amundi' },
  { soubor: 'axa.png', slug: 'axa', kryti: axa },
  { soubor: 'conseq.png', slug: 'conseq' },
  { soubor: 'česká spořitelna.png', slug: 'ceska-sporitelna', kryti: podleJasu(0.84, 0.2) },
  { soubor: 'ČPP.png', slug: 'cpp' },
  // Míček a vlna ČSOB se překrývají; v plné barvě by splynuly do skvrny,
  // podle jasu zůstane světlý míček poloprůhledný.
  { soubor: 'čsob.jpg', slug: 'csob', kryti: podleJasu(0.84, 0.2), plne: 1 },
  { soubor: 'Flexi.png', slug: 'flexi' },
  { soubor: 'generali.png', slug: 'generali' },
  { soubor: 'hypoteční banka.png', slug: 'hypotecni-banka' },
  { soubor: 'kb.png', slug: 'komercni-banka' },
  { soubor: 'kooperativa.jpg', slug: 'kooperativa' },
  { soubor: 'mBank mass logo.jpg', slug: 'mbank', kryti: bilaPismena },
  { soubor: 'metlife.png', slug: 'metlife' },
  { soubor: 'Modrá pyramida.png', slug: 'modra-pyramida' },
  { soubor: 'NN.jpg', slug: 'nn' },
  { soubor: 'raiffeisen.png', slug: 'raiffeisenbank', kryti: naBarve([255, 241, 0]) },
  { soubor: 'uniqua.jpg', slug: 'uniqa' },
]

// Názvy na disku macOS bývají v NFD, v kódu v NFC.
const naDisku = new Map(readdirSync(ZDROJ).map((f) => [f.normalize('NFC'), f]))
mkdirSync(CIL, { recursive: true })

const rozmery: Record<string, [number, number]> = {}
for (const { soubor, slug, kryti = naBile, plne = PRAH_PLNE } of LOGA) {
  const cesta = naDisku.get(soubor.normalize('NFC'))
  if (!cesta) throw new Error(`Chybí zdrojové logo ${soubor}`)
  const { data, info } = await sharp(`${ZDROJ}/${cesta}`)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h } = info
  const maska = Buffer.alloc(w * h * 4) // černá, krytí v alfa kanálu
  let [x0, y0, x1, y1] = [w, h, -1, -1]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      const a = omez((kryti(data[i], data[i + 1], data[i + 2]) - PRAH_SUMU) / (plne - PRAH_SUMU))
      if (a === 0) continue
      maska[(y * w + x) * 4 + 3] = Math.round(a * 255)
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }
  if (x1 < 0) throw new Error(`V logu ${soubor} nezbyl žádný tvar`)

  const vystup = await sharp(maska, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ width: MAX_SIRKA, withoutEnlargement: true })
    .webp({ lossless: true })
    .toFile(`${CIL}/${slug}.webp`)
  rozmery[slug] = [vystup.width, vystup.height]
}

console.log(JSON.stringify(rozmery, null, 2))
