import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SportPage } from '../SportPage'
import { MOCK_MATCHES } from '@/lib/mock-data'

beforeEach(() => {
  vi.useFakeTimers()
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        matches: [],
        meta: { total: 0, cached: false, cacheAge: 0 },
      }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('SportPage', () => {
  it('renders without crashing for football', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })
  })

  it('renders without crashing for basketball', async () => {
    await act(async () => {
      render(<SportPage sport="basketball" />)
    })
  })

  it('renders without crashing for mma', async () => {
    await act(async () => {
      render(<SportPage sport="mma" />)
    })
  })

  it('shows MatchListSkeleton while loading', () => {
    render(<SportPage sport="football" />)
    const skeleton = document.querySelector('.grid.gap-3')
    expect(skeleton).not.toBeNull()
  })

  it('renders MatchRow components when matches load', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES,
          meta: { total: 6, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<SportPage sport="football" />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Arsenal FC')).toBeDefined()
    expect(screen.getByText('Real Madrid')).toBeDefined()
    expect(screen.getByText('Bayern Munich')).toBeDefined()
  })

  it('shows DatePills status filters via MatchListCompact', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES,
          meta: { total: 6, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<SportPage sport="football" />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Todos')).toBeDefined()
    const liveElements = screen.getAllByText('En vivo')
    expect(liveElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Próximos')).toBeDefined()
    expect(screen.getByText('Finalizados')).toBeDefined()
  })

  it('sends timezone query param to API based on visitor timezone', async () => {
    const originalIntl = globalThis.Intl
    try {
      const mockTz = 'America/Santiago'
      const mockDateTimeFormat = function () {
        return {
          resolvedOptions: () => ({ timeZone: mockTz, locale: 'en' }),
          format: () => '2026-06-18',
        }
      } as unknown as typeof Intl.DateTimeFormat
      globalThis.Intl = { DateTimeFormat: mockDateTimeFormat } as typeof Intl

      const fetchSpy = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ matches: [], meta: { total: 0, cached: false, cacheAge: 0 } }),
      })
      globalThis.fetch = fetchSpy

      await act(async () => {
        render(<SportPage sport="football" />)
      })

      await act(async () => {
        vi.advanceTimersByTime(0)
      })

      const url = new URL(fetchSpy.mock.calls[0][0] as string)
      expect(url.searchParams.get('timezone')).toBe('America/Santiago')
    } finally {
      globalThis.Intl = originalIntl
    }
  })
})
