# Context — Deportes Web

## Domain Terms

### Match (Partido)
Evento deportivo entre dos equipos. Tiene estados: `upcoming` (por jugar), `live` (en curso), `finished` (finalizado). Contiene score, timeline de eventos, y links de streaming.

### Team (Equipo)
Entidad con `id`, `name`, `logo`. No se persiste en DB — se consume de API-Football en tiempo real. `shortName` existe en el modelo para uso en mobile/espacios reducidos.

### League (Liga)
Competencia footballística (Premier League, La Liga, etc). Tiene `id`, `name`, `country`, `logo`. Cada league tiene un color de acento para identidad visual.

### MatchEvent (Evento de Partido)
Gol, tarjeta amarilla/roja, penal, sustitución. Tipo, minuto, jugador, equipo. No todos los partidos tienen eventos — campo opcional.

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
- Otros deportes (solo fútbol)
- Notificaciones push

## Technical Decisions

- **API Proxy:** Next.js API Routes como proxy de API-Football (key oculta)
- **Cache:** stale-while-revalidate por status (live:60s, upcoming:300s, finished:900s)
- **Shape normalization:** API-Football raw → internal types (frontend no conoce la API externa)
- **Polling:** 30s en vistas live, solo cuando tab está visible (Page Visibility API)
- **Error handling:** Retry con backoff exponencial (30s → 60s → 120s) para rate limits
- **Design:** Dark mode por defecto, paleta por league