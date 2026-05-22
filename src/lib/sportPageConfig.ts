import type { League, Sport } from './types'

export interface SportPageConfig {
  sport: Sport
  apiEndpoint: string
  title: string
  accentColor: string
  leagues: League[]
}

export const SPORT_PAGE_CONFIGS: Record<Sport, SportPageConfig> = {
  football: {
    sport: 'football',
    apiEndpoint: '/api/matches',
    title: 'LiveScores',
    accentColor: '#ef4444',
    leagues: [
      { id: '1', name: 'Premier League', country: 'England', logo: 'https://cdn.sofascore.com/images/league/logo/2.png', color: '#3d1959' },
      { id: '2', name: 'La Liga', country: 'Spain', logo: 'https://cdn.sofascore.com/images/league/logo/8.png', color: '#ee8707' },
      { id: '3', name: 'Bundesliga', country: 'Germany', logo: 'https://cdn.sofascore.com/images/league/logo/7.png', color: '#e20000' },
      { id: '4', name: 'Serie A', country: 'Italy', logo: 'https://cdn.sofascore.com/images/league/logo/23.png', color: '#024f8d' },
      { id: '5', name: 'Ligue 1', country: 'France', logo: 'https://cdn.sofascore.com/images/league/logo/5.png', color: '#d30f0d' },
    ],
  },
  basketball: {
    sport: 'basketball',
    apiEndpoint: '/api/matches?sport=basketball',
    title: 'Basket',
    accentColor: '#C8102E',
    leagues: [
      { id: 'nba', name: 'NBA', country: 'USA', logo: 'https://cdn.sofascore.com/images/league/logo/21894.png', color: '#1D428A' },
      { id: 'euroleague', name: 'EuroLeague', country: 'Europe', logo: 'https://cdn.sofascore.com/images/league/logo/3747.png', color: '#FFB81C' },
      { id: 'acb', name: 'ACB', country: 'Spain', logo: 'https://cdn.sofascore.com/images/league/logo/3757.png', color: '#E03A3E' },
      { id: 'lega', name: 'Lega Basket', country: 'Italy', logo: 'https://cdn.sofascore.com/images/league/logo/3797.png', color: '#0066B0' },
    ],
  },
  mma: {
    sport: 'mma',
    apiEndpoint: '/api/matches?sport=mma',
    title: 'MMA',
    accentColor: '#B90000',
    leagues: [
      { id: 'mma1', name: 'UFC', country: 'USA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ultimate_Fighting_Championship_logo.svg/512px-Ultimate_Fighting_Championship_logo.svg.png', color: '#B90000' },
      { id: 'mma2', name: 'Bellator', country: 'USA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Bellator_MMA_logo.svg/512px-Bellator_MMA_logo.svg.png', color: '#000000' },
      { id: 'mma3', name: 'ONE Championship', country: 'Singapore', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/ONE_Championship_Logo.svg/512px-ONE_Championship_Logo.svg.png', color: '#F5A623' },
    ],
  },
}
