-- =====================================================================
-- Interní poznámky poradce ke klientovi (25. 9. 2026)
--
-- Co poradce ví z telefonátů a schůzek (rodina, plány, na co si dát
-- pozor) a do chatu klientovi nepatří. Klient poznámky nevidí: politika
-- pouští jen poradce, i na čtení. Úprava se nenabízí – poznámka se
-- smaže a napíše znovu, takže stačí select, insert a delete.
--
-- Role se čte přes get_user_role() z app_metadata v tabulce, ne z JWT,
-- takže odebrání role platí hned (viz migrace 013). Se smazáním klienta
-- zmizí i jeho poznámky (cascade přes profil).
-- =====================================================================

create table if not exists public.poznamky_klientu (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 5000),
  autor uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.poznamky_klientu is
  'Interní poznámky poradce ke klientovi. Klient je nevidí (RLS jen pro poradce).';

create index if not exists poznamky_klientu_klient_idx
  on public.poznamky_klientu (client_id, created_at desc);

alter table public.poznamky_klientu enable row level security;

drop policy if exists "Poznamky: jen poradce" on public.poznamky_klientu;
create policy "Poznamky: jen poradce"
  on public.poznamky_klientu
  for all to authenticated
  using (public.get_user_role() = 'advisor')
  with check (public.get_user_role() = 'advisor' and autor = auth.uid());

revoke all on public.poznamky_klientu from anon, authenticated;
grant select, insert, delete on public.poznamky_klientu to authenticated;
