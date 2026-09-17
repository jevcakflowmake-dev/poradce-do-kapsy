/**
 * Paleta pro knihovny, které chtějí barvu jako hodnotu, ne jako třídu —
 * recharts, inline SVG. Jinde se barvy berou tokenem z app/globals.css.
 *
 * Hodnoty musí sedět s tokeny v @theme. Když se mění paleta, mění se
 * obě místa naráz; jiný zdroj barev v projektu není.
 */
export const BARVY = {
  navy: '#0F2A44',
  navyDeep: '#0A1F33',
  navySoft: '#1B3B5A',
  mint: '#1FB58F',
  mintDark: '#179A78',
  cream: '#F6F5F1',
  creamDeep: '#EDEBE4',
  surface: '#FFFFFF',
  line: '#E2E0D9',
  amber: '#F2B441',
  slate: '#64707D',
  slateSoft: '#7A8794',
  danger: '#C2410C',
} as const
