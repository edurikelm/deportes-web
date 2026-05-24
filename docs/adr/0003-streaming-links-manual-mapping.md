# Streaming links resueltos con mapping manual por país

API-Football v3 no incluye datos de transmisión (TV/streaming) en sus fixtures. Las APIs de basketball y MMA tampoco. Decidimos modelar los stream links como un mapping manual `leagueId → StreamLink[]` en `src/lib/streaming-links.ts`, resuelto en el adapter después de normalizar.

Hoy está hardcodeado a Chile. Cuando se agreguen más países, el resolver recibirá el país del espectador como parámetro.

**Status**: accepted

**Considered Options**:
- **Depender de API externa** (Sofascore, Sportmonks): rechazado porque agrega otra integración con API key, cuota, y latencia para datos que cambian ~1 vez por temporada.
- **Scraping**: rechazado por ser frágil y contra ToS.
- **Mapping manual**: elegido. El conjunto es acotado (~10 ligas), los derechos son estables, y el cambio es un archivo de config.

**Consequences**:
- Para agregar un nuevo país, se añade un nuevo Record en `streaming-links.ts` y se parametriza el resolver
- Si un día una API externa ofrece estos datos de forma confiable, se reemplaza el resolver sin tocar el adapter ni la UI
