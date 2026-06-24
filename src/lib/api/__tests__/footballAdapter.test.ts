import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FootballAdapter } from '../footballAdapter'
import { clearCache } from '../client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function makeLineupResponse(homeTeamId: number, awayTeamId: number) {
  return {
    response: [
      {
        team: { id: homeTeamId, name: 'Arsenal', logo: '/arsenal.png' },
        formation: '4-2-3-1',
        startXI: [
          { player: { id: 1, name: 'Raya', number: 22, pos: 'G', grid: '1:1' } },
          { player: { id: 2, name: 'White', number: 4, pos: 'D', grid: '2:4' } },
          { player: { id: 3, name: 'Saliba', number: 2, pos: 'D', grid: '2:2' } },
          { player: { id: 4, name: 'Gabriel', number: 6, pos: 'D', grid: '2:3' } },
          { player: { id: 5, name: 'Zinchenko', number: 35, pos: 'D', grid: '2:1' } },
          { player: { id: 6, name: 'Partey', number: 5, pos: 'M', grid: '3:1' } },
          { player: { id: 7, name: 'Rice', number: 41, pos: 'M', grid: '3:2' } },
          { player: { id: 8, name: 'Saka', number: 7, pos: 'F', grid: '4:3' } },
          { player: { id: 9, name: 'Odegaard', number: 8, pos: 'M', grid: '4:2' } },
          { player: { id: 10, name: 'Havertz', number: 29, pos: 'M', grid: '4:1' } },
          { player: { id: 11, name: 'Jesus', number: 9, pos: 'F', grid: '5:1' } },
        ],
        substitutes: [
          { player: { id: 12, name: 'Ramsdale', number: 1, pos: 'G' } },
        ],
        coach: { id: 1, name: 'Arteta', photo: '' },
      },
      {
        team: { id: awayTeamId, name: 'Chelsea', logo: '/chelsea.png' },
        formation: '4-3-3',
        startXI: [
          { player: { id: 21, name: 'Sanchez', number: 1, pos: 'G', grid: '1:1' } },
          { player: { id: 22, name: 'James', number: 24, pos: 'D', grid: '2:4' } },
        ],
        substitutes: [],
        coach: { id: 2, name: 'Maresca', photo: '' },
      },
    ],
  }
}

describe('FootballAdapter.fetchFixtures', () => {
  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
    vi.stubEnv('API_SPORTS_KEY', 'test-key')
  })

  it('appends timezone to URL when timeZone is provided', async () => {
    const apiResponse = {
      errors: [],
      response: [
        {
          fixture: {
            id: 1,
            date: '2026-06-18T14:00:00Z',
            status: { long: 'Not Started', short: 'NS', elapsed: null },
          },
          league: { id: 1, name: 'Primera División', country: 'Chile', logo: '' },
          teams: {
            home: { id: 10, name: 'Colo Colo', logo: '' },
            away: { id: 20, name: 'U de Chile', logo: '' },
          },
          goals: {},
          score: {},
          events: [],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(apiResponse),
    })

    const adapter = new FootballAdapter()
    await adapter.fetchFixtures({ date: '2026-06-18', isLive: false, timeZone: 'America/Santiago' })

    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('timezone=America%2FSantiago')
    const parsed = new URL(calledUrl)
    expect(parsed.searchParams.get('timezone')).toBe('America/Santiago')
  })

  it('does not append timezone when timeZone is not provided', async () => {
    const apiResponse = { errors: [], response: [] }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(apiResponse),
    })

    const adapter = new FootballAdapter()
    await adapter.fetchFixtures({ date: '2026-06-18', isLive: false })

    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).not.toContain('timezone')
  })

  it('includes elapsed in raw status passed to normalizer', async () => {
    const apiResponse = {
      errors: [],
      response: [
        {
          fixture: {
            id: 1,
            date: '2026-05-01T14:00:00Z',
            status: { long: 'First Half', short: '1H', elapsed: 34 },
          },
          league: { id: 1, name: 'Premier League', country: 'England', logo: '' },
          teams: {
            home: { id: 10, name: 'Arsenal', logo: '' },
            away: { id: 20, name: 'Chelsea', logo: '' },
          },
          goals: { home: 1, away: 0 },
          score: {},
          events: [],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(apiResponse),
    })

    const adapter = new FootballAdapter()
    const { matches } = await adapter.fetchFixtures({ date: '2026-05-01', isLive: false })

    expect(matches).toHaveLength(1)
    expect(matches[0].minute).toBe(34)
    expect(matches[0].status).toBe('live')
  })
})

