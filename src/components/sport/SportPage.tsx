'use client'

import { useState, useCallback } from 'react'
import type { Match, Sport } from '@/lib/types'
import { SPORT_PAGE_CONFIGS } from '@/lib/sportPageConfig'
import { MatchListCompact, type DateOption } from '@/components/match/MatchListCompact'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'
import { InlineSearch } from '@/components/search/InlineSearch'
import { useMatchPolling } from '@/hooks/useMatchPolling'
import { MatchClockProvider } from '@/components/match/MatchClockContext'

interface SportPageProps {
  sport: Sport
}

export function SportPage({ sport }: SportPageProps) {
  const config = SPORT_PAGE_CONFIGS[sport]
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeDate, setActiveDate] = useState<DateOption>('today')
  const [includeAllLeagues, setIncludeAllLeagues] = useState(false)

  const getDateForOption = useCallback((option: DateOption) => {
    const date = new Date()
    if (option === 'yesterday') date.setDate(date.getDate() - 1)
    if (option === 'tomorrow') date.setDate(date.getDate() + 1)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const fetchMatches = useCallback(async () => {
    try {
      const apiUrl = new URL(config.apiEndpoint, window.location.origin)
      apiUrl.searchParams.set('date', getDateForOption(activeDate))
      if (includeAllLeagues) {
        apiUrl.searchParams.set('important', 'false')
      }
      const res = await fetch(apiUrl.toString())
      const data = await res.json()
      setAllMatches(data.matches || [])
    } catch (error) {
      console.error(`Failed to fetch ${sport} matches:`, error)
    } finally {
      setLoading(false)
    }
  }, [config.apiEndpoint, sport, activeDate, includeAllLeagues, getDateForOption])

  const { lastUpdated } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
    enabled: true,
    refreshKey: `${activeDate}-${includeAllLeagues}`,
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {searchOpen ? (
        <InlineSearch
          matches={allMatches}
          sport={sport}
          onClose={() => setSearchOpen(false)}
        />
      ) : loading ? (
        <div className="p-6">
          <MatchListSkeleton count={6} />
        </div>
      ) : (
        <MatchClockProvider lastFetchTimestamp={lastUpdated?.getTime()}>
          <MatchListCompact
            matches={allMatches}
            sport={sport}
            activeDate={activeDate}
            onDateChange={setActiveDate}
            includeAllLeagues={includeAllLeagues}
            onToggleAllLeagues={() => setIncludeAllLeagues((prev) => !prev)}
          />
        </MatchClockProvider>
      )}
    </div>
  )
}
