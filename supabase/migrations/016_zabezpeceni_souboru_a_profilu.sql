-- =====================================================================
-- Zabezpečení souborů, profilu a zpráv (audit 23. 9. 2026)
--
-- 1) Smlouvy v bucketu `proposals` četl KAŽDÝ přihlášený uživatel:
--    politika „Autentizovaný uživatel může číst PDF“ kontrolovala jen
--    auth.role() = 'authenticated'. Klient si přes veřejný klíč mohl
--    vypsat celý bucket a stáhnout smlouvy ostatních klientů. V době
--    auditu byl bucket prázdný, díra se měla projevit s prvním PDF.
--    Nově jako u bucketu `analysis`: vlastní složka (cesta začíná ID
--    klienta, viz ProposalForm) nebo poradce.
--
-- 2) Buckety neměly limit velikosti ani typu souboru. Klient smí do
--    vlastní složky v `analysis` nahrávat přímo přes storage API, takže
--    kontrola v aplikaci (lib/storage.ts) se dala obejít.
--
-- 3) Zprávy: klient při vložení určoval i created_at, is_read a id –
--    šlo tak podstrčit zprávu se starým datem doprostřed historie chatu.
--    Nově smí vložit jen client_id, sender_role a content; zbytek dá
--    databáze sama. Politika „Klient může odeslat zprávu“ dál hlídá, že
--    klient píše jen za sebe.
--
-- 4) Profil: politika „Klient upravuje vlastní profil“ pouští k celému
--    řádku, takže si klient přepsal i `status` v poradcově přehledu nebo
--    `risk_profile` z analýzy. Z prohlížeče klient mění jen
--    onboarding_completed a goals (dokončení analýzy); stav klienta mění
--    poradce přes /api/advisor/client-status pod service role.
--
-- 5) Funkce bez pevného search_path (lint Supabase). Všechny používají
--    plně kvalifikované názvy nebo vestavěné funkce, prázdná cesta nic
--    nerozbije.
-- =====================================================================

-- 1) Smlouvy: jen vlastní složka nebo poradce
drop policy if exists "Autentizovaný uživatel může číst PDF" on storage.objects;
create policy "Smlouvy: cteni vlastnik nebo poradce"
  on storage.objects for select
  using (
    bucket_id = 'proposals'
    and (
      (storage.foldername(name))[1] = (auth.uid())::text
      or public.get_user_role() = 'advisor'
    )
  );

-- 2) Limity bucketů – stejné typy jako `accept` u polí v aplikaci
update storage.buckets
  set file_size_limit = 10485760, -- 10 MB, jako MAX_FILE_SIZE v lib/storage.ts
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
  where id = 'analysis';

update storage.buckets
  set file_size_limit = 52428800, -- 50 MB, smlouva i s pojistnými podmínkami
      allowed_mime_types = array['application/pdf']
  where id = 'proposals';

-- 3) Zprávy: při vložení jen obsah, datum a přečtení určuje databáze
revoke insert on table public.messages from authenticated, anon;
grant insert (client_id, sender_role, content) on table public.messages to authenticated;

-- 4) Profil: klient mění jen dokončení analýzy
revoke update on table public.profiles from authenticated, anon;
grant update (onboarding_completed, goals) on table public.profiles to authenticated;

-- 5) Pevný search_path
alter function public.handle_new_user() set search_path = '';
alter function public.handle_updated_at() set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.set_updated_at_cf() set search_path = '';
alter function public.questionnaire_reviews_sync_flags() set search_path = '';
