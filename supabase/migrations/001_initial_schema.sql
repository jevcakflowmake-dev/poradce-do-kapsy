-- ============================================================
-- Poradce do kapsy — počáteční schéma
-- ============================================================

-- Profily klientů (rozšíření Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  age int,
  income text,
  family_status text check (family_status in ('single', 'partner', 'family', 'single_parent')),
  risk_profile text check (risk_profile in ('conservative', 'moderate', 'balanced', 'aggressive')),
  goals text[] default '{}',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Návrhy od poradce
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('insurance', 'pension', 'invest')) not null,
  title text not null,
  content text,
  file_url text,
  link_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Trigger: aktualizace updated_at na profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger: při vytvoření uživatele v auth.users → vlož záznam do profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.proposals enable row level security;

-- Pomocná funkce pro zjištění role uživatele
create or replace function public.get_user_role()
returns text as $$
  select coalesce(
    (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()),
    'client'
  );
$$ language sql security definer;

-- PROFILES: klient vidí jen sebe, poradce vidí vše
create policy "Klient vidí vlastní profil"
  on public.profiles for select
  using (auth.uid() = id or public.get_user_role() = 'advisor');

create policy "Klient upravuje vlastní profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Trigger může vložit profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- PROPOSALS: klient vidí jen svoje, poradce může CRUD vše
create policy "Klient vidí vlastní návrhy"
  on public.proposals for select
  using (
    client_id = auth.uid()
    or public.get_user_role() = 'advisor'
  );

create policy "Poradce vkládá návrhy"
  on public.proposals for insert
  with check (public.get_user_role() = 'advisor');

create policy "Poradce upravuje návrhy"
  on public.proposals for update
  using (public.get_user_role() = 'advisor');

create policy "Poradce maže návrhy"
  on public.proposals for delete
  using (public.get_user_role() = 'advisor');

create policy "Klient označí návrh jako přečtený"
  on public.proposals for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ============================================================
-- Storage bucket pro PDF návrhy
-- ============================================================

insert into storage.buckets (id, name, public)
values ('proposals', 'proposals', false)
on conflict do nothing;

-- Poradce může nahrávat soubory
create policy "Poradce nahrává PDF"
  on storage.objects for insert
  with check (
    bucket_id = 'proposals'
    and public.get_user_role() = 'advisor'
  );

-- Poradce i klient mohou číst (klient jen vlastní složku)
create policy "Autentizovaný uživatel může číst PDF"
  on storage.objects for select
  using (
    bucket_id = 'proposals'
    and auth.role() = 'authenticated'
  );
