'use client'

import { Search, Settings } from 'lucide-react'

type HeaderProps = {
  leftSlot?: React.ReactNode
}

export function Header({ leftSlot }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-12 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4">
      <div className="mx-auto flex h-full w-full max-w-[1320px] items-center">
        <div className="flex items-center gap-2">
          {leftSlot}
          <span className="text-lg font-bold text-white">
            Live<span className="text-[#ef4444]">Scores</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Search className="h-5 w-5 text-[#a1a1a1]" data-testid="search-icon" />
          <Settings className="h-5 w-5 text-[#a1a1a1]" data-testid="settings-icon" />
        </div>
      </div>
    </header>
  )
}
