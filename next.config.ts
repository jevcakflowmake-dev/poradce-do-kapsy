import type { NextConfig } from 'next'

/**
 * Bezpečnostní hlavičky pro všechny stránky i API.
 *
 * CSP je schválně jen ta obranná část: kdo nás smí vložit do rámu, kam
 * smějí mířit formuláře a <base>. Tím se zavírá clickjacking – přehled
 * klienta vložený do cizí stránky pod průhlednou vrstvu, kde by klient
 * nevědomky klikal na „Poslat poradci“. Plná CSP včetně skriptů by
 * potřebovala nonce v proxy a hlídání každé nové knihovny.
 *
 * HSTS tu není: Vercel ho posílá sám a includeSubDomains/preload by
 * zavázaly i subdomény, o kterých tahle aplikace nerozhoduje.
 */
const bezpecnostniHlavicky = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  // Pro starší prohlížeče, které frame-ancestors neznají.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Cizí web (třeba odkaz na hlášení pojistné události) uvidí jen doménu, ne adresu s ID klienta.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  // Neprozrazovat, na čem web běží.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: bezpecnostniHlavicky }]
  },
}

export default nextConfig
