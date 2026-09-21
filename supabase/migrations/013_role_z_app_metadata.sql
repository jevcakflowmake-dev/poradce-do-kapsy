-- =====================================================================
-- Role poradce se čte z app_metadata, ne z user_metadata
--
-- Do user_metadata si zapíše každý přihlášený uživatel sám přes
-- auth.updateUser({ data: { role: 'advisor' } }). Ověřeno 21. 9. 2026 na
-- ostré databázi testovacím účtem přes veřejný anon klíč: po jednom volání
-- viděl cizí profily i návrhy. Do app_metadata zapisuje jen service role.
--
-- Žádná politika se nemění – všech 20 jich volá tuhle funkci.
-- Čteme z tabulky, ne z JWT: odebrání role pak platí hned, ne až po
-- obnovení access tokenu.
--
-- Doprovodné kroky mimo SQL (jednorázově, přes admin API):
--   · všem účtům zkopírovat roli z user_metadata do app_metadata,
--   · po nasazení kódu roli z user_metadata smazat,
--   · zakládání účtu (/api/register, /api/analyza/odeslat) zapisuje
--     role: 'client' do app_metadata.
-- =====================================================================

create or replace function public.get_user_role()
returns text
language sql
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()),
    'client'
  );
$$;

comment on function public.get_user_role() is
  'Role přihlášeného uživatele z app_metadata (zapisuje jen service role). Nikdy nečti roli z user_metadata.';
