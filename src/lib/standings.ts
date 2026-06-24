import type { League, Season } from './types'

export const STANDINGS_FEATURE_ENABLED = false

export function inferSeasonFromDate(date: Date | string): Season {
  if (typeof date === 'string') {
    const [yearStr, monthStr] = date.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    return month >= 8 ? year : year - 1
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return month >= 8 ? year : year - 1
}

const SEASONAL_LEAGUE_IDS = new Set<string>([
  '39',
  '140',
  '78',
  '135',
  '61',
])

function isSeasonalLeague(league: League): boolean {
  return SEASONAL_LEAGUE_IDS.has(league.id)
}

function inferCalendarYear(date: Date | string): Season {
  if (typeof date === 'string') {
    const [yearStr] = date.split('-')
    return parseInt(yearStr, 10)
  }

  return date.getFullYear()
}

export function inferSeasonForLeague(date: Date | string, league: League): Season {
  if (isSeasonalLeague(league)) {
    return inferSeasonFromDate(date)
  }

  return inferCalendarYear(date)
}
