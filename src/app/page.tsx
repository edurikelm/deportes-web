'use client'

import { useState } from 'react'
import type { MatchStatus } from '@/lib/types'
import { MOCK_MATCHES } from '@/lib/mock-data'
import { MatchList } from '@/components/match/MatchList'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'

type TabType = 'all' | MatchStatus

const TABS: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [matches] = useState(MOCK_MATCHES)

  const filteredMatches = activeTab === 'all'
    ? matches
    : matches.filter(m => m.status === activeTab)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              Live<span className="text-[#ef4444]">Scores</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#a1a1a1]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
              </span>
              <span>Live</span>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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

      <main className="mx-auto max-w-7xl px-4 py-6">
        {isLoading ? (
          <MatchListSkeleton count={6} />
        ) : (
          <MatchList matches={filteredMatches} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-7xl">
          <button className="flex flex-1 flex-col items-center py-3 text-[#ef4444]">
            <svg className="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-3 text-[#666] hover:text-white">
            <svg className="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-xs">Live</span>
          </button>
          <button className="flex flex-1 flex-col items-center py-3 text-[#666] hover:text-white">
            <svg className="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs">Search</span>
          </button>
        </div>
      </nav>
    </div>
  )
}