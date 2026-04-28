'use client'

import Image from 'next/image'
import type { Match } from '@/lib/types'
import { LiveIndicator } from './LiveIndicator'
import { StatusBadge } from './StatusBadge'

interface MatchCardProps {
  match: Match
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export function MatchCard({ match }: MatchCardProps) {
  const accentColor = match.league.color

  return (
    <div className="group relative overflow-hidden rounded-xl bg-[#141414] border border-[#262626] transition-all duration-200 hover:border-[#404040]">
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#262626]">
          <div className="relative h-5 w-5 overflow-hidden rounded">
            <Image
              src={match.league.logo}
              alt={match.league.name}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="text-xs text-[#a1a1a1]">{match.league.name}</span>
          <StatusBadge status={match.status} minute={match.minute} />
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#1a1a1a]">
              <Image
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                width={48}
                height={48}
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="font-semibold text-white">
                {match.homeTeam.shortName || match.homeTeam.name}
              </p>
              <p className="text-xs text-[#666]">{match.homeTeam.name}</p>
            </div>
          </div>

          <div className="flex flex-col items-center px-6">
            {match.status !== 'upcoming' && match.score ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-white">
                    {match.score.home}
                  </span>
                  <span className="font-mono text-xl text-[#666]">-</span>
                  <span className="font-mono text-3xl font-bold text-white">
                    {match.score.away}
                  </span>
                </div>
                {match.status === 'live' && match.minute && (
                  <span className="mt-1 text-sm text-[#ef4444] font-medium">
                    {match.minute}'
                  </span>
                )}
              </>
            ) : (
              <span className="font-mono text-xl text-[#a1a1a1]">
                {formatTime(match.startTime)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <p className="font-semibold text-white">
                {match.awayTeam.shortName || match.awayTeam.name}
              </p>
              <p className="text-xs text-[#666]">{match.awayTeam.name}</p>
            </div>
            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#1a1a1a]">
              <Image
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                width={48}
                height={48}
                className="object-contain p-1"
              />
            </div>
          </div>
        </div>

        {match.status === 'live' && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-[#262626]">
            <LiveIndicator />
            <span className="text-xs text-[#666]">
              {match.streamLinks.length > 0 && match.streamLinks[0].name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
