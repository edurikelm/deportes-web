'use client'

import Image from 'next/image'
import type { Match, MatchEvent, SportConfig } from '@/lib/types'
import { FOOTBALL_CONFIG } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface ScoreDisplayProps {
  match: Match
  sportConfig?: SportConfig
}

const GOAL_TYPES = new Set(['goal', 'own_goal', 'penalty'])

function getPlayerName(player: unknown): string {
  if (typeof player === 'string') return player
  if (player && typeof player === 'object') {
    const p = player as Record<string, unknown>
    return (p.name || p.shortName || '') as string
  }
  return ''
}

function formatEventMinute(minute: unknown): string {
  if (typeof minute === 'number') return `${minute}'`
  if (minute && typeof minute === 'object') {
    const m = minute as Record<string, unknown>
    const elapsed = typeof m.elapsed === 'number' ? m.elapsed : 0
    const extra = typeof m.extra === 'number' ? m.extra : 0
    return `${elapsed + extra}'`
  }
  return ''
}

function getGoalScorers(events: MatchEvent[], team: 'home' | 'away'): string[] {
  return events
    .filter(e => GOAL_TYPES.has(e.type) && e.team === team && e.player)
    .sort((a, b) => a.minute - b.minute)
    .map(e => `${getPlayerName(e.player)} ${formatEventMinute(e.minute)}`.trim())
}

export function ScoreDisplay({ match, sportConfig = FOOTBALL_CONFIG }: ScoreDisplayProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isUpcoming = match.status === 'upcoming'
  const isBasketball = sportConfig.sport === 'basketball'

  const homeScorers = getGoalScorers(match.events, 'home')
  const awayScorers = getGoalScorers(match.events, 'away')

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-[#1a1a1a]">
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </div>
          <span className="mt-2 max-w-32 truncate text-center text-sm font-semibold text-white sm:max-w-44">
            {match.homeTeam.name}
          </span>
          {homeScorers.length > 0 && (
            <div className="mt-1 max-w-32 space-y-0.5 text-center text-xs text-[#9a9a9a] sm:max-w-44">
              {homeScorers.map((scorer) => (
                <span key={scorer} className="block break-words">
                  {scorer}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center px-8">
          {isUpcoming ? (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-white">
                vs
              </span>
              <span className="mt-2 text-sm text-[#a1a1a1]">
                {clock.formatted}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-5xl font-bold text-white">
                  {match.score?.home ?? 0}
                </span>
                <span className="font-mono text-3xl text-[#666]">-</span>
                <span className="font-mono text-5xl font-bold text-white">
                  {match.score?.away ?? 0}
                </span>
              </div>

              {match.score?.ht && !isBasketball && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[#262626] px-2 py-0.5 text-xs text-[#a1a1a1]">
                    PT {match.score.ht.home} - {match.score.ht.away}
                  </span>
                </div>
              )}

              {isBasketball && match.score?.quarters && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {match.score.quarters.map((q, i) => (
                    <span key={i} className="rounded bg-[#262626] px-2 py-0.5 text-xs text-[#a1a1a1]">
                      C{i + 1} {q.home}-{q.away}
                    </span>
                  ))}
                </div>
              )}

              {isLive && (
                <span className="mt-2 text-lg font-semibold text-[#ef4444]">
                  {clock.formatted}
                </span>
              )}

              {isFinished && (
                <span className="mt-2 text-sm text-[#22c55e]">{clock.formatted}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-[#1a1a1a]">
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          </div>
          <span className="mt-2 max-w-32 truncate text-center text-sm font-semibold text-white sm:max-w-44">
            {match.awayTeam.name}
          </span>
          {awayScorers.length > 0 && (
            <div className="mt-1 max-w-32 space-y-0.5 text-center text-xs text-[#9a9a9a] sm:max-w-44">
              {awayScorers.map((scorer) => (
                <span key={scorer} className="block break-words">
                  {scorer}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
