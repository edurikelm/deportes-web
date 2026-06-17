import { NextRequest, NextResponse } from 'next/server'
import { searchHighlightVideo, getYouTubeEmbedUrl, type HighlightSearchContext } from '@/lib/api/youtube'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const matchId = searchParams.get('matchId')
  const homeTeam = searchParams.get('homeTeam')
  const awayTeam = searchParams.get('awayTeam')
  const minute = searchParams.get('minute')
  const eventType = searchParams.get('eventType') || undefined
  const startTime = searchParams.get('startTime')
  const leagueName = searchParams.get('leagueName')
  const leagueCountry = searchParams.get('leagueCountry')
  const player = searchParams.get('player') || undefined
  const eventTeam = (searchParams.get('eventTeam') as 'home' | 'away' | null) || undefined

  const missing = [matchId, homeTeam, awayTeam, startTime, leagueName, leagueCountry]
    .filter(v => !v)
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required params: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const minuteNum = minute ? parseInt(minute, 10) : undefined
  if (minute && isNaN(minuteNum!)) {
    return NextResponse.json(
      { error: 'minute must be a number' },
      { status: 400 }
    )
  }

  try {
    const ctx: HighlightSearchContext = {
      matchId: matchId!,
      homeTeam: homeTeam!,
      awayTeam: awayTeam!,
      minute: minuteNum,
      eventType,
      startTime: startTime!,
      leagueName: leagueName!,
      leagueCountry: leagueCountry!,
      player,
      eventTeam,
    }

    const result = await searchHighlightVideo(ctx)

    if (!result) {
      return NextResponse.json({ videoUrl: null, thumbnail: null, title: null })
    }

    return NextResponse.json({
      videoUrl: getYouTubeEmbedUrl(result.videoId),
      thumbnail: result.thumbnail,
      title: result.title,
    })
  } catch (err) {
    console.error('[Highlights API] Error:', err)
    return NextResponse.json(
      { error: 'Failed to search highlight video' },
      { status: 500 }
    )
  }
}
