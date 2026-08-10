/**
 * Má prohlížeč zapnuté omezení animací?
 *
 * GSAP animuje inline styly, takže samotné CSS `@media (prefers-reduced-motion)`
 * ho nezastaví – a co hůř, `gsap.from({ opacity: 0 })` by při vypnutém tweenu
 * nechalo obsah neviditelný. Proto se ptáme v JS a animaci rovnou nespustíme;
 * prvky zůstanou ve finálním stavu, tedy vidět.
 *
 * Na serveru vrací false (nemáme se koho zeptat) – první render tak odpovídá
 * výchozímu stavu a hydratace nic nerozhodí.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
