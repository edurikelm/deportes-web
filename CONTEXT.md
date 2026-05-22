# Context — Deportes Web

## Domain Terms

### Match (Partido)
Evento deportivo entre dos equipos. Tiene estados: `upcoming` (por jugar), `live` (en curso), `finished` (finalizado). Contiene score, timeline de eventos, y links de streaming. Cada match tiene un `sport` explícito: `'football' | 'basketball' | 'mma'`.

### Team (Equipo)
Entidad con `id`, `name`, `logo`. No se persiste en DB — se consume de API-Football en tiempo real. `shortName` existe en el modelo para uso en mobile/espacios reducidos.

### League (Liga)
Competencia footballística (Premier League, La Liga, etc). Tiene `id`, `name`, `country`, `logo`. Cada league tiene un color de acento para identidad visual.

### MatchEvent (Evento de Partido)
Gol, tarjeta amarilla/roja, penal, sustitución para fútbol. Para otros deportes, campos opcionales genéricos (`extra?: Record<string, unknown>`) permiten flexibilidad. Tipo, minuto, jugador, equipo. No todos los partidos tienen eventos — campo opcional.

### StreamLink (Link de Streaming)
Canal de TV o plataforma de streaming donde transmite el partido. Tipo: `tv` | `stream`. Nombre: "ESPN", "Star+", "Canal+".

### StatusBadge (Indicador de Estado)
Badge visual que muestra el estado del partido: "LIVE" (pulso rojo), "Upcoming" (gris), "FT" (verde).

### Home
Vista principal que lista partidos del día. Filtros: tabs de estado + dropdown de league.

### Live
Vista dedicada a partidos en vivo (status=live). Auto-refresh cada 30s.

## Out of Scope

- Favoritos (no se persisten, no se implementan en v1)
- Autenticación / usuarios
- Base de datos (Supabase no se usa en v1)
- Notificaciones push

## Architecture — Multi-Sport

### Sport
Campo explícito en Match: `'football' | 'basketball' | 'mma'`. Cada deporte se resuelve por URL (`/`, `/basketball`, `/mma`) y se pasa como parámetro a módulos compartidos.

### SportPage
Módulo de página único parametrizado por `Sport`. Unifica tabs, polling, skeleton, y búsqueda que antes estaban duplicados 3x. Cada ruta es un wrapper fino que pasa el identificador de deporte.

### SportDataAdapter
Interfaz que abstrae el fetching de partidos por deporte: `fetchFixtures(date, isLive) => Promise<Match[]>`. Cada deporte implementa su adapter (football → API-Football v3, basketball → NBA API, MMA → MMA API). La API route delega al adapter según `?sport=` — un solo endpoint en vez de tres.

### Cache compartido
`fetchWithCache` vive en un módulo único. Los adapters lo importan con un `serviceName` para diferenciar logs. TTL: live=10s, normal=60s, eventos=120s. Fallback a cache stale en 429.

### Components
Componentes compartidos (`MatchCard`, `MatchList`, etc.) con props de configuración por deporte (`sportConfig`). La estructura es común, el contenido varía.

## Technical Decisions

- **API Proxy:** Next.js API Routes como proxy de APIs externas (key oculta en servidor)
- **Cache:** In-memory `Map<string, CacheEntry>` compartido entre adapters, TTL por status
- **Shape normalization:** Cada adapter normaliza raw API → internal `Match` (frontend no conoce la API externa)
- **Polling:** 30s en vistas live, pausa en upcoming tab, pausa cuando tab oculta (Page Visibility API), no si hay error anterior pendiente
- **Error handling:** 429 → retorna cache stale si existe; si no, error que se propaga a la UI
- **Página unificada por parámetro:** Una sola lógica de tabs/search/polling/skeleton, el deporte es un parámetro de configuración
- **Design:** Dark mode por defecto, paleta por league