-- ============================================================
-- 009 — veřejná analýza bez přihlášení
-- ============================================================
-- Návštěvník vyplní analýzu na /analyza, aniž by měl účet. Každé odeslání
-- se nejdřív uloží sem a teprve pak se rozhoduje, co s ním:
--
--   • e-mail u nás ještě účet nemá  → server rovnou založí klienta,
--     překlopí odpovědi do analysis_responses a označí status 'applied'
--   • e-mail už účet má             → zůstane 'pending'. Odpovědi se
--     NEPŘEPÍŠOU automaticky, protože odeslat formulář s cizím e-mailem
--     může kdokoliv. Poradce v detailu klienta rozhodne (přijmout/zahodit).
--
-- Tabulka je zároveň auditní stopa: co přesně kdo poslal a kdy. Hodí se
-- při reklamaci i při žádosti o výpis dle GDPR.

create table if not exists public.public_submissions (
  id uuid primary key default gen_random_uuid(),

  -- Kontakt ze sekce „Osobní údaje“ — vytažený zvlášť kvůli hledání a párování
  email text not null,
  full_name text,
  phone text,

  -- Celý formulář: { section_id: { question_id: hodnota } }
  responses jsonb not null default '{}'::jsonb,
  -- Přílohy: [{ section, file_name, file_url, file_size }]
  files jsonb not null default '[]'::jsonb,

  -- Klient, ke kterému odeslání patří (nový i nalezený podle e-mailu)
  matched_client_id uuid references public.profiles(id) on delete set null,

  status text not null default 'pending'
    check (status in ('pending', 'applied', 'discarded')),

  -- Zvolil si návštěvník rovnou heslo? Když ne, poradce mu pošle přístup až s plánem.
  has_password boolean not null default false,

  applied_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists public_submissions_status_idx
  on public.public_submissions (status);
create index if not exists public_submissions_client_idx
  on public.public_submissions (matched_client_id);
create index if not exists public_submissions_email_idx
  on public.public_submissions (lower(email));

alter table public.public_submissions enable row level security;

-- Zápis jde výhradně přes service role v /api/analyza/odeslat, proto tu
-- žádná insert policy pro anon není — anonymní klient sem nesmí sáhnout.
drop policy if exists "Poradce cte odeslani" on public.public_submissions;
create policy "Poradce cte odeslani" on public.public_submissions
  for select using (public.get_user_role() = 'advisor');

drop policy if exists "Poradce rozhoduje o odeslani" on public.public_submissions;
create policy "Poradce rozhoduje o odeslani" on public.public_submissions
  for update using (public.get_user_role() = 'advisor');

-- ------------------------------------------------------------
-- Přílohy z veřejného formuláře
-- ------------------------------------------------------------
-- Dokud odeslání čeká na schválení, nemáme client_id, a tak soubory nemůžou
-- ležet v `{client_id}/…`. Parkují se v `submissions/{submission_id}/…`,
-- kam vidí jen poradce; po schválení je server přesune ke klientovi.

drop policy if exists "Analyza: poradce cte parkovane prilohy" on storage.objects;
create policy "Analyza: poradce cte parkovane prilohy"
  on storage.objects for select
  using (
    bucket_id = 'analysis'
    and (storage.foldername(name))[1] = 'submissions'
    and public.get_user_role() = 'advisor'
  );
