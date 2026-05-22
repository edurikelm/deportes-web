'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Match, League } from '@/lib/types'

type DateTab = 'yesterday' | 'today' | 'tomorrow'

interface SearchBarProps {
  onSearch: (query: string, date: string, leagueId?: string) => void
  selectedLeagueId?: string
  leagues: League[]
  matches: Match[]
}

function getDateString(tab: DateTab): string {
  const today = new Date()
  const offset = tab === 'yesterday' ? -1 : tab === 'tomorrow' ? 1 : 0
  const date = new Date(today)
  date.setDate(date.getDate() + offset)
  return date.toISOString().split('T')[0]
}

export function SearchBar({ onSearch, selectedLeagueId, leagues, matches }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [dateTab, setDateTab] = useState<DateTab>('today')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [leagueFilter, setLeagueFilter] = useState(selectedLeagueId || '')
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [results, setResults] = useState<Match[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const results = matches.filter(m =>
        m.homeTeam.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        m.awayTeam.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 5)
      setResults(results)
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [debouncedQuery, matches])

  useEffect(() => {
    onSearch(debouncedQuery, customDate || getDateString(dateTab), leagueFilter || undefined)
  }, [debouncedQuery, dateTab, customDate, leagueFilter, onSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('[data-dropdown]')) {
        setShowLeagueDropdown(false)
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTabClick = (tab: DateTab) => {
    setDateTab(tab)
    setCustomDate('')
    setShowDatePicker(false)
  }

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value)
    setDateTab('today')
  }

  const handleResultClick = (match: Match) => {
    const teamName = match.homeTeam.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      ? match.homeTeam.name
      : match.awayTeam.name
    setQuery(teamName)
    setShowResults(false)
  }

  const selectedLeague = leagues.find(l => l.id === leagueFilter)

  return (
    <div className="space-y-3">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]"
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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder="Buscar equipo..."
            className="w-full rounded-lg border border-[#262626] bg-[#141414] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#666] focus:border-[#404040] focus:outline-none focus:ring-1 focus:ring-[#404040]"
          />

          {showResults && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-[#262626] bg-[#141414] shadow-lg">
              {results.map((match) => (
                <button
                  key={match.id}
                  onClick={() => handleResultClick(match)}
                  className="flex w-full items-center gap-3 border-b border-[#262626] px-4 py-3 last:border-0 hover:bg-[#1a1a1a]"
                >
                  <div className="relative h-8 w-8 overflow-hidden rounded bg-[#1a1a1a]">
                    <Image
                      src={match.homeTeam.logo}
                      alt={match.homeTeam.name}
                      fill
                      sizes="32px"
                      className="object-contain p-0.5"
                    />
                  </div>
                  <span className="text-sm text-white">{match.homeTeam.name}</span>
                  <span className="text-xs text-[#666]">vs</span>
                  <span className="text-sm text-white">{match.awayTeam.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" data-dropdown>
          <button
            onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] px-3 text-sm text-[#a1a1a1] hover:border-[#404040]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {selectedLeague ? (
              <div className="flex items-center gap-2">
                <div className="relative h-4 w-4 overflow-hidden rounded">
                  <Image src={selectedLeague.logo} alt={selectedLeague.name} fill sizes="16px" className="object-contain" />
                </div>
                <span className="hidden sm:inline">{selectedLeague.name}</span>
              </div>
            ) : (
              <span>Liga</span>
            )}
          </button>

          {showLeagueDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-48 overflow-auto rounded-lg border border-[#262626] bg-[#141414] shadow-lg">
              <button
                onClick={() => { setLeagueFilter(''); setShowLeagueDropdown(false) }}
                className="flex w-full items-center gap-2 border-b border-[#262626] px-4 py-2.5 text-sm hover:bg-[#1a1a1a] first:rounded-t-lg"
              >
                <span className="text-[#a1a1a1]">Todas las ligas</span>
              </button>
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => { setLeagueFilter(league.id); setShowLeagueDropdown(false) }}
                  className="flex w-full items-center gap-2 border-b border-[#262626] px-4 py-2.5 last:border-0 hover:bg-[#1a1a1a]"
                >
                  <div className="relative h-5 w-5 overflow-hidden rounded">
                    <Image src={league.logo} alt={league.name} fill sizes="20px" className="object-contain" />
                  </div>
                  <span className="text-sm text-white">{league.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#141414] p-1">
          {(['yesterday', 'today', 'tomorrow'] as DateTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                dateTab === tab && !customDate
                  ? 'bg-white text-black'
                  : 'bg-transparent text-[#a1a1a1] hover:bg-[#1a1a1a]'
              }`}
            >
              {tab === 'yesterday' ? 'Ayer' : tab === 'today' ? 'Hoy' : 'Mañana'}
            </button>
          ))}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              customDate
                ? 'bg-white text-black'
                : 'bg-transparent text-[#a1a1a1] hover:bg-[#1a1a1a]'
            }`}
          >
            📅
          </button>
        </div>

        {customDate && (
          <span className="text-xs text-[#666]">
            {new Date(customDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {showDatePicker && (
        <div className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#141414] p-3">
          <input
            type="date"
            value={customDate}
            onChange={handleDatePickerChange}
            className="flex-1 rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#404040]"
          />
          <button
            onClick={() => { setCustomDate(''); setShowDatePicker(false) }}
            className="text-sm text-[#666] hover:text-white"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  )
}
