-- Varianty finančního plánu pro klienty
create table if not exists public.plan_variants (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  section text not null, -- 'income', 'housing', 'retirement', 'children', 'investing', 'property'
  company text not null,
  logo text not null default '',
  monthly_payment text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Parametry pro každou variantu
create table if not exists public.plan_params (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.plan_variants(id) on delete cascade not null,
  param_key text not null, -- 'dailyInjury', 'sickLeaveDaily', etc.
  param_label text not null, -- 'Denní odškodné v případě úrazu'
  value text not null, -- '300 Kč/den'
  note text default '', -- vysvětlivka
  sort_order int default 0
);

-- Jednoduché textové doporučení pro sekce bez variant
create table if not exists public.plan_recommendations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  section text not null,
  status text check (status in ('ok', 'recommendation', 'action')) default 'recommendation',
  items text[] default '{}', -- pole textových doporučení
  created_at timestamptz default now()
);

-- RLS
alter table public.plan_variants enable row level security;
alter table public.plan_params enable row level security;
alter table public.plan_recommendations enable row level security;

-- Poradce může CRUD vše
create policy "Poradce spravuje varianty" on public.plan_variants
  for all using (public.get_user_role() = 'advisor');

create policy "Poradce spravuje parametry" on public.plan_params
  for all using (public.get_user_role() = 'advisor');

create policy "Poradce spravuje doporučení" on public.plan_recommendations
  for all using (public.get_user_role() = 'advisor');

-- Klient vidí své varianty
create policy "Klient vidí své varianty" on public.plan_variants
  for select using (client_id = auth.uid() or public.get_user_role() = 'advisor');

create policy "Klient vidí parametry svých variant" on public.plan_params
  for select using (
    variant_id in (select id from public.plan_variants where client_id = auth.uid())
    or public.get_user_role() = 'advisor'
  );

create policy "Klient vidí svá doporučení" on public.plan_recommendations
  for select using (client_id = auth.uid() or public.get_user_role() = 'advisor');

-- Indexy
create index plan_variants_client_idx on public.plan_variants(client_id, section);
create index plan_params_variant_idx on public.plan_params(variant_id, sort_order);
create index plan_recommendations_client_idx on public.plan_recommendations(client_id, section);