describe('FootballAdapter.fetchLineup', () => {
  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
    vi.stubEnv('API_SPORTS_KEY', 'test-key')
  })

  it('returns undefined when API key is missing', async () => {
    vi.stubEnv('API_SPORTS_KEY', '')
    const adapter = new FootballAdapter()
    const result = await adapter.fetchLineup('123')
    expect(result.lineup).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('normalizes API-Football lineups response and returns Lineup', async () => {
    const fixtureResponse = {
      response: [
        {
          fixture: { id: 1, date: '2026-05-01T14:00:00Z', status: { short: 'FT', long: 'Match Finished', elapsed: null } },
          league: { id: 1, name: 'Premier League', country: 'England', logo: '' },
          teams: { home: { id: 10, name: 'Arsenal', logo: '' }, away: { id: 20, name: 'Chelsea', logo: '' } },
          goals: { home: 2, away: 1 },
          score: {},
          events: [],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(makeLineupResponse(10, 20)),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(fixtureResponse),
    })

    const adapter = new FootballAdapter()
    const { lineup } = await adapter.fetchLineup('1')

    expect(lineup).toBeDefined()
    expect(lineup?.home.team.name).toBe('Arsenal')
    expect(lineup?.home.formation).toBe('4-2-3-1')
    expect(lineup?.home.coach).toBe('Arteta')
    expect(lineup?.home.startXI).toHaveLength(11)
    expect(lineup?.home.startXI[0].name).toBe('Raya')
    expect(lineup?.home.startXI[0].grid).toBe('1:1')
    expect(lineup?.home.substitutes).toHaveLength(1)
    expect(lineup?.home.substitutes[0].name).toBe('Ramsdale')
    expect(lineup?.away.team.name).toBe('Chelsea')
    expect(lineup?.away.formation).toBe('4-3-3')
  })

  it('returns undefined when lineups response has fewer than two teams', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ response: [] }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ response: [{ teams: { home: { id: 10 }, away: { id: 20 } } }] }),
    })

    const adapter = new FootballAdapter()
    const { lineup } = await adapter.fetchLineup('1')

    expect(lineup).toBeUndefined()
  })
})

describe('FootballAdapter.fetchStandings', () => {
  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
    vi.stubEnv('API_SPORTS_KEY', 'test-key')
  })

  it('returns normalized standings from API', async () => {
    const apiResponse = {
      response: [
        {
          league: {
            id: 39,
            name: 'Premier League',
            country: 'England',
            logo: '',
            season: 2024,
            standings: [
              [
                {
                  rank: 1,
                  team: { id: 1, name: 'Liverpool', logo: '/liv.png' },
                  points: 80,
                  goalsDiff: 45,
                  all: { played: 34, win: 25, draw: 5, lose: 4, goals: { for: 78, against: 33 } },
                },
              ],
            ],
          },
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(apiResponse),
    })

    const adapter = new FootballAdapter()
    const result = await adapter.fetchStandings({ leagueId: '39', season: 2024 })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('league=39')
    expect(calledUrl).toContain('season=2024')
    expect(result.standings).toBeDefined()
    expect(result.standings?.league.name).toBe('Premier League')
    expect(result.standings?.standings[0].team.name).toBe('Liverpool')
    expect(result.cached).toBe(false)
  })

  it('returns null standings when API response is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ response: [] }),
    })

    const adapter = new FootballAdapter()
    const result = await adapter.fetchStandings({ leagueId: '39', season: 2024 })

    expect(result.standings).toBeNull()
  })

  it('returns null without fetching when API key is missing', async () => {
    vi.stubEnv('API_SPORTS_KEY', '')
    const adapter = new FootballAdapter()
    const result = await adapter.fetchStandings({ leagueId: '39', season: 2024 })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.standings).toBeNull()
  })
})
