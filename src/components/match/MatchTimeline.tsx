'use client'

import type { MatchEvent, MatchEventType } from '@/lib/types'

interface MatchTimelineProps {
  events: MatchEvent[]
}

const eventIcons: Record<MatchEventType, { icon: string; color: string }> = {
  goal: { icon: '⚽', color: '#22c55e' },
  own_goal: { icon: '⚽', color: '#ef4444' },
  penalty: { icon: '⚽', color: '#22c55e' },
  missed_penalty: { icon: '✕', color: '#ef4444' },
  yellow_card: { icon: '🟨', color: '#eab308' },
  red_card: { icon: '🟥', color: '#ef4444' },
  subst: { icon: '🔄', color: '#3b82f6' },
}

function EventItem({ event }: { event: MatchEvent }) {
  const eventInfo = eventIcons[event.type]
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
          {isHomeEvent && (
            <span className="text-sm font-semibold text-white">{event.player}</span>
          )}
          {!isHomeEvent && (
            <span className="text-sm font-semibold text-white">{event.player}</span>
          )}
          <span className="rounded bg-[#262626] px-1.5 py-0.5 text-xs font-mono text-[#a1a1a1]">
            {event.minute}&apos;
          </span>
        </div>

        <div className="flex items-center gap-2">
          {event.assist && (
            <span className="text-xs text-[#666]">Assist: {event.assist}</span>
          )}
          {event.comment && (
            <span className="text-xs text-[#666]">{event.comment}</span>
          )}
        </div>

        {!isHomeEvent && event.player && (
          <span className="text-sm font-semibold text-white">{event.player}</span>
        )}
        {isHomeEvent && event.player && (
          <span className="text-sm font-semibold text-white">{event.player}</span>
        )}
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <span className="text-xs font-mono text-[#666]">
          {event.minute}&apos;
        </span>
      </div>
    </div>
  )
}

export function MatchTimeline({ events }: MatchTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-[#666]">No hay eventos en este partido</span>
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
            <EventItem key={`ht-${idx}`} event={event} />
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
            <EventItem key={`st-${idx}`} event={event} />
          ))}
          {secondHalfEvents.length === 0 && (
            <span className="text-xs text-[#666]">Sin eventos</span>
          )}
        </div>
      </div>
    </div>
  )
}
