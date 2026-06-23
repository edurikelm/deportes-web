export interface ApiFootballMatch {
  id: number
  tournament: {
    id: number
    name: string
    slug: string
    country: string
    logo: string
  }
  homeTeam: {
    id: number
    name: string
    shortName: string
    logo: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    logo: string
  }
  startTime: string
  status: {
    code: string
    description: string
    elapsed?: number | null
  }
  score?: {
    home: number | null
    away: number | null
    ht?: {
      home: number
      away: number
    }
  }
  events?: Array<{
    id: string
    type: string
    detail?: string | null
    time?: number | { elapsed?: number | null; extra?: number | null } | null
    player?: {
      name: string
    }
    team?: {
      id: number
      name?: string
    }
    assist?: {
      name: string
    }
    comment?: string
  }>
  streamLinks?: Array<{
    id: string
    streamType: string
    name: string
    link?: string
  }>
}

export interface ApiFootballResponse {
  data: {
    events: ApiFootballMatch[]
  }
  meta: {
    cached: boolean
    cacheAge: number
  }
}

export interface ApiFootballLineupPlayer {
  player: {
    id: number | null
    name: string
    number: number
    pos?: string | null
    grid?: string | null
  }
}

export interface ApiFootballTeamLineup {
  team: {
    id: number
    name: string
    logo: string
  }
  formation?: string | null
  startXI: ApiFootballLineupPlayer[]
  substitutes: ApiFootballLineupPlayer[]
  coach?: {
    id?: number | null
    name?: string | null
    photo?: string | null
  } | null
}

export interface ApiFootballLineupsResponse {
  response?: ApiFootballTeamLineup[]
  errors?: Record<string, unknown>
}
