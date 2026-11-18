import { ImageResponse } from 'next/og'
import { BARVY } from '@/lib/barvy'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Ikona na plochu iPhonu („Přidat na plochu“) – stejná značka jako favicon
 * (app/icon.tsx). Bez zaoblení: iOS si rohy zaoblí sám a průhledné okraje
 * by vyplnil černou.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          background: BARVY.mint,
          padding: 40,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 18, background: BARVY.navy }} />
      </div>
    ),
    size,
  )
}
