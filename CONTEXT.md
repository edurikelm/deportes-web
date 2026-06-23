# Context — Deportes Web

## Domain Terms

### Match (Partido)
Evento deportivo entre dos equipos. Tiene estados: `upcoming` (por jugar), `live` (en curso), `finished` (finalizado). Contiene score, timeline de eventos, y links de streaming. Cada match tiene un `sport` explícito: `'football' | 'basketball' | 'mma'`.

### Team (Equipo)
Entidad con `id`, `name`, `logo`. No se persiste en DB — se consume de API-Football en tiempo real. `shortName` existe en el modelo para uso en mobile/espacios reducidos.

### League (Liga)
Competencia footballística (Premier League, La Liga, etc). Tiene `id`, `name`, `country`, `logo`. Cada league tiene un color de acento para identidad visual.

### Pinned League (Liga Fijada)
Liga que el usuario ancla para que aparezca primero en el listado. Se persiste en `localStorage` (sin backend, sin auth). El pinning es por navegador — no sincroniza entre dispositivos. Una liga fijada siempre aparece arriba de las no fijadas, separada por un divider visual.

### MatchEvent (Evento de Partido)
Gol, tarjeta amarilla/roja, penal, sustitución para fútbol. El campo `detail` propaga subtipos (Penalty, Own Goal, Missed Penalty, Yellow Card, Red Card). Tipos desconocidos mapean a `'unknown'` — **no** caen a `'goal'` para evitar falsos goleadores. Para otros deportes, campos opcionales genéricos (`extra?: Record<string, unknown>`) permiten flexibilidad. Tipo, minuto, jugador, equipo. No todos los partidos tienen eventos — campo opcional.

### StreamLink (Link de Streaming)
Canal de TV o plataforma de streaming donde transmite el partido. Tipo: `tv` | `stream`. Nombre: "ESPN", "Star+", "Canal+". Deben resolverse por país del espectador — hoy hardcodeado a Chile.

### StreamingResolver
Config `(leagueId) → StreamLink[]` que mapea ligas a las plataformas que las transmiten en un país. Vive en `src/lib/streaming-links.ts`. Resuelve en el adapter después de normalizar, solo si la API externa no trajo links.

### Broadcasting Rights
Derechos de transmisión por país. No se modelan explícitamente — el `StreamingResolver` captura el resultado de los rights sin necesidad de modelar contratos, dueños, ni fechas de vigencia. Si cambian los derechos, se actualiza el mapping.

### StatusBadge (Indicador de Estado)
Badge visual que muestra el estado del partido: "LIVE" (pulso rojo), "Upcoming" (gris), "FT" (verde).

### MatchClock (Reloj de Partido)
Cálculo local de tiempo para cada partido. El hook `useMatchClock` computa el display según el status:
- **Live**: minuto actual desde `fixture.status.elapsed` (API-Football), interpolado client-side. Muestra `"67'"`. Cuando `statusDetail` indica un estado especial, muestra un label descriptivo (ver StatusDetail).
- **Upcoming (futuro)**: countdown regresivo. `"En 2h 15m"` para >1h, `"En 5m"` para <1h.
- **Upcoming (pasado <3h)**: `"Retrasado"` — el partido debió empezar pero la API no lo reporta como live.
- **Upcoming (pasado >3h)**: `"Suspendido"` — probablemente postergado.
- **Finished**: `"FT"`.
- **startTime inválido**: `"--:--"`.

El poll siempre gana: cuando llegan datos nuevos del servidor, el reloj local se resetea al valor del servidor. El reloj local avanza entre polls para dar sensación de tiempo real.

### StatusDetail (Detalle de Estado)
Campo opcional en Match que preserva el código de estado raw de la API para partidos live (`'1H'`, `'2H'`, `'HT'`, `'ET'`, `'BT'`, `'INT'`, `'SUSP'`, `'P'`, `'LIVE'`). Permite que `computeClock` muestre labels descriptivos en vez del minuto numérico:

| Código | Label |
|--------|-------|
| `HT` | Entretiempo |
| `ET` | Tiempo Extra (con minuto: `"Tiempo Extra 105'"`) |
| `BT` | Descanso |
| `INT` | Interrumpido |
| `SUSP` | Suspendido |
| `P` | Penales |
| `1H`, `2H`, `LIVE` | Sin label, solo minuto numérico |

## Layout — Flashscore-style Redesign

