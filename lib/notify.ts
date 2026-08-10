/**
 * Klientská notifikace poradci přes n8n webhook.
 * DB je vždy zdroj pravdy (zájem/dotaz se ukládá do Supabase) – webhook je
 * jen doručení zprávy. Když n8n neběží, nesmí to rozbít UX, ale nesmí to
 * být ani neviditelné: selhání logujeme do konzole.
 */
const WEBHOOK_URL = 'https://n8n.jevcakn8n.com/webhook/klient-zajem'

export function notifyAdvisor(payload: Record<string, unknown>): void {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
  })
    .then(res => {
      if (!res.ok) console.warn(`[n8n] notifikace poradci nedoručena: HTTP ${res.status}`)
    })
    .catch(() => {
      console.warn('[n8n] notifikace poradci nedoručena – webhook nedostupný (zájem je ale uložen v databázi)')
    })
}
