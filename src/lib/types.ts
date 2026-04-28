export type MatchStatus = 'upcoming' | 'live' | 'finished'

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty'
  | 'missed_penalty'
  | 'yellow_card'
  | 'red_card'
  | 'subst'

export type StreamLinkType = 'tv' | 'stream'

export interface Team {
  id: string
  name: string
  shortName?: string
  logo: string
}

export interface League {
  id: string
  name: string
  country: string
  logo: string
  color: string
}

export interface Score {
  home: number
  away: number
  ht?: {
    home: number
    away: number
  }
}

export interface MatchEvent {
  type: MatchEventType
  minute: number
  player?: string
  team?: 'home' | 'away'
  assist?: string
  comment?: string
}

export interface StreamLink {
  type: StreamLinkType
  name: string
  url?: string
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  status: MatchStatus
  startTime: string
  minute?: number
  league: League
  score?: Score
  events: MatchEvent[]
  streamLinks: StreamLink[]
}

export const LEAGUE_COLORS: Record<string, string> = {
  'Premier League': '#3d1959',
  'La Liga': '#ee8707',
  'Serie A': '#024f8d',
  'Bundesliga': '#e20000',
  'Ligue 1': '#d30f0d',
  'Championship': '#ef8f1a',
  'UEFA Champions League': '#1a365d',
  'UEFA Europa League': '#065f46',
  'World Cup': '#e63946',
  'Euro': '#003399',
  'Copa America': '#009c3b',
  'default': '#262626',
}

export function getLeagueColor(leagueName: string): string {
  return LEAGUE_COLORS[leagueName] || LEAGUE_COLORS['default']
}