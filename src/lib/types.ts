export type Sport = 'football' | 'basketball' | 'mma'

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export type MatchEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty'
  | 'missed_penalty'
  | 'yellow_card'
  | 'red_card'
  | 'subst'
  | 'two_points'
  | 'three_points'
  | 'free_throw'
  | 'foul'
  | 'timeout'
  | 'turnover'

export interface SportConfig {
  sport: Sport
  eventIcons: Record<MatchEventType, string>
  eventLabels: Record<MatchEventType, string>
  scoreLabel: string
  periodLabel: string
  periods: number
}

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
  qt?: number[]
}

export interface MatchEvent {
  type: MatchEventType
  minute: number
  player?: string
  team?: 'home' | 'away'
  assist?: string
  comment?: string
  extra?: Record<string, unknown>
}

export interface StreamLink {
  type: StreamLinkType
  name: string
  url?: string
}

export interface Match {
  id: string
  sport: Sport
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

export const FOOTBALL_CONFIG: SportConfig = {
  sport: 'football',
  eventIcons: {
    goal: '⚽',
    own_goal: '⚽',
    penalty: '⚽',
    missed_penalty: '✕',
    yellow_card: '🟨',
    red_card: '🟥',
    subst: '🔄',
    two_points: '',
    three_points: '',
    free_throw: '',
    foul: '',
    timeout: '',
    turnover: '',
  },
  eventLabels: {
    goal: 'Goal',
    own_goal: 'Own Goal',
    penalty: 'Penalty',
    missed_penalty: 'Missed Penalty',
    yellow_card: 'Yellow Card',
    red_card: 'Red Card',
    subst: 'Substitution',
    two_points: '',
    three_points: '',
    free_throw: '',
    foul: '',
    timeout: '',
    turnover: '',
  },
  scoreLabel: 'Score',
  periodLabel: 'Half',
  periods: 2,
}

export const BASKETBALL_CONFIG: SportConfig = {
  sport: 'basketball',
  eventIcons: {
    goal: '🏀',
    own_goal: '🏀',
    penalty: '🏀',
    missed_penalty: '✕',
    yellow_card: '🟨',
    red_card: '🟥',
    subst: '🔄',
    two_points: '2️⃣',
    three_points: '3️⃣',
    free_throw: '1️⃣',
    foul: '🚫',
    timeout: '⏱️',
    turnover: '↩️',
  },
  eventLabels: {
    goal: 'Basket',
    own_goal: 'Own Basket',
    penalty: 'Penalty',
    missed_penalty: 'Missed Penalty',
    yellow_card: 'Yellow Card',
    red_card: 'Red Card',
    subst: 'Substitution',
    two_points: '2 PTS',
    three_points: '3 PTS',
    free_throw: 'Free Throw',
    foul: 'Foul',
    timeout: 'Timeout',
    turnover: 'Turnover',
  },
  scoreLabel: 'Puntos',
  periodLabel: 'Quarter',
  periods: 4,
}

export function getSportConfig(sport: Sport): SportConfig {
  switch (sport) {
    case 'basketball':
      return BASKETBALL_CONFIG
    case 'mma':
      return FOOTBALL_CONFIG
    default:
      return FOOTBALL_CONFIG
  }
}