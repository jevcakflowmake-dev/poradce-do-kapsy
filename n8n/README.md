# Upozornění e-mailem (n8n)

Aplikace posílá klientovi e-mail, když poradce zveřejní nebo upraví plán,
přidá smlouvu nebo napíše do chatu (u chatu jen první zpráva po dvou
hodinách ticha). Předmět, text i HTML skládá aplikace (`lib/upozorneni.ts`),
n8n e-mail jen odešle.

Stejným workflow chodí i e-mail opačným směrem: **poradci, když mu klient
napíše** (chat a formulář „Potřebuju něco vyřešit“). V n8n se kvůli tomu
nic nenastavuje – workflow pošle e-mail na adresu z požadavku a tou je
tady přihlašovací e-mail účtu s rolí poradce. Pravidla jsou v
`app/api/zpravy/upozorneni/route.ts`:

- aplikace 20 vteřin počká; když poradce zprávu mezitím přečte (má
  konverzaci otevřenou), e-mail neodejde,
- když v konverzaci už čeká starší nepřečtená zpráva z posledních dvou
  hodin, další e-mail neodejde (tři zprávy za sebou = jeden e-mail),
- text zprávy v e-mailu není, jen jméno klienta a odkaz do chatu.

Dotaz k plánu a zájem o variantu hlásí poradci jiný webhook
(`klient-zajem`, `lib/notify.ts`), ten s tímhle nesouvisí.

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

## Když e-mail neodejde

Webhook odpoví hned po přijetí, takže aplikace o chybě při odesílání neví.
Hlídá to error workflow `chyba-upozorneni.json`: při každém spadlém spuštění
pošle Jakubovi e-mail s chybou a odkazem na spuštění. Jde přes **Gmail**, ne
přes Resend – kdyby selhal Resend, nedošlo by přes něj ani upozornění.

1. V n8n → nový workflow → vlož obsah `chyba-upozorneni.json` (Cmd+V do
   plátna, nebo Import from File).
2. V nodu *Send_Alert* vyber svoje Gmail přihlašovací údaje, případně změň
   adresu v *To*. Workflow ulož; aktivovat ho není potřeba.
3. Ve workflow `PoradceDoKapsy_upozorneni_klienta_webhook` → Settings →
   **Error workflow** vyber `PoradceDoKapsy_chyba_upozorneni_error` a ulož.
4. Test: v error workflow klikni na *Execute workflow* – Error Trigger dodá
   ukázková data a do schránky přijde zkušební upozornění.

## Co chodí na webhook

`POST https://n8n.jevcakn8n.com/webhook/upozorneni-klienta`

| pole | obsah |
| --- | --- |
| `udalost` | klientovi: `plan_zverejnen`, `plan_upraven`, `nova_smlouva`, `nova_zprava`; poradci: `zprava_od_klienta` |
| `email` | příjemce – klient, u `zprava_od_klienta` poradce |
| `jmeno`, `client_id` | klient, kterého se e-mail týká |
| `predmet`, `text`, `html` | hotový e-mail |
| `odkaz` | kam vede tlačítko v e-mailu |

---

# Novinky z finančního světa (n8n + Claude)

Workflow `novinky-clanek.json` (`PoradceDoKapsy_novinky_clanek_kazde_2_tydny`)
jednou za dva týdny v pondělí v 8:00:

1. načte zprávy z RSS Měšec.cz, Peníze.cz a ČT24 Ekonomika (posledních 15 dní,
   nejvýš 45 zpráv; zdroj, který zrovna neodpoví, se přeskočí),
2. Claude (`claude-opus-5-5`) z nich napíše krátký článek pro běžné domácnosti
   – bez investičních doporučení, jen z údajů ve zprávách,
3. pošle ho e-mailem na `kuba.jevcak@gmail.com` s tlačítky **Zveřejnit** / **Zamítnout**,
4. po Zveřejnit ho pošle na `POST https://poradcedokapsy.cz/api/novinky`,
   článek se hned objeví na `/novinky` a na úvodní stránce, a přijde potvrzení
   s odkazem. Bez odpovědi do 7 dní se článek zahodí.

RSS dávají jen posledních pár desítek zpráv, takže článek stojí hlavně na
zprávách z posledních dní před spuštěním.

## Zapojení

1. **Klíč pro web.** Vygeneruj nový náhodný řetězec (`openssl rand -hex 32`),
   jiný než u upozornění klientů.
2. **Vercel.** Projekt poradce-do-kapsy → Settings → Environment Variables:
   `N8N_NOVINKY_TOKEN` = ten klíč (Production, Sensitive), pak redeploy.
   Bez něj web články odmítne (503).
3. **n8n – přihlašovací údaje:**
   - *Header Auth* `Header_PoradceDoKapsy_Novinky`: Name `X-Poradce-Token`,
     Value = klíč z kroku 1.
   - *Header Auth* `Anthropic_PoradceDoKapsy`: Name `x-api-key`, Value = API klíč
     z console.anthropic.com.
   - *SMTP* `SMTP_Resend` už existuje (upozornění klientů).
4. **Import.** Workflows → Import from File → `novinky-clanek.json`. V uzlech
   `Napsat_clanek`, `Zverejnit_clanek`, `Poslat_ke_schvaleni` a `Poslat_potvrzeni`
   vyber přihlašovací údaje z kroku 3. Settings → Error workflow:
   `PoradceDoKapsy_chyba_upozorneni_error`. Workflow aktivuj.
5. **Zkouška.** Spusť ho ručně (`Spustit_rucne`). Do pár minut přijde e-mail ke
   schválení. Když článek nechceš, klikni Zamítnout a nic se nezveřejní.

## Kdyby bylo potřeba článek stáhnout

Zatím v Supabase: tabulka `novinky`, u článku vymazat `zverejneno_at` (nebo
řádek smazat). Výpis na webu se obnoví nejpozději do hodiny.

## Co chodí na web

`POST https://poradcedokapsy.cz/api/novinky`, hlavička `X-Poradce-Token`:

| pole | obsah |
| --- | --- |
| `titulek` | do 160 znaků |
| `perex` | do 600 znaků |
| `obsah` | prostý text: odstavce oddělené prázdným řádkem, `## ` mezititulek, `- ` odrážka |
| `zdroje` | `[{ "nazev": "…", "url": "https://…" }]`, jen adresy, které byly v zadání |

Adresu článku složí web z titulku. Odpověď: `201 { ok, slug, url }`.
