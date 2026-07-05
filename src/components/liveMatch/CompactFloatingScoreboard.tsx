'use client'

import { useRef, useState, useEffect } from 'react'
import { clsx } from 'clsx'
import type { Match, MatchEvent, Team } from '@/lib/types'
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

const FOOTBALL_SCORER_TYPES = new Set(['goal', 'own_goal', 'penalty'])

function getLatestScoreEvent(events: MatchEvent[]): MatchEvent | undefined {
  const filtered = events.filter((e) => SCORE_EVENT_TYPES.has(e.type))
  if (filtered.length === 0) return undefined
  return filtered.reduce((latest, e) => (e.minute > latest.minute ? e : latest))
}

function getScorersByTeam(match: Match) {
  if (match.sport !== 'football') {
    return { home: [], away: [] }
  }

  const { events } = match
  const scorers = events.filter((e) => FOOTBALL_SCORER_TYPES.has(e.type))
  return {
    home: scorers.filter((e) => e.team === 'home').sort((a, b) => a.minute - b.minute),
    away: scorers.filter((e) => e.team === 'away').sort((a, b) => a.minute - b.minute),
  }
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

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function TeamLogo({ team }: { team: Team }) {
  const hasLogo = team.logo && team.logo.trim().length > 0

  if (hasLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logo}
        alt={`${team.name} logo`}
        className="h-6 w-6 shrink-0 rounded-full object-contain"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={`${team.name} logo`}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#27272a] text-[10px] font-bold text-[#a1a1aa]"
    >
      {getInitials(team.name)}
    </div>
  )
}

function ScorerList({ events }: { events: MatchEvent[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {events.map((event, index) => (
        <div key={`${event.player ?? 'event'}-${event.type}-${event.minute}-${index}`} className="leading-tight">
          <span className="text-[#a1a1aa]">{event.player ?? '\u2014'}</span>
          <span className="text-[#71717a]"> {event.minute}{'\u0027'}</span>
        </div>
      ))}
    </div>
  )
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
  const homeScore = match.score?.home
  const awayScore = match.score?.away

  useEffect(() => {
    const currentScore =
      homeScore !== undefined || awayScore !== undefined
        ? { home: homeScore ?? 0, away: awayScore ?? 0 }
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
  }, [homeScore, awayScore])

  const latestEvent = getLatestScoreEvent(match.events)
  const scorers = getScorersByTeam(match)
  const hasScorers = scorers.home.length > 0 || scorers.away.length > 0

  const clockDisplay = isFinished ? 'FT' : clock.formatted

  return (
    <div
      className={clsx(
        'flex w-[360px] flex-col gap-1 rounded-lg p-3 text-white',
        isFinished ? 'bg-[#18181b]' : 'bg-[#09090b]',
      )}
    >
      <div className="flex items-center justify-between text-xs text-[#71717a]">
        <span className="truncate">
          {match.league.name} {'\u00B7'} {match.league.country}
        </span>
        <span
          className={clsx(
            'shrink-0 font-semibold',
            isFinished ? 'text-[#22c55e]' : 'text-[#ef4444]',
          )}
          aria-label={isFinished ? 'Partido finalizado' : 'En vivo'}
        >
          {clockDisplay}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamLogo team={match.homeTeam} />
          <span className="truncate text-sm font-medium text-white">
            {match.homeTeam.name}
          </span>
        </div>

        <div className="flex shrink-0 items-baseline gap-1.5">
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

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-medium text-white">
            {match.awayTeam.name}
          </span>
          <TeamLogo team={match.awayTeam} />
        </div>
      </div>

      {hasScorers ? (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <ScorerList events={scorers.home} />
          <ScorerList events={scorers.away} />
        </div>
      ) : (
        <div className="text-xs text-[#71717a]">
          {latestEvent
            ? formatEventDescription(latestEvent)
            : `Actualizado ${formatTime(lastUpdated ?? new Date())}`}
        </div>
      )}
    </div>
  )
}
