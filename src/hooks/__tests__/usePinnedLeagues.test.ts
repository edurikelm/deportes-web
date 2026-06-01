import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePinnedLeagues } from '../usePinnedLeagues'
import type { Sport } from '@/lib/types'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('usePinnedLeagues', () => {
  const football: Sport = 'football'

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('returns pinnedIds, togglePin, isPinnned', () => {
    const { result } = renderHook(() => usePinnedLeagues(football))

    expect(result.current).toHaveProperty('pinnedIds')
    expect(result.current).toHaveProperty('togglePin')
    expect(result.current).toHaveProperty('isPinned')
    expect(result.current.pinnedIds).toEqual([])
  })

  it('togglePin adds a league ID to pinned set', () => {
    const { result } = renderHook(() => usePinnedLeagues(football))

    act(() => {
      result.current.togglePin('39')
    })

    expect(result.current.isPinned('39')).toBe(true)
    expect(result.current.pinnedIds).toEqual(['39'])
  })

  it('togglePin removes a league ID if already pinned', () => {
    const { result } = renderHook(() => usePinnedLeagues(football))

    act(() => {
      result.current.togglePin('39')
    })

    expect(result.current.isPinned('39')).toBe(true)

    act(() => {
      result.current.togglePin('39')
    })

    expect(result.current.isPinned('39')).toBe(false)
    expect(result.current.pinnedIds).toEqual([])
  })

  it('togglePin is idempotent - pinning same ID multiple times does not duplicate', () => {
    const { result } = renderHook(() => usePinnedLeagues(football))

    act(() => { result.current.togglePin('39') })
    act(() => { result.current.togglePin('39') })
    act(() => { result.current.togglePin('39') })

    expect(result.current.pinnedIds).toEqual(['39'])
  })

  it('persists data across hook instances via localStorage', () => {
    const { result: first } = renderHook(() => usePinnedLeagues(football))

    act(() => { first.current.togglePin('39') })

    expect(first.current.pinnedIds).toEqual(['39'])

    const { result: second } = renderHook(() => usePinnedLeagues(football))

    expect(second.current.pinnedIds).toEqual(['39'])
  })

  it('different sports have separate pin lists', () => {
    const basketball: Sport = 'basketball'
    const { result: footballHook } = renderHook(() => usePinnedLeagues(football))
    const { result: basketballHook } = renderHook(() => usePinnedLeagues(basketball))

    act(() => { footballHook.current.togglePin('39') })

    expect(footballHook.current.pinnedIds).toEqual(['39'])
    expect(basketballHook.current.pinnedIds).toEqual([])

    expect(footballHook.current.isPinned('39')).toBe(true)
    expect(basketballHook.current.isPinned('39')).toBe(false)
  })

  it('is SSR-safe - does not crash when localStorage is unavailable', () => {
    const originalLocalStorage = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      get: () => { throw new Error('localStorage not available') },
      configurable: true,
    })

    expect(() => {
      renderHook(() => usePinnedLeagues(football))
    }).not.toThrow()

    const { result } = renderHook(() => usePinnedLeagues(football))
    expect(result.current.pinnedIds).toEqual([])

    act(() => { result.current.togglePin('39') })
    expect(result.current.pinnedIds).toEqual(['39'])

    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, configurable: true })
  })
})
