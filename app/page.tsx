import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import InlineLogin from '@/components/auth/InlineLogin'

const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Bez schůzek',
    desc: 'Celý proces od A do Z online. Žádné cestování, žádné čekání v kanceláři.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Osobní návrh do 48h',
    desc: 'Certifikovaný poradce připraví návrh přesně pro vaši životní situaci.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Přímý chat s poradcem',
    desc: 'Kdykoli máte dotaz, napište přímo poradci přes chat. Odpověď do 24 hodin.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Bezpečné a důvěrné',
    desc: 'Vaše data jsou chráněna a nikdy neposkytnuty třetím stranám bez vašeho souhlasu.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Bez závazků',
    desc: 'Návrh si v klidu prostudujete. Rozhodnutí je vždy jen na vás.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
  { icon: '🛡️', title: 'Zajištění příjmů', desc: 'Ochrana vašeho příjmu a životní úrovně' },
  { icon: '🏖️', title: 'Příprava na penzi', desc: 'Klidný důchod s příspěvkem od státu' },
  { icon: '🏠', title: 'Pojištění majetku', desc: 'Ochrana vašeho domova a věcí' },
  { icon: '📈', title: 'Investování', desc: 'Nechte peníze pracovat za vás' },
  { icon: '🔑', title: 'Hypotéka', desc: 'Financování vlastního bydlení' },
]

export default async function HomePage() {
  // Pokud přihlášen → přesměruj na dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.user_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f2d52 0%, #1a4170 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Poradce do kapsy</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#jak-to-funguje" className="hidden sm:block text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
              Jak to funguje
            </a>
            <a href="#prihlaseni" className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Přihlásit se
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4" style={{ background: 'linear-gradient(160deg, #f8faff 0%, #ffffff 60%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border" style={{ background: '#f0f7ff', borderColor: '#c3dafe', color: '#1e40af' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Certifikovaný poradce OVB Allfinanz
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6" style={{ color: '#0f172a' }}>
            Finanční poradenství{' '}
            <span style={{ color: '#0f2d52' }}>bez kompromisů</span>
            <br />
            <span className="text-4xl md:text-5xl" style={{ color: '#1a4170' }}>přímo z vašeho telefonu</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Vyplňte dotazník, dostanete osobní návrh pojištění, penzijního spoření nebo investic — bez schůzek, bez závazků, zcela zdarma.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-2xl text-white text-base transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #0f2d52 0%, #1a4170 100%)' }}
            >
              Začít dotazník zdarma →
            </Link>
            <a
              href="#jak-to-funguje"
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-2xl text-slate-700 text-base border border-slate-200 hover:bg-slate-50 transition-all text-center"
            >
              Jak to funguje?
            </a>
          </div>
          <p className="text-sm text-slate-400 mt-4">Dotazník zabere ~3 minuty · Bez závazků · Zdarma</p>
        </div>

        {/* Mockup */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-4 bg-slate-700 rounded-lg px-3 py-1 text-xs text-slate-400">
                poradce-do-kapsy.cz/dashboard
              </div>
            </div>
            <div className="bg-slate-50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="h-5 w-32 bg-slate-800 rounded-md mb-1.5"></div>
                  <div className="h-3 w-24 bg-slate-300 rounded"></div>
                </div>
                <div className="w-14 h-14 rounded-full" style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96a)' }}></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['Pojištění', 'Důchod', 'Investice'].map(t => (
                  <div key={t} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <div className="h-3 w-12 bg-slate-200 rounded mb-2"></div>
                    <div className="h-5 w-8 rounded-full bg-blue-100"></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="h-3 w-20 bg-slate-200 rounded mb-3"></div>
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <div className="h-3 flex-1 bg-slate-100 rounded"></div>
                      <div className="h-3 w-12 bg-slate-100 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefity */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Proč Poradce do kapsy?</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Moderní přístup k finančnímu poradenství s důrazem na váš komfort</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white" style={{ background: 'linear-gradient(135deg, #0f2d52, #1a4170)' }}>
                  {b.icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Produkty */}
      <section className="px-4 py-20" style={{ background: 'linear-gradient(160deg, #0f2d52, #1a4170)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">S čím vám pomůžeme</h2>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">Komplexní finanční poradenství pod jednou střechou</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCTS.map(p => (
              <div key={p.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all text-center">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-semibold text-white text-base mb-2">{p.title}</h3>
                <p className="text-blue-200 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section id="jak-to-funguje" className="px-4 py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Jak to funguje?</h2>
            <p className="text-slate-500 text-lg">Čtyři jednoduché kroky k vašemu finančnímu plánu</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {STEPS.map(step => (
              <div key={step.num} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-black leading-none shrink-0 mt-0.5" style={{ color: '#d4a843' }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{step.title}</h3>
                    <p className="text-slate-500 text-sm mb-3">{step.desc}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Statistiky */}
      <section className="px-4 py-16 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-black mb-2" style={{ color: '#0f2d52' }}>48h</div>
              <div className="text-slate-500 text-sm">Průměrná doba přípravy návrhu</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2" style={{ color: '#0f2d52' }}>100%</div>
              <div className="text-slate-500 text-sm">Bezplatné poradenství</div>
            </div>
            <div>
              <div className="text-4xl font-black mb-2" style={{ color: '#0f2d52' }}>OVB</div>
              <div className="text-slate-500 text-sm">Certifikovaný poradce Allfinanz</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PŘIHLÁŠENÍ / CTA ===== */}
      <section id="prihlaseni" className="px-4 py-20" style={{ background: 'linear-gradient(135deg, #0a2040 0%, #0f2d52 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Levá strana — text */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Přihlaste se nebo začněte zdarma
              </h2>
              <p className="text-blue-200 leading-relaxed mb-6">
                Máte již účet? Přihlaste se přes e-mail. Nový klient? Vyplňte dotazník a dostanete osobní návrh do 48 hodin.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96a)', color: '#0f2d52' }}
              >
                Začít dotazník zdarma →
              </Link>
            </div>

            {/* Pravá strana — login box */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-1">Přihlásit se do účtu</h3>
              <p className="text-blue-300 text-sm mb-5">Zadejte e-mail a my vám pošleme přihlašovací odkaz</p>
              <InlineLogin />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0f2d52' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-700 text-sm">Poradce do kapsy</span>
          </div>
          <span className="text-sm text-slate-400">© 2025 · Certifikovaný poradce OVB Allfinanz</span>
        </div>
      </footer>
    </div>
  )
}
