import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatDateInTimeZone, getTodayDateKey } from '../date'

afterEach(() => {
  vi.useRealTimers()
})

describe('formatDateInTimeZone', () => {
  it('formats a UTC date as YYYY-MM-DD in America/Santiago', () => {
    const date = new Date('2026-06-19T01:00:00Z')
    const result = formatDateInTimeZone(date, 'America/Santiago')
    expect(result).toBe('2026-06-18')
  })

  it('formats a UTC date as YYYY-MM-DD in Europe/Madrid', () => {
    const date = new Date('2026-06-18T23:00:00Z')
    const result = formatDateInTimeZone(date, 'Europe/Madrid')
    expect(result).toBe('2026-06-19')
  })

  it('formats a UTC date as YYYY-MM-DD in UTC', () => {
    const date = new Date('2026-06-18T20:00:00Z')
    const result = formatDateInTimeZone(date, 'UTC')
    expect(result).toBe('2026-06-18')
  })
})

describe('getTodayDateKey', () => {
  it('returns the current date in the given timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-18T23:30:00Z'))

    expect(getTodayDateKey('America/Santiago')).toBe('2026-06-18')
    expect(getTodayDateKey('Europe/Madrid')).toBe('2026-06-19')
  })
})
