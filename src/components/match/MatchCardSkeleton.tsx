export function MatchCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#141414] border border-[#262626]">
      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-[#262626]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#262626]" />
          </div>
          <div className="h-5 w-12 animate-pulse rounded bg-[#262626]" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-[#262626]" />
            <div className="h-5 w-28 animate-pulse rounded bg-[#262626]" />
          </div>

          <div className="mx-4 flex flex-col items-center">
            <div className="h-8 w-16 animate-pulse rounded bg-[#262626]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-5 w-28 animate-pulse rounded bg-[#262626]" />
            <div className="h-10 w-10 animate-pulse rounded-lg bg-[#262626]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  )
}