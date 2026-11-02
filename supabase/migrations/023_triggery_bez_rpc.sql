-- Triggerové funkce běží jako SECURITY DEFINER a šly zavolat i přes
-- /rest/v1/rpc (anon i přihlášený). Volá je jen trigger, ten právo EXECUTE
-- při spuštění nekontroluje – odebrání nic nerozbije.
-- get_user_role() zůstává: používají ho RLS politiky.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.questionnaires_before_update() from public, anon, authenticated;
