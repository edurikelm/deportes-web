import { describe, it, expect } from 'vitest'
import { getSportConfig, MMA_CONFIG } from '../types'
import type { Sport } from '../types'

describe('getSportConfig', () => {
  it('returns the MMA config for mma sport', () => {
    const config = getSportConfig('mma')
    expect(config.sport).toBe('mma')
    expect(config.periods).toBe(3)
    expect(config.periodLabel).toBe('Round')
  })

  it('returns different configs for different sports', () => {
    const footballConfig = getSportConfig('football')
    const mmaConfig = getSportConfig('mma')
    expect(footballConfig.sport).not.toBe(mmaConfig.sport)
    expect(footballConfig.periods).not.toBe(mmaConfig.periods)
  })
})

describe('MMA_CONFIG', () => {
  it('has event icons for all MMA event types', () => {
    expect(MMA_CONFIG.eventIcons.knockout).toBe('🥊')
    expect(MMA_CONFIG.eventIcons.submission).toBe('🧎')
    expect(MMA_CONFIG.eventIcons.tko).toBe('🥊')
    expect(MMA_CONFIG.eventIcons.decision).toBe('⚖️')
  })

  it('has event labels for all MMA event types', () => {
    expect(MMA_CONFIG.eventLabels.knockout).toBe('Knockout')
    expect(MMA_CONFIG.eventLabels.submission).toBe('Sumisión')
    expect(MMA_CONFIG.eventLabels.tko).toBe('TKO')
    expect(MMA_CONFIG.eventLabels.decision).toBe('Decisión')
  })
})

describe('exhaustive getSportConfig', () => {
  it('covers all sports at compile time', () => {
    const sports: Sport[] = ['football', 'basketball', 'mma']
    const configs = sports.map(getSportConfig)
    expect(configs).toHaveLength(3)
    expect(configs.map(c => c.sport).sort()).toEqual(sports.sort())
  })
})
