'use client'

import { useSyncExternalStore } from 'react'
import { prectiSouhlas, SOUHLAS_UDALOST, SOUHLAS_KLIC, type UlozenySouhlas } from '@/lib/souhlas'

/**
 * Souhlas je stav mimo React (úložiště prohlížeče), proto `useSyncExternalStore`
 * a ne `useEffect` + `setState`: komponenta se překreslí, až když se hodnota
 * opravdu změní, a to i ve vedlejší záložce.
 *
 * Snapshot se drží v modulu — `useSyncExternalStore` porovnává reference, takže
 * kdyby se při každém volání parsoval JSON znovu, React by se zacyklil.
 */
let snapshot: UlozenySouhlas | null = null
let nacteno = false

function precti(): UlozenySouhlas | null {
  if (!nacteno) {
    snapshot = prectiSouhlas()
    nacteno = true
  }
  return snapshot
}

function naServeru(): null {
  return null
}

function odebirej(oznam: () => void): () => void {
  const prepocti = () => {
    snapshot = prectiSouhlas()
    nacteno = true
    oznam()
  }
  const zJineZalozky = (e: StorageEvent) => {
    if (e.key === SOUHLAS_KLIC) prepocti()
  }
  window.addEventListener(SOUHLAS_UDALOST, prepocti)
  window.addEventListener('storage', zJineZalozky)
  return () => {
    window.removeEventListener(SOUHLAS_UDALOST, prepocti)
    window.removeEventListener('storage', zJineZalozky)
  }
}

export function useSouhlas(): UlozenySouhlas | null {
  return useSyncExternalStore(odebirej, precti, naServeru)
}

const bezOdberu = () => () => {}

/**
 * Běží kód už v prohlížeči? Server o uloženém souhlasu nic neví, takže bez
 * téhle pojistky by lišta na okamžik probliknula i tomu, kdo se už rozhodl.
 */
export function useVProhlizeci(): boolean {
  return useSyncExternalStore(
    bezOdberu,
    () => true,
    () => false,
  )
}
