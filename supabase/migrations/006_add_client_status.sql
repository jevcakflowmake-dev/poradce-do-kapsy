-- ============================================================
-- 006 — stav klienta v pipeline poradce
-- ============================================================
-- Hodnoty:
--   novy           — čerstvá registrace, ještě žádná analýza / plán
--   financni_plan  — poradce pracuje na finančním plánu
--   podepsano      — klient podepsal smlouvu
--   servis         — běžný servis, průběžná péče
--   zmena          — aktivní změna smlouvy / úprava plánu

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'novy'
    CHECK (status IN ('novy', 'financni_plan', 'podepsano', 'servis', 'zmena'));

-- Index pro filtrování v advisor panelu
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);

-- RLS: pouze poradce může status upravit
DROP POLICY IF EXISTS "Poradce upravuje status klienta" ON public.profiles;
CREATE POLICY "Poradce upravuje status klienta"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'advisor');
