'use client'

import type { Match } from '@/lib/types'
import { CompactFloatingScoreboard } from '@/components/liveMatch/CompactFloatingScoreboard'

interface FloatingPipShellProps {
  match: Match
  lastUpdated: Date | null
  pollingError?: string | null
  onClose: () => void
  onViewDetail: (match: Match) => void
}

export function FloatingPipShell({
  match,
  lastUpdated,
  pollingError,
  onClose,
  onViewDetail,
}: FloatingPipShellProps) {
  return (
    <div className="flex flex-col">
      <CompactFloatingScoreboard match={match} lastUpdated={lastUpdated} />
      {pollingError && (
        <div className="border-t border-[#2a2a2a] px-3 py-1 text-center text-[10px] text-[#9a9a9a]">
          Error al actualizar
        </div>
      )}
      <div className="flex items-center justify-between border-t border-[#2a2a2a] px-3 py-1.5">
        <button
          onClick={onClose}
          className="rounded px-2 py-0.5 text-xs font-medium text-[#9a9a9a] transition-colors hover:bg-[#2a2a2a] hover:text-white"
        >
          Cerrar
        </button>
        <button
          onClick={() => onViewDetail(match)}
          className="rounded bg-[#2563eb] px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Ver detalle
        </button>
      </div>
    </div>
  )
}
