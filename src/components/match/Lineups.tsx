'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Team, TeamLineup } from '@/lib/types'
import { useLineup } from '@/hooks/useLineup'

interface LineupsProps {
  matchId: string
  sport: string
  homeTeam: Team
  awayTeam: Team
}

function groupStartXIByRow(players: TeamLineup['startXI']) {
  const rows = new Map<number, typeof players>()

  for (const player of players) {
    if (!player.grid) continue
    const row = Number.parseInt(player.grid.split(':')[0], 10)
    if (Number.isNaN(row)) continue
    const list = rows.get(row) || []
    list.push(player)
    rows.set(row, list)
  }

  return Array.from(rows.entries())
    .sort(([a], [b]) => a - b)
    .map(([, rowPlayers]) =>
      rowPlayers.sort((a, b) => {
        const colA = Number.parseInt(a.grid?.split(':')[1] || '0', 10)
        const colB = Number.parseInt(b.grid?.split(':')[1] || '0', 10)
        return colA - colB
      }),
    )
}

function FormationPitch({ teamLineup, reverse }: { teamLineup: TeamLineup; reverse?: boolean }) {
  const rows = groupStartXIByRow(teamLineup.startXI)

  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-[#262626] bg-[#1a472a]">
        <span className="text-sm text-[#a1a1a1]">Formación no disponible</span>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[16rem] flex-col justify-between gap-4 rounded-xl border border-[#262626] bg-[#1a472a] p-4"
      data-testid="formation-pitch"
    >
      {rows.map((row, idx) => (
        <div key={idx} className={`flex justify-around ${reverse ? 'flex-row-reverse' : ''}`}>
          {row.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e] text-xs font-bold text-black">
                {player.number}
              </div>
              <span className="max-w-[80px] truncate text-center text-xs text-white">{player.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TeamLineupView({
  team,
  teamLineup,
  reverse,
}: {
  team: Team
  teamLineup: TeamLineup
  reverse?: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-[#262626]">
          {team.logo ? (
            <Image src={team.logo} alt={team.name} fill sizes="32px" className="object-contain" />
          ) : (
            <span className="text-xs font-semibold text-[#a1a1a1]">{team.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{team.name}</span>
          <span className="text-xs text-[#a1a1a1]">
            {teamLineup.formation || 'Formación no disponible'}
            {teamLineup.coach && ` · ${teamLineup.coach}`}
          </span>
        </div>
      </div>

      <FormationPitch teamLineup={teamLineup} reverse={reverse} />

      <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#666]">Suplentes</h4>
        {teamLineup.substitutes.length === 0 ? (
          <span className="text-sm text-[#666]">Sin suplentes</span>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {teamLineup.substitutes.map((player) => (
              <div key={player.id} className="flex items-center gap-2 text-sm text-white">
                <span className="w-6 text-center font-mono text-xs text-[#a1a1a1]">{player.number}</span>
                <span>{player.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Lineups({ matchId, sport, homeTeam, awayTeam }: LineupsProps) {
  const { lineup, loading, error, loadLineup } = useLineup(matchId, sport)

  useEffect(() => {
    loadLineup()
  }, [loadLineup])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-[#22c55e]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-sm font-medium text-[#ef4444]">{error}</span>
      </div>
    )
  }

  const hasStarters = lineup && (lineup.home.startXI.length > 0 || lineup.away.startXI.length > 0)

  if (!hasStarters) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="text-2xl">📋</span>
        <span className="mt-2 text-sm font-medium text-white">Alineaciones no disponibles</span>
        <span className="text-xs text-[#666]">Aún no hay datos de alineaciones para este partido.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <TeamLineupView team={homeTeam} teamLineup={lineup.home} />
        <TeamLineupView team={awayTeam} teamLineup={lineup.away} reverse />
      </div>
    </div>
  )
}
