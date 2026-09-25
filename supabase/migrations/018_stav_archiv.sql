-- =====================================================================
-- Stav klienta „archiv“ (25. 9. 2026)
--
-- Ukončení klienti (odešli, smlouvy zrušené) nemají v pipeline místo, ale
-- mazat je poradce nechce – kvůli historii a zákonným lhůtám. Archiv je
-- schová ze seznamu „vše“; zobrazí se jen na výslovný filtr.
-- =====================================================================

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('novy', 'financni_plan', 'podepsano', 'servis', 'zmena', 'archiv'));
