'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pole } from '@/components/advisor/PoleFormulare'

/**
 * Ruční založení klienta – pro stávající klienty, kteří se do aplikace sami
 * neregistrovali. Účet vznikne bez hesla. Pozvánku s odkazem na nastavení
 * hesla může poradce poslat hned, nebo později z detailu klienta.
 */
const schema = z.object({
  full_name: z.string().trim().min(2, 'Vyplňte jméno a příjmení.').max(100, 'Jméno je moc dlouhé.'),
  email: z.string().trim().email('Zadejte platný e-mail, třeba jan.novak@seznam.cz.'),
  phone: z
    .string()
    .trim()
    .refine((v) => !v || v.replace(/\D/g, '').length >= 9, 'Telefonní číslo musí mít aspoň 9 číslic.'),
  pozvat: z.boolean(),
})

type Formular = z.infer<typeof schema>

export default function NovyKlientForm() {
  const id = useId()
  const router = useRouter()
  const [chyba, setChyba] = useState<{ text: string; existuje?: boolean } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formular>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { full_name: '', email: '', phone: '', pozvat: false },
  })

  async function odeslat(data: Formular) {
    setChyba(null)
    try {
      const res = await fetch('/api/advisor/klienti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.id) {
        setChyba({ text: payload.error ?? 'Klienta se nepodařilo založit.', existuje: res.status === 409 })
        return
      }
      router.push(`/advisor/${payload.id}?novy=${payload.pozvan ? 'pozvan' : '1'}`)
    } catch {
      setChyba({ text: 'Chyba připojení. Zkuste to prosím znovu.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(odeslat)} noValidate className="space-y-5">
      {/* autoComplete off: prohlížeč by jinak nabízel údaje poradce, ne klienta. */}
      <Pole id={`${id}-jmeno`} popisek="Jméno a příjmení" chyba={errors.full_name?.message}>
        <Input
          id={`${id}-jmeno`}
          aria-describedby={`${id}-jmeno-popis`}
          autoComplete="off"
          {...register('full_name')}
          aria-invalid={errors.full_name ? true : undefined}
        />
      </Pole>
      <Pole
        id={`${id}-email`}
        popisek="E-mail"
        napoveda="Na něj klientovi půjde odkaz na nastavení hesla a upozornění z aplikace."
        chyba={errors.email?.message}
      >
        <Input
          id={`${id}-email`}
          aria-describedby={`${id}-email-popis`}
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          {...register('email')}
          aria-invalid={errors.email ? true : undefined}
        />
      </Pole>
      <Pole id={`${id}-telefon`} popisek="Telefon (nepovinné)" chyba={errors.phone?.message}>
        <Input
          id={`${id}-telefon`}
          aria-describedby={`${id}-telefon-popis`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          {...register('phone')}
          aria-invalid={errors.phone ? true : undefined}
        />
      </Pole>

      <label htmlFor={`${id}-pozvat`} className="flex items-start gap-3 rounded-card border border-line bg-cream p-4 cursor-pointer">
        <input
          id={`${id}-pozvat`}
          type="checkbox"
          {...register('pozvat')}
          className="mt-1 w-4 h-4 shrink-0 rounded border-line accent-mint"
        />
        <span>
          <span className="block text-base font-medium text-navy">Poslat klientovi rovnou pozvánku</span>
          <span className="block mt-1 text-sm text-slate text-pretty">
            E-mail „Máte připravený přístup“ s odkazem na nastavení hesla. Když ho nepošlete teď, pošlete ho později
            z detailu klienta – třeba až bude plán hotový.
          </span>
        </span>
      </label>

      {chyba && (
        <p role="alert" className="rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
          {chyba.text}
          {chyba.existuje && (
            <>
              {' '}
              <Link href="/advisor" className="font-semibold underline underline-offset-4">
                Seznam klientů
              </Link>
            </>
          )}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Zakládám…
          </>
        ) : (
          'Založit klienta'
        )}
      </Button>
    </form>
  )
}
