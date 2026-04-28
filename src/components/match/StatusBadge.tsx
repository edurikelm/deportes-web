import type { MatchStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: MatchStatus
  minute?: number
}

export function StatusBadge({ status, minute }: StatusBadgeProps) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef4444]" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#ef4444]">
          Live{minute ? ` ${minute}'` : ''}
        </span>
      </div>
    )
  }

  if (status === 'finished') {
    return (
      <span className="rounded bg-[#262626] px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-[#22c55e]">
        FT
      </span>
    )
  }

  return (
    <span className="rounded bg-[#262626] px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-[#666]">
      Upcoming
    </span>
  )
}