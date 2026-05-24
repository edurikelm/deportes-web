'use client'
import { clsx } from 'clsx'
import type { Match } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface MatchTimeProps {
  match: Match
  className?: string
}

export function MatchTime({ match, className }: MatchTimeProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)

  return <span className={clsx(className)}>{clock.formatted}</span>
}
