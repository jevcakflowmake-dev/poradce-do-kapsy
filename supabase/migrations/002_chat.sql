-- Zprávy chatu mezi klientem a poradcem
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  sender_role text check (sender_role in ('client', 'advisor')) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- Klient vidí jen vlastní konverzaci
create policy "Klient vidí vlastní zprávy"
  on public.messages for select
  using (client_id = auth.uid() or public.get_user_role() = 'advisor');

create policy "Klient může odeslat zprávu"
  on public.messages for insert
  with check (
    (sender_role = 'client' and client_id = auth.uid())
    or public.get_user_role() = 'advisor'
  );

create policy "Označit zprávy jako přečtené"
  on public.messages for update
  using (client_id = auth.uid() or public.get_user_role() = 'advisor');

-- Index pro rychlé načítání konverzace
create index messages_client_id_idx on public.messages(client_id, created_at desc);
