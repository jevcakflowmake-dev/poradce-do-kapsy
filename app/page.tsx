import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import InlineLogin from '@/components/auth/InlineLogin'
import HeroSection from '@/components/landing/HeroSection'

const BENEFITS = [
  {
    icon: '🏠',
    title: 'Bez schůzek',
    desc: 'Celý proces od A do Z online. Žádné cestování, žádné čekání v kanceláři.',
  },
  {
    icon: '📋',
    title: 'Osobní návrh do 48h',
    desc: 'Certifikovaný poradce připraví návrh přesně pro vaši životní situaci.',
  },
  {
    icon: '💬',
    title: 'Přímý chat s poradcem',
    desc: 'Kdykoli máte dotaz, napište přímo poradci přes chat. Odpověď do 24 hodin.',
  },
  {
    icon: '🔒',
    title: 'Bezpečné a důvěrné',
    desc: 'Vaše data jsou chráněna a nikdy neposkytnuty třetím stranám bez vašeho souhlasu.',
  },
  {
    icon: '✓',
    title: 'Bez závazků',
    desc: 'Návrh si v klidu prostudujete. Rozhodnutí je vždy jen na vás.',
  },
  {
    icon: '💰',
    title: '100% zdarma',
    desc: 'Poradenství neplatíte. Poradce je odměňován provizí od partnerů.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Vyplňte dotazník',
    desc: 'Krátký 4-krokový dotazník o vaší situaci. Zabere méně než 3 minuty.',
    detail: 'Věk, příjem, rodinná situace a finanční cíle',
  },
  {
    num: '02',
    title: 'Poradce připraví návrh',
    desc: 'Do 48 hodin obdržíte osobní finanční návrh šitý na míru.',
    detail: 'Pojištění, důchod nebo investice podle vašich potřeb',
  },
  {
    num: '03',
    title: 'Komunikujte přes chat',
    desc: 'Máte otázky? Pište poradci přímo přes chat. Bez čekání na termín.',
    detail: 'Odpověď zpravidla do 24 hodin',
  },
  {
    num: '04',
    title: 'Rozhodněte se',
    desc: 'Vše si v klidu prostudujete a rozhodnete se bez tlaku.',
    detail: 'Žádné závazky, žádný nátlak',
  },
]

const PRODUCTS = [
  { title: 'Zajištění příjmů', desc: 'Ochrana vašeho příjmu a životní úrovně', icon: '🛡️' },
  { title: 'Příprava na penzi', desc: 'Klidný důchod s příspěvkem od státu', icon: '🏖️' },
  { title: 'Pojištění majetku', desc: 'Ochrana vašeho domova a věcí', icon: '🏠' },
  { title: 'Investování', desc: 'Nechte peníze pracovat za vás', icon: '📈' },
  { title: 'Hypotéka', desc: 'Financování vlastního bydlení', icon: '🔑' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.user_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with particle animation */}
      <HeroSection />

      {/* Proč si vybrat nás — inspired by ProfiFP */}
      <section className="px-6 md:px-10 lg:px-16 xl:px-20 py-24 bg-white">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="w-16 h-1 bg-[#009EE2] mx-auto mb-6 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#162459' }}>
              Proč si vybrat nás?
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#818EAF' }}>
              Moderní přístup k finančnímu poradenství s důrazem na váš komfort
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div
                key={b.title}
                className="group p-7 rounded-2xl border border-slate-100 hover:border-[#009EE2]/30 hover:shadow-lg hover:shadow-[#009EE2]/5 transition-all bg-white"
              >
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#162459' }}>
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#818EAF' }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Služby — dark section inspired by ProfiFP */}
      <section id="sluzby" className="px-6 md:px-10 lg:px-16 xl:px-20 py-24" style={{ background: 'linear-gradient(160deg, #162459, #243471)' }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="w-16 h-1 bg-[#009EE2] mx-auto mb-6 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              V jakých službách vám pomůžeme?
            </h2>
            <p className="text-lg max-w-xl mx-auto text-blue-200/70">
              Komplexní finanční poradenství pod jednou střechou
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTS.map(p => (
              <div
                key={p.title}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 hover:border-[#009EE2]/30 transition-all"
              >
                <div className="text-4xl mb-5">{p.icon}</div>
                <h3 className="font-semibold text-white text-lg mb-2">{p.title}</h3>
                <p className="text-blue-200/60 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section id="jak-to-funguje" className="px-6 md:px-10 lg:px-16 xl:px-20 py-24" style={{ background: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="w-16 h-1 bg-[#009EE2] mx-auto mb-6 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#162459' }}>
              Jak to funguje?
            </h2>
            <p className="text-lg" style={{ color: '#818EAF' }}>
              Čtyři jednoduché kroky k vašemu finančnímu plánu
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(step => (
              <div key={step.num} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-5">
                  <div
                    className="text-3xl font-black leading-none shrink-0 mt-0.5"
                    style={{ color: '#009EE2' }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1.5" style={{ color: '#162459' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: '#818EAF' }}>
                      {step.desc}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#009EE2' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {step.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Přihlášení / CTA */}
      <section id="prihlaseni" className="px-6 md:px-10 lg:px-16 xl:px-20 py-24" style={{ background: 'linear-gradient(135deg, #0e1a3d 0%, #162459 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="w-16 h-1 bg-[#009EE2] mb-6 rounded-full" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Přihlaste se nebo začněte zdarma
              </h2>
              <p className="text-blue-200/60 leading-relaxed mb-8">
                Máte již účet? Přihlaste se přes e-mail. Nový klient? Vyplňte dotazník a dostanete osobní návrh do 48 hodin.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#009EE2]/20 text-white"
                style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
              >
                Začít dotazník zdarma →
              </Link>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-7">
              <h3 className="font-semibold text-white mb-1.5">Přihlásit se do účtu</h3>
              <p className="text-blue-300/60 text-sm mb-5">
                Zadejte e-mail a heslo
              </p>
              <InlineLogin />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 lg:px-16 xl:px-20 py-10 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#162459] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#162459' }}>
              Poradce do kapsy
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#818EAF' }}>
            <a href="#jak-to-funguje" className="hover:text-[#162459] transition-colors">Jak to funguje</a>
            <a href="#sluzby" className="hover:text-[#162459] transition-colors">Služby</a>
            <a href="#prihlaseni" className="hover:text-[#162459] transition-colors">Přihlášení</a>
          </div>
          <span className="text-sm" style={{ color: '#818EAF' }}>
            © 2025 · Certifikovaný poradce ProfiFP · OVB Allfinanz
          </span>
        </div>
      </footer>
    </div>
  )
}
