import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  LiveMatchFloatingProvider,
  useLiveMatchFloating,
  type FloatingWindowApi,
} from '../LiveMatchFloatingContext'
import type { Match } from '@/lib/types'

function createMatch(overrides?: Partial<Match>): Match {
  return {
    id: 'test-1',
    sport: 'football',
    homeTeam: { id: 'h1', name: 'Home Team', logo: '' },
    awayTeam: { id: 'a1', name: 'Away Team', logo: '' },
    status: 'live',
    startTime: '2026-06-17T12:00:00Z',
    league: { id: 'l1', name: 'Test League', country: 'Test Country', logo: '', color: '#000' },
    score: { home: 2, away: 1 },
    events: [],
    streamLinks: [],
    ...overrides,
  }
}

interface MockApi extends FloatingWindowApi {
  triggerPageHide: () => void
  wasClosed: () => boolean
}

function createMockApi(isSupported: boolean): MockApi {
  const pageHideListeners: Array<() => void> = []
  let closed = false

  const pipWindow = {
    document: {
      head: { appendChild: vi.fn() },
      body: { appendChild: vi.fn() },
      createElement: (tag: string) => document.createElement(tag),
    },
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (event === 'pagehide') pageHideListeners.push(handler)
    }),
    close: vi.fn(() => {
      closed = true
    }),
  }

  return {
    requestWindow: vi.fn(async () => pipWindow as unknown as Window),
    isSupported: () => isSupported,
    triggerPageHide: () => {
      pageHideListeners.forEach((fn) => fn())
    },
    wasClosed: () => closed,
  }
}

describe('LiveMatchFloatingContext', () => {
  let match: Match

  beforeEach(() => {
    match = createMatch()
  })

  describe('default state', () => {
    it('provides default values when no match is open', () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      expect(result.current.isSupported).toBe(true)
      expect(result.current.isFloatingOpen).toBe(false)
      expect(result.current.floatingMatch).toBeNull()
      expect(result.current.lastUpdated).toBeNull()
    })
  })

  describe('isSupported', () => {
    it('returns true when api reports supported', () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })
      expect(result.current.isSupported).toBe(true)
    })

    it('returns false when api reports not supported', () => {
      const api = createMockApi(false)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })
      expect(result.current.isSupported).toBe(false)
    })

    it('returns false when requestWindow is not a function on the default API', () => {
      const orig = window.documentPictureInPicture
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: {},
        configurable: true,
        writable: true,
      })
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider>{children}</LiveMatchFloatingProvider>
        ),
      })
      expect(result.current.isSupported).toBe(false)
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: orig,
        configurable: true,
        writable: true,
      })
    })

    it('returns false when documentPictureInPicture is undefined on the default API', () => {
      const orig = window.documentPictureInPicture
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: undefined,
        configurable: true,
        writable: true,
      })
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider>{children}</LiveMatchFloatingProvider>
        ),
      })
      expect(result.current.isSupported).toBe(false)
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: orig,
        configurable: true,
        writable: true,
      })
    })
  })

  describe('openFloatingMatch', () => {
    it('opens a match and updates context state', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      const lastUpdated = new Date('2026-06-17T12:00:00Z')
      await act(async () => {
        await result.current.openFloatingMatch(match, lastUpdated)
      })

      expect(result.current.isFloatingOpen).toBe(true)
      expect(result.current.floatingMatch).toBe(match)
      expect(result.current.lastUpdated).toBe(lastUpdated)
      expect(api.requestWindow).toHaveBeenCalledOnce()
      expect(api.requestWindow).toHaveBeenCalledWith({ width: 360, height: 220 })
    })

    it('replaces existing floating match when opening a new one', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      const match1 = createMatch({ id: 'match-1' })
      const match2 = createMatch({ id: 'match-2' })

      await act(async () => {
        await result.current.openFloatingMatch(match1, null)
      })

      expect(result.current.floatingMatch?.id).toBe('match-1')
      expect(api.requestWindow).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.openFloatingMatch(match2, null)
      })

      expect(api.requestWindow).toHaveBeenCalledTimes(2)
      expect(result.current.floatingMatch?.id).toBe('match-2')
      expect(api.wasClosed()).toBe(true)
    })

    it('does not open when isSupported is false', async () => {
      const api = createMockApi(false)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      await act(async () => {
        await result.current.openFloatingMatch(match, null)
      })

      expect(result.current.isFloatingOpen).toBe(false)
      expect(result.current.floatingMatch).toBeNull()
      expect(api.requestWindow).not.toHaveBeenCalled()
    })
  })

  describe('closeFloatingMatch', () => {
    it('closes the floating window and clears state', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      await act(async () => {
        await result.current.openFloatingMatch(match, null)
      })
      expect(result.current.isFloatingOpen).toBe(true)

      await act(async () => {
        result.current.closeFloatingMatch()
      })

      expect(result.current.isFloatingOpen).toBe(false)
      expect(result.current.floatingMatch).toBeNull()
      expect(result.current.lastUpdated).toBeNull()
    })
  })

  describe('close-state cleanup (pagehide)', () => {
    it('clears floating match when PiP window is closed by user', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      await act(async () => {
        await result.current.openFloatingMatch(match, null)
      })
      expect(result.current.isFloatingOpen).toBe(true)

      await act(async () => {
        api.triggerPageHide()
      })

      expect(result.current.isFloatingOpen).toBe(false)
      expect(result.current.floatingMatch).toBeNull()
    })
  })

  describe('updateFloatingContent', () => {
    it('updates state without reopening the PiP window', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      const initialDate = new Date('2026-06-17T12:00:00Z')
      await act(async () => {
        await result.current.openFloatingMatch(match, initialDate)
      })

      expect(result.current.isFloatingOpen).toBe(true)
      expect(api.requestWindow).toHaveBeenCalledTimes(1)

      const updatedMatch = createMatch({ id: 'test-2', score: { home: 3, away: 1 } })
      const updatedDate = new Date('2026-06-17T12:30:00Z')

      await act(async () => {
        result.current.updateFloatingContent(updatedMatch, updatedDate)
      })

      expect(result.current.floatingMatch).toBe(updatedMatch)
      expect(result.current.lastUpdated).toBe(updatedDate)
      expect(result.current.isFloatingOpen).toBe(true)
      expect(api.requestWindow).toHaveBeenCalledTimes(1)
      expect(api.wasClosed()).toBe(false)
    })

    it('is a no-op when no PiP window is open', async () => {
      const api = createMockApi(true)
      const { result } = renderHook(() => useLiveMatchFloating(), {
        wrapper: ({ children }) => (
          <LiveMatchFloatingProvider api={api}>{children}</LiveMatchFloatingProvider>
        ),
      })

      const updateMatch = createMatch({ id: 'test-3' })
      await act(async () => {
        result.current.updateFloatingContent(updateMatch, null)
      })

      expect(result.current.floatingMatch).toBeNull()
      expect(result.current.isFloatingOpen).toBe(false)
      expect(api.requestWindow).not.toHaveBeenCalled()
    })
  })

  describe('useLiveMatchFloating error', () => {
    it('throws when used outside provider', () => {
      expect(() => {
        renderHook(() => useLiveMatchFloating())
      }).toThrow('useLiveMatchFloating must be used within a LiveMatchFloatingProvider')
    })
  })
})
