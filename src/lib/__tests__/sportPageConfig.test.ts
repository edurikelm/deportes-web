import { describe, it, expect } from 'vitest'
import { SPORT_PAGE_CONFIGS } from '../sportPageConfig'
import type { Sport } from '../types'

describe('SPORT_PAGE_CONFIGS', () => {
  it('has entries for all sports', () => {
    const sports: Sport[] = ['football', 'basketball', 'mma']
    for (const sport of sports) {
      expect(SPORT_PAGE_CONFIGS[sport]).toBeDefined()
    }
  })

  it('has the correct number of entries', () => {
    expect(Object.keys(SPORT_PAGE_CONFIGS)).toHaveLength(3)
  })

  describe('football config', () => {
    const config = SPORT_PAGE_CONFIGS.football

    it('has correct sport', () => {
      expect(config.sport).toBe('football')
    })

    it('has correct apiEndpoint', () => {
      expect(config.apiEndpoint).toBe('/api/matches')
    })

    it('has correct title', () => {
      expect(config.title).toBe('Fútbol')
    })

    it('has correct accentColor', () => {
      expect(config.accentColor).toBe('#ef4444')
    })

    it('has 11 leagues', () => {
      expect(config.leagues).toHaveLength(11)
    })

    it('has all required fields in each league', () => {
      for (const league of config.leagues) {
        expect(league.id).toBeTruthy()
        expect(league.name).toBeTruthy()
        expect(league.country).toBeTruthy()
        expect(league.logo).toBeTruthy()
        expect(league.color).toBeTruthy()
      }
    })
  })

  describe('basketball config', () => {
    const config = SPORT_PAGE_CONFIGS.basketball

    it('has correct sport', () => {
      expect(config.sport).toBe('basketball')
    })

    it('has correct apiEndpoint', () => {
      expect(config.apiEndpoint).toBe('/api/matches?sport=basketball')
    })

    it('has correct title', () => {
      expect(config.title).toBe('Básquet')
    })

    it('has correct accentColor', () => {
      expect(config.accentColor).toBe('#C8102E')
    })

    it('has 4 leagues', () => {
      expect(config.leagues).toHaveLength(4)
    })

    it('has all required fields in each league', () => {
      for (const league of config.leagues) {
        expect(league.id).toBeTruthy()
        expect(league.name).toBeTruthy()
        expect(league.country).toBeTruthy()
        expect(league.logo).toBeTruthy()
        expect(league.color).toBeTruthy()
      }
    })
  })

  describe('mma config', () => {
    const config = SPORT_PAGE_CONFIGS.mma

    it('has correct sport', () => {
      expect(config.sport).toBe('mma')
    })

    it('has correct apiEndpoint', () => {
      expect(config.apiEndpoint).toBe('/api/matches?sport=mma')
    })

    it('has correct title', () => {
      expect(config.title).toBe('MMA')
    })

    it('has correct accentColor', () => {
      expect(config.accentColor).toBe('#B90000')
    })

    it('has 3 leagues', () => {
      expect(config.leagues).toHaveLength(3)
    })

    it('has all required fields in each league', () => {
      for (const league of config.leagues) {
        expect(league.id).toBeTruthy()
        expect(league.name).toBeTruthy()
        expect(league.country).toBeTruthy()
        expect(league.logo).toBeTruthy()
        expect(league.color).toBeTruthy()
      }
    })
  })

  it('each config has the correct type for SportPageConfig', () => {
    for (const config of Object.values(SPORT_PAGE_CONFIGS)) {
      expect(config).toHaveProperty('sport')
      expect(config).toHaveProperty('apiEndpoint')
      expect(config).toHaveProperty('title')
      expect(config).toHaveProperty('accentColor')
      expect(config).toHaveProperty('leagues')
      expect(Array.isArray(config.leagues)).toBe(true)
    }
  })
})
