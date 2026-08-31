# Checklist před ostrým spuštěním

Stav k 31. 8. 2026. Co je hotové, je odškrtnuté; zbytek jsou ruční kroky
v administracích, ke kterým Claude nemá (a nemá mít) přístup.

## Jak teď vypadá cesta klienta

    /analyza (bez přihlášení)  →  poradce dostane analýzu  →  finanční plán
                                                           →  přístup do aplikace

1. Návštěvník vyplní analýzu na `/analyza`. Žádná registrace: rozepsaný
   formulář drží `localStorage`, odesílá se najednou na `/api/analyza/odeslat`.
2. Heslo je na konci **nepovinné**. Kdo si ho zvolí, může se přihlásit hned;
   kdo ne, dostane od poradce odkaz na nastavení hesla, až je plán hotový
   (tlačítko „Vygenerovat odkaz pro přístup" v detailu klienta).
3. Každé odeslání se zapíše do `public_submissions` (auditní stopa) a pak:
   - **nový e-mail** → server rovnou založí klienta a překlopí odpovědi,
   - **e-mail se stávajícím účtem** → zůstane `pending` a poradce v detailu
     klienta rozhodne, jestli analýzu přijmout. Automaticky ne: formulář
     s cizím e-mailem odešle kdokoliv a jsou v něm zdravotní údaje.
4. `/signup` zůstává funkční pro toho, kdo chce jen účet, ale odkazy na
   landingu i z přihlášení už vedou na `/analyza`.
5. Úvodní wizard `/onboarding` je zrušený — kdo přijde přes analýzu, má
   vyplněno všechno, co se wizard ptal. Rodinný stav a rizikový profil se
   teď odvozují z odpovědí (`syncProfileFromResponses` v `lib/submissions.ts`).
   Sloupec `profiles.onboarding_completed` zůstává, jen dnes znamená
   „analýza odeslána“.

## Hotovo v kódu

- [x] Google login odstraněn (provider nebyl v Supabase zapnutý)
- [x] Přílohy z analýzy se reálně nahrávají (bucket `analysis`, migrace 008)
      a poradce je vidí v detailu klienta
- [x] PDF návrhy přes signed URL (bucket `proposals` je privátní)
- [x] Notifikace na n8n: server awaituje + loguje selhání, klient loguje
      do konzole; zájem/dotazy jsou vždy v DB i bez n8n
- [x] ~~GitHub Actions keepalive proti uspání Supabase~~ — smazáno 31. 8. 2026,
      po přechodu na Supabase Pro už projekt neusíná
- [x] Vercel auto-deploy z `main` + service role key v env
- [x] **Veřejná analýza bez přihlášení** (7. 8. 2026) — `/analyza`, endpoint
      `/api/analyza/odeslat`, migrace 009 (`public_submissions`), rozhodování
      poradce nad čekajícími odesláními, generování přístupového odkazu.
      Definice otázek je nově v `lib/analysis-sections.ts` — sdílí ji veřejný
      i přihlášený formulář, takže se nemůžou rozejít.
- [x] **Opravená díra v `/api/analysis`** (7. 8. 2026) — endpoint běží pod
      service role a neměl žádnou kontrolu přihlášení: kdokoli, kdo uhodl UUID,
      si přes GET stáhl cizí analýzu včetně zdravotních údajů a přes POST ji
      přepsal. Nově klient smí jen sám sebe, poradce kohokoliv.

## ⚠️ Hero video je NASAZENÉ, ale je to previz

V hero sekci běží ambientní video (`public/video/hero.*`, komponenta
`components/landing/HeroVideo.tsx`). **Poradce v něm není Jakub** – je to
vygenerovaný placeholder z `~/Projects/pdk-promo-video`.

Nasazeno na Jakubovo výslovné rozhodnutí 12. 8. 2026. Do doby, než se video
přegeneruje s jeho fotkou, platí:

- video je ambientní podklad pod textem, silně stažené závojem (nikde není
  popsané jako „váš poradce"), ale postava je rozpoznatelná
- **nikde k němu nepřidávat popisek, jméno ani titulek**, který by osobu
  ve videu ztotožnil s Jakubem – tím by se z ilustrace stalo tvrzení

Výměna: přegenerovat záběry 02, 03 a 05 s referencí
`~/Projects/pdk-promo-video/assets/reference/poradce-ref.jpg`, spustit
`build-hero.sh` a přepsat `hero.webm`, `hero.mp4`, `hero-poster.webp`.
Kód na konkrétním souboru nezávisí.

## 🔴 Před spuštěním — nutné

### 1. SMTP pro e-maily (reset hesla, magic link) — musí udělat Jakub
> Od 7. 8. 2026 to **není tvrdý blokátor spuštění**: přístupový odkaz pro
> klienta se generuje v detailu klienta a poradce ho zkopíruje a pošle sám
> (WhatsApp, vlastní e-mail). SMTP je pořád potřeba pro samoobslužné
> „Zapomenuté heslo" na `/forgot-password`.

Výchozí Supabase SMTP má limit ~2 e-maily/hod a je jen pro vývoj; navíc
neodesílá na adresy mimo členy týmu. Bez vlastního SMTP klientům reset hesla
nedojde. Claude tenhle krok udělat nemůže (zakládání účtu u poskytovatele
a vkládání jeho API klíče do konfigurace).

Postup (~5 minut):
1. Registrace na [resend.com](https://resend.com) — free tarif 100 e-mailů/den
2. Resend → API Keys → vytvořit klíč
3. Supabase → [Authentication → Emails → SMTP Settings](https://supabase.com/dashboard/project/riyxkbylqdimksbtxihr/auth/templates)
   → Enable Custom SMTP a vyplnit:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: *API klíč z kroku 2*
   - Sender email: `noreply@<tvoje-doména>` (do doby, než bude doména,
     lze použít `onboarding@resend.dev` — jen pro testy)
   - Sender name: `Poradce do kapsy`
4. Pokud používáš vlastní doménu: Resend → Domains → přidat a nastavit
   SPF/DKIM DNS záznamy, jinak budou e-maily padat do spamu
5. Test: na `/forgot-password` zadat svůj e-mail a zkontrolovat doručení

### 2. Auth URL allowlist — ✅ UŽ JE V POŘÁDKU
Ověřeno 6. 8. 2026 sondou na `/auth/v1/verify` (bez posílání e-mailu):
- Site URL = `https://poradce-do-kapsy.vercel.app` ✓
- Allowlist obsahuje `/auth/callback`, `/reset-password`, `/update-password` ✓
- Cizí doména správně spadne na Site URL (allowlist tedy funguje) ✓
- Pro lokální vývoj je povolen `http://localhost:3000`, ale **ne 3457**
  (port z `.claude/launch.json`). Buď dev spouštět na 3000, nebo
  `http://localhost:3457/**` přidat do Redirect URLs.

Až přibude vlastní doména, přidat sem i její varianty.

### 3. Supabase Pro plán — ✅ HOTOVO (31. 8. 2026)
Organizace `jevcakflowmake-dev's Org` je na tarifu **pro**, projekt
`riyxkbylqdimksbtxihr` je `ACTIVE_HEALTHY` (ověřeno reálným SQL dotazem, ne jen
statusem z API — ten hlásí `ACTIVE` i u projektu, který se teprve probouzí).
Projekt už neusíná, `.github/workflows/supabase-keepalive.yml` proto smazán.

### 4. n8n — ✅ instance běží, ale 🔴 GMAIL CREDENTIAL JE PROPADLÝ
Instance `n8n.jevcakn8n.com` je nahozená (dřívější HTTP 530 pominul) a všechny
tři webhooky existují a odpovídají 200:
- `POST /webhook/novy-klient` — `ProfiFP_novy_klient_notifikace` (`7eYhQeLIRmPSNu9G`)
- `POST /webhook/klient-zajem` — `ProfiFP_klient_zajem_notifikace` (`lBnWV2S2Pyyy6Z3f`),
  doplněno 31. 8. 2026; do té doby cesta vůbec neexistovala a vracela 404
- `POST /webhook/novy-navrh` — `ProfiFP_novy_navrh_notifikace` (`sDhvGCMcd5ES0Syv`)

**Jenže e-mail z nich neodejde.** Sdílený n8n credential „Gmail account"
(`5JlwUx7B7AZMc5GS`) vrací `invalid_grant` — propadlý/odvolaný refresh token.
Ověřeno na všech třech workflow. Data se neztrácí (jsou v Supabase), ale poradce
nedostane žádné upozornění. **Oprava: v n8n credential znovu propojit s Googlem.**
Když se to bude opakovat po ~7 dnech, má OAuth consent screen v Google Cloudu
stav *Testing* — přepnout na *In production*.

Pozn.: `novy-klient` a `novy-navrh` existují v n8n **dvakrát** se stejnou cestou
(vždy jeden aktivní, jeden vypnutý) — při úpravách sáhnout do toho aktivního.

## 🟡 Před předáním klientům — doporučené

- [ ] **Doména** — koupit + přidat ve Vercelu, poté aktualizovat bod 2
- [ ] **Čísla na landingu** (69 000+ klientů, od 2003, 500+ poradců) jsou čísla
      sítě ProfiFP/OVB — ověřit, že je lze takto prezentovat
- [ ] **Smazat testovací účty** v Supabase (Authentication → Users):
      `test123@test.cz`, příp. staré testy `kuba.jevcak@gmail.com`,
      `jakub.jevcak@ovbmail.cz`
- [x] **SEO** — hotovo 7. 8. 2026: `app/robots.ts`, `app/sitemap.ts`,
      `metadataBase` + OG/Twitter metadata v `app/layout.tsx` a OG obrázek
      (`app/opengraph-image.tsx`, prerenderuje se při buildu z fontů
      v `assets/`). Adresa webu je v `lib/site.ts` — po koupi domény stačí
      nastavit `NEXT_PUBLIC_SITE_URL` ve Vercelu, v kódu se nemění nic.
- [x] **Právní minimum** — hotovo 7. 8. 2026: `/zasady-ochrany-osobnich-udaju`,
      odkaz v patičce, v registraci a v analýze. Zdravotní údaje z analýzy jsou
      řešené jako zvláštní kategorie (čl. 9 GDPR) s výslovným souhlasem před
      vyplněním sekce. Cookies lišta není potřeba (žádná analytika).
      🔴 **Musí doplnit Jakub**: v `app/zasady-ochrany-osobnich-udaju/page.tsx`
      je konstanta `SPRAVCE` se čtyřmi `[DOPLNIT]` — jméno, IČO, adresa sídla
      a kontaktní e-mail. Bez nich zásady nejsou platné. Text je návrh, ne
      právní posudek — doporučuji ho nechat proběhnout právníkem, hlavně
      lhůty archivace a odkazy na zákon o distribuci pojištění.
- [ ] **Mock data**: `/dashboard/produkty` zobrazuje smyšlené platební údaje
      (mockPayments) — před ostrým provozem skrýt nebo napojit na DB

## 🧪 Ruční smoke test po nasazení (5 minut)

Backend je ověřený automaticky proti ostré databázi: upload → RLS → signed
URL ✓, zápis do cizí složky zamítnut ✓, nový e-mail → založení klienta
a překlopení odpovědí ✓, stejný e-mail podruhé → `pending` bez přepsání ✓,
rodinný stav a rizikový profil odvozené z analýzy ✓, podvržená sekce
v requestu zahozena ✓, honeypot ✓, GET cizí analýzy bez přihlášení → 401 ✓.
Testovací data smazána.

Headless prohlížeč ale neumí simulovat výběr souboru v UI, takže po nasazení
proklikat:

1. `/analyza` bez přihlášení: vyplnit sekci „Osobní údaje“, nahrát PDF
   přílohu, **heslo nechat prázdné**, odeslat
2. Jako poradce: detail nového klienta → „Dokumenty od klienta“ → PDF jde
   otevřít; „Vygenerovat odkaz pro přístup“ → odkaz zkopírovat
3. Odkaz otevřít v anonymním okně → nastavit heslo → přistát v dashboardu
4. Vyplnit `/analyza` znovu se **stejným e-mailem** → v detailu klienta se
   objeví oranžový banner „Nová analýza z veřejného formuláře“ → přijmout
5. Vytvořit návrh s PDF → klient ho v dashboardu otevře (signed URL)
6. Smazat testovací účet v Supabase (a řádky v `public_submissions`)
