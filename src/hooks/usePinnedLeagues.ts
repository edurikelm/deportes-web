'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { Sport } from '@/lib/types'

const EMPTY_PINNED: string[] = []
const cachedRawBySport: Partial<Record<Sport, string | null>> = {}
const cachedParsedBySport: Partial<Record<Sport, string[]>> = {}

export interface UsePinnedLeaguesReturn {
  pinnedIds: string[]
  togglePin: (leagueId: string) => void
  isPinned: (leagueId: string) => boolean
}

function getStorageKey(sport: Sport): string {
  return `pinned-leagues-${sport}`
}

function readPinned(sport: Sport): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(sport))
    if (!raw) {
      cachedRawBySport[sport] = null
      cachedParsedBySport[sport] = EMPTY_PINNED
      return EMPTY_PINNED
    }

    if (cachedRawBySport[sport] === raw && cachedParsedBySport[sport]) {
      return cachedParsedBySport[sport]
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      cachedRawBySport[sport] = raw
      cachedParsedBySport[sport] = EMPTY_PINNED
      return EMPTY_PINNED
    }

    const normalized = parsed.filter((id): id is string => typeof id === 'string')
    cachedRawBySport[sport] = raw
    cachedParsedBySport[sport] = normalized
    return normalized
  } catch {
    return EMPTY_PINNED
  }
}

export function usePinnedLeagues(sport: Sport): UsePinnedLeaguesReturn {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === getStorageKey(sport)) onStoreChange()
    }
    const onPinnedChange = () => onStoreChange()

    window.addEventListener('storage', onStorage)
    window.addEventListener('pinned-leagues-changed', onPinnedChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pinned-leagues-changed', onPinnedChange)
    }
  }, [sport])

  const getSnapshot = useCallback(() => readPinned(sport), [sport])
  const getServerSnapshot = useCallback(() => EMPTY_PINNED, [])

  const pinnedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const togglePin = useCallback((leagueId: string) => {
    const current = readPinned(sport)
    const next = current.includes(leagueId)
      ? current.filter(id => id !== leagueId)
      : [...current, leagueId]

    try {
      localStorage.setItem(getStorageKey(sport), JSON.stringify(next))
      window.dispatchEvent(new Event('pinned-leagues-changed'))
    } catch {
      // localStorage unavailable
    }
  }, [sport])

  const isPinned = useCallback((leagueId: string) => {
    return pinnedIds.includes(leagueId)
  }, [pinnedIds])

  return { pinnedIds, togglePin, isPinned }
}
