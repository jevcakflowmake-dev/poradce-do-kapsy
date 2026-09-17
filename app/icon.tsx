import { ImageResponse } from 'next/og'
import { BARVY } from '@/lib/barvy'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Favicon = zmenšená značka z hlavičky webu: mátová dlaždice s navy tečkou
 * v pravém dolním rohu. V 32 px se nic jiného stejně nepřečte, takže žádný
 * monogram – rozpoznatelný je právě ten tvar.
 */
export default function Icon() {
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
          borderRadius: 8,
          padding: 6,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: 4, background: BARVY.navy }} />
      </div>
    ),
    size,
  )
}
