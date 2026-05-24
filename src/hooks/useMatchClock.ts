import { useState, useEffect, useRef } from 'react'
import type { Match } from '@/lib/types'
import { computeClock, type MatchClock } from '@/lib/clock/computeClock'

export function useMatchClock(
  match: Match,
  lastFetchTimestamp?: number
): MatchClock {
  const [clock, setClock] = useState<MatchClock>(() =>
    computeClock(match, Date.now(), lastFetchTimestamp)
  )

  const prevFetchRef = useRef(lastFetchTimestamp)

  useEffect(() => {
    if (match.status === 'finished') return

    const fetchChanged = prevFetchRef.current !== lastFetchTimestamp
    prevFetchRef.current = lastFetchTimestamp

    if (fetchChanged) {
      setClock(computeClock(match, Date.now(), lastFetchTimestamp))
    }

    const interval = setInterval(() => {
      setClock(computeClock(match, Date.now(), lastFetchTimestamp))
    }, 30000)

    return () => clearInterval(interval)
  }, [match, lastFetchTimestamp])

  return clock
}
