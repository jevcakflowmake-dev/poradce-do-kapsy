import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_NAME } from '@/lib/site'
import { BARVY } from '@/lib/barvy'

export const alt = `${SITE_NAME} – finanční poradce, kterého máte v mobilu`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Náhledový obrázek při sdílení odkazu (Facebook, LinkedIn, Messenger,
 * WhatsApp, Slack…). Stejný soubor obsluhuje i twitter-image.
 *
 * Satori (renderer za ImageResponse) umí jen flexbox a woff/ttf/otf, takže
 * lokální TTF v `assets/` místo next/font. Web sází Inter, tady zatím zůstává
 * IBM Plex Sans — Inter v assets/ není. TODO: doplnit Inter a přepnout i sem.
 */
export default async function Image() {
  const sans = await readFile(join(process.cwd(), 'assets/IBMPlexSans-SemiBold.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: BARVY.navy,
          fontFamily: 'IBM Plex Sans',
        }}
      >
        {/* Titulek shodný s H1 na landingu */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 84,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            color: BARVY.cream,
          }}
        >
          <div style={{ display: 'flex' }}>Finanční poradce,</div>
          <div style={{ display: 'flex' }}>kterého máte</div>
          <div style={{ display: 'flex' }}>
            v&nbsp;<span style={{ color: BARVY.mint }}>mobilu.</span>
          </div>
        </div>

        {/* Patička – značka vlevo, věta z hero vpravo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: `1px solid rgba(246,245,241,0.16)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Značka – mátová dlaždice s navy tečkou, stejná jako v hlavičce */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: BARVY.mint,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: 9,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 4, background: BARVY.navy }} />
            </div>
            <div style={{ fontSize: 30, color: BARVY.cream, letterSpacing: '-0.01em' }}>
              {SITE_NAME}
            </div>
          </div>
          <div style={{ fontSize: 24, color: 'rgba(246,245,241,0.7)' }}>
            Bez schůzek, bez tlaku.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'IBM Plex Sans', data: sans, style: 'normal', weight: 600 }],
    }
  )
}
