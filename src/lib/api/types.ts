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
  }
  score?: {
    home: number
    away: number
    ht?: {
      home: number
      away: number
    }
  }
  events?: Array<{
    id: string
    type: string
    time: number
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
