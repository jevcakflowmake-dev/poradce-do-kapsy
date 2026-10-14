-- =====================================================================
-- Doporučení a věrnostní body (14. 10. 2026, schválil Jakub)
--
-- Jeden řádek = jeden doporučený klient a ten, kdo ho doporučil. Za každé
-- doporučení dostane doporučitel poukázku (odmena_kc, při založení 250 Kč).
-- Stav se neukládá, počítá se:
--   vyplaceno_at vyplněné          → vyplaceno
--   doporučený má smlouvu          → k proplacení
--   jinak                          → čeká na smlouvu
-- Smlouvy se tak nemusí s tabulkou synchronizovat.
--
-- Řádek zakládá aplikace sama, když jméno z analýzy (otázka referred_by)
-- sedí na jediného klienta, nebo poradce ručně (prirazeno_rucne). Ruční
-- a vyplacené řádky automatika nepřepisuje.
--
-- Přístup má jen poradce (get_user_role() z app_metadata, migrace 013).
-- Klient tabulku přímo nečte: počty bodů mu skládá server se service role,
-- takže se nedozví, koho kdo doporučil ani kdo má jakou smlouvu.
-- Se smazáním kteréhokoli z obou klientů zmizí i řádek.
-- =====================================================================

create table if not exists public.doporuceni (
  doporuceny_id uuid primary key references public.profiles(id) on delete cascade,
  doporucitel_id uuid not null references public.profiles(id) on delete cascade,
  odmena_kc integer not null default 250 check (odmena_kc between 0 and 10000),
  prirazeno_rucne boolean not null default false,
  vyplaceno_at timestamptz,
  created_at timestamptz not null default now(),
  constraint doporuceni_ne_sam_sebe check (doporuceny_id <> doporucitel_id)
);

comment on table public.doporuceni is
  'Kdo koho doporučil a jestli je za to vyplacená poukázka. Stav (čeká na smlouvu / k proplacení) se počítá ze smluv doporučeného. RLS jen pro poradce.';

create index if not exists doporuceni_doporucitel_idx
  on public.doporuceni (doporucitel_id);

alter table public.doporuceni enable row level security;

drop policy if exists "Doporuceni: jen poradce" on public.doporuceni;
create policy "Doporuceni: jen poradce"
  on public.doporuceni
  for all to authenticated
  using (public.get_user_role() = 'advisor')
  with check (public.get_user_role() = 'advisor');

revoke all on public.doporuceni from anon, authenticated;
grant select, insert, update, delete on public.doporuceni to authenticated;
