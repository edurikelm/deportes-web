'use client'

import Image from 'next/image'
import type { League } from '@/lib/types'
import { getLeagueColor } from '@/lib/types'

interface LeagueBadgeProps {
  league: League
  compact?: boolean
}

export function LeagueBadge({ league, compact = false }: LeagueBadgeProps) {
  const color = getLeagueColor(league.name)

  if (compact) {
    return (
      <div className="relative h-6 w-6 overflow-hidden rounded">
        <Image
          src={league.logo}
          alt={league.name}
          fill
          sizes="24px"
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 w-4 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="relative h-6 w-6 overflow-hidden rounded">
        <Image
          src={league.logo}
          alt={league.name}
          fill
          sizes="24px"
          className="object-contain"
        />
      </div>
      <span className="text-sm font-medium text-white">{league.name}</span>
    </div>
  )
}
