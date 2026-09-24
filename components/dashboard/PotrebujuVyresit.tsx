'use client'

import { useCallback, useId, useState } from 'react'
import Link from 'next/link'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, LifeBuoy, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/**
 * „Potřebuju něco vyřešit“ na přehledu: klient vybere, čeho se věc týká,
 * připíše pár slov a zpráva odejde poradci do chatu.
 *
 * Schválně žádná nová schránka. Je to obyčejná zpráva v chatu, takže ji
 * poradce najde tam, kde s klientem mluví, i s počtem nepřečtených u klienta.
 * Formulář jen pomáhá začít: prázdné okno chatu nutí vymýšlet první větu,
 * výběr tématu ne. Zavřený zabere jeden řádek, aby přehled nezahltil.
 */

/**
 * Oblasti analýzy a plánu pod názvy, jak je klient zná z plánu. Navíc
 * pojistná událost – nejčastější důvod, proč se klient po podpisu ozve –
 * a „Něco jiného“, aby výběr nikoho nezastavil.
 */
const TEMATA = [
  'Pojistná událost',
  'Zajištění příjmů',
  'Bydlení',
  'Příprava na důchod',
  'Děti',
  'Investice',
  'Pojištění majetku',
  'Něco jiného',
] as const

const schema = z
  .object({
    temata: z.array(z.enum(TEMATA)),
    zprava: z.string().trim().max(2000, 'Zpráva je moc dlouhá. Zkraťte ji prosím, zbytek probereme v chatu.'),
  })
  .refine((d) => d.temata.length > 0 || d.zprava.length > 0, {
    message: 'Vyberte, čeho se to týká, nebo napište pár slov.',
    path: ['temata'],
  })

type Formular = z.infer<typeof schema>

/** Zpráva v chatu: témata na prvním řádku, pod nimi slova klienta. */
function textZpravy({ temata, zprava }: Formular): string {
  const radky: string[] = []
  if (temata.length > 0) radky.push(`Potřebuju vyřešit: ${temata.join(', ')}`)
  if (zprava) radky.push(zprava)
  return radky.join('\n\n')
}

export default function PotrebujuVyresit({ clientId }: { clientId: string }) {
  const [otevreno, setOtevreno] = useState(false)
  const [odeslano, setOdeslano] = useState(false)
  const [chybaOdeslani, setChybaOdeslani] = useState(false)
  const idPanelu = useId()
  const idZpravy = useId()
  const idNapovedy = useId()
  const idChybyTemat = useId()
  const idChybyZpravy = useId()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Formular>({
    resolver: zodResolver(schema),
    defaultValues: { temata: [], zprava: '' },
  })
  const vybrana = useWatch({ control, name: 'temata' })

  // Potvrzení převezme fokus, jinak by po zmizení formuláře zůstal viset na
  // stránce a čtečka by o odeslání mlčela.
  const zaostri = useCallback((el: HTMLDivElement | null) => el?.focus(), [])

  async function odeslat(data: Formular) {
    setChybaOdeslani(false)
    const { error } = await createClient().from('messages').insert({
      client_id: clientId,
      sender_role: 'client',
      content: textZpravy(data),
    })
    if (error) {
      setChybaOdeslani(true)
      return
    }
    reset()
    setOdeslano(true)
  }

  function prepni() {
    // Po odeslání má další otevření začít čistým formulářem, ne starou potvrzenkou.
    if (!otevreno) setOdeslano(false)
    setOtevreno(!otevreno)
  }

  return (
    <Card className="overflow-hidden">
      <h2>
        <button
          type="button"
          onClick={prepni}
          aria-expanded={otevreno}
          aria-controls={idPanelu}
          className="w-full flex items-center gap-4 p-5 md:p-6 text-left transition-colors hover:bg-cream/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40"
        >
          <span aria-hidden className="w-10 h-10 shrink-0 rounded-input bg-cream flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-navy" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lead text-navy">Potřebuju něco vyřešit</span>
            <span className="block text-base text-slate mt-0.5 text-pretty">
              Vyberte, čeho se to týká, a napište mi. Odpovím v chatu.
            </span>
          </span>
          <ChevronDown
            aria-hidden
            strokeWidth={1.8}
            className={`w-5 h-5 shrink-0 text-slate transition-transform duration-300 ${otevreno ? 'rotate-180 text-navy' : ''}`}
          />
        </button>
      </h2>

      <AnimatePresence initial={false}>
        {otevreno && (
          <motion.div
            id={idPanelu}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              <div className="pt-5 border-t border-line">
                {odeslano ? (
                  <div ref={zaostri} tabIndex={-1} className="focus:outline-none">
                    <p className="flex items-center gap-2 font-display text-lead text-navy">
                      <Check className="w-5 h-5 text-mint-dark" strokeWidth={2.5} aria-hidden />
                      Zpráva odešla
                    </p>
                    <p className="mt-1 text-base text-slate">Odpovím v chatu, obvykle do 24 hodin.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <Link href="/dashboard/chat" className={buttonVariants({ variant: 'outline' })}>
                        Otevřít chat <ArrowRight className="w-4 h-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOdeslano(false)}
                        className="text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                      >
                        Napsat další
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(odeslat)} noValidate>
                    <fieldset aria-describedby={errors.temata ? idChybyTemat : undefined}>
                      <legend className="text-base font-medium text-navy">Čeho se to týká</legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TEMATA.map((tema) => {
                          const vybrano = vybrana?.includes(tema) ?? false
                          return (
                            <label key={tema} className="cursor-pointer">
                              <input type="checkbox" value={tema} {...register('temata')} className="peer sr-only" />
                              {/* Vybrané téma pozná i ten, kdo nerozliší barvy: přibude fajfka. */}
                              <span
                                className={`inline-flex items-center gap-1.5 h-11 px-4 rounded-pill border text-base transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-mint/40 ${
                                  vybrano
                                    ? 'bg-navy border-navy text-cream'
                                    : 'bg-surface border-line text-navy hover:border-navy/40'
                                }`}
                              >
                                {vybrano && <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden />}
                                {tema}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                      {errors.temata && (
                        <p id={idChybyTemat} className="mt-2 text-base text-danger">
                          {errors.temata.message}
                        </p>
                      )}
                    </fieldset>

                    <div className="mt-5">
                      <Label htmlFor={idZpravy}>Zpráva</Label>
                      <textarea
                        id={idZpravy}
                        rows={4}
                        placeholder="Třeba: čekáme miminko a chci upravit pojištění."
                        aria-invalid={errors.zprava ? true : undefined}
                        aria-describedby={errors.zprava ? `${idNapovedy} ${idChybyZpravy}` : idNapovedy}
                        {...register('zprava')}
                        className="mt-2 w-full rounded-input border border-line bg-surface px-4 py-3 text-base text-navy placeholder:text-slate transition-colors resize-y focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
                      />
                      <p id={idNapovedy} className="mt-1.5 text-base text-slate">
                        Stačí pár slov, podrobnosti doladíme v chatu.
                      </p>
                      {errors.zprava && (
                        <p id={idChybyZpravy} className="mt-1.5 text-base text-danger">
                          {errors.zprava.message}
                        </p>
                      )}
                    </div>

                    {chybaOdeslani && (
                      <p role="alert" className="mt-4 text-base text-danger">
                        Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo mi napište rovnou do chatu.
                      </p>
                    )}

                    <Button type="submit" disabled={isSubmitting} className="mt-5">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Odesílám…
                        </>
                      ) : (
                        'Poslat poradci'
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
