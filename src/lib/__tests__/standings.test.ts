import { describe, it, expect } from 'vitest'
import { inferSeasonFromDate, inferSeasonForLeague } from '../standings'
import type { League } from '../types'

function makeLeague(id: string, name: string): League {
  return { id, name, country: '', logo: '', color: '' }
}

const worldCup = makeLeague('1', 'World Cup')
const premierLeague = makeLeague('39', 'Premier League')
const laLiga = makeLeague('140', 'La Liga')
const bundesliga = makeLeague('78', 'Bundesliga')
const serieA = makeLeague('135', 'Serie A')
const ligue1 = makeLeague('61', 'Ligue 1')
const libertadores = makeLeague('13', 'Copa Libertadores')
const argentinaCup = makeLeague('130', 'Copa Argentina')
const brasileirao = makeLeague('71', 'Serie A')
const chilePrimera = makeLeague('265', 'Primera Division')

describe('inferSeasonFromDate', () => {
  it('returns current year for august', () => {
    expect(inferSeasonFromDate('2026-08-01')).toBe(2026)
  })

  it('returns current year for dates after august', () => {
    expect(inferSeasonFromDate('2026-12-31')).toBe(2026)
    expect(inferSeasonFromDate('2026-11-15')).toBe(2026)
  })

  it('returns previous year for july', () => {
    expect(inferSeasonFromDate('2026-07-31')).toBe(2025)
  })

  it('returns previous year for january', () => {
    expect(inferSeasonFromDate('2026-01-15')).toBe(2025)
  })

  it('accepts Date instances', () => {
    expect(inferSeasonFromDate(new Date(2026, 7, 1))).toBe(2026)
    expect(inferSeasonFromDate(new Date(2026, 6, 31))).toBe(2025)
  })
})

describe('inferSeasonForLeague', () => {
  it('uses calendar year for World Cup in June 2026', () => {
    expect(inferSeasonForLeague('2026-06-15', worldCup)).toBe(2026)
  })

  it('uses calendar year for calendar tournaments in June 2026', () => {
    expect(inferSeasonForLeague('2026-06-15', libertadores)).toBe(2026)
    expect(inferSeasonForLeague('2026-06-15', argentinaCup)).toBe(2026)
    expect(inferSeasonForLeague('2026-06-15', brasileirao)).toBe(2026)
    expect(inferSeasonForLeague('2026-06-15', chilePrimera)).toBe(2026)
  })

  it('uses european rule for Premier League in February 2026', () => {
    expect(inferSeasonForLeague('2026-02-15', premierLeague)).toBe(2025)
  })

  it('uses european rule for other seasonal leagues in early year', () => {
    expect(inferSeasonForLeague('2026-02-15', laLiga)).toBe(2025)
    expect(inferSeasonForLeague('2026-02-15', bundesliga)).toBe(2025)
    expect(inferSeasonForLeague('2026-02-15', serieA)).toBe(2025)
    expect(inferSeasonForLeague('2026-02-15', ligue1)).toBe(2025)
  })

  it('uses current year for seasonal leagues from August onward', () => {
    expect(inferSeasonForLeague('2026-08-01', premierLeague)).toBe(2026)
    expect(inferSeasonForLeague('2026-09-15', laLiga)).toBe(2026)
  })

  it('accepts Date instances', () => {
    expect(inferSeasonForLeague(new Date(2026, 5, 15), worldCup)).toBe(2026)
    expect(inferSeasonForLeague(new Date(2026, 1, 15), premierLeague)).toBe(2025)
  })
})
