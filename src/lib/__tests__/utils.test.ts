import { describe, it, expect } from 'vitest'
import { isSportActive } from '../utils'

describe('isSportActive', () => {
  it('returns true for matching basketball paths', () => {
    expect(isSportActive('/basketball', '/basketball')).toBe(true)
  })

  it('returns false for non-matching paths', () => {
    expect(isSportActive('/', '/basketball')).toBe(false)
  })

  it('returns true for root path when on / or football', () => {
    expect(isSportActive('/', '/')).toBe(true)
    expect(isSportActive('/football', '/')).toBe(true)
  })

  it('returns false for different sport paths', () => {
    expect(isSportActive('/mma', '/basketball')).toBe(false)
  })
})
