import type { Lineup, LineupPlayer, Match, MatchEvent, Sport, StreamLink, Team, TeamLineup } from '@/lib/types'
import type { ApiFootballMatch, ApiFootballTeamLineup } from './types'

type ApiFootballEventTime = NonNullable<ApiFootballMatch['events']>[number]['time']

export function normalizeMatch(raw: ApiFootballMatch, sport: Sport = 'football'): Match {
  let status = mapStatus(raw.status.code)

  const startTime = new Date(raw.startTime)
  const now = new Date()

  if (status === 'upcoming' && startTime <= now) {
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000)
    if (elapsedMinutes >= 0) {
      status = 'live'
    }
  }

  return {
    id: String(raw.id),
    sport,
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
    minute: status === 'live' ? raw.status.elapsed ?? undefined : undefined,
    statusDetail: status === 'live' ? raw.status.code : undefined,
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
    events: normalizeEvents(raw.events || [], raw.homeTeam.id, raw.awayTeam.id),
    streamLinks: normalizeStreamLinks(raw.streamLinks || []),
  }
}

function mapStatus(code: string): Match['status'] {
  switch (code) {
    case '1H':
    case '2H':
    case 'ET':
    case 'P':
    case 'BT':
    case 'LIVE':
    case 'HT':
    case 'INT':
    case 'SUSP':
    case 'inprogress':
    case 'halftime':
      return 'live'
    case 'FT':
    case 'AET':
    case 'PEN':
    case 'WO':
    case 'CANC':
    case 'ABD':
    case 'AWD':
    case 'finished':
    case 'canceled':
    case 'postponed':
      return 'finished'
    default:
      return 'upcoming'
  }
}
function normalizeEvents(events: ApiFootballMatch['events'], homeTeamId?: number, awayTeamId?: number): MatchEvent[] {
  return (events || []).map((e) => ({
    type: mapEventType(e.type, e.detail),
    minute: normalizeEventMinute(e.time),
    player: e.player?.name,
    team: e.team?.id === awayTeamId ? 'away' : 'home',
    assist: e.assist?.name,
    comment: e.comment,
  }))
}

function normalizeEventMinute(time: ApiFootballEventTime): number {
  if (typeof time === 'number') return time
  if (!time) return 0
  return (time.elapsed ?? 0) + (time.extra ?? 0)
}

function mapEventType(type: string, detail?: string | null): MatchEvent['type'] {
  const normalizedType = type.toLowerCase()
  const normalizedDetail = detail?.toLowerCase()

  if (normalizedType === 'own_goal') return 'own_goal'
  if (normalizedType === 'penalty') return 'penalty'
  if (normalizedType === 'missed_penalty') return 'missed_penalty'
  if (normalizedType === 'yellow_card') return 'yellow_card'
  if (normalizedType === 'red_card') return 'red_card'

  if (normalizedType === 'goal') {
    if (normalizedDetail === 'penalty') return 'penalty'
    if (normalizedDetail === 'own goal') return 'own_goal'
    if (normalizedDetail === 'missed penalty') return 'missed_penalty'
    return 'goal'
  }

  if (normalizedType === 'card') {
    if (normalizedDetail === 'red card') return 'red_card'
    return 'yellow_card'
  }

  if (normalizedType === 'subst' || normalizedType === 'substitution') return 'subst'

  return 'unknown'
}

function normalizeStreamLinks(links: ApiFootballMatch['streamLinks']): StreamLink[] {
  return (links || []).map((l) => ({
    type: l.streamType === 'tv' ? 'tv' : 'stream',
    name: l.name,
    url: l.link,
  }))
}

function normalizeLineupPlayer(raw: ApiFootballTeamLineup['startXI'][number]): LineupPlayer {
  return {
    id: String(raw.player.id ?? `${raw.player.name}-${raw.player.number}`),
    name: raw.player.name,
    number: raw.player.number,
    pos: raw.player.pos ?? undefined,
    grid: raw.player.grid ?? undefined,
  }
}

function normalizeTeamLineup(raw: ApiFootballTeamLineup): TeamLineup {
  const team: Team = {
    id: String(raw.team.id),
    name: raw.team.name,
    logo: raw.team.logo,
  }

  return {
    team,
    formation: raw.formation || '',
    coach: raw.coach?.name ?? undefined,
    startXI: (raw.startXI || []).map(normalizeLineupPlayer),
    substitutes: (raw.substitutes || []).map(normalizeLineupPlayer),
  }
}

export function normalizeLineup(
  lineups: ApiFootballTeamLineup[],
  homeTeamId: string,
  awayTeamId: string,
): Lineup | undefined {
  if (!lineups || lineups.length < 2) return undefined

  const rawHome = lineups.find((l) => String(l.team.id) === homeTeamId)
  const rawAway = lineups.find((l) => String(l.team.id) === awayTeamId)

  if (!rawHome || !rawAway) return undefined

  return {
    home: normalizeTeamLineup(rawHome),
    away: normalizeTeamLineup(rawAway),
  }
}
