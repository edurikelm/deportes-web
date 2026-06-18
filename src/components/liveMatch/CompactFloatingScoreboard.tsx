'use client'

import { useRef, useState, useEffect } from 'react'
import { clsx } from 'clsx'
import type { Match, MatchEvent } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from '@/components/match/MatchClockContext'

interface CompactFloatingScoreboardProps {
  match: Match
  lastUpdated: Date | null
}

const SCORE_EVENT_TYPES = new Set([
  'goal', 'own_goal', 'penalty',
  'two_points', 'three_points', 'free_throw',
  'triple', 'two_pointer', 'freethrow',
  'knockout', 'submission', 'tko', 'decision',
])

function getLatestScoreEvent(events: MatchEvent[]): MatchEvent | undefined {
  const filtered = events.filter((e) => SCORE_EVENT_TYPES.has(e.type))
  if (filtered.length === 0) return undefined
  return filtered.reduce((latest, e) => (e.minute > latest.minute ? e : latest))
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatEventDescription(event: MatchEvent): string {
  const parts: string[] = []
  if (event.player) parts.push(event.player)
  parts.push(`${event.minute}'`)
  return parts.join(' ')
}

export function CompactFloatingScoreboard({
  match,
  lastUpdated,
}: CompactFloatingScoreboardProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)
  const isFinished = match.status === 'finished'

  const prevScoreRef = useRef<{ home: number; away: number } | null>(null)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    const currentScore = match.score
      ? { home: match.score.home, away: match.score.away }
      : null
    if (prevScoreRef.current && currentScore) {
      const changed =
        prevScoreRef.current.home !== currentScore.home ||
        prevScoreRef.current.away !== currentScore.away
      if (changed) {
        setPulsing(true)
        const timer = setTimeout(() => setPulsing(false), 600)
        prevScoreRef.current = currentScore
        return () => clearTimeout(timer)
      }
    }
    prevScoreRef.current = currentScore
  }, [match.score?.home, match.score?.away])

  const latestEvent = getLatestScoreEvent(match.events)

  const clockDisplay = isFinished ? 'FT' : clock.formatted

  return (
    <div
      className={clsx(
        'flex w-[360px] flex-col gap-0.5 rounded-lg p-3 text-white',
        isFinished ? 'bg-[#1a1a1a]' : 'bg-[#111]',
      )}
    >
      <div className="text-xs text-[#9a9a9a]">
        {match.league.name} {'\u00B7'} {match.league.country}
      </div>

      <div
        className={clsx(
          'text-sm font-semibold',
          isFinished ? 'text-[#22c55e]' : 'text-[#ef4444]',
        )}
      >
        {clockDisplay}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="max-w-[100px] truncate text-sm font-medium text-white">
          {match.homeTeam.name}
        </span>

        <div className="flex items-baseline gap-1.5">
          <span
            className={clsx(
              'font-mono text-3xl font-bold text-white transition-colors duration-300',
              pulsing && 'text-[#fbbf24]',
            )}
          >
            {match.score?.home ?? 0}
          </span>
          <span className="font-mono text-lg text-[#555]">-</span>
          <span
            className={clsx(
              'font-mono text-3xl font-bold text-white transition-colors duration-300',
              pulsing && 'text-[#fbbf24]',
            )}
          >
            {match.score?.away ?? 0}
          </span>
        </div>

        <span className="max-w-[100px] truncate text-right text-sm font-medium text-white">
          {match.awayTeam.name}
        </span>
      </div>

      <div className="mt-0.5 text-xs text-[#9a9a9a]">
        {latestEvent
          ? formatEventDescription(latestEvent)
          : `Actualizado ${formatTime(lastUpdated ?? new Date())}`}
      </div>
    </div>
  )
}
