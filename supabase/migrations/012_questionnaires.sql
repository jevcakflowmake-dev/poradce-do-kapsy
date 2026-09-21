-- =====================================================================
-- Poradce do kapsy – verzované definice dotazníků + odpovědi
--
-- Idempotentní: dá se pustit i nad existujícím schématem.
--
-- Oproti původnímu návrhu čtyři změny, každá je u svého místa zdůvodněná:
--   1. role poradce se čte z app_metadata (do user_metadata si zapíše
--      kdokoliv sám) – účtu poradce je proto potřeba app_metadata doplnit,
--   2. poznámka poradce a vyhodnocení nejsou sloupce v questionnaires, ale
--      vlastní tabulka – sloupcová práva by rozbila každý `select *`,
--   3. flags se zrcadlí jen z pole, jinak jsonb_array_elements spadne,
--   4. blok pro documents zůstává, ale dnes je to no-op (tabulka neexistuje;
--      přílohy analýzy drží bucket `analysis`, viz migrace 008).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helper: je přihlášený uživatel poradce?
--    Role patří do app_metadata – tam zapisuje jen service role.
--    user_metadata si uživatel přepíše sám přes auth.updateUser().
-- ---------------------------------------------------------------------
create or replace function public.is_advisor()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'advisor',
    false
  );
$$;

revoke all on function public.is_advisor() from public;
grant execute on function public.is_advisor() to authenticated, anon;

comment on function public.is_advisor() is
  'Role z app_metadata (zapisuje jen service role). Nikdy nečti roli z user_metadata.';

-- ---------------------------------------------------------------------
-- 1. Definice dotazníků (obsah TS configu jako JSONB, verzovaný)
--    Jedna aktivní verze na key. Odpovědi se vážou na konkrétní verzi,
--    takže změna otázek nerozbije staré odpovědi.
-- ---------------------------------------------------------------------
create table if not exists public.questionnaire_definitions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,                    -- 'zajisteni_prijmu'
  version     int  not null,
  title       text not null,
  definition  jsonb not null,                   -- celý objekt Questionnaire z TS
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (key, version)
);

create unique index if not exists questionnaire_definitions_one_active
  on public.questionnaire_definitions (key)
  where is_active;

comment on table public.questionnaire_definitions is
  'Verzované definice dotazníků. definition = JSON export z TS configu; seeduje se skriptem pod service role.';

