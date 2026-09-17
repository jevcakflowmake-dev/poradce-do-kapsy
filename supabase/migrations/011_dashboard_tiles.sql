-- Dvě čísla, která klient vidí na přehledu vedle měsíčních plateb.
-- Vyplňuje je poradce v editoru plánu; dokud jsou prázdná, dlaždice
-- ukazují pomlčku a nic si nedomýšlí.
alter table public.client_financials
  add column if not exists possible_savings numeric,
  add column if not exists reserve numeric;

comment on column public.client_financials.possible_savings is
  'Možná měsíční úspora podle návrhu poradce. Prázdné = dlaždice ukáže pomlčku.';
comment on column public.client_financials.reserve is
  'Doporučená výše finanční rezervy. Prázdné = dlaždice ukáže pomlčku.';
