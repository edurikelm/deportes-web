# PRD — Deportes Web

## 1. Concept & Vision

Plataforma web para visualizar partidos de fútbol en tiempo real. Experiencia mobile-first, dark mode por defecto, similar a Flashscore pero más limpia. El usuario puede ver partidos de hoy, en vivo, resultados y detalle de cada partido con timeline de eventos y links de streaming.

## 2. Design Language

### Aesthetic Direction
Sports dark — inspirado en Flashscore/Sofascore. Minimalista, muy visual, navegação rápida.

### Color Palette
- **Background:** `#0a0a0a` (near-black)
- **Surface:** `#141414` (cards)
- **Border:** `#262626`
- **Text Primary:** `#fafafa`
- **Text Secondary:** `#a1a1a1`
- **Accent (live):** `#ef4444` (red pulse)
- **Success:** `#22c55e`
- **League colors:** Paleta por league (Premier League = `#3d1959`, La Liga = `#ee8707`, etc.)

### Typography
- **Headlines:** Inter (bold)
- **Body:** Inter (regular)
- **Monospace (scores):** JetBrains Mono

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Cards: 16px padding, 8px border-radius
- Grid gap: 16px

### Motion Philosophy
- Skeleton loaders durante fetch (pulse animation)
- Transiciones suaves de 150ms para state changes
- Live indicator: pulse animation rojo cada 2s
- No motion gratuitous — funcionalidad primero

## 3. Layout & Structure

### Page Architecture

```
/                    → Home (partidos del día)
/live                → En Vivo (filtro auto de status=live)
/match/[id]          → Detalle de partido
```

### Navigation
- Bottom tab bar en mobile: Home | En Vivo | Search
- Desktop: top header con tabs y search input

### Responsive Strategy
- Mobile-first (< 640px): single column, cards full-width
- Tablet (640-1024px): 2-column grid
- Desktop (> 1024px): 3-column grid, sidebar filters

### Content Flow
- Home: tabs de estado (Todos / En Vivo / Finalizados) + filtros de league
- Match Detail: score header → timeline → stream links

## 4. Features & Interactions

### Core Features

#### Home — Partidos del día
- Lista de partidos ordenados por hora
- Tabs de estado: Todos | En Vivo | Finalizados
- Filtro por league (dropdown)
- Pull-to-refresh en mobile
- Empty state si no hay partidos

#### En Vivo
- Página dedicada con filtro status=live
- Live indicator animado en cada card
- Auto-refresh cada 30s (polling)
- Si no hay partidos live: mensaje + sugerir Home

#### Match Detail
- Score principal (home vs away, resultado actual)
- Half-time score si existe
- Minuto actual (solo live)
- Timeline de eventos (goals, cards, substitutions)
- Lista de stream links (TV channels + streaming platforms)
- Botón de back + share

#### Búsqueda (integrada en Home)
- Input con debounce 300ms
- Búsqueda por nombre de equipo
- Dropdown con hasta 5 resultados
- Fecha: tabs "Hoy" / "Ayer" / "Mañana" + date picker
- Filtro league dropdown

### Error Handling
- API timeout → mensaje + retry button
- Rate limit → retry automático con backoff exponencial (30s → 60s → 120s → mensaje final)
- Sin conexión → mensaje + usar cache si existe
- Logo fallback → placeholder genérico

### States
- **Loading:** Skeleton cards con pulse animation
- **Empty:** Ilustración + mensaje contextual ("No hay partidos hoy")
- **Error:** Mensaje + retry button
- **Rate limited:** Countdown + auto-retry

## 5. Component Inventory

### Molecules

| Component | Appearance | States |
|-----------|------------|--------|
| `MatchCard` | Logo equipo, nombre, score/hora, badge league, status | default, live (pulse), loading (skeleton) |
| `LeagueBadge` | Logo league + nombre, accent bar con color de league | default, compact (solo logo) |
| `TeamLogo` | Logo con fallback a inicial | loaded, loading (spinner), error (placeholder) |
| `StatusBadge` | Texto + color según status | live (red pulse), upcoming (gray), finished (green) |
| `ScoreDisplay` | Resultado "2 - 1" + HT si existe | live, finished, upcoming (show time) |
| `LiveIndicator` | Badge "LIVE" con animación pulse | active |

### Organisms

| Component | Description |
|-----------|-------------|
| `MatchList` | Grid responsive de MatchCards, soportando filtros y tabs |
| `MatchTimeline` | Lista de eventos ordenados por minuto, agrupados por half |
| `StreamLinks` | Lista de canales/streaming con iconos y links externos |
| `SearchBar` | Input + dropdown con resultados de búsqueda por equipo |

### Pages

| Page | Layout |
|------|--------|
| `Home` | Tabs (Todos/En Vivo/Finalizados) + MatchList + filtros |
| `Live` | Header "En Vivo" + MatchList filtrado |
| `MatchDetail` | Score header → Timeline → StreamLinks |

## 6. Technical Approach

### Stack
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **API:** Next.js API Routes como proxy
- **Data source:** API-Football (tier gratuito, 100 req/day)
- **Deployment:** Vercel

### Architecture

```
Browser → Next.js API Route /api/matches?sport={sport}
                ↓
         SportDataAdapter (seleccionado por ?sport=)
                ↓
         fetchWithCache (compartido, TTL según status)
                ↓
         Normalizer (raw → internal Match shape)
                ↓
         Response con Cache headers
```

