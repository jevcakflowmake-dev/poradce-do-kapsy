import { PARTNERI } from '@/lib/partneri'

/**
 * Nabídka partnerů k poli se společností v editorech poradce: stačí začít
 * psát a vybrat. Názvy jsou tvary, podle kterých pak klient uvidí logo;
 * psát se dá i cokoliv jiného.
 */
export default function SeznamPartneru({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {PARTNERI.map((p) => (
        <option key={p.nazev} value={p.nazev} />
      ))}
    </datalist>
  )
}
