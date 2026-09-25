-- =====================================================================
-- Katalog produktů – šablony variant plánu (25. 9. 2026)
--
-- Poradce nabízí pořád dokola stejné produkty. Aby u každého klienta
-- nepsal znovu název, popis, kontakty a parametry, uloží si variantu do
-- katalogu a u dalšího klienta ji jen vybere. Šablona drží to, co patří
-- produktu, ne klientovi: společnost, detail produktu (tvar jako
-- plan_variants.details.produkt), parametry a u investic výnos pro graf.
-- Měsíční platba je jen předvyplněná, poradce ji u klienta přepíše.
--
-- Katalog je jen poradcův: politika přes get_user_role() z app_metadata
-- (migrace 013), klient ani anonym nevidí nic. Úprava se nenabízí –
-- šablona se smaže a uloží znovu z upravené varianty.
-- =====================================================================

create table if not exists public.katalog_produktu (
  id uuid primary key default gen_random_uuid(),
  sekce text not null
    check (sekce in ('income', 'housing', 'retirement', 'children', 'investing', 'property')),
  nazev text not null check (char_length(btrim(nazev)) between 1 and 120),
  spolecnost text not null check (char_length(btrim(spolecnost)) between 1 and 120),
  logo text not null default '' check (char_length(logo) <= 10),
  mesicni_platba text not null default '' check (char_length(mesicni_platba) <= 60),
  produkt jsonb not null default '{}'::jsonb check (jsonb_typeof(produkt) = 'object'),
  parametry jsonb not null default '[]'::jsonb check (jsonb_typeof(parametry) = 'array'),
  vynos numeric(4, 2) check (vynos is null or vynos between 0 and 30),
  created_at timestamptz not null default now()
);

comment on table public.katalog_produktu is
  'Šablony variant plánu, které si poradce uložil. Klient je nevidí (RLS jen pro poradce).';

create index if not exists katalog_produktu_sekce_idx
  on public.katalog_produktu (sekce, nazev);

alter table public.katalog_produktu enable row level security;

drop policy if exists "Katalog: jen poradce" on public.katalog_produktu;
create policy "Katalog: jen poradce"
  on public.katalog_produktu
  for all to authenticated
  using (public.get_user_role() = 'advisor')
  with check (public.get_user_role() = 'advisor');

revoke all on public.katalog_produktu from anon, authenticated;
grant select, insert, delete on public.katalog_produktu to authenticated;
