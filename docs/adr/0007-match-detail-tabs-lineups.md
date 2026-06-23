# Match Detail — Tabs y Alineaciones

## Status

**Aceptado**

## Contexto

MatchDetail (`/match/[id]`) necesitaba tabs estilo Flashscore (Resumen / Cronología / Alineaciones / Transmisión) con alineaciones lazy solo para football. La decisión abarca: layout de tabs, cómo se carga la alineación, y qué se rechaza.

## Decisión

### Tabs estilo Flashscore

Cuatro tabs: **Resumen**, **Cronología**, **Alineaciones**, **Transmisión**.

- Tab activo: color de acento de la league del partido (`league.color`), texto blanco, barra inferior de 2px en ese color.
- Tabs inactivos: texto `#71717a` (zinc-500), sin barra.
- Scroll horizontal en mobile — el tab activo permanece centrado si es posible.
- Header de MatchDetail (score, nombres, reloj) queda **fijo** al hacer scroll; las tabs y el contenido scrollan debajo.

### Alineaciones — recurso separado, lazy

- La alineación **no** viene en la respuesta de `/api/matches`. Es un recurso independiente: `GET /api/matches/[id]/lineup`.
- Solo existe para football. Basketball y MMA retornan `null` o array vacío en ese endpoint.
- Se invoca solo cuando el usuario entra a la tab "Alineaciones" — no antes.
- TTL: **120 segundos** en cache (mayor que el de eventos porque la formación cambia menos).
- Se **rechaza fan-out**: el endpoint de lineup no hace polling de stats ni eventos simultáneos. Solo retorna la formación.
- Se **rechaza polling** desde la tab: si el usuario está en "Alineaciones" y el partido es live, no se hace polling automático de la alineación. Se actualiza solo cuando el usuario sale y vuelve a entrar, o cuando se refresca la página.

### Arquitectura del endpoint

```
GET /api/matches/[id]/lineup
→ sport se infiere del match (lookup interno, no param)
→ football: llama API-Football / lineup endpoint, normaliza a TeamLineup[]
→ basketball / MMA: retorna 200 con { lineups: null }
→ 404 si el match no existe
→ 500 en error de red (no stale fallback para lineup)
```

### Línea de rechazo (no se hizo)

- ~~Embeber alineación en la respuesta de `/api/matches`~~: aumentaría la respuesta para todos los sports yharía polling innecesario en mobile.
- ~~Polling automático de alineación cuando la tab está activa~~: la alineación casi no cambia durante un partido; el costo de network no justifica la frescura.
- ~~Un solo endpoint con `?expand=lineups`~~: el enfoque de recurso separado es más limpio y permite cache independiente.

## Consecuencias

- El adapter de football implementa `fetchLineup?` opcional en la interfaz `SportDataAdapter`.
- El componente de tabs solo hace fetch de lineup cuando la tab "Alineaciones" se activa.
- El endpoint `/api/matches/[id]/lineup` tiene su propio TTL (120s) independiente del de fixtures.