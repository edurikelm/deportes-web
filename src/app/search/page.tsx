'use client'

import { useState, useEffect, useCallback } from 'react'
import { Match } from '@/lib/types'
import { InlineSearch } from '@/components/search/InlineSearch'

export default function SearchPage() {
  const [allMatches, setAllMatches] = useState<Match[]>([])

  const fetchMatches = useCallback(async () => {
    const res = await fetch('/api/matches')
    const data = await res.json()
    setAllMatches(data.matches || [])
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <InlineSearch
        matches={allMatches}
        sport="football"
        onClose={() => window.history.back()}
      />
    </div>
  )
}
