'use client'

export default function HealthScore({ score }: { score: number }) {
  const isGood = score >= 70
  const isMid = score >= 40 && score < 70

  const ringColor = isGood ? '#22c55e' : isMid ? '#f59e0b' : '#ef4444'
  const bgColor = isGood ? '#f0fdf4' : isMid ? '#fffbeb' : '#fef2f2'
  const textColor = isGood ? '#15803d' : isMid ? '#b45309' : '#dc2626'
  const label = isGood ? 'Výborné' : isMid ? 'Dobré' : 'Začínáte'
  const sublabel = isGood ? 'Váš profil je v pořádku' : isMid ? 'Dobrý základ, prostor pro zlepšení' : 'Dokončete profil pro lepší skóre'

  const circumference = 2 * Math.PI * 40
  const dash = (score / 100) * circumference

  return (
    <div className="rounded-2xl p-5 flex items-center gap-5 border" style={{ background: bgColor, borderColor: ringColor + '30' }}>
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke={ringColor} strokeWidth="8" strokeOpacity="0.15" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={ringColor} strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color: textColor }}>{score}</span>
          <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.6 }}>/ 100</span>
        </div>
      </div>
      <div>
        <div className="text-lg font-bold" style={{ color: textColor }}>{label}</div>
        <div className="text-sm text-slate-600 mt-0.5">Skóre finančního zdraví</div>
        <div className="text-xs text-slate-400 mt-1">{sublabel}</div>
      </div>
    </div>
  )
}