Tres adaptadores implementan `SportDataAdapter`:
- Football → `v3.football.api-sports.io`
- Basketball → `v2.nba.api-sports.io`
- MMA → `v1.mma.api-sports.io`

Un solo endpoint (`/api/matches`) sirve los 3 deportes via `?sport=` param. Las rutas legacy `/api/matches/basketball` y `/api/matches/mma` redirigen al endpoint unificado.

### API Design

**Endpoint:** `GET /api/matches`

**Query params:**
- `sport`: `football` | `basketball` | `mma` (default: `football`)
- `date`: `YYYY-MM-DD` (default: today)
- `status`: `live` | `finished` | `upcoming` (optional, para filtros)
- `league_id`: ID numérico (optional)
- `team_id`: ID numérico (optional)

**Response:**
```json
{
  "matches": [...],
  "meta": {
    "total": 42,
    "cached": true,
    "cache_age": 120
  }
}
```

### Data Model

```ts
type MatchStatus = 'upcoming' | 'live' | 'finished'

type Match = {
  id: string
  homeTeam: { id: string; name: string; logo: string }
  awayTeam: { id: string; name: string; logo: string }
  status: MatchStatus
  startTime: string // ISO 8601
  minute?: number // solo para live
  league: { id: string; name: string; country: string; logo: string }
  score?: { home: number; away: number; ht?: { home: number; away: number } }
  events: MatchEvent[]
  streamLinks: StreamLink[]
}

type MatchEvent = {
  type: 'goal' | 'own_goal' | 'penalty' | 'missed_penalty' | 'yellow_card' | 'red_card' | 'subst'
  minute: number
  player?: string
  team?: 'home' | 'away'
  assist?: string
}

type StreamLink = {
  type: 'tv' | 'stream'
  name: string
  url?: string
}
```

### Caching Strategy

| Status | Cache-Control | TTL |
|--------|---------------|-----|
| live | stale-while-revalidate | 60s |
| upcoming | stale-while-revalidate | 300s |
| finished | stale-while-revalidate | 900s |

Rationale: Tier gratuito tiene 100 req/day. Con cache, ~400-500 requests pueden servir ~10,000 páginas view.

### Polling (Live Matches)

- Solo en `/live` y `/match/[id]`
- Interval: 30s
- No polling cuando tab no está visible (Page Visibility API)
- Si falla por rate limit: backoff exponencial con mensaje al usuario

### Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Football (wrapper → SportPage)
│   ├── basketball/
│   │   └── page.tsx             # Basketball (wrapper → SportPage)
│   ├── mma/
│   │   └── page.tsx             # MMA (wrapper → SportPage)
│   ├── live/
│   │   └── page.tsx             # En Vivo
│   ├── match/
│   │   └── [id]/
│   │       └── page.tsx         # Match Detail
│   └── api/
│       └── matches/
│           ├── route.ts         # API proxy unificado (?sport=)
│           ├── basketball/      # redirige a ?sport=basketball
│           └── mma/             # redirige a ?sport=mma
├── components/
│   ├── sport/
│   │   └── SportPage.tsx        # Página unificada parametrizada por deporte
│   ├── ui/                      # shadcn/ui base
│   ├── match/
│   │   ├── MatchCard.tsx
│   │   ├── MatchCardSkeleton.tsx
│   │   ├── MatchList.tsx
│   │   ├── MatchTimeline.tsx
│   │   ├── LiveIndicator.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── ErrorState.tsx
│   │   └── RateLimitState.tsx
│   ├── league/
│   │   └── LeagueBadge.tsx
│   ├── team/
│   │   └── TeamLogo.tsx
│   ├── navigation/
│   │   ├── BottomNav.tsx
│   │   └── TopHeader.tsx
│   └── search/
│       └── SearchBar.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts            # fetchWithCache compartido
│   │   ├── types.ts             # API-football wire types
│   │   ├── normalizer.ts        # raw football → internal Match
│   │   ├── sportDataAdapter.ts  # interfaz SportDataAdapter
│   │   ├── adapterRegistry.ts   # mapeo Sport → adapter
│   │   ├── footballAdapter.ts   # implementación football
│   │   ├── basketball.ts        # implementación basketball
│   │   └── mma.ts               # implementación MMA
│   ├── sportPageConfig.ts       # config por deporte (endpoint, leagues, branding)
│   ├── mock-data.ts             # mocks consolidados de los 3 deportes
│   ├── types.ts                 # tipos internos compartidos (Match, Sport, etc)
│   └── utils.ts                 # cn(), isSportActive()
└── hooks/
    └── useMatchPolling.ts       # polling con pause por visibility + rate limit info
```

## 7. Out of Scope (v1)

- Autenticación / usuarios
- Favoritos persistidos
- Base de datos (Supabase no se usa por ahora)
- Notificaciones push
- PWA offline completo
- Share de favoritos entre usuarios
- Estadísticas avanzadas de equipo
- Partidos de otros deportes fuera de football, basketball, MMA

## 8. Success Metrics (v1)

- Primera vista (Home) carga en < 2s
- Skeleton visible instantáneamente (loading state)
- 0 errores de rate limit en uso normal de dev
- Layout responsive sin scroll horizontal en mobile