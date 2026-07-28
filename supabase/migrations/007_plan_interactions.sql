-- Reakce klienta na sekce finančního plánu
-- Jedna volba per (client_id, section) — přepisuje se při opakovaném kliku.
create table if not exists public.plan_section_interest (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  section text not null, -- 'income' | 'housing' | 'retirement' | 'children' | 'investing' | 'property'
  status text not null check (status in ('interested', 'question', 'not_now')),
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, section)
);

-- Preferovaná varianta (soft commit — poradce finalizuje offline)
create table if not exists public.plan_variant_selection (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  variant_id uuid references public.plan_variants(id) on delete cascade not null,
  selected_at timestamptz default now(),
  unique (client_id, variant_id)
);

-- RLS
alter table public.plan_section_interest enable row level security;
alter table public.plan_variant_selection enable row level security;

-- Klient spravuje svoje reakce
create policy "Klient spravuje svůj zájem o sekci" on public.plan_section_interest
  for all using (client_id = auth.uid() or public.get_user_role() = 'advisor')
  with check (client_id = auth.uid() or public.get_user_role() = 'advisor');

create policy "Klient spravuje výběr variant" on public.plan_variant_selection
  for all using (client_id = auth.uid() or public.get_user_role() = 'advisor')
  with check (client_id = auth.uid() or public.get_user_role() = 'advisor');

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists plan_section_interest_updated on public.plan_section_interest;
create trigger plan_section_interest_updated
  before update on public.plan_section_interest
  for each row execute function public.set_updated_at();

-- Indexy
create index if not exists plan_section_interest_client_idx on public.plan_section_interest(client_id);
create index if not exists plan_section_interest_status_idx on public.plan_section_interest(status, updated_at desc);
create index if not exists plan_variant_selection_client_idx on public.plan_variant_selection(client_id);
