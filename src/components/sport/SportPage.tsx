'use client'

import { useState, useCallback } from 'react'
import type { Match, Sport } from '@/lib/types'
import { SPORT_PAGE_CONFIGS } from '@/lib/sportPageConfig'
import { MatchListCompact, type MatchDateKey } from '@/components/match/MatchListCompact'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'
import { InlineSearch } from '@/components/search/InlineSearch'
import { useMatchPolling } from '@/hooks/useMatchPolling'
import { MatchClockProvider } from '@/components/match/MatchClockContext'
import { getTodayDateKey } from '@/lib/date'

interface SportPageProps {
  sport: Sport
}

export function SportPage({ sport }: SportPageProps) {
  const config = SPORT_PAGE_CONFIGS[sport]
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  const timeZone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'

  const [activeDate, setActiveDate] = useState<MatchDateKey>(() => getTodayDateKey(timeZone))

  const fetchMatches = useCallback(async () => {
    try {
      const apiUrl = new URL(config.apiEndpoint, window.location.origin)
      apiUrl.searchParams.set('date', activeDate)
      apiUrl.searchParams.set('timezone', timeZone)
      const res = await fetch(apiUrl.toString())
      const data = await res.json()
      setAllMatches(data.matches || [])
    } catch (error) {
      console.error(`Failed to fetch ${sport} matches:`, error)
    } finally {
      setLoading(false)
    }
  }, [config.apiEndpoint, sport, activeDate, timeZone])

  const { lastUpdated } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
    enabled: true,
    refreshKey: activeDate,
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {searchOpen ? (
        <InlineSearch
          matches={allMatches}
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
          />
        </MatchClockProvider>
      )}
    </div>
  )
}
