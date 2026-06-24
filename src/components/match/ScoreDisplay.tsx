'use client'

import Image from 'next/image'
import type { Match, MatchEvent, SportConfig, Team } from '@/lib/types'
import { FOOTBALL_CONFIG } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface ScoreDisplayProps {
  match: Match
  sportConfig?: SportConfig
}

interface TeamColumnProps {
  team: Team
  scorers: string[]
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

function TeamColumn({ team, scorers }: TeamColumnProps) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-16 sm:w-16">
        <Image
          src={team.logo}
          alt={team.name}
          fill
          sizes="(max-width: 640px) 44px, 64px"
          className="object-contain p-1"
        />
      </div>
      <span className="mt-2 max-w-full truncate text-center text-xs font-semibold text-white sm:text-sm">
        {team.shortName || team.name}
      </span>
      {scorers.length > 0 && (
        <div className="mt-1 max-w-full space-y-0.5 text-center text-[10px] text-[#9a9a9a] sm:text-xs">
          {scorers.map((scorer) => (
            <span key={scorer} className="block break-words">
              {scorer}
            </span>
          ))}
        </div>
      )}
    </div>
  )
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
    <div className="w-full">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-2 sm:items-center sm:gap-x-6">
        <TeamColumn team={match.homeTeam} scorers={homeScorers} />

        <div className="flex min-w-0 flex-col items-center px-1 sm:px-8">
          {isUpcoming ? (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white sm:text-4xl">
                vs
              </span>
              <span className="mt-2 text-xs text-[#a1a1a1] sm:text-sm">
                {clock.formatted}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1 sm:gap-3">
                <span className="font-mono text-4xl font-bold text-white sm:text-5xl">
                  {match.score?.home ?? 0}
                </span>
                <span className="select-none font-mono text-2xl text-[#666] sm:text-3xl">-</span>
                <span className="font-mono text-4xl font-bold text-white sm:text-5xl">
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
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                  {match.score.quarters.map((q, i) => (
                    <span key={i} className="rounded bg-[#262626] px-1.5 py-0.5 text-[10px] text-[#a1a1a1] sm:px-2 sm:text-xs">
                      C{i + 1} {q.home}-{q.away}
                    </span>
                  ))}
                </div>
              )}

              {isLive && (
                <span className="mt-2 text-base font-semibold text-[#ef4444] sm:text-lg">
                  {clock.formatted}
                </span>
              )}

              {isFinished && (
                <span className="mt-2 text-xs text-[#22c55e] sm:text-sm">{clock.formatted}</span>
              )}
            </div>
          )}
        </div>

        <TeamColumn team={match.awayTeam} scorers={awayScorers} />
      </div>
    </div>
  )
}
