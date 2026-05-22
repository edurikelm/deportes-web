'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const SPORTS = [
  { href: '/', label: 'Football' },
  { href: '/basketball', label: 'Básquet' },
  { href: '/mma', label: 'MMA' },
]

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live' },
  { href: '/search', label: 'Search' },
]

function isSportActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/football') || pathname === ''
  }
  return pathname.startsWith(href)
}

export function TopHeader() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="hidden border-b border-[#1a1a1a] bg-[#0a0a0a] md:block">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              Live<span className="text-[#ef4444]">Scores</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {SPORTS.map((sport) => {
              const isActive = isSportActive(pathname, sport.href)
              return (
                <Link
                  key={sport.href}
                  href={sport.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-[#1a1a1a] text-[#a1a1a1] hover:bg-[#262626] hover:text-white'
                  }`}
                >
                  {sport.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-[#262626] bg-[#141414] px-4 py-2 text-sm text-white placeholder-[#666] focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
            />
            <svg
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}
