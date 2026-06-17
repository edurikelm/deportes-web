# YouTube Data API para highlights dinámicos de jugadas

## Context

Los eventos de partido (goles, tarjetas, etc.) en el timeline carecen de video clips. La API-Football v3 provee eventos textuales (`/fixtures/events`) pero **no incluye URLs de video**. Queremos que el modal de jugada destacada pueda reproducir un video de la jugada.

**Status**: accepted

## Decision

Integrar YouTube Data API v3 como fuente dinámica de video highlights. Cuando un usuario abre el modal de una jugada que no tiene `videoUrl` preexistente, el frontend llama a `/api/highlights` que busca en YouTube por equipo + minuto + tipo de evento.

**Flujo:**

```
Usuario hace click en icono de gol
    ↓
HighlightModal detecta que event.videoUrl es undefined
    ↓
GET /api/highlights?homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal
    ↓
Server: searchHighlightVideo() construye query, llama YouTube Data API
    ↓
YouTube devuelve hasta 8 resultados
    ↓
Scoring heurístico: canal preferido + minuto en título + fecha reciente
    ↓
Retorna videoUrl del mejor match
    ↓
Modal muestra iframe embebido
```

## Considered Options

| Opción | Pros | Cons | Decisión |
|---|---|---|---|
| **API-Football incluye video** | Misma API, sin costo | No existe endpoint de video en v3 | ❌ No disponible |
| **YouTube Data API** | Gratuito (10k unidades/día), catálogo masivo, embed directo | Requiere API key, resultados no siempre exactos, cuota limitada | ✅ Elegido |
| **WSC Sports / Minute Media** | Clips automatizados de alta calidad | Enterprise, costoso, contrato requerido | ❌ Fuera de presupuesto |
| **Scraping de redes sociales** | Contenido nativo, reciente | Legalmente riesgoso, frágil, contra ToS | ❌ Rechazado |
| **URLs hardcodeadas en mock data** | Cero costo, control total | Manual, no escalable, obsoleto rápido | ❌ Solo para demo |

## Scoring heuristic

Para mitigar el problema de resultados irrelevantes de YouTube, implementamos un scoring multi-factor:

| Factor | Peso | Racional |
|---|---|---|
| Canal preferido (ESPN, Sky Sports, beIN, etc.) | +50 | Canales deportivos oficiales suben highlights reales |
| Minuto exacto en el título (ej: `"23'"`) | +20 | Indica que el video es del momento específico |
| Fecha reciente (< 7 días) | +15 | Partidos actuales tienen highlights recientes |
| Fecha < 30 días | +8 | Aún relevante |
| Keyword `goal` / `gol` / `highlight` en título | +10 | Confirma que es un highlight |

Los resultados se ordenan por score descendente y se selecciona el mejor.

## Architecture

```
Frontend (MatchTimeline.tsx)
    ↓ props: homeTeamName, awayTeamName
HighlightModal
    ↓ fetch /api/highlights
API Route (app/api/highlights/route.ts)
    ↓ calls searchHighlightVideo()
youtube.ts utility
    ↓ YouTube Data API v3 /search
    ← scoring + caching
```

**Cache:** Map en memoria (1h TTL) para evitar llamadas repetidas a YouTube por la misma jugada.

**Embed URL:** `https://www.youtube.com/embed/{videoId}?rel=0&modestbranding=1` (evita recomendaciones irrelevantes).

## Configuration

```bash
# .env.local
API_FOOTBALL_API_KEY=your_api_football_key
YOUTUBE_API_KEY=your_youtube_data_api_key
```

## Consequences

- **Pros:** Los usuarios ven highlights reales sin costo adicional de API
- **Pros:** El modelo `MatchEvent` ya tiene `videoUrl` y `videoThumbnail` — si un día otra API provee videos directamente, no cambia la UI
- **Cons:** Depende de que YouTube tenga highlights indexados para el partido específico
- **Cons:** La cuota gratuita (10k unidades/día) puede agotarse con tráfico alto. El cache mitiga esto
- **Cons:** Resultados no garantizados — si no hay match, el modal simplemente no muestra video (graceful degradation)

## Files involved

| Archivo | Rol |
|---|---|
| `src/lib/api/youtube.ts` | Utilidad de búsqueda, scoring y cache |
| `src/app/api/highlights/route.ts` | API endpoint que expone la búsqueda al frontend |
| `src/components/match/MatchTimeline.tsx` | HighlightModal con lógica de fetch condicional |
| `src/lib/types.ts` | `MatchEvent` incluye `videoUrl?` y `videoThumbnail?` |
| `.env.local` | `YOUTUBE_API_KEY` |

## Next Steps / Future

- Evaluar agregar `videoDuration=short` a la query de YouTube para priorizar clips cortos (< 4 min)
- Considerar filtrar por `videoCategoryId=17` (Sports) si la precisión mejora
- Si la cuota se agota frecuentemente, evaluar cache Redis o Supabase para persistir resultados
