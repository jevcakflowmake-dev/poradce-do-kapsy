import { Clock, Shield, TrendingUp } from 'lucide-react'

/**
 * Ikona druhu smlouvy – v Moje smlouvy u nadpisu skupiny a v dlaždici
 * smlouvy, když k ní není logo společnosti. Mimo 'use client' soubory, aby
 * ji mohl použít i přehled vykreslovaný na serveru.
 */
export const IKONA_DRUHU = {
  insurance: Shield,
  pension: Clock,
  invest: TrendingUp,
} as const
