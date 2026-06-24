'use client'

import type { League, Sport } from '@/lib/types'
import Image from 'next/image'
import { Pin, PinOff, Table } from 'lucide-react'
import { STANDINGS_FEATURE_ENABLED } from '@/lib/standings'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  league: League
  isPinned: boolean
  onTogglePin: () => void
  sport: Sport
  onToggleStandings?: () => void
  standingsOpen?: boolean
}

export function SectionHeader({
  league,
  isPinned,
  onTogglePin,
  sport,
  onToggleStandings,
  standingsOpen,
}: SectionHeaderProps) {
  const showStandingsButton = STANDINGS_FEATURE_ENABLED && sport === 'football'

  return (
    <div
      data-testid="section-header"
      className="group flex items-center border-l-2 border-b border-[#1d1d1d] bg-[#101010] px-3 py-2.5 sm:px-4"
      style={{ borderLeftColor: league.color }}
    >
      <div className="flex flex-1 items-center gap-2.5">
        <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm">
          <Image src={league.logo} alt={league.name} fill sizes="16px" className="object-contain" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#fafafa]">{league.name}</div>
          <div className="text-xs text-[#8a8a8a]">{league.country}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showStandingsButton && (
          <button
            type="button"
            aria-label="Tabla"
            aria-pressed={standingsOpen}
            onClick={() => onToggleStandings?.()}
            className={cn(
              'rounded p-1 transition-colors hover:bg-[#262626]',
              standingsOpen ? 'text-[#22c55e]' : 'text-[#a1a1aa] opacity-60 group-hover:opacity-100'
            )}
          >
            <Table className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={isPinned ? `Desfijar ${league.name}` : `Fijar ${league.name}`}
          onClick={onTogglePin}
          className={cn(
            'rounded p-1 transition-colors hover:bg-[#262626]',
            isPinned ? 'text-[#22c55e]' : 'text-[#666] opacity-40 group-hover:opacity-100'
          )}
        >
          {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
