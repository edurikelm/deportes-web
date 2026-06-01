'use client'

import Image from 'next/image'
import type { Match, SportConfig } from '@/lib/types'
import { FOOTBALL_CONFIG } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface ScoreDisplayProps {
  match: Match
  sportConfig?: SportConfig
}

export function ScoreDisplay({ match, sportConfig = FOOTBALL_CONFIG }: ScoreDisplayProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isUpcoming = match.status === 'upcoming'
  const isBasketball = sportConfig.sport === 'basketball'

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
        </div>
      </div>
    </div>
  )
}
