# SportDataAdapter seam para fetching de partidos

Cada deporte consumía una API externa diferente (API-Football v3, NBA API, MMA API), pero no existía una interfaz explícita. Cada adapter implementaba el fetching a su manera: football usaba client.ts+normalizer.ts separados, basketball y MMA tenían todo en un archivo monolítico.

Decidimos introducir una interfaz `SportDataAdapter` con `fetchFixtures({ date, isLive, timeZone? }): Promise<Match[]>` para que la API route pueda delegar por `?sport=` sin saber si el adapter usa mock o API real. Esto mueve el branching mock-vs-real detrás de la interfaz, donde pertenece.

**Status**: accepted (actualizado: se añadió `timeZone?` a la interfaz)

**Considered Options**:
- **Mantener el statu quo** (3 rutas separadas, cada una sabe si usa mock o API): rechazado porque añadir un deporte requiere copiar el branching mock/API en cada ruta nueva.
- **Interfaz SportDataAdapter**: elegido. Un solo endpoint, cada adapter encapsula su API key check + fetching + normalization + mock fallback.

**Consequences**:
- La ruta única `/api/matches?sport={sport}` reemplaza 3 rutas separadas. También acepta `sport=all` para consultar todos los deportes en paralelo con tolerancia a fallos parciales (`Promise.allSettled`).
- La interfaz expone `timeZone?: string` para que los adapters puedan filtrar partidos por la fecha local del visitante. Football pasa `timezone` directamente a API-SPORTS. Basketball y MMA usan una estrategia de fechas vecinas (3 consultas) + filtro client-side con `formatDateInTimeZone`.
- Cada adapter necesita un test de integración con mock para verificar el pipeline fetch → normalize → response.