-- ---------------------------------------------------------------------
-- 2. Odpovědi
-- ---------------------------------------------------------------------
create table if not exists public.questionnaires (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  areas         text[] not null default '{}',   -- oblasti zájmu z onboardingu
  answers       jsonb not null default '{}'::jsonb,
  status        text not null default 'draft',
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.questionnaires
  add column if not exists definition_key     text not null default 'zajisteni_prijmu',
  add column if not exists definition_version int  not null default 1;

-- status: draft → submitted → reviewed (poradce si to prošel a založil projekt)
alter table public.questionnaires drop constraint if exists questionnaires_status_check;
alter table public.questionnaires
  add constraint questionnaires_status_check
  check (status in ('draft', 'submitted', 'reviewed'));

-- answers musí být objekt, ne pole/skalár
alter table public.questionnaires drop constraint if exists questionnaires_answers_object;
alter table public.questionnaires
  add constraint questionnaires_answers_object
  check (jsonb_typeof(answers) = 'object');

-- Vazba na konkrétní verzi definice. Pozor: dokud v questionnaire_definitions
-- není řádek ('zajisteni_prijmu', 1), neprojde žádný insert – seed musí být dřív
-- než první dotazník.
alter table public.questionnaires drop constraint if exists questionnaires_definition_fk;
alter table public.questionnaires
  add constraint questionnaires_definition_fk
  foreign key (definition_key, definition_version)
  references public.questionnaire_definitions (key, version);

-- klient má na jeden typ dotazníku max. jeden rozpracovaný
create unique index if not exists questionnaires_one_draft_per_client
  on public.questionnaires (client_id, definition_key)
  where status = 'draft';

create index if not exists questionnaires_client_idx  on public.questionnaires (client_id);
create index if not exists questionnaires_status_idx  on public.questionnaires (status, submitted_at desc);
create index if not exists questionnaires_answers_gin on public.questionnaires using gin (answers);

-- ---------------------------------------------------------------------
-- 3. Vyhodnocení a poznámky poradce
--
--    Vlastní tabulka schválně. Původní návrh je měl jako sloupce
--    questionnaires a klientovi je bral přes `revoke select (...)`.
--    Jenže sloupcová práva platí pro celou roli `authenticated`, takže by
--    „permission denied for column“ dostal i poradce – a hlavně by každý
--    `select *` skončil chybou (PostgREST hvězdičku rozbaluje na sloupce).
--    Takhle to hlídá RLS po řádcích a klient ta data prostě nevidí.
-- ---------------------------------------------------------------------
create table if not exists public.questionnaire_reviews (
  questionnaire_id uuid primary key
    references public.questionnaires(id) on delete cascade,
  recommendation   jsonb,                       -- výstup computeRecommendation()
  flags            text[] not null default '{}',-- vytažené z recommendation pro filtrování
  computed_at      timestamptz,
  advisor_note     text,                        -- klient nevidí
  updated_at       timestamptz not null default now()
);

create index if not exists questionnaire_reviews_flags_gin
  on public.questionnaire_reviews using gin (flags);

comment on table public.questionnaire_reviews is
  'Vyhodnocení dotazníku a poznámky poradce. Klient k tabulce nemá přístup (RLS).';

-- ---------------------------------------------------------------------
-- 4. Triggery
-- ---------------------------------------------------------------------

-- updated_at (funkce už v databázi je, tělo je shodné)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists questionnaires_set_updated_at on public.questionnaires;
create trigger questionnaires_set_updated_at
  before update on public.questionnaires
  for each row execute function public.set_updated_at();

drop trigger if exists questionnaire_reviews_set_updated_at on public.questionnaire_reviews;
create trigger questionnaire_reviews_set_updated_at
  before update on public.questionnaire_reviews
  for each row execute function public.set_updated_at();

-- přechod draft → submitted: zamkni obsah a zkontroluj povinné otázky
create or replace function public.questionnaires_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  missing text[];
begin
  -- klient nesmí měnit odeslaný dotazník (poradce ano)
  if old.status <> 'draft' and not public.is_advisor() then
    if new.answers is distinct from old.answers
       or new.status is distinct from old.status then
      raise exception 'Odeslaný dotazník už nelze upravit';
    end if;
  end if;

  if new.status = 'submitted' and old.status = 'draft' then
    -- povinné otázky bez showIf (podmíněné povinné hlídá app)
    select array_agg(q->>'key')
      into missing
      from public.questionnaire_definitions d,
           jsonb_array_elements(d.definition->'sections') s,
           jsonb_array_elements(s->'questions') q
     where d.key = new.definition_key
       and d.version = new.definition_version
       and coalesce((q->>'required')::boolean, false)
       and q->'showIf' is null
       and (new.answers->(q->>'key')) is null;

    if missing is not null then
      raise exception 'Chybí povinné odpovědi: %', array_to_string(missing, ', ');
    end if;

    new.submitted_at = coalesce(new.submitted_at, now());
  end if;

  return new;
end $$;

drop trigger if exists questionnaires_before_update on public.questionnaires;
create trigger questionnaires_before_update
  before update on public.questionnaires
  for each row execute function public.questionnaires_before_update();

-- při uložení recommendation zrcadli flags do sloupce.
-- Kontrola typu schválně: jsonb_array_elements() na objektu nebo skaláru
-- vyhodí chybu a shodila by celý zápis vyhodnocení.
create or replace function public.questionnaire_reviews_sync_flags()
returns trigger language plpgsql as $$
begin
  if jsonb_typeof(new.recommendation -> 'flags') = 'array' then
    new.flags := coalesce(
      (select array_agg(value #>> '{}')
         from jsonb_array_elements(new.recommendation -> 'flags')),
      '{}'
    );
  end if;

  if new.recommendation is not null then
    new.computed_at := coalesce(new.computed_at, now());
  end if;

  return new;
end $$;

drop trigger if exists questionnaire_reviews_sync_flags on public.questionnaire_reviews;
create trigger questionnaire_reviews_sync_flags
  before insert or update of recommendation on public.questionnaire_reviews
  for each row execute function public.questionnaire_reviews_sync_flags();

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
alter table public.questionnaire_definitions enable row level security;
alter table public.questionnaires            enable row level security;
alter table public.questionnaire_reviews     enable row level security;

-- definice: každý přihlášený čte aktivní, poradce vše, zápis jen poradce
drop policy if exists qd_read_active on public.questionnaire_definitions;
create policy qd_read_active on public.questionnaire_definitions
  for select to authenticated
  using (is_active or public.is_advisor());

drop policy if exists qd_advisor_write on public.questionnaire_definitions;
create policy qd_advisor_write on public.questionnaire_definitions
  for all to authenticated
  using (public.is_advisor())
  with check (public.is_advisor());

-- odpovědi: klient vidí své, poradce vše
drop policy if exists q_select on public.questionnaires;
create policy q_select on public.questionnaires
  for select to authenticated
  using (client_id = auth.uid() or public.is_advisor());

-- klient zakládá jen sobě a jen jako draft
drop policy if exists q_insert_own on public.questionnaires;
create policy q_insert_own on public.questionnaires
  for insert to authenticated
  with check (
    (client_id = auth.uid() and status = 'draft')
    or public.is_advisor()
  );

-- klient upravuje jen své; obsah po odeslání hlídá trigger výše
drop policy if exists q_update on public.questionnaires;
create policy q_update on public.questionnaires
  for update to authenticated
  using (client_id = auth.uid() or public.is_advisor())
  with check (client_id = auth.uid() or public.is_advisor());

-- mazat smí klient jen rozpracovaný, poradce cokoliv
drop policy if exists q_delete on public.questionnaires;
create policy q_delete on public.questionnaires
  for delete to authenticated
  using (
    (client_id = auth.uid() and status = 'draft')
    or public.is_advisor()
  );

-- vyhodnocení: jen poradce. Klient nemá ani řádek, natož sloupec.
drop policy if exists qr_advisor_only on public.questionnaire_reviews;
create policy qr_advisor_only on public.questionnaire_reviews
  for all to authenticated
  using (public.is_advisor())
  with check (public.is_advisor());

-- ---------------------------------------------------------------------
-- 6. Pohled pro poradcovský seznam (vytáhne klíčové odpovědi z JSONB)
--    Jen pro service role / server – authenticated nemá grant.
-- ---------------------------------------------------------------------
create or replace view public.questionnaire_overview
with (security_invoker = false) as
select
  q.id,
  q.client_id,
  p.full_name,
  q.status,
  q.submitted_at,
  q.definition_key,
  q.definition_version,
  (q.answers->>'vek')::int                       as vek,
  q.answers->>'typ_prace'                        as typ_prace,
  (q.answers->>'prijem_cisty')::numeric          as prijem_cisty,
  (q.answers->>'vydaje_nutne')::numeric          as vydaje_nutne,
  (q.answers->>'deti_pocet')::int                as deti_pocet,
  (q.answers->>'hypoteka')::boolean              as hypoteka,
  q.answers->>'rozpocet'                         as rozpocet,
  q.answers->'obavy'->>0                         as hlavni_obava,
  cardinality(coalesce(r.flags, '{}'))           as flags_count,
  coalesce(r.flags, '{}')                        as flags,
  r.recommendation,
  r.advisor_note
from public.questionnaires q
join public.profiles p on p.id = q.client_id
left join public.questionnaire_reviews r on r.questionnaire_id = q.id;

revoke all on public.questionnaire_overview from anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Upload stávající smlouvy → tabulka documents
--    Dnes no-op: tabulka documents v databázi není, přílohy analýzy drží
--    bucket `analysis` (migrace 008). Blok zůstává pro případ, že documents
--    přibude – pak se sloupec i typ doplní samy.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'documents') then
    alter table public.documents
      add column if not exists questionnaire_id uuid
        references public.questionnaires(id) on delete set null;

    if exists (select 1 from pg_constraint where conname = 'documents_type_check') then
      alter table public.documents drop constraint documents_type_check;
    end if;
    alter table public.documents
      add constraint documents_type_check
      check (type in ('id_front', 'id_back', 'contract_pdf', 'existing_policy', 'other'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 8. Webhook pro n8n: odeslání dotazníku
--    Nastav jako Database Webhook v dashboardu:
--      table: questionnaires, event: UPDATE, filter: status = 'submitted'
--    Payload nese old i new record → n8n switch: old.status='draft' → Telegram.
--    Varianta přes pg_net přímo z databáze je v repu záměrně vypnutá –
--    rozšíření pg_net v projektu zapnuté není.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 9. Seed definice
--    Nedávej JSON do migrace ručně – seeduj skriptem pod service role,
--    který exportuje TS config, upsertne řádek a přepne is_active.
--    Dokud řádek ('zajisteni_prijmu', 1) neexistuje, cizí klíč výš
--    nepustí žádný dotazník.
-- ---------------------------------------------------------------------
