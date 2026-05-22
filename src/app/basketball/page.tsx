'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Match, MatchStatus, League } from '@/lib/types'
import { MatchList } from '@/components/match/MatchList'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'
import { SearchBar } from '@/components/search/SearchBar'
import { useMatchPolling } from '@/hooks/useMatchPolling'

type TabType = 'all' | MatchStatus

const TABS: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
]

const LEAGUES: League[] = [
  { id: '1', name: 'NBA', country: 'USA', logo: 'https://cdn.sofascore.com/images/league/logo/21894.png', color: '#C8102E' },
  { id: '2', name: 'EuroLeague', country: 'Europe', logo: 'https://cdn.sofascore.com/images/league/logo/3747.png', color: '#1E3566' },
  { id: '3', name: 'ACB', country: 'Spain', logo: 'https://cdn.sofascore.com/images/league/logo/3757.png', color: '#F0222A' },
  { id: '4', name: 'Lega Basket', country: 'Italy', logo: 'https://cdn.sofascore.com/images/league/logo/3797.png', color: '#0066B3' },
]

interface MatchesResponse {
  matches: Match[]
  meta: {
    total: number
    cached: boolean
    cacheAge: number
  }
}

export default function BasketballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches/basketball')
      const data: MatchesResponse = await res.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Failed to fetch basketball matches:', error)
    }
  }, [])

  const { lastUpdated } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
    enabled: activeTab !== 'upcoming',
  })

  useEffect(() => {
    fetchMatches().then(() => setLoading(false))
  }, [fetchMatches])

  const handleSearch = (query: string, date: string, leagueId?: string) => {
    let filtered = matches

    if (query.length >= 2) {
      filtered = filtered.filter(m =>
        m.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (leagueId) {
      filtered = filtered.filter(m => m.league.id === leagueId)
    }

    setMatches(filtered)
  }

  const filteredMatches = activeTab === 'all'
    ? matches
    : matches.filter(m => m.status === activeTab)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              Basket<span className="text-[#C8102E]">ball</span>
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
            <SearchBar onSearch={handleSearch} leagues={LEAGUES} matches={matches} />
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
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-xs text-white">
                    {matches.filter(m => m.status === 'live').length}
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
          <MatchList matches={filteredMatches} />
        )}
      </div>
    </div>
  )
}
