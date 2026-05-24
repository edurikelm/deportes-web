import type { StreamLink } from './types'

const CHILE_STREAMING_LINKS: Record<string, StreamLink[]> = {
  '265': [
    { type: 'tv', name: 'TNT Sports' },
    { type: 'stream', name: 'Estadio TNT' },
  ],
  '13': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Star+' },
  ],
  '11': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Star+' },
  ],
  '39': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Disney+' },
  ],
  '140': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Disney+' },
  ],
  '78': [
    { type: 'tv', name: 'ESPN' },
  ],
  '135': [
    { type: 'tv', name: 'ESPN' },
  ],
  '61': [
    { type: 'tv', name: 'ESPN' },
  ],
  '128': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Star+' },
  ],
  '71': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Star+' },
  ],
  '262': [
    { type: 'tv', name: 'ESPN' },
    { type: 'stream', name: 'Star+' },
  ],
}

export function resolveStreamLinks(leagueId: string): StreamLink[] | null {
  return CHILE_STREAMING_LINKS[leagueId] ?? null
}
