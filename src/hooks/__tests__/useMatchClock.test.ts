import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMatchClock } from '../useMatchClock'
import type { Match } from '@/lib/types'

const liveMatch: Match = {
  id: 'test-1',
  sport: 'football',
  homeTeam: { id: 'h1', name: 'Home', shortName: 'H', logo: '' },
  awayTeam: { id: 'a1', name: 'Away', shortName: 'A', logo: '' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 45,
  league: { id: 'l1', name: 'Test League', country: 'XX', logo: '', color: '#000' },
  events: [],
  streamLinks: [],
}

describe('useMatchClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T14:45:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial clock value immediately', () => {
    const { result } = renderHook(() => useMatchClock(liveMatch))

    expect(result.current.formatted).toBe("45'")
    expect(result.current.isDelayed).toBe(false)
    expect(result.current.countdownMinutes).toBeNull()
  })

  it('updates clock after interval elapses', () => {
    const lastFetch = new Date('2026-05-01T14:45:00Z').getTime()
    const { result } = renderHook(() =>
      useMatchClock(liveMatch, lastFetch)
    )

    expect(result.current.formatted).toBe("45'")

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(result.current.formatted).toBe("47'")
  })

  it('resets when lastFetchTimestamp changes', () => {
    const firstFetch = new Date('2026-05-01T14:45:00Z').getTime()
    const { result, rerender } = renderHook(
      ({ lastFetch }) => useMatchClock(liveMatch, lastFetch),
      { initialProps: { lastFetch: firstFetch } }
    )

    expect(result.current.formatted).toBe("45'")

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(result.current.formatted).toBe("47'")

    const newFetch = new Date('2026-05-01T14:47:00Z').getTime()
    rerender({ lastFetch: newFetch })

    expect(result.current.formatted).toBe("45'")
  })

  it('does not set interval for finished matches', () => {
    const finishedMatch: Match = {
      ...liveMatch,
      status: 'finished',
    }
    const { result } = renderHook(() => useMatchClock(finishedMatch))

    expect(result.current.formatted).toBe('Finalizado')

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.formatted).toBe('Finalizado')
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useMatchClock(liveMatch))

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('caps football live clock at 120', () => {
    vi.setSystemTime(new Date('2026-05-01T15:59:00Z'))
    const lateMatch: Match = {
      ...liveMatch,
      minute: 119,
    }
    const lastFetch = new Date('2026-05-01T15:59:00Z').getTime()
    const { result } = renderHook(() =>
      useMatchClock(lateMatch, lastFetch)
    )

    expect(result.current.formatted).toBe("119'")

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(result.current.formatted).toBe("120'")

    act(() => {
      vi.advanceTimersByTime(120000)
    })

    expect(result.current.formatted).toBe("120'")
  })
})
