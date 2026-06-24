'use client'

import * as React from 'react'
import Image from 'next/image'
import type { LeagueStandings } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StandingsTableProps {
  standings: LeagueStandings
}

const HEADER_CELLS = [
  { key: 'rank', label: 'Pos', className: 'w-10 text-center' },
  { key: 'team', label: 'Equipo', className: 'text-left' },
  { key: 'played', label: 'PJ', className: 'w-10 text-center hidden sm:table-cell' },
  { key: 'wins', label: 'G', className: 'w-10 text-center hidden sm:table-cell' },
  { key: 'draws', label: 'E', className: 'w-10 text-center hidden sm:table-cell' },
  { key: 'losses', label: 'P', className: 'w-10 text-center hidden sm:table-cell' },
  { key: 'goalDifference', label: 'DG', className: 'w-10 text-center hidden sm:table-cell' },
  { key: 'points', label: 'PTS', className: 'w-12 text-center' },
] as const

function groupRows<T>(rows: T[], keyFn: (row: T) => string | undefined): { group?: string; rows: T[] }[] {
  const groups: { group?: string; rows: T[] }[] = []
  let current: { group?: string; rows: T[] } | null = null

  for (const row of rows) {
    const group = keyFn(row)
    if (!current || current.group !== group) {
      current = { group, rows: [] }
      groups.push(current)
    }
    current.rows.push(row)
  }

  return groups
}

export function StandingsTable({ standings }: StandingsTableProps) {
  const groups = groupRows(standings.standings, (row) => row.group)

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#27272a] text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">
            {HEADER_CELLS.map((cell) => (
              <th key={cell.key} className={cn('px-2 py-2', cell.className)}>
                {cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group.group ?? 'default'}>
              {group.group && (
                <tr className="border-b border-[#27272a]">
                  <td
                    colSpan={HEADER_CELLS.length}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#71717a]"
                  >
                    {group.group}
                  </td>
                </tr>
              )}
              {group.rows.map((row) => (
                <tr
                  key={row.team.id}
                  className="border-b border-[#27272a]/60 transition-colors hover:bg-[#121212]"
                >
                  <td className="px-2 py-2 text-center tabular-nums text-[#a1a1aa]">{row.rank}</td>
                  <td className="px-2 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-sm">
                        {row.team.logo ? (
                          <Image
                            src={row.team.logo}
                            alt={row.team.name}
                            fill
                            sizes="20px"
                            className="object-contain"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#666]">
                            {row.team.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="truncate font-medium text-[#fafafa]">
                        <span className="hidden sm:inline">{row.team.name}</span>
                        <span className="sm:hidden">{row.team.shortName || row.team.name}</span>
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-[#a1a1aa] sm:table-cell">
                    {row.played}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-[#a1a1aa] sm:table-cell">
                    {row.wins}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-[#a1a1aa] sm:table-cell">
                    {row.draws}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-[#a1a1aa] sm:table-cell">
                    {row.losses}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-[#a1a1aa] sm:table-cell">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums font-semibold text-[#fafafa]">
                    {row.points}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
