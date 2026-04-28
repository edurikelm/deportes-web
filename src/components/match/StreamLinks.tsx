'use client'

import type { StreamLink } from '@/lib/types'

interface StreamLinksProps {
  links: StreamLink[]
}

export function StreamLinks({ links }: StreamLinksProps) {
  if (links.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-sm text-[#666]">No hay enlaces de streaming disponibles</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, idx) => (
        <a
          key={idx}
          href={link.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] p-4 transition-colors hover:border-[#404040] hover:bg-[#1a1a1a]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#262626]">
              {link.type === 'tv' ? (
                <span className="text-xl">📺</span>
              ) : (
                <span className="text-xl">🌐</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-white">{link.name}</span>
              <span className="text-xs text-[#666]">
                {link.type === 'tv' ? 'Televisión' : 'Streaming'}
              </span>
            </div>
          </div>
          <span className="text-[#666]">→</span>
        </a>
      ))}
    </div>
  )
}
