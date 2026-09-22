-- =====================================================================
-- Očekávaný státní důchod zadává poradce
--
-- Blok „Kolik na to potřebujete" ve finančním plánu dosud odhadoval státní
-- důchod jako 40 % čistého příjmu. Je to nejslabší číslo celého výpočtu —
-- skutečná výše závisí na odpracovaných letech a vyměřovacích základech,
-- takže poradce ho z kalkulačky ČSSZ spočítá přesně.
--
-- Prázdná hodnota = zůstává původní odhad, blok to o sobě napíše.
-- Žádná politika se nemění, tabulka je pokrytá stávajícími pravidly.
-- =====================================================================

alter table public.client_financials
  add column if not exists expected_state_pension numeric;

comment on column public.client_financials.expected_state_pension is
  'Očekávaný měsíční státní důchod v dnešních cenách, zadává poradce (kalkulačka ČSSZ). Prázdné = plán odhadne 40 % čistého příjmu.';
