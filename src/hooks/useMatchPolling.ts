'use client'

import { useEffect, useRef, useState } from 'react'

interface UseMatchPollingOptions {
  onFetch: () => Promise<void>
  interval?: number
  enabled?: boolean
}

interface UseMatchPollingReturn {
  isPolling: boolean
  lastUpdated: Date | null
  error: string | null
}

export function useMatchPolling({
  onFetch,
  interval = 30000,
  enabled = true,
}: UseMatchPollingOptions): UseMatchPollingReturn {
  const [isPolling, setIsPolling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFetchRef = useRef(onFetch)
  const enabledRef = useRef(enabled)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    onFetchRef.current = onFetch
  }, [onFetch])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!enabled) {
      clearTimer()
      setIsPolling(false)
      return
    }

    const tick = async () => {
      if (!enabledRef.current || !isMountedRef.current) {
        clearTimer()
        setIsPolling(false)
        return
      }
      try {
        await onFetchRef.current()
        if (isMountedRef.current) {
          setLastUpdated(new Date())
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Fetch failed')
        }
      }
    }

    setIsPolling(true)
    tick()

    intervalRef.current = setInterval(tick, interval)

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimer()
        setIsPolling(false)
      } else {
        setIsPolling(true)
        tick()
        intervalRef.current = setInterval(tick, interval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled, interval])

  return { isPolling, lastUpdated, error }
}
