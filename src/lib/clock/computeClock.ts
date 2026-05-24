import type { Match } from '@/lib/types'

export interface MatchClock {
  formatted: string
  isDelayed: boolean
  countdownMinutes: number | null
}

const MAX_FOOTBALL_MINUTE = 120

const STATUS_LABELS: Record<string, string> = {
  HT: 'Entretiempo',
  ET: 'Tiempo Extra',
  BT: 'Descanso',
  INT: 'Interrumpido',
  SUSP: 'Suspendido',
  P: 'Penales',
}

export function computeClock(
  match: Match,
  now: number,
  lastFetchTimestamp?: number
): MatchClock {
  if (match.status === 'finished') {
    return { formatted: 'Finalizado', isDelayed: false, countdownMinutes: null }
  }

  if (match.status === 'upcoming') {
    const startTime = new Date(match.startTime).getTime()
    if (isNaN(startTime)) {
      return { formatted: '--:--', isDelayed: false, countdownMinutes: null }
    }

    const diff = startTime - now
    if (diff > 0) {
      const totalMinutes = Math.ceil(diff / 60000)
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60)
        const mins = totalMinutes % 60
        return { formatted: `En ${hours}h ${mins}m`, isDelayed: false, countdownMinutes: totalMinutes }
      }
      if (totalMinutes >= 1) {
        return { formatted: `En ${totalMinutes}m`, isDelayed: false, countdownMinutes: totalMinutes }
      }
    }

    const delayedMinutes = Math.floor(-diff / 60000)
    if (delayedMinutes < 180) {
      return { formatted: 'Retrasado', isDelayed: true, countdownMinutes: null }
    }
    return { formatted: 'Suspendido', isDelayed: false, countdownMinutes: null }
  }

  if (match.status === 'live') {
    const startTime = new Date(match.startTime).getTime()
    if (isNaN(startTime)) {
      return { formatted: '--:--', isDelayed: false, countdownMinutes: null }
    }

    if (match.statusDetail && STATUS_LABELS[match.statusDetail]) {
      const label = STATUS_LABELS[match.statusDetail]
      if (match.statusDetail === 'ET' && match.minute != null) {
        return { formatted: `${label} ${match.minute}'`, isDelayed: false, countdownMinutes: null }
      }
      return { formatted: label, isDelayed: false, countdownMinutes: null }
    }

    let displayMinute: number
    if (lastFetchTimestamp !== undefined) {
      displayMinute = (match.minute ?? 0) + Math.max(0, Math.floor((now - lastFetchTimestamp) / 60000))
    } else {
      displayMinute = match.minute ?? 0
    }

    if (match.sport === 'football') {
      displayMinute = Math.min(displayMinute, MAX_FOOTBALL_MINUTE)
    }

    return { formatted: `${displayMinute}'`, isDelayed: false, countdownMinutes: null }
  }

  return { formatted: 'Finalizado', isDelayed: false, countdownMinutes: null }
}
