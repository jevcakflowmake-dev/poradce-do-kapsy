import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_NAME } from '@/lib/site'

export const alt = `${SITE_NAME} – finanční plán pro celý život`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Paleta „inkoust a papír“ – viz app/globals.css
const INK = '#0B111F'
const NAVY = '#162459'
const PAPER = '#F6F4EE'
const AZUR = '#009EE2'
const MUTED = 'rgba(246,244,238,0.55)'

/**
 * Náhledový obrázek při sdílení odkazu (Facebook, LinkedIn, Messenger,
 * WhatsApp, Slack…). Stejný soubor obsluhuje i twitter-image.
 *
 * Satori (renderer za ImageResponse) umí jen flexbox a woff/ttf/otf –
 * proto lokální TTF v `assets/` místo next/font, a žádný grid ani noise
 * overlay z globals.css. Kurzíva je na webu zakázaná, akcent nese barva.
 */
export default async function Image() {
  const [serif, sans] = await Promise.all([
    readFile(join(process.cwd(), 'assets/InstrumentSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'assets/IBMPlexSans-SemiBold.ttf')),
  ])

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
          background: `linear-gradient(135deg, ${NAVY} 0%, ${INK} 100%)`,
          fontFamily: 'IBM Plex Sans',
        }}
      >
        {/* Kicker – azurová linka + certifikace, stejně jako na hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 2, background: AZUR }} />
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            Certifikovaný poradce ProfiFP
          </div>
        </div>

        {/* Headline – shodný s landingem, „život.“ kurzívou v azuru */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Instrument Serif',
            fontSize: 132,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: PAPER,
          }}
        >
          <div style={{ display: 'flex' }}>Finanční plán</div>
          <div style={{ display: 'flex' }}>
            pro celý&nbsp;
            <span style={{ color: AZUR }}>život.</span>
          </div>
        </div>

        {/* Patička – značka vlevo, claim vpravo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: `1px solid rgba(246,244,238,0.14)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo – papírový čtverec s azurovou tečkou v pravém dolním rohu */}
            <div
              style={{
                width: 40,
                height: 40,
                background: PAPER,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: 8,
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: 4, background: AZUR }} />
            </div>
            <div style={{ fontSize: 30, color: PAPER, letterSpacing: '-0.01em' }}>
              {SITE_NAME}
            </div>
          </div>
          <div style={{ fontSize: 24, color: MUTED }}>
            Bez schůzek · Bez závazků · Zdarma
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 },
        { name: 'IBM Plex Sans', data: sans, style: 'normal', weight: 600 },
      ],
    }
  )
}
