# SportDataAdapter seam para fetching de partidos

Cada deporte consumía una API externa diferente (API-Football v3, NBA API, MMA API), pero no existía una interfaz explícita. Cada adapter implementaba el fetching a su manera: football usaba client.ts+normalizer.ts separados, basketball y MMA tenían todo en un archivo monolítico.

Decidimos introducir una interfaz `SportDataAdapter` con `fetchFixtures(date, isLive): Promise<Match[]>` para que la API route pueda delegar por `?sport=` sin saber si el adapter usa mock o API real. Esto mueve el branching mock-vs-real detrás de la interfaz, donde pertenece.

**Status**: accepted

**Considered Options**:
- **Mantener el statu quo** (3 rutas separadas, cada una sabe si usa mock o API): rechazado porque añadir un deporte requiere copiar el branching mock/API en cada ruta nueva.
- **Interfaz SportDataAdapter**: elegido. Un solo endpoint, cada adapter encapsula su API key check + fetching + normalization + mock fallback.

**Consequences**:
- La ruta única `/api/matches?sport=` reemplaza 3 rutas separadas — las rutas viejas pueden redirigir o eliminarse
- Cada adapter necesita un test de integración con mock para verificar el pipeline fetch → normalize → response
