/**
 * České hlášky k heslu, které odmítl Supabase.
 *
 * S ochranou proti uniklým heslům (Supabase → Sign In / Providers → Email)
 * odmítne Supabase i heslo, které naše kontrola délky pustí – „heslo123“
 * má osm znaků, ale je v únicích dat. Bez překladu by klient viděl
 * anglickou hlášku, nebo v horším případě nic.
 */
export function hlaskaKHeslu(chyba: { code?: string } | null | undefined): string | null {
  switch (chyba?.code) {
    case 'weak_password':
      return 'Tohle heslo je příliš slabé nebo se objevilo v únicích dat z jiných webů. Zvolte prosím jiné.'
    case 'same_password':
      return 'Nové heslo musí být jiné než to současné.'
    default:
      return null
  }
}
