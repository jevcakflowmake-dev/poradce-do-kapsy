-- Storage bucket pro dokumenty z finanční analýzy (smlouvy, pojistky)
-- Privátní — čtení jen přes signed URL. Cesta souboru: {client_id}/{section}/{ts}_{nazev}

insert into storage.buckets (id, name, public)
values ('analysis', 'analysis', false)
on conflict do nothing;

-- Klient nahrává jen do vlastní složky; poradce kamkoli
create policy "Analyza: upload vlastni slozka nebo poradce"
  on storage.objects for insert
  with check (
    bucket_id = 'analysis'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() = 'advisor'
    )
  );

-- Číst může vlastník složky a poradce (kvůli createSignedUrl)
create policy "Analyza: cteni vlastnik nebo poradce"
  on storage.objects for select
  using (
    bucket_id = 'analysis'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() = 'advisor'
    )
  );

-- Mazání: vlastník složky nebo poradce
create policy "Analyza: mazani vlastnik nebo poradce"
  on storage.objects for delete
  using (
    bucket_id = 'analysis'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() = 'advisor'
    )
  );

-- Klient smí smazat záznam o svém souboru (UI odebrání přílohy)
create policy "Klient maze sve soubory" on public.analysis_files
  for delete using (client_id = auth.uid());
