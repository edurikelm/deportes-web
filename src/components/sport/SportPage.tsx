'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Match, MatchStatus, Sport } from '@/lib/types'
import { SPORT_PAGE_CONFIGS } from '@/lib/sportPageConfig'
import { MatchList } from '@/components/match/MatchList'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'
import { SearchBar } from '@/components/search/SearchBar'
import { useMatchPolling } from '@/hooks/useMatchPolling'

type TabType = 'all' | MatchStatus

interface SportPageProps {
  sport: Sport
}

const TABS: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
]

interface MatchesResponse {
  matches: Match[]
  meta: {
    total: number
    cached: boolean
    cacheAge: number
  }
}

export function SportPage({ sport }: SportPageProps) {
  const config = SPORT_PAGE_CONFIGS[sport]

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLeagueId, setSearchLeagueId] = useState<string | undefined>()

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(config.apiEndpoint)
      const data: MatchesResponse = await res.json()
      setAllMatches(data.matches || [])
    } catch (error) {
      console.error(`Failed to fetch ${sport} matches:`, error)
    }
  }, [config.apiEndpoint, sport])

  const { lastUpdated } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
    enabled: activeTab !== 'upcoming',
  })

  useEffect(() => {
    fetchMatches().then(() => setLoading(false))
  }, [fetchMatches])

  const handleSearch = (query: string, leagueId?: string) => {
    setSearchQuery(query)
    setSearchLeagueId(leagueId)
  }

  const displayedMatches = useMemo(() => {
    let filtered = allMatches

    if (searchQuery.length >= 2) {
      filtered = filtered.filter(m =>
        m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (searchLeagueId) {
      filtered = filtered.filter(m => m.league.id === searchLeagueId)
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(m => m.status === activeTab)
    }

    return filtered
  }, [allMatches, searchQuery, searchLeagueId, activeTab])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              <span style={{ color: config.accentColor }}>{config.title}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#a1a1a1]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
              </span>
              <span>Live</span>
            </div>
            {lastUpdated && (
              <span className="text-xs text-[#666]">
                · {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="mb-4">
            <SearchBar onSearch={handleSearch} leagues={config.leagues} matches={allMatches} />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1a] text-[#a1a1a1] hover:bg-[#262626]'
                }`}
              >
                {tab.label}
                {tab.value === 'live' && (
                  <span
                    className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    {allMatches.filter(m => m.status === 'live').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <MatchListSkeleton count={6} />
        ) : (
          <MatchList matches={displayedMatches} />
        )}
      </div>
    </div>
  )
}
