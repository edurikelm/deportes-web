'use client'

import { useState } from 'react'
import type { Match } from '@/lib/types'
import { MatchTimeline } from './MatchTimeline'
import { StreamLinks } from './StreamLinks'
import { Lineups } from './Lineups'
import { HighlightSummaryModal } from './HighlightSummaryModal'
import { getSportConfig } from '@/lib/types'

interface MatchDetailTabsProps {
  match: Match
}

type TabId = 'summary' | 'timeline' | 'lineups' | 'streaming'

interface TabDefinition {
  id: TabId
  label: string
  showFor: Sport[]
}

type Sport = Match['sport']

const TABS: TabDefinition[] = [
  { id: 'summary', label: 'Resumen', showFor: ['football', 'basketball', 'mma'] },
  { id: 'timeline', label: 'Cronología', showFor: ['football', 'basketball', 'mma'] },
  { id: 'lineups', label: 'Alineaciones', showFor: ['football'] },
  { id: 'streaming', label: 'Transmisión', showFor: ['football', 'basketball', 'mma'] },
]

export function MatchDetailTabs({ match }: MatchDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [lineupsActivated, setLineupsActivated] = useState(false)
  const visibleTabs = TABS.filter((tab) => tab.showFor.includes(match.sport))
  const sportConfig = getSportConfig(match.sport)

  function handleTabClick(tabId: TabId) {
    if (tabId === 'lineups') {
      setLineupsActivated(true)
    }
    setActiveTab(tabId)
  }

  const matchDate = new Date(match.startTime)
  const isValidDate = !Number.isNaN(matchDate.getTime())
  const formattedDate = isValidDate
    ? matchDate.toLocaleString('es-CL', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--'

  const summaryItems = [
    {
      label: 'Estado',
      value: match.status === 'live' ? 'En vivo' : match.status === 'finished' ? 'Finalizado' : 'Próximo',
    },
    { label: 'Inicio', value: formattedDate },
    { label: 'Liga', value: match.league.name },
    { label: 'País', value: match.league.country },
  ]

  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-full gap-2 border-b border-[#262626]">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
        {activeTab === 'summary' && (
          <>
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Información del partido</h2>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#262626] bg-[#101010] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#666]">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
              <div className="rounded-lg border border-[#262626] bg-[#101010] px-4 py-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[#666]">Transmisión principal</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {match.streamLinks[0]?.name || 'Sin links disponibles'}
                </p>
              </div>
            </div>
            <div className="border-t border-[#262626] px-6 py-4">
              <HighlightSummaryModal match={match} />
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <>
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Cronología</h2>
            </div>
            <div className="p-6">
              <MatchTimeline events={match.events} sportConfig={sportConfig} />
            </div>
          </>
        )}

        {lineupsActivated && match.sport === 'football' && (
          <div hidden={activeTab !== 'lineups'}>
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Alineaciones</h2>
            </div>
            <div className="p-6">
              <Lineups
                matchId={match.id}
                sport={match.sport}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
              />
            </div>
          </div>
        )}

        {activeTab === 'streaming' && (
          <>
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Transmisión</h2>
            </div>
            <div className="p-6">
              <StreamLinks links={match.streamLinks} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
