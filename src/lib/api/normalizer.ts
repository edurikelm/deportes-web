import type { Match, MatchEvent, StreamLink } from '@/lib/types'
import type { ApiFootballMatch } from './types'

export function normalizeMatch(raw: ApiFootballMatch): Match {
  let status = mapStatus(raw.status.code)

  const startTime = new Date(raw.startTime)
  const now = new Date()

  if (status === 'upcoming' && startTime <= now) {
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000)
    if (elapsedMinutes >= 90) {
      status = 'finished'
    } else if (elapsedMinutes >= 0) {
      status = 'live'
    }
  }

  return {
    id: String(raw.id),
    homeTeam: {
      id: String(raw.homeTeam.id),
      name: raw.homeTeam.name,
      shortName: raw.homeTeam.shortName,
      logo: raw.homeTeam.logo,
    },
    awayTeam: {
      id: String(raw.awayTeam.id),
      name: raw.awayTeam.name,
      shortName: raw.awayTeam.shortName,
      logo: raw.awayTeam.logo,
    },
    status,
    startTime: raw.startTime,
    minute: status === 'live' ? extractMinute(raw.status.description) : undefined,
    league: {
      id: String(raw.tournament.id),
      name: raw.tournament.name,
      country: raw.tournament.country,
      logo: raw.tournament.logo,
      color: '#262626',
    },
    score: (status === 'live' || status === 'finished') && raw.score ? {
      home: raw.score.home ?? 0,
      away: raw.score.away ?? 0,
      ht: raw.score.ht,
    } : undefined,
    events: normalizeEvents(raw.events || []),
    streamLinks: normalizeStreamLinks(raw.streamLinks || []),
  }
}

function mapStatus(code: string): Match['status'] {
  switch (code) {
    case '1H':
    case '2H':
    case 'ET':
    case 'P':
    case 'inprogress':
    case 'halftime':
      return 'live'
    case 'FT':
    case 'AET':
    case 'PEN':
    case 'finished':
    case 'canceled':
    case 'postponed':
      return 'finished'
    default:
      return 'upcoming'
  }
}

function extractMinute(description: string): number | undefined {
  if (!description) return undefined
  const match = description.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

function normalizeEvents(events: ApiFootballMatch['events']): MatchEvent[] {
  return (events || []).map((e) => ({
    type: mapEventType(e.type),
    minute: e.time,
    player: e.player?.name,
    team: e.team?.id ? 'home' : 'away',
    assist: e.assist?.name,
    comment: e.comment,
  }))
}

function mapEventType(type: string): MatchEvent['type'] {
  const map: Record<string, MatchEvent['type']> = {
    goal: 'goal',
    own_goal: 'own_goal',
    penalty: 'penalty',
    missed_penalty: 'missed_penalty',
    yellow_card: 'yellow_card',
    red_card: 'red_card',
    substitution: 'subst',
  }
  return map[type] || 'goal'
}

function normalizeStreamLinks(links: ApiFootballMatch['streamLinks']): StreamLink[] {
  return (links || []).map((l) => ({
    type: l.streamType === 'tv' ? 'tv' : 'stream',
    name: l.name,
    url: l.link,
  }))
}
