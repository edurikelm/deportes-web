'use client'

import { useState, useEffect, useRef } from 'react'
import type { Match } from '@/lib/types'
import { MatchRow } from '@/components/match/MatchRow'
import { MatchClockProvider } from '@/components/match/MatchClockContext'

interface InlineSearchProps {
  matches: Match[]
  onClose: () => void
}

export function InlineSearch({ matches, onClose }: InlineSearchProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = query.length >= 2
    ? matches.filter(m =>
        m.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <MatchClockProvider lastFetchTimestamp={undefined}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
          placeholder="Buscar equipo..."
          className="w-full rounded-lg border border-[#262626] bg-[#111111] px-4 py-2.5 pr-10 text-sm text-white placeholder:text-[#666] focus:border-[#404040] focus:outline-none focus:ring-1 focus:ring-[#404040]"
        />
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
          aria-label="Cerrar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {filtered.length > 0 && (
          <div>
            {filtered.map(m => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        )}
        {query.length >= 2 && filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-[#a1a1a1]">
            No se encontraron equipos para &apos;{query}&apos;
          </p>
        )}
      </div>
    </MatchClockProvider>
  )
}
