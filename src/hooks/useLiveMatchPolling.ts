'use client'

import { useEffect, useRef, useState } from 'react'

interface UseMatchPollingOptions {
  url?: string
  sport?: string
  status?: string
  onFetch?: () => Promise<void>
  onData?: (data: unknown) => void
  interval?: number
  enabled?: boolean
  refreshKey?: string
}

interface RateLimitInfo {
  active: boolean
  remainingSeconds: number
}

interface UseMatchPollingReturn {
  isPolling: boolean
  lastUpdated: Date | null
  error: string | null
  rateLimitInfo: RateLimitInfo
}

interface UseLiveMatchPollingOptions extends UseMatchPollingOptions {
  keepAlive: boolean
  trackedMatchId?: string
}

function buildUrl(sport?: string, status?: string): string {
  const params = new URLSearchParams()
  if (sport) params.set('sport', sport)
  if (status) params.set('status', status)
  const qs = params.toString()
  return qs ? `/api/matches?${qs}` : '/api/matches'
}

export function useLiveMatchPolling(options: UseLiveMatchPollingOptions): UseMatchPollingReturn {
  const {
    url,
    sport,
    status,
    onFetch,
    onData,
    interval = 30000,
    enabled = true,
    refreshKey,
    keepAlive,
    trackedMatchId,
  } = options

  const [isPolling, setIsPolling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({ active: false, remainingSeconds: 0 })

  const onFetchRef = useRef(onFetch)
  const onDataRef = useRef(onData)
  const urlRef = useRef(url)
  const sportRef = useRef(sport)
  const statusRef = useRef(status)
  const enabledRef = useRef(enabled)
  const keepAliveRef = useRef(keepAlive)
  const trackedMatchIdRef = useRef(trackedMatchId)
  const missingCountRef = useRef(0)
  const finishedRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => { onFetchRef.current = onFetch }, [onFetch])
  useEffect(() => { onDataRef.current = onData }, [onData])
  useEffect(() => { urlRef.current = url }, [url])
  useEffect(() => { sportRef.current = sport }, [sport])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  useEffect(() => { trackedMatchIdRef.current = trackedMatchId }, [trackedMatchId])

  useEffect(() => {
    keepAliveRef.current = keepAlive
    if (!keepAlive && document.hidden) {
      clearTimer()
      queueMicrotask(() => setIsPolling(false))
    }
  }, [keepAlive])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const clearRateLimitTimer = () => {
    if (rateLimitTimerRef.current) {
      clearInterval(rateLimitTimerRef.current)
      rateLimitTimerRef.current = null
    }
  }

  useEffect(() => {
    if (!enabled || finishedRef.current) {
      clearTimer()
      queueMicrotask(() => setIsPolling(false))
      return
    }

    const tick = async () => {
      if (!enabledRef.current || !isMountedRef.current || finishedRef.current) {
        clearTimer()
        setIsPolling(false)
        return
      }
      try {
        const currentUrl = urlRef.current
        if (currentUrl || sportRef.current || statusRef.current) {
          const fetchUrl = currentUrl || buildUrl(sportRef.current, statusRef.current)
          const res = await fetch(fetchUrl)
          if (!res.ok) {
            if (res.status === 429) throw new Error('429 Too Many Requests')
            throw new Error(`HTTP ${res.status}`)
          }
          const data = await res.json()
          if (isMountedRef.current) {
            onDataRef.current?.(data)

            if (trackedMatchIdRef.current) {
              const matches = (data as { matches?: Array<{ id: string; status: string }> }).matches
              if (Array.isArray(matches)) {
                const tracked = matches.find(m => m.id === trackedMatchIdRef.current)
                if (tracked?.status === 'finished') {
                  finishedRef.current = true
                  clearTimer()
                  setIsPolling(false)
                  return
                }
                if (!tracked && matches.length > 0) {
                  missingCountRef.current++
                  if (missingCountRef.current >= 2) {
                    finishedRef.current = true
                    clearTimer()
                    setIsPolling(false)
                    return
                  }
                } else if (tracked) {
                  missingCountRef.current = 0
                }
              }
            }
          }
        } else if (onFetchRef.current) {
          await onFetchRef.current()
        }
        if (isMountedRef.current) {
          setLastUpdated(new Date())
          setError(null)
        }
      } catch (err) {
        if (isMountedRef.current) {
          const message = err instanceof Error ? err.message : 'Fetch failed'
          setError(message)
          if (message.includes('429') || message.includes('Too Many Requests')) {
            setRateLimitInfo({ active: true, remainingSeconds: 120 })
            clearRateLimitTimer()
            rateLimitTimerRef.current = setInterval(() => {
              setRateLimitInfo(prev => {
                const next = prev.remainingSeconds - 1
                if (next <= 0) {
                  clearRateLimitTimer()
                  return { active: false, remainingSeconds: 0 }
                }
                return { ...prev, remainingSeconds: next }
              })
            }, 1000)
          }
        }
      }
    }

    queueMicrotask(() => setIsPolling(true))
    tick()

    intervalRef.current = setInterval(tick, interval)

    const handleVisibility = () => {
      if (document.hidden && !keepAliveRef.current) {
        clearTimer()
        setIsPolling(false)
      } else if (!document.hidden && !intervalRef.current && !finishedRef.current) {
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
  }, [enabled, interval, refreshKey])

  return { isPolling, lastUpdated, error, rateLimitInfo }
}
