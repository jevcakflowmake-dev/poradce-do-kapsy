# E-mailové šablony Supabase Auth

Hostovaný Supabase šablony z repa nečte – vkládají se ručně v
[Authentication → Emails](https://supabase.com/dashboard/project/riyxkbylqdimksbtxihr/auth/templates).
U každé šablony přepište **Subject** a do **Message body** vložte celý obsah souboru.
Soubory jsou tady, aby se texty verzovaly a daly se porovnat s tím, co je v Supabase.

| Šablona v Supabase | Předmět | Soubor |
| --- | --- | --- |
| Confirm sign up | Potvrďte svůj e-mail | `potvrzeni-registrace.html` |
| Invite user | Přístup do aplikace Poradce do kapsy | `pozvanka.html` |
| Magic link | Přihlášení do aplikace | `prihlasovaci-odkaz.html` |
| Change email address | Potvrďte novou e-mailovou adresu | `zmena-emailu.html` |
| Reset password | Nastavení hesla | `nastaveni-hesla.html` |
| Reauthentication | Váš ověřovací kód | `overovaci-kod.html` |
| Password changed *(Security notifications)* | Heslo k vašemu účtu bylo změněno | `heslo-zmeneno.html` |
| Email address changed *(Security notifications)* | E-mail u vašeho účtu byl změněn | `email-zmenen.html` |

Upozornění v sekci Security notifications se posílají, jen když je u nich zapnutý přepínač.

## Proč odkazy nevedou na `{{ .ConfirmationURL }}`

Odkazy míří na mezistránku `/auth/potvrzeni` s `token_hash`. Tlačítko na ní odešle
POST na `/auth/confirm`, který token ověří na serveru (`verifyOtp`).

- **Funguje na jakémkoli zařízení.** Výchozí odkaz s `?code=` (PKCE) potřebuje klíč
  uložený v prohlížeči, kde si člověk o e-mail řekl – obnova hesla vyžádaná na počítači
  a otevřená v mobilu by hlásila neplatný odkaz.
- **Skenery pošty token nespotřebují.** Microsoft Safe Links a podobné služby odkazy
  otevírají předem. Mezistránka nic neověřuje, dokud člověk neklikne.

Předpoklad: **Site URL** v [URL Configuration](https://supabase.com/dashboard/project/riyxkbylqdimksbtxihr/auth/url-configuration)
je `https://poradcedokapsy.cz` – odkazy se skládají z `{{ .SiteURL }}`.

## Parametry odkazu

- `type` – typ tokenu pro `verifyOtp`: `email` (registrace i přihlášení), `recovery`, `invite`, `email_change`
- `ucel` – jen text na mezistránce u `type=email`: `registrace` nebo `prihlaseni`
- `next` – kam po ověření; bez něj poradce na `/advisor`, klient na `/dashboard`

## Zásady textů

Podle doporučení Supabase pro doručitelnost: žádné obrázky ani reklamní věty, jeden odkaz,
krátký předmět bez emoji, platnost odkazu se neuvádí číslem (řídí ji nastavení
„Email OTP Expiration“, výchozí je hodina). Vykání, bez vykřičníků.
