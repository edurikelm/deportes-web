'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Trophy, Circle, Swords, ChevronDown, ChevronRight, Pin, Radio, Search } from 'lucide-react'
import { SPORT_PAGE_CONFIGS } from '@/lib/sportPageConfig'
import { usePinnedLeagues } from '@/hooks/usePinnedLeagues'
import type { Sport } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/', label: 'Futbol', icon: Trophy },
  { href: '/basketball', label: 'Basquet', icon: Circle },
  { href: '/mma', label: 'MMA', icon: Swords },
] as const

const HREF_TO_SPORT: Record<string, Sport> = {
  '/': 'football',
  '/basketball': 'basketball',
  '/mma': 'mma',
}

type SidebarContentProps = {
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeLeagueId = searchParams.get('liga')

  const pinnedFutbol = usePinnedLeagues('football')
  const pinnedBasquet = usePinnedLeagues('basketball')
  const pinnedMma = usePinnedLeagues('mma')

  const PINNED_MAP: Record<string, { pinnedIds: string[]; togglePin: (id: string) => void; isPinned: (id: string) => boolean }> = {
    '/': pinnedFutbol,
    '/basketball': pinnedBasquet,
    '/mma': pinnedMma,
  }

  const [expandedSports, setExpandedSports] = useState<Set<string>>(() => {
    const activeSportHref = NAV_ITEMS.find(
      (item) => pathname === item.href
    )?.href
    return new Set(activeSportHref ? [activeSportHref] : ['/'])
  })

  const toggleSport = (href: string) => {
    setExpandedSports((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 pb-6 pt-6">
        <span className="text-lg font-bold text-white">
          Live<span className="text-[#ef4444]">Scores</span>
        </span>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const sport = HREF_TO_SPORT[item.href]
            const config = SPORT_PAGE_CONFIGS[sport]
            const { pinnedIds, togglePin, isPinned } = PINNED_MAP[item.href]
            const isExpanded = expandedSports.has(item.href)
            const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

            const pinnedLeagues = config.leagues.filter((l) => isPinned(l.id))
            const unpinnedLeagues = config.leagues.filter((l) => !isPinned(l.id))
            const sortedPinned = [...pinnedLeagues].sort(
              (a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id)
            )
            const allLeagues = [...sortedPinned, ...unpinnedLeagues]

            const hasPinned = sortedPinned.length > 0

            return (
              <li key={item.href}>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    toggleSport(item.href)
                    onNavigate?.()
                  }}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-2 border-[#22c55e] bg-[#1a1a1a] text-white'
                      : 'border-l-2 border-transparent text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronIcon className="h-4 w-4 shrink-0" />
                </button>
                {isExpanded && (
                  <ul className="ml-2 mt-1 space-y-0.5 border-l border-[#1a1a1a] pl-2">
                    {allLeagues.map((league, idx) => {
                      const isActiveLeague = activeLeagueId === league.id
                      const isPinnedLeague = isPinned(league.id)
                      const isFirstUnpinned = hasPinned && idx === sortedPinned.length && idx > 0
                      const baseHref = item.href === '/' ? '' : item.href
                      return (
                        <li key={league.id}>
                          {isFirstUnpinned && (
                            <div className="my-1 border-t border-[#1a1a1a]" />
                          )}
                          <div
                            className={`group flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
                              isActiveLeague
                                ? 'bg-[#1a1a1a] text-white'
                                : 'text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                togglePin(league.id)
                              }}
                              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label={isPinnedLeague ? `Desfijar ${league.name}` : `Fijar ${league.name}`}
                            >
                              {isPinnedLeague ? (
                                <Pin className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Pin className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <Link
                              href={`${baseHref}/?liga=${league.id}`}
                              onClick={onNavigate}
                              className="min-w-0 flex-1"
                            >
                              <span className="truncate block">{league.name}</span>
                            </Link>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        <hr className="mx-3 my-4 border-[#1a1a1a]" />

        <ul className="space-y-1 px-3">
          <li>
            <Link
              href="/live"
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/live'
                  ? 'border-l-2 border-[#22c55e] bg-[#1a1a1a] text-white'
                  : 'border-l-2 border-transparent text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <Radio className="h-5 w-5" />
              <span>En vivo</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="flex h-2 w-2 rounded-full bg-[#ef4444] animate-pulse-live" />
                <span className="rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  3
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/search"
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/search'
                  ? 'border-l-2 border-[#22c55e] bg-[#1a1a1a] text-white'
                  : 'border-l-2 border-transparent text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <Search className="h-5 w-5" />
              Buscar
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
