'use client'

import type { MatchEvent, MatchEventType, SportConfig } from '@/lib/types'
import { FOOTBALL_CONFIG } from '@/lib/types'

interface MatchTimelineProps {
  events: MatchEvent[]
  sportConfig?: SportConfig
}

const defaultEventIcons: Record<MatchEventType, { icon: string; color: string }> = {
  goal: { icon: '⚽', color: '#22c55e' },
  own_goal: { icon: '⚽', color: '#ef4444' },
  penalty: { icon: '⚽', color: '#22c55e' },
  missed_penalty: { icon: '✕', color: '#ef4444' },
  yellow_card: { icon: '🟨', color: '#eab308' },
  red_card: { icon: '🟥', color: '#ef4444' },
  subst: { icon: '🔄', color: '#3b82f6' },
  two_points: { icon: '2️⃣', color: '#22c55e' },
  three_points: { icon: '3️⃣', color: '#22c55e' },
  free_throw: { icon: '1️⃣', color: '#22c55e' },
  foul: { icon: '🚫', color: '#ef4444' },
  timeout: { icon: '⏱️', color: '#3b82f6' },
  turnover: { icon: '↩️', color: '#ef4444' },
  triple: { icon: '3️⃣', color: '#22c55e' },
  two_pointer: { icon: '2️⃣', color: '#22c55e' },
  freethrow: { icon: '1️⃣', color: '#22c55e' },
  assist: { icon: '🎯', color: '#3b82f6' },
  rebound: { icon: '📊', color: '#3b82f6' },
  block: { icon: '🚧', color: '#3b82f6' },
  steal: { icon: '🫳', color: '#3b82f6' },
  start: { icon: '▶️', color: '#22c55e' },
  end: { icon: '⏹️', color: '#ef4444' },
  jump_ball: { icon: '🏀', color: '#3b82f6' },
  substitution: { icon: '🔄', color: '#3b82f6' },
  knockout: { icon: '🥊', color: '#ef4444' },
  submission: { icon: '🧎', color: '#ef4444' },
  tko: { icon: '🥊', color: '#ef4444' },
  decision: { icon: '⚖️', color: '#3b82f6' },
  round: { icon: '🔴', color: '#3b82f6' },
  unknown: { icon: '•', color: '#666' },
}

function EventItem({ event, sportConfig }: { event: MatchEvent; sportConfig: SportConfig }) {
  const eventInfo = sportConfig.eventIcons[event.type]
    ? { icon: sportConfig.eventIcons[event.type], color: defaultEventIcons[event.type]?.color || '#22c55e' }
    : defaultEventIcons[event.type]
  const isHomeEvent = event.team === 'home'

  return (
    <div className={`flex items-start gap-4 ${isHomeEvent ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${eventInfo.color}20` }}
      >
        <span className="text-lg">{eventInfo.icon}</span>
      </div>

      <div className={`flex flex-1 flex-col ${isHomeEvent ? 'items-start' : 'items-end'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {sportConfig.eventLabels[event.type] || event.type}
          </span>
          <span className="rounded bg-[#262626] px-1.5 py-0.5 text-xs font-mono text-[#a1a1a1]">
            {event.minute}&apos;
          </span>
        </div>

        <div className="flex items-center gap-2">
          {event.player && (
            <span className="text-xs text-[#a1a1a1]">{event.player}</span>
          )}
          {event.assist && (
            <span className="text-xs text-[#666]">Asistencia: {event.assist}</span>
          )}
          {event.comment && (
            <span className="text-xs text-[#666]">{event.comment}</span>
          )}
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <span className="text-xs font-mono text-[#666]">
          {event.minute}&apos;
        </span>
      </div>
    </div>
  )
}

export function MatchTimeline({ events, sportConfig = FOOTBALL_CONFIG }: MatchTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-[#666]">No hay eventos en este partido</span>
      </div>
    )
  }

  const isBasketball = sportConfig.sport === 'basketball'

  if (isBasketball) {
    const quarterLabels = ['C1', 'C2', 'C3', 'C4']
    const periodEvents = quarterLabels.map((label, idx) => ({
      label,
      events: events
        .filter(e => Math.floor(e.minute / 12) === idx)
        .sort((a, b) => a.minute - b.minute),
    }))

    return (
      <div className="flex flex-col gap-6">
        {periodEvents.map(({ label, events: periodEventsList }) => (
          <div key={label} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#a1a1a1]">{label}</span>
              <div className="h-px flex-1 bg-[#262626]" />
            </div>
            <div className="flex flex-col gap-4">
              {periodEventsList.map((event, idx) => (
                <EventItem key={`${label}-${idx}`} event={event} sportConfig={sportConfig} />
              ))}
              {periodEventsList.length === 0 && (
                <span className="text-xs text-[#666]">Sin eventos</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const firstHalfEvents = events.filter(e => e.minute <= 45).sort((a, b) => a.minute - b.minute)
  const secondHalfEvents = events.filter(e => e.minute > 45).sort((a, b) => a.minute - b.minute)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#a1a1a1]">Primera Parte</span>
          <div className="h-px flex-1 bg-[#262626]" />
        </div>
        <div className="flex flex-col gap-4">
          {firstHalfEvents.map((event, idx) => (
            <EventItem key={`ht-${idx}`} event={event} sportConfig={sportConfig} />
          ))}
          {firstHalfEvents.length === 0 && (
            <span className="text-xs text-[#666]">Sin eventos</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#a1a1a1]">Segunda Parte</span>
          <div className="h-px flex-1 bg-[#262626]" />
        </div>
        <div className="flex flex-col gap-4">
          {secondHalfEvents.map((event, idx) => (
            <EventItem key={`st-${idx}`} event={event} sportConfig={sportConfig} />
          ))}
          {secondHalfEvents.length === 0 && (
            <span className="text-xs text-[#666]">Sin eventos</span>
          )}
        </div>
      </div>
    </div>
  )
}
