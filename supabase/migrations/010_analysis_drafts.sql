-- Rozepsaná veřejná analýza. Ukládá se až od posledního kroku, kdy je znám
-- e-mail a člověk na obrazovce vidí, že se odpovědi ukládají.
--
-- Do tabulky se z prohlížeče nedostane nikdo: RLS je zapnutá a záměrně tu
-- není jediná politika, takže anon i authenticated role dostanou prázdno.
-- Zapisuje výhradně serverová routa /api/analyza/koncept pod service role.
create table if not exists public.analysis_drafts (
  id uuid primary key default gen_random_uuid(),
  -- náhodný klíč z prohlížeče, ne e-mail: podle něj se koncept přepisuje
  draft_key uuid not null unique,
  responses jsonb not null default '{}'::jsonb,
  step smallint not null default 0,
  -- e-mail držíme zvlášť, ať jde rozepsaný dotazník dohledat bez čtení odpovědí
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.analysis_drafts enable row level security;

drop trigger if exists analysis_drafts_updated on public.analysis_drafts;
create trigger analysis_drafts_updated
  before update on public.analysis_drafts
  for each row execute function public.set_updated_at();

create index if not exists analysis_drafts_updated_idx
  on public.analysis_drafts (updated_at desc);

-- Koncepty obsahují zdravotní údaje (čl. 9 GDPR), takže se nedrží věčně:
-- routa /api/analyza/koncept při každém zápisu smaže řádky starší 60 dnů.
-- Kdyby měla platit lhůta i bez provozu, jde místo toho zapnout pg_cron.