### Sidebar (Barra Lateral)
Panel izquierdo fijo (240px) visible en desktop (`>=1024px`). Contiene: logo "LiveScores", navegación por deporte (Fútbol, Básquet, MMA) con accesos directos a ligas principales, "En vivo" con badge de conteo, y "Buscar". En mobile y tablet, se reemplaza por un hamburger drawer.

### Drawer (Panel Desplegable Mobile)
Sidebar colapsada que se abre con ícono hamburger en mobile y tablet (`<1024px`). Slide-in desde la izquierda con overlay semitransparente. Contiene la misma información que la Sidebar de desktop.

### Header (Barra Superior)
Barra fija minimalista (48px). Izquierda: logo "LiveScores". Derecha: íconos de búsqueda y settings. Sin pills de deporte, sin links de navegación — esa función la cumple la Sidebar.

### DatePills (Píldoras de Fecha)
Barra horizontal scrolleable con tabs: "Hoy" (seleccionado, acento verde `#22c55e`), "Ayer", "Mañana", ícono de calendario. Filtra los partidos por fecha local del visitante. Arriba del contenido principal.

### Visitor Time Zone (Zona Horaria del Visitante)
Zona horaria IANA detectada en el navegador con `Intl.DateTimeFormat().resolvedOptions().timeZone`. Es la fuente de verdad para interpretar "hoy", la fecha seleccionada y qué partidos pertenecen al día visible. La app no debe asumir UTC ni Chile fijo para cargar listados diarios; `America/Santiago` solo es un ejemplo de visitante ubicado en Chile.

### StatusFilters (Filtros de Estado)
Pills secundarias debajo de DatePills: "Todos", "En vivo" (con badge rojo de conteo), "Próximos", "Finalizados". Filtran partidos por `MatchStatus`.

### MatchRow (Fila de Partido)
Reemplaza a `MatchCard`. Formato compacto de dos líneas por partido. Layout horizontal:
- **Línea 1:** Indicador de estado (⚫/✓/⏰), minuto/hora, logo chico 24px, nombre local, **score en monospace bold**, nombre visita, logo chico 24px.
- **Línea 2 opcional:** Goleadores (`goal | own_goal | penalty`) debajo de cada equipo en líneas separadas sin truncar. Links de streaming aparecen centrados columna del score si no hay goleadores. No se renderiza info deportiva genérica (FT, HT, quarters, método MMA).
- Separación entre filas: borde inferior fino `#262626`. Sin fondo de card.

### SectionHeader (Encabezado de Liga)
Agrupa MatchRows por league. Barra de acento izquierda de 2px con el color de la liga, nombre de la liga + país, e ícono de pin 📌 a la derecha (si está fijada). Sin fondo de card.

### MatchDetail (Detalle de Partido)
Página `/match/[id]`. ScoreDisplay grande con goleadores debajo de cada nombre de equipo (líneas separadas, sin truncar). MatchTimeline, StreamLinks. Sidebar visible en desktop.

### Ventana flotante de partido en vivo
Ventana externa del navegador para seguir un único **Match** con estado `live` en computador. Muestra un marcador compacto con liga, reloj, equipos, score y último evento de marcador o frescura de actualización. No es una notificación, un favorito ni un pinning de liga.

### Búsqueda Inline
La búsqueda se activa desde la Sidebar ("Buscar"). En vez de navegar a `/search`, abre un input en el área principal. Los resultados reemplazan el contenido actual como MatchRows filtrados. `/search` se mantiene como fallback.

## Out of Scope (v1)

- Favoritos de equipos/partidos (sí hay pinning de ligas vía localStorage)
- Autenticación / usuarios
- Base de datos (Supabase no se usa en v1)
- Notificaciones push

## Architecture — Multi-Sport

### Sport
Campo explícito en Match: `'football' | 'basketball' | 'mma'`. Cada deporte se resuelve por URL (`/`, `/basketball`, `/mma`) y se pasa como parámetro a módulos compartidos.

### SportPage
Módulo de página único parametrizado por `Sport`. Unifica tabs, polling, skeleton, y búsqueda que antes estaban duplicados 3x. Cada ruta es un wrapper fino que pasa el identificador de deporte.

