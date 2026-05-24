'use client'

import { useEffect, useState } from 'react'

interface RateLimitStateProps {
  nextRetryInSeconds: number
}

export function RateLimitState({ nextRetryInSeconds }: RateLimitStateProps) {
  const [countdown, setCountdown] = useState(nextRetryInSeconds)

  useEffect(() => {
    setCountdown(nextRetryInSeconds)
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [nextRetryInSeconds])

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-6xl">⏳</div>
      <h3 className="mb-2 text-lg font-semibold text-white">Límite de solicitudes excedido</h3>
      <p className="mb-4 text-sm text-[#666]">
        Demasiadas solicitudes. Reintentando en{' '}
        <span className="font-mono text-[#ef4444]">{countdown}</span> segundos...
      </p>
    </div>
  )
}
