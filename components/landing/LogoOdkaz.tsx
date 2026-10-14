'use client'

import type { ComponentProps, MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Logo v hlavičce: odkaz na úvodní stránku.
 *
 * Na úvodní stránce samotné by Link nic neudělal – Next při přechodu na tutéž
 * stránku drží pozici, dokud je stránka vidět, a ta je vidět pořád. Tam proto
 * odjedeme nahoru k hero sami a z adresy smažeme kotvu sekce (#caste-dotazy…),
 * ať po obnovení stránky neskočí zpátky dolů. Klik s Ctrl/Cmd nechává
 * prohlížeči (nová záložka).
 */
export default function LogoOdkaz(props: Omit<ComponentProps<typeof Link>, 'href' | 'onClick'>) {
  const cesta = usePathname()

  function nahoru(e: MouseEvent<HTMLAnchorElement>) {
    if (cesta !== '/' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const plynule = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: plynule ? 'smooth' : 'auto' })
    if (window.location.hash) window.history.replaceState(null, '', `/${window.location.search}`)
  }

  return <Link href="/" onClick={nahoru} {...props} />
}
