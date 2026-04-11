-- Odpovědi z finanční analýzy
create table if not exists public.analysis_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  section text not null,
  question_id text not null,
  value text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, section, question_id)
);

-- Nahrané soubory z analýzy
create table if not exists public.analysis_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  section text not null,
  file_name text not null,
  file_url text not null,
  file_size int default 0,
  created_at timestamptz default now()
);

alter table public.analysis_responses enable row level security;
alter table public.analysis_files enable row level security;

-- Klient i poradce mohou číst
create policy "Viditelnost odpovědí" on public.analysis_responses
  for select using (client_id = auth.uid() or public.get_user_role() = 'advisor');

create policy "Viditelnost souborů" on public.analysis_files
  for select using (client_id = auth.uid() or public.get_user_role() = 'advisor');

-- Klient může vkládat a upravovat své odpovědi
create policy "Klient vkládá odpovědi" on public.analysis_responses
  for insert with check (client_id = auth.uid());

create policy "Klient upravuje odpovědi" on public.analysis_responses
  for update using (client_id = auth.uid());

create policy "Klient nahrává soubory" on public.analysis_files
  for insert with check (client_id = auth.uid());

-- Poradce může vše
create policy "Poradce spravuje odpovědi" on public.analysis_responses
  for all using (public.get_user_role() = 'advisor');

create policy "Poradce spravuje soubory" on public.analysis_files
  for all using (public.get_user_role() = 'advisor');

create index analysis_responses_client_idx on public.analysis_responses(client_id, section);
create index analysis_files_client_idx on public.analysis_files(client_id, section);
