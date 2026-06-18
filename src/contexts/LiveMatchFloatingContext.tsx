'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Match } from '@/lib/types'
import { FloatingPipShell } from '@/components/liveMatch/FloatingPipShell'

export interface FloatingWindowApi {
  requestWindow(options: { width: number; height: number }): Promise<Window>
  isSupported(): boolean
}

export interface UseLiveMatchFloatingReturn {
  isSupported: boolean
  isFloatingOpen: boolean
  floatingMatch: Match | null
  openFloatingMatch: (match: Match, lastUpdated: Date | null) => void
  updateFloatingContent: (match: Match, lastUpdated: Date | null) => void
  closeFloatingMatch: () => void
  setFloatingError: (error: string | null) => void
  lastUpdated: Date | null
}

interface LiveMatchFloatingContextValue extends UseLiveMatchFloatingReturn {
  _pipWindowRef: React.MutableRefObject<Window | null>
  _rootRef: React.MutableRefObject<Root | null>
}

function createDefaultFloatingWindowApi(): FloatingWindowApi {
  return {
    requestWindow: async (options) => {
      return await window.documentPictureInPicture!.requestWindow(options)
    },
    isSupported: () =>
      'documentPictureInPicture' in window &&
      window.innerWidth >= 1024 &&
      typeof window.documentPictureInPicture?.requestWindow === 'function',
  }
}

export function createTestFloatingWindowApi(
  overrides?: Partial<FloatingWindowApi>,
): FloatingWindowApi {
  return {
    requestWindow: async () => {
      throw new Error('not implemented')
    },
    isSupported: () => true,
    ...overrides,
  }
}

const LiveMatchFloatingContext = createContext<LiveMatchFloatingContextValue | null>(null)

interface LiveMatchFloatingProviderProps {
  children: ReactNode
  api?: FloatingWindowApi
}

export function LiveMatchFloatingProvider({
  children,
  api = createDefaultFloatingWindowApi(),
}: LiveMatchFloatingProviderProps) {
  const [floatingMatch, setFloatingMatch] = useState<Match | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [pipError, setPipError] = useState<string | null>(null)

  const pipWindowRef = useRef<Window | null>(null)
  const rootRef = useRef<Root | null>(null)

  useEffect(() => {
    setIsSupported(api.isSupported())
  }, [api])

  const closeFloatingMatch = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount()
      rootRef.current = null
    }
    if (pipWindowRef.current) {
      pipWindowRef.current.close()
      pipWindowRef.current = null
    }
    setFloatingMatch(null)
    setLastUpdated(null)
    setIsFloatingOpen(false)
  }, [])

  const handleViewDetail = useCallback((match: Match) => {
    if (pipWindowRef.current?.opener) {
      pipWindowRef.current.opener.focus()
      pipWindowRef.current.opener.location.href = `/match/${match.sport}/${match.id}`
    }
  }, [])

  const setFloatingError = useCallback((error: string | null) => {
    setPipError(error)
  }, [])

  const updateFloatingContent = useCallback(
    (match: Match, newLastUpdated: Date | null) => {
      if (!pipWindowRef.current) return
      if (!rootRef.current) return

      setFloatingMatch(match)
      setLastUpdated(newLastUpdated)

      rootRef.current.render(
        <FloatingPipShell
          match={match}
          lastUpdated={newLastUpdated}
          pollingError={pipError}
          onClose={closeFloatingMatch}
          onViewDetail={handleViewDetail}
        />,
      )
    },
    [closeFloatingMatch, handleViewDetail],
  )

  const openFloatingMatch = useCallback(
    async (match: Match, newLastUpdated: Date | null) => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close()
        pipWindowRef.current = null
      }
      if (rootRef.current) {
        rootRef.current.unmount()
        rootRef.current = null
      }

      if (!isSupported) return

      try {
        const pipWindow = await api.requestWindow({ width: 360, height: 220 })

        const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
        styles.forEach((style) => {
          pipWindow.document.head.appendChild(style.cloneNode(true))
        })

        const container = pipWindow.document.createElement('div')
        pipWindow.document.body.appendChild(container)
        const root = createRoot(container)
        rootRef.current = root
        root.render(
          <FloatingPipShell
            match={match}
            lastUpdated={newLastUpdated}
            pollingError={pipError}
            onClose={closeFloatingMatch}
            onViewDetail={handleViewDetail}
          />,
        )

        pipWindowRef.current = pipWindow
        setFloatingMatch(match)
        setLastUpdated(newLastUpdated)
        setIsFloatingOpen(true)

        pipWindow.addEventListener('pagehide', () => {
          closeFloatingMatch()
        })
      } catch {
        closeFloatingMatch()
      }
    },
    [isSupported, api, closeFloatingMatch, handleViewDetail],
  )

  const value: LiveMatchFloatingContextValue = {
    isSupported,
    isFloatingOpen,
    floatingMatch,
    openFloatingMatch,
    updateFloatingContent,
    closeFloatingMatch,
    setFloatingError,
    lastUpdated,
    _pipWindowRef: pipWindowRef,
    _rootRef: rootRef,
  }

  return (
    <LiveMatchFloatingContext.Provider value={value}>
      {children}
    </LiveMatchFloatingContext.Provider>
  )
}

export function useLiveMatchFloating(): UseLiveMatchFloatingReturn {
  const ctx = useContext(LiveMatchFloatingContext)
  if (!ctx) {
    throw new Error(
      'useLiveMatchFloating must be used within a LiveMatchFloatingProvider',
    )
  }
  return {
    isSupported: ctx.isSupported,
    isFloatingOpen: ctx.isFloatingOpen,
    floatingMatch: ctx.floatingMatch,
    openFloatingMatch: ctx.openFloatingMatch,
    updateFloatingContent: ctx.updateFloatingContent,
    closeFloatingMatch: ctx.closeFloatingMatch,
    setFloatingError: ctx.setFloatingError,
    lastUpdated: ctx.lastUpdated,
  }
}
