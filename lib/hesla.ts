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

/**
 * Česká hláška k jakékoli chybě ze Supabase Auth. Anglický originál
 * („For security purposes, you can only request this after 49 seconds“)
 * by klientovi nic neřekl; co neznáme, nahradí obecná věta.
 */
export function hlaskaAuth(chyba: { code?: string; status?: number } | null | undefined): string {
  const kHeslu = hlaskaKHeslu(chyba)
  if (kHeslu) return kHeslu
  if (chyba?.status === 429 || chyba?.code?.startsWith('over_')) {
    return 'Odkaz jste si nechali poslat před chvílí. Zkuste to prosím znovu za minutu.'
  }
  if (chyba?.code === 'email_address_invalid') return 'Zadejte platný e-mail.'
  return 'Něco se nepovedlo. Zkuste to prosím znovu.'
}
