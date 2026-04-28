export function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef4444]" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#ef4444]">
        Live
      </span>
    </div>
  )
}