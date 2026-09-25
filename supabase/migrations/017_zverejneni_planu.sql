-- =====================================================================
-- Zveřejnění finančního plánu (25. 9. 2026)
--
-- Klient dřív viděl plán od první varianty, kterou poradce přidal – tedy
-- rozdělaný, a přehled mu hlásil „Váš finanční plán je připravený“. Nově
-- ho uvidí, až ho poradce zveřejní; kdy to bylo, drží profil klienta.
--
-- Sloupec zapisuje jen poradce přes /api/advisor/plan/zverejneni pod
-- service role. Klient smí v profilu měnit jen onboarding_completed
-- a goals (migrace 016), takže si plán sám zveřejnit nemůže.
--
-- Plány, které klienti v době nasazení už vidí (mají aspoň jednu
-- variantu), se rovnou označí jako zveřejněné, ať jim nezmizí.
-- =====================================================================

alter table public.profiles
  add column if not exists plan_zverejnen_at timestamptz;

comment on column public.profiles.plan_zverejnen_at is
  'Kdy poradce zveřejnil finanční plán; null = klient plán zatím nevidí.';

update public.profiles p
  set plan_zverejnen_at = now()
  where plan_zverejnen_at is null
    and exists (select 1 from public.plan_variants v where v.client_id = p.id);
