import type { League, Sport } from './types'

export interface SportPageConfig {
  sport: Sport
  apiEndpoint: string
  title: string
  accentColor: string
  leagues: League[]
}

export function getImportantLeagueIds(sport: Sport): string[] {
  return SPORT_PAGE_CONFIGS[sport].leagues.map(l => l.id)
}

export const SPORT_PAGE_CONFIGS: Record<Sport, SportPageConfig> = {
  football: {
    sport: 'football',
    apiEndpoint: '/api/matches',
    title: 'Fútbol',
    accentColor: '#ef4444',
    leagues: [
      { id: '39', name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', color: '#3d1959' },
      { id: '140', name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', color: '#ee8707' },
      { id: '78', name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', color: '#e20000' },
      { id: '135', name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png', color: '#024f8d' },
      { id: '61', name: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png', color: '#d30f0d' },
      { id: '128', name: 'Liga Profesional Argentina', country: 'Argentina', logo: 'https://media.api-sports.io/football/leagues/128.png', color: '#75aadb' },
      { id: '71', name: 'Campeonato Brasileiro Série A', country: 'Brazil', logo: 'https://media.api-sports.io/football/leagues/71.png', color: '#f5c82a' },
      { id: '265', name: 'Primera División de Chile', country: 'Chile', logo: 'https://media.api-sports.io/football/leagues/265.png', color: '#d4202b' },
      { id: '262', name: 'Liga MX', country: 'Mexico', logo: 'https://media.api-sports.io/football/leagues/262.png', color: '#12874b' },
      { id: '13', name: 'Copa Libertadores', country: 'South America', logo: 'https://media.api-sports.io/football/leagues/13.png', color: '#e30613' },
      { id: '11', name: 'Copa Sudamericana', country: 'South America', logo: 'https://media.api-sports.io/football/leagues/11.png', color: '#f47920' },
    ],
  },
  basketball: {
    sport: 'basketball',
    apiEndpoint: '/api/matches?sport=basketball',
    title: 'Básquet',
    accentColor: '#C8102E',
    leagues: [
      { id: 'nba', name: 'NBA', country: 'USA', logo: 'https://cdn.nba.com/logos/nba/primary/L/logo.svg', color: '#1D428A' },
      { id: 'euroleague', name: 'EuroLeague', country: 'Europe', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Euroleague_Basketball_logo.svg/512px-Euroleague_Basketball_logo.svg.png', color: '#FFB81C' },
      { id: 'acb', name: 'ACB', country: 'Spain', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Liga_ACB_logo.svg/512px-Liga_ACB_logo.svg.png', color: '#E03A3E' },
      { id: 'lega', name: 'Lega Basket', country: 'Italy', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Lega_Basket_Serie_A_logo.svg/512px-Lega_Basket_Serie_A_logo.svg.png', color: '#0066B0' },
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
