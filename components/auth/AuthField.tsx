'use client'

import { useId } from 'react'
import { Input, type InputProps } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Pole přihlašovacích formulářů. Popisek je svázaný s polem přes `id`,
 * chybová hláška přes `aria-describedby` — čtečka ji přečte hned po popisku,
 * ne až když na ni uživatel náhodou narazí.
 */
export default function AuthField({
  label,
  error,
  inputProps,
}: {
  label: string
  error?: string
  inputProps: InputProps
}) {
  const id = useId()
  const chybaId = `${id}-chyba`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? chybaId : undefined}
      />
      {error && (
        <p id={chybaId} className="text-base text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
