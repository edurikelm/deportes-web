'use client'

import { useState, useEffect } from 'react'
import { MatchList } from '@/components/match/MatchList'
import type { Match } from '@/lib/types'

export default function SearchPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadMatches() {
      const res = await fetch('/api/matches')
      const data = await res.json()
      setMatches(data.matches || [])
    }
    loadMatches()
  }, [])

  const filteredMatches = query.trim()
    ? matches.filter(
        (match) =>
          match.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
          match.awayTeam.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="mb-4 text-2xl font-bold text-white">Search</h1>
          <input
            type="text"
            placeholder="Search by team name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[#262626] bg-[#141414] px-4 py-3 text-white placeholder-[#666] focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
          />
        </div>

        {query.trim() ? (
          filteredMatches.length > 0 ? (
            <MatchList matches={filteredMatches} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="mb-4 h-16 w-16 text-[#666]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-[#a1a1a1]">No teams found for &quot;{query}&quot;</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-4 h-16 w-16 text-[#666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-[#a1a1a1]">Enter a team name to search</p>
          </div>
        )}
      </div>
    </div>
  )
}
