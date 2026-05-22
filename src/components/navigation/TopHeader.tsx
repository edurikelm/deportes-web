'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isSportActive } from '@/lib/utils'

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

export function TopHeader() {
  const pathname = usePathname()

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
              const active = isSportActive(pathname, sport.href)
              return (
                <Link
                  key={sport.href}
                  href={sport.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
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
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white text-black'
                      : 'text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
