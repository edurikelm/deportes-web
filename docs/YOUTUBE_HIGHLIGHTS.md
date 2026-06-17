# Guía de integración: YouTube Data API para Highlights

Documento práctico para configurar, probar y depurar la búsqueda dinámica de video highlights vía YouTube Data API.

---

## 1. Obtener tu YouTube Data API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (o selecciona uno existente)
3. Navega a **APIs & Services > Library**
4. Busca **YouTube Data API v3** y habilítala
5. Ve a **APIs & Services > Credentials**
6. Click **Create credentials > API key**
7. Copia la key y agregala a `.env.local`:

```bash
YOUTUBE_API_KEY=tu_key_real_aqui
```

**Importante:** La cuota gratuita es de **10,000 unidades por día**. Cada búsqueda (`/search`) consume **100 unidades**. Eso da ~100 búsquedas diarias sin costo. El cache en memoria (1h TTL) reduce drásticamente las llamadas repetidas.

---

## 2. Cómo funciona la búsqueda

Cuando un usuario hace click en el icono de una jugada destacada:

```
1. El modal detecta si el evento tiene videoUrl
2. Si NO tiene → hace fetch a /api/highlights
3. El server construye una query como: "Arsenal Chelsea 23 goal football highlights"
4. YouTube devuelve hasta 8 videos
5. Se puntúa cada resultado y se elige el mejor
```

### Query de búsqueda

La query se construye dinámicamente:

```
{homeTeam} {awayTeam} {minute}' {eventType} football highlights
```

Ejemplo real:
```
Arsenal Chelsea 23' goal football highlights
```

Se remueven sufijos como "FC", "AFC", "CF" para evitar resultados genéricos.

---

## 3. Scoring: cómo elegimos el mejor video

YouTube devuelve resultados ordenados por su propio algoritmo de relevancia, que no siempre coincide con el partido exacto. Por eso implementamos un scoring propio:

| Criterio | Puntos | Ejemplo |
|---|---|---|
| Canal deportivo conocido | +50 | ESPN, Sky Sports, beIN Sports, CBS Sports, DAZN |
| Minuto exacto en título | +20 | `"Saka 23' goal"` |
| Publicado hace < 7 días | +15 | Partido de esta semana |
| Publicado hace < 30 días | +8 | Aún relevante |
| Keyword `goal` / `gol` / `highlight` | +10 | Confirma que es un highlight |

El video con mayor score se selecciona y se cachea por 1 hora.

---

## 4. Testear la integración manualmente

### Test directo del endpoint

```bash
curl "http://localhost:3000/api/highlights?homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal"
```

Respuesta esperada (si encuentra video):
```json
{
  "videoUrl": "https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1",
  "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
  "title": "Arsenal vs Chelsea - Saka 23' goal"
}
```

Respuesta si no encuentra nada:
```json
{
  "videoUrl": null,
  "thumbnail": null,
  "title": null
}
```

### Test desde el frontend

1. Abre un partido con eventos (ej: `/match/1` que usa mock data)
2. Ve a la pestaña "Cronologia"
3. Haz click en el icono de un gol (⚽)
4. El modal debería mostrar:
   - Un spinner de loading (1-2 segundos)
   - El video embebido (si YouTube encuentra match)
   - O solo los detalles del evento (si no hay video)

---

## 5. Troubleshooting

### "No aparece video en el modal, solo los detalles"

**Causas posibles:**
1. `YOUTUBE_API_KEY` no está configurado en `.env.local`
2. La cuota diaria se agotó
3. YouTube no tiene highlights indexados para ese partido/minuto

**Cómo verificar:**
```bash
# Verificar que la variable esté cargada
grep YOUTUBE_API_KEY .env.local

# Ver logs del server (debería mostrar warnings de "No YOUTUBE_API_KEY")
```

### "El video que aparece no corresponde al partido"

**Causa:** YouTube devolvió un resultado genérico.

**Soluciones:**
- Revisa el query en los logs: debería mostrar algo como `[YouTube] Searching: Arsenal Chelsea 23 goal football highlights`
- Si el query es muy genérico, puedes ajustar `buildSearchQuery()` en `src/lib/api/youtube.ts`
- Considera agregar la liga o temporada a la query

### "El video es de un partido viejo"

**Causa:** El filtro `publishedAfter` está a 90 días, pero YouTube puede indexar highlights antiguos como "más relevantes".

**Solución:** Reducir `publishedAfter` a 30 o 7 días en `src/lib/api/youtube.ts`:

```typescript
publishedAfter.setDate(publishedAfter.getDate() - 7)  // Solo última semana
```

### "Cuota agotada (403 error)"

**Causa:** Se alcanzaron las 10,000 unidades diarias.

**Soluciones:**
- Aumentar el TTL del cache (actualmente 1h → cambiar a 6h o 24h)
- Implementar cache persistente (Redis, Supabase, etc.)
- Solicitar aumento de cuota en Google Cloud Console

---

## 6. Estructura de archivos

```
src/
├── lib/
│   ├── api/
│   │   └── youtube.ts          # Búsqueda, scoring, cache
│   └── types.ts                # MatchEvent.videoUrl?
├── app/
│   └── api/
│       └── highlights/
│           └── route.ts          # GET /api/highlights
└── components/
    └── match/
        └── MatchTimeline.tsx   # HighlightModal con fetch dinámico
```

---

## 7. Cómo agregar un canal preferido

Si notas que un canal deportivo específico sube buenos highlights pero no está en la lista, edita `src/lib/api/youtube.ts`:

```typescript
const PREFERRED_CHANNELS = [
  'football',
  ' highlights',
  ' gol ',
  ' goal',
  ' bt sport',
  ' espn',
  ' sky sports',
  ' bein sports',
  ' dazn',
  ' TU_CANAL_AQUI',  // <-- agregar
]
```

---

## 8. Alternativas si YouTube no funciona

Si YouTube Data API no es viable (cuota, precisión, etc.), el sistema permite otras fuentes sin cambiar la UI:

1. **URLs hardcodeadas:** Agregar `videoUrl` directamente al evento en la base de datos o mock data
2. **API de terceros:** Reemplazar `youtube.ts` con otro proveedor (WSC Sports, Sportmonks, etc.)
3. **Sin video:** Si no hay `videoUrl`, el modal simplemente muestra los detalles del evento (graceful degradation)

La UI nunca se rompe — solo muestra video si existe.
