# SportDataAdapter seam para fetching de partidos

Cada deporte consumía una API externa diferente (API-Football v3, NBA API, MMA API), pero no existía una interfaz explícita. Cada adapter implementaba el fetching a su manera: football usaba client.ts+normalizer.ts separados, basketball y MMA tenían todo en un archivo monolítico.

Decidimos introducir una interfaz `SportDataAdapter` con `fetchFixtures({ date, isLive, timeZone? }): Promise<Match[]>` para que la API route pueda delegar por `?sport=` sin saber si el adapter usa mock o API real. Esto mueve el branching mock-vs-real detrás de la interfaz, donde pertenece.

**Status**: accepted (actualizado: se añadió `timeZone?` a la interfaz, `fetchLineup?` opcional para football, y `fetchStandings?` opcional football-only)

**Considered Options**:
- **Mantener el statu quo** (3 rutas separadas, cada una sabe si usa mock o API): rechazado porque añadir un deporte requiere copiar el branching mock/API en cada ruta nueva.
- **Interfaz SportDataAdapter**: elegido. Un solo endpoint, cada adapter encapsula su API key check + fetching + normalization + mock fallback.

**Consequences**:
- La ruta única `/api/matches?sport={sport}` reemplaza 3 rutas separadas. También acepta `sport=all` para consultar todos los deportes en paralelo con tolerancia a fallos parciales (`Promise.allSettled`).
- La interfaz expone `timeZone?: string` para que los adapters puedan filtrar partidos por la fecha local del visitante. Football pasa `timezone` directamente a API-SPORTS. Basketball y MMA usan una estrategia de fechas vecinas (3 consultas) + filtro client-side con `formatDateInTimeZone`.
- Cada adapter necesita un test de integración con mock para verificar el pipeline fetch → normalize → response.
- **Adición posterior — alineaciones lazy:** Se añadió `fetchLineup?(matchId: string): Promise<TeamLineup[] | null>` como método opcional. Solo football lo implementa (retorna `null` para basketball/MMA) — el llamador verifica con `if (adapter.fetchLineup)` antes de invocar. Permite que la tab "Alineaciones" en MatchDetail cargue bajo demanda sin que el adapter de basketball/MMA necesite stubs vacíos.
- **Adición posterior — standings football-only:** Se añadió `fetchStandings?({ leagueId, season }): Promise<StandingsResult>` como método opcional. Solo `FootballAdapter` lo implementa usando el endpoint `/standings` de API-Football v3 con TTL 600s. Si no hay `API_SPORTS_KEY`, retorna `standings: null` sin realizar fetch. Basketball y MMA no implementan el método, manteniendo la abstracción sin stubs vacíos y evitando decisiones de diseño prematuras para otros deportes.
