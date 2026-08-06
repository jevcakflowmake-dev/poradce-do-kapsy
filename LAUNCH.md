# Checklist před ostrým spuštěním

Stav k 6. 8. 2026. Co je hotové, je odškrtnuté; zbytek jsou ruční kroky
v administracích, ke kterým Claude nemá (a nemá mít) přístup.

## Hotovo v kódu

- [x] Google login odstraněn (provider nebyl v Supabase zapnutý)
- [x] Přílohy z analýzy se reálně nahrávají (bucket `analysis`, migrace 008)
      a poradce je vidí v detailu klienta
- [x] PDF návrhy přes signed URL (bucket `proposals` je privátní)
- [x] Notifikace na n8n: server awaituje + loguje selhání, klient loguje
      do konzole; zájem/dotazy jsou vždy v DB i bez n8n
- [x] GitHub Actions keepalive proti uspání Supabase (2× denně)
- [x] Vercel auto-deploy z `main` + service role key v env

## 🔴 Před spuštěním — nutné

### 1. SMTP pro e-maily (reset hesla, magic link) — musí udělat Jakub
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

### 3. Supabase Pro plán (~$25/měs)
Free tier projekt usíná po týdnu neaktivity (stalo se 2× jen během vývoje).
Keepalive workflow to zmírňuje, ale pro ostrý provoz s klienty je Pro nutnost
(navíc: denní zálohy, žádné usínání, vyšší limity).
Poznámka: po přechodu na Pro lze smazat `.github/workflows/supabase-keepalive.yml`.

### 4. n8n — nahodit instanci
`n8n.jevcakn8n.com` vrací HTTP 530 (origin down). Webhooky, které aplikace volá:
- `POST /webhook/novy-klient` — nová registrace (jméno, e-mail, telefon)
- `POST /webhook/klient-zajem` — zájem o sekci/variantu, dotaz k plánu
- `POST /webhook/novy-navrh` — poradce vytvořil návrh
Do té doby: nic se neztratí (vše je v DB), jen nechodí upozornění.

## 🟡 Před předáním klientům — doporučené

- [ ] **Doména** — koupit + přidat ve Vercelu, poté aktualizovat bod 2
- [ ] **Čísla na landingu** (69 000+ klientů, od 2003, 500+ poradců) jsou čísla
      sítě ProfiFP/OVB — ověřit, že je lze takto prezentovat
- [ ] **Smazat testovací účty** v Supabase (Authentication → Users):
      `test123@test.cz`, příp. staré testy `kuba.jevcak@gmail.com`,
      `jakub.jevcak@ovbmail.cz`
- [ ] **SEO**: `robots.txt`, `sitemap.ts`, OG image (náhled při sdílení),
      `metadataBase` — zatím chybí
- [ ] **Právní minimum**: zásady zpracování osobních údajů (registrace sbírá
      jméno/telefon/e-mail, analýza i zdravotní údaje!), cookies lišta není
      potřeba (žádná analytika), ale GDPR informace ano
- [ ] **Mock data**: `/dashboard/produkty` zobrazuje smyšlené platební údaje
      (mockPayments) — před ostrým provozem skrýt nebo napojit na DB

## 🧪 Ruční smoke test po nasazení (5 minut)

Backend celé cesty je ověřený automaticky (upload → RLS → signed URL ✓,
zápis do cizí složky zamítnut ✓). Headless prohlížeč ale neumí simulovat
výběr souboru v UI, takže po nasazení proklikat:

1. Registrace nového (testovacího) klienta → přesměruje na dashboard
2. Analýza: nahrát PDF přílohu, odeslat → objeví se chip „nahráno“
3. Jako poradce: detail klienta → sekce „Dokumenty od klienta“ → PDF jde otevřít
4. Vytvořit návrh s PDF → klient ho v dashboardu otevře (signed URL)
5. Smazat testovací účet v Supabase
