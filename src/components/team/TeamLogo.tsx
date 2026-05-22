'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Team } from '@/lib/types'

interface TeamLogoProps {
  team: Team
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { container: 8, image: 32 },
  md: { container: 12, image: 48 },
  lg: { container: 16, image: 64 },
}

export function TeamLogo({ team, size = 'md' }: TeamLogoProps) {
  const [hasError, setHasError] = useState(false)
  const { container, image } = sizes[size]

  if (hasError) {
    return (
      <div
        className={`flex h-${container} w-${container} items-center justify-center rounded-lg bg-[#1a1a1a]`}
        style={{ width: sizes[size].container * 4, height: sizes[size].container * 4 }}
      >
        <span className="text-lg font-bold text-[#666]">
          {team.shortName?.[0] || team.name[0]}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[#1a1a1a]`}
      style={{ width: sizes[size].container * 4, height: sizes[size].container * 4 }}
    >
      <Image
        src={team.logo}
        alt={team.name}
        fill
        sizes={`${sizes[size].image}px`}
        className="object-contain p-1"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
