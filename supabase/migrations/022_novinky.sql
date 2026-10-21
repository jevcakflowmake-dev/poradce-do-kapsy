-- =====================================================================
-- Novinky z finančního světa (21. 10. 2026, schválil Jakub)
--
-- Krátké články na /novinky. Píše je n8n s pomocí AI jednou za dva týdny,
-- Jakub je schvaluje e-mailem a teprve schválený článek pošle n8n webu
-- (POST /api/novinky s tajným klíčem). Do tabulky tedy zapisuje server
-- se service role; přímý zápis má jen poradce (třeba skrytí článku).
--
-- Veřejnost čte jen zveřejněné články (zverejneno_at vyplněné a ne
-- v budoucnu). Obsah je prostý text s odstavci, nadpisy „## “ a odrážkami
-- „- “ – web ho skládá sám, HTML se neukládá.
-- =====================================================================

create table if not exists public.novinky (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titulek text not null check (char_length(btrim(titulek)) between 1 and 160),
  perex text not null check (char_length(btrim(perex)) between 1 and 600),
  obsah text not null check (char_length(btrim(obsah)) between 1 and 30000),
  -- Zdroje, ze kterých článek vychází: [{ "nazev": "…", "url": "https://…" }]
  zdroje jsonb not null default '[]'::jsonb check (jsonb_typeof(zdroje) = 'array'),
  zverejneno_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.novinky is
  'Články na /novinky. Zapisuje web na pokyn z n8n (service role), veřejnost čte jen zveřejněné.';

create index if not exists novinky_zverejneno_idx
  on public.novinky (zverejneno_at desc)
  where zverejneno_at is not null;

alter table public.novinky enable row level security;

drop policy if exists "Novinky: verejne zverejnene" on public.novinky;
create policy "Novinky: verejne zverejnene"
  on public.novinky
  for select to anon, authenticated
  using (zverejneno_at is not null and zverejneno_at <= now());

drop policy if exists "Novinky: poradce spravuje" on public.novinky;
create policy "Novinky: poradce spravuje"
  on public.novinky
  for all to authenticated
  using (public.get_user_role() = 'advisor')
  with check (public.get_user_role() = 'advisor');

revoke all on public.novinky from anon, authenticated;
grant select on public.novinky to anon, authenticated;
grant insert, update, delete on public.novinky to authenticated;
