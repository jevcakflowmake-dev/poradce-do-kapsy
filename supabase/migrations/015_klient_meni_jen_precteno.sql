-- =====================================================================
-- U smluv a zpráv smí přihlášený uživatel měnit jen „přečteno“
--
-- Politiky „Klient označí návrh jako přečtený“ (proposals) a „Označit
-- zprávy jako přečtené“ (messages) pouštějí k UPDATE celého řádku a role
-- authenticated má UPDATE na celou tabulku. Přihlášený klient tak přes
-- veřejný anon klíč mohl přepsat text poradcových zpráv v chatu (včetně
-- sender_role) nebo obsah vlastní smlouvy – IBAN, částky, krytí.
-- Ověřeno 23. 9. 2026 na ostré databázi (pg_policies, table_privileges,
-- žádný trigger to nehlídal).
--
-- Oprava na úrovni sloupců: role authenticated smí měnit jen is_read,
-- anon nic. Politiky zůstávají beze změny, jen teď pouštějí k jedinému
-- sloupci. Týká se to i poradce v prohlížeči – ani on dnes nic jiného
-- nemění. Úpravy obsahu smluv patří do serverových rout se service role,
-- na kterou tahle práva nemají vliv.
--
-- Zpráva v chatu je záznam rozhovoru: po odeslání se už nepřepisuje,
-- jen se označí jako přečtená.
-- =====================================================================

revoke update on table public.proposals from authenticated, anon;
grant update (is_read) on table public.proposals to authenticated;

revoke update on table public.messages from authenticated, anon;
grant update (is_read) on table public.messages to authenticated;