### SportDataAdapter
Interfaz que abstrae el fetching de partidos por deporte: `fetchFixtures({ date, isLive, timeZone? }) => Promise<Match[]>`. Cada deporte implementa su adapter (football → API-Football v3, basketball → NBA API, MMA → MMA API). La API route delega al adapter según `?sport=` — un solo endpoint en vez de tres.

### All-Sports API
El endpoint `/api/matches` acepta `sport=all` para consultar todos los deportes en paralelo. Usa `Promise.allSettled` internamente: si falla un deporte, los resultados de los demás se retornan igual. Si fallan todos, la respuesta es `500`. La página `/live` usa `sport=all` para mostrar un feed unificado.

### Cache compartido
`fetchWithCache` vive en un módulo único. Los adapters lo importan con un `serviceName` para diferenciar logs. TTL: live=10s, normal=60s, eventos=120s. Fallback a cache stale en 429.

## Technical Decisions

- **API Proxy:** Next.js API Routes como proxy de APIs externas (key oculta en servidor)
- **Cache:** In-memory `Map<string, CacheEntry>` compartido entre adapters, TTL por status
- **Shape normalization:** Cada adapter normaliza raw API → internal `Match` (frontend no conoce la API externa)
- **Polling:** 30s en vistas live, pausa en upcoming tab, pausa cuando tab oculta (Page Visibility API), no si hay error anterior pendiente
- **Error handling:** 429 → retorna cache stale si existe; si no, error que se propaga a la UI
- **Página unificada por parámetro:** Una sola lógica de tabs/search/polling/skeleton, el deporte es un parámetro de configuración
- **Fecha diaria por visitante:** Los listados de partidos se consultan y filtran por la fecha local en la zona horaria IANA del visitante. El backend recibe `date` + `timezone`; si el proveedor externo no soporta timezone de forma confiable, el adapter debe cubrir bordes UTC consultando fechas vecinas y filtrando por `startTime` en la zona del visitante.
- **Design:** Dark mode por defecto, paleta por league. Layout Flashscore-style: sidebar fija en desktop, drawer en mobile, filas compactas sin cards, ligas pineables vía localStorage, búsqueda inline en área principal.
- **Transiciones:** Solo CSS (Tailwind `transition-*`). Sin framer-motion. Slide-in del drawer, crossfade de contenido, transition-colors en badges.

## Process — Orquestación Matt Pocock

### deportes-orchestrator

Agente primario definido en `opencode.json` y `.opencode/agent/deportes-orchestrator.md`. Su trabajo NO es implementar código no trivial; es clasificar la petición en N1/N2/N3 y delegar a la combinación correcta de subagentes y skills de Matt Pocock. Responde en español, 2-4 líneas por turno, con referencias `path:line`.

### Subagentes operativos

Cada subagente tiene un prompt enfocado en `.opencode/agent/<nombre>.md`. Roles:

- `explorer` — read-only research (`/zoom-out`, auditorías). No edita.
- `architect` — diseña seams, interfaces, ADRs. No escribe código de producción.
- `implementer` — escribe código en worktree cuando hay plan claro. Cambios triviales los hace el orchestrator inline.
- `tester` — TDD red-green-refactor, regression tests. Vitest.
- `reviewer` — última línea antes del merge. No edita, produce veredicto + findings accionables.
- `docs-writer` — mantiene `CONTEXT.md`, `docs/adr/*.md` y, condicionalmente, `DESIGN.md`.

### Work Levels (N1 / N2 / N3)

Clasificación obligatoria antes de actuar. Definición exacta en `AGENTS.md` > "Work levels" y `docs/adr/0006-orchestracion-matt-pocock.md`. N1 = orchestrator inline, N2 = `implementer + reviewer`, N3 = cadena completa `architect → implementer + tester → reviewer → docs-writer`.

### Verification Artifact Cleanup

Screenshots, lighthouse reports, traces, heapsnapshots y otros artifacts de verificación se guardan en `C:\Users\eduri\AppData\Local\Temp\opencode\deportes-web\` durante la tarea y se borran del repo antes de reportar "done" o pedir commit. No dejar `*.png`, `*.trace.json*`, `*.heapsnapshot`, o `lighthouse-*.html` dentro del árbol.

### DESIGN.md condicional

`DESIGN.md` no es session-global. Siempre leer `CONTEXT.md`. Leer `DESIGN.md` solo cuando el trabajo toca UI, styling, layout, componentes, breakpoints responsive o dark mode. `docs-writer` mantiene `DESIGN.md` con decisiones visuales durables.
