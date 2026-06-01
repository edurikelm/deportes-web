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
  | 'triple'
  | 'two_pointer'
  | 'freethrow'
  | 'assist'
  | 'rebound'
  | 'block'
  | 'steal'
  | 'start'
  | 'end'
  | 'jump_ball'
  | 'substitution'
  | 'knockout'
  | 'submission'
  | 'tko'
  | 'decision'
  | 'round'
  | 'unknown'

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
  quarters?: Array<{ home: number; away: number }>
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
  statusDetail?: string
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
    triple: '',
    two_pointer: '',
    freethrow: '',
    assist: '',
    rebound: '',
    block: '',
    steal: '',
    start: '',
    end: '',
    jump_ball: '',
    substitution: '',
    knockout: '',
    submission: '',
    tko: '',
    decision: '',
    round: '',
    unknown: '',
  },
  eventLabels: {
    goal: 'Gol',
    own_goal: 'Autogol',
    penalty: 'Penal',
    missed_penalty: 'Penal fallado',
    yellow_card: 'Tarjeta amarilla',
    red_card: 'Tarjeta roja',
    subst: 'Sustitución',
    two_points: '',
    three_points: '',
    free_throw: '',
    foul: '',
    timeout: '',
    turnover: '',
    triple: '',
    two_pointer: '',
    freethrow: '',
    assist: '',
    rebound: '',
    block: '',
    steal: '',
    start: '',
    end: '',
    jump_ball: '',
    substitution: '',
    knockout: '',
    submission: '',
    tko: '',
    decision: '',
    round: '',
    unknown: 'Evento',
  },
  scoreLabel: 'Marcador',
  periodLabel: 'Tiempo',
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
    triple: '3️⃣',
    two_pointer: '2️⃣',
    freethrow: '1️⃣',
    assist: '🎯',
    rebound: '📊',
    block: '🚧',
    steal: '🫳',
    start: '▶️',
    end: '⏹️',
    jump_ball: '🏀',
    substitution: '🔄',
    knockout: '',
    submission: '',
    tko: '',
    decision: '',
    round: '',
    unknown: '',
  },
  eventLabels: {
    goal: 'Canasta',
    own_goal: 'Canasta propia',
    penalty: 'Penal',
    missed_penalty: 'Penal fallado',
    yellow_card: 'Tarjeta amarilla',
    red_card: 'Tarjeta roja',
    subst: 'Sustitución',
    two_points: '2 PTS',
    three_points: '3 PTS',
    free_throw: 'Tiro libre',
    foul: 'Falta',
    timeout: 'Tiempo muerto',
    turnover: 'Pérdida',
    triple: '3 PTS',
    two_pointer: '2 PTS',
    freethrow: 'Tiro libre',
    assist: 'Asistencia',
    rebound: 'Rebote',
    block: 'Bloqueo',
    steal: 'Robo',
    start: 'Inicio',
    end: 'Fin',
    jump_ball: 'Salto inicial',
    substitution: 'Sustitución',
    knockout: '',
    submission: '',
    tko: '',
    decision: '',
    round: '',
    unknown: 'Evento',
  },
  scoreLabel: 'Puntos',
  periodLabel: 'Cuarto',
  periods: 4,
}

export const MMA_CONFIG: SportConfig = {
  sport: 'mma',
  eventIcons: {
    goal: '',
    own_goal: '',
    penalty: '',
    missed_penalty: '',
    yellow_card: '',
    red_card: '',
    subst: '',
    two_points: '',
    three_points: '',
    free_throw: '',
    foul: '',
    timeout: '⏱️',
    turnover: '',
    triple: '',
    two_pointer: '',
    freethrow: '',
    assist: '',
    rebound: '',
    block: '',
    steal: '',
    start: '▶️',
    end: '⏹️',
    jump_ball: '',
    substitution: '',
    knockout: '🥊',
    submission: '🧎',
    tko: '🥊',
    decision: '⚖️',
    round: '🔴',
    unknown: '',
  },
  eventLabels: {
    goal: '',
    own_goal: '',
    penalty: '',
    missed_penalty: '',
    yellow_card: '',
    red_card: '',
    subst: '',
    two_points: '',
    three_points: '',
    free_throw: '',
    foul: '',
    timeout: 'Tiempo muerto',
    turnover: '',
    triple: '',
    two_pointer: '',
    freethrow: '',
    assist: '',
    rebound: '',
    block: '',
    steal: '',
    start: 'Inicio del combate',
    end: 'Fin del combate',
    jump_ball: '',
    substitution: '',
    knockout: 'Knockout',
    submission: 'Sumisión',
    tko: 'TKO',
    decision: 'Decisión',
    round: 'Round',
    unknown: 'Evento',
  },
  scoreLabel: 'Resultado',
  periodLabel: 'Round',
  periods: 3,
}

export function getSportConfig(sport: Sport): SportConfig {
  switch (sport) {
    case 'basketball':
      return BASKETBALL_CONFIG
    case 'mma':
      return MMA_CONFIG
    case 'football':
      return FOOTBALL_CONFIG
    default:
      const _exhaustive: never = sport
      return _exhaustive
  }
}
