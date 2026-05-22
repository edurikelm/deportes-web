import type { Sport } from '@/lib/types'
import type { SportDataAdapter } from './sportDataAdapter'
import { FootballAdapter } from './footballAdapter'
import { BasketballAdapter } from './basketball'
import { MmaAdapter } from './mma'

export const ADAPTERS: Record<Sport, SportDataAdapter> = {
  football: new FootballAdapter(),
  basketball: new BasketballAdapter(),
  mma: new MmaAdapter(),
}
