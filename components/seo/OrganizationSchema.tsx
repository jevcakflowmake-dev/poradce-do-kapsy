import { PORADCE } from '@/lib/poradce'
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '@/lib/site'

/**
 * JSON-LD pro celý web. FinancialService místo obecné Organization – přesněji
 * popisuje obor a umožní Googlu zařadit web do finančních služeb. FAQPage
 * schema se sem záměrně nedává: Google rich results pro FAQ zrušil v 5/2026,
 * takže by bylo bez efektu.
 */
export default function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    email: PORADCE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Čížová 59',
      postalCode: '398 31',
      addressLocality: 'Čížová',
      addressCountry: 'CZ',
    },
    areaServed: 'CZ',
    founder: {
      '@type': 'Person',
      name: PORADCE.jmeno,
      image: absoluteUrl(PORADCE.fotka),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
