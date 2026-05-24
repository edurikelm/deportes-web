'use client'
import { createContext, useContext, type ReactNode } from 'react'

interface MatchClockContextValue {
  lastFetchTimestamp: number | undefined
}

const MatchClockContext = createContext<MatchClockContextValue>({
  lastFetchTimestamp: undefined,
})

export function MatchClockProvider({ lastFetchTimestamp, children }: {
  lastFetchTimestamp: number | undefined
  children: ReactNode
}) {
  return (
    <MatchClockContext.Provider value={{ lastFetchTimestamp }}>
      {children}
    </MatchClockContext.Provider>
  )
}

export function useMatchClockContext(): MatchClockContextValue {
  return useContext(MatchClockContext)
}
