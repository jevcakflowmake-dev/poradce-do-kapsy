# Upozornění klienta e-mailem (n8n)

Aplikace posílá klientovi e-mail, když poradce zveřejní nebo upraví plán,
přidá smlouvu nebo napíše do chatu (u chatu jen první zpráva po dvou
hodinách ticha). Předmět, text i HTML skládá aplikace (`lib/upozorneni.ts`),
n8n e-mail jen odešle.

## Zapojení

1. **Token.** Vygeneruj náhodný řetězec, třeba v terminálu:
   `openssl rand -hex 32`. Nikam ho neposílej, jen ho vlož do dvou míst níž.
2. **Vercel.** V projektu poradce-do-kapsy → Settings → Environment
   Variables přidej `N8N_UPOZORNENI_TOKEN` s tím tokenem (Production)
   a udělej redeploy. Bez tokenu aplikace upozornění vůbec neposílá.
3. **n8n – přihlašovací údaje.**
   - *Header Auth* pojmenovaný `Header_PoradceDoKapsy`: Name
     `X-Poradce-Token`, Value = token z kroku 1.
   - *SMTP* pojmenovaný `SMTP_Resend`: host `smtp.resend.com`, port 465,
     SSL/TLS zapnuté, uživatel `resend`, heslo = API klíč z Resendu
     (stejný, jaký máš v Supabase u SMTP).
4. **Import.** V n8n → Workflows → Import from File → `upozorneni-klienta.json`.
   V obou nodech vyber přihlašovací údaje z kroku 3 a workflow aktivuj.

Odesílatel je `noreply@mail.poradcedokapsy.cz`. V Resendu je ověřená jen
subdoména `mail.poradcedokapsy.cz` (DNS záznamy ve Vercel DNS), ze stejné
posílá i Supabase. Z kořenové `poradcedokapsy.cz` Resend odmítne e-mail
chybou „550 This API key is not authorized to send emails from
poradcedokapsy.cz“. API klíč pro n8n musí mít přístup k doméně
`mail.poradcedokapsy.cz` (nebo ke všem doménám).

Webhook ověřuje token v hlavičce – bez něj by přes něj mohl kdokoli
rozesílat e-maily naším jménem, protože adresa příjemce přichází
v požadavku.

## Co chodí na webhook

`POST https://n8n.jevcakn8n.com/webhook/upozorneni-klienta`

| pole | obsah |
| --- | --- |
| `udalost` | `plan_zverejnen`, `plan_upraven`, `nova_smlouva`, `nova_zprava` |
| `email`, `jmeno`, `client_id` | příjemce |
| `predmet`, `text`, `html` | hotový e-mail |
| `odkaz` | kam vede tlačítko v e-mailu |
