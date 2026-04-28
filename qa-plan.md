# QA Plan: Deportes Web v1

## Feature Summary
Plataforma web para visualizar partidos de fútbol en tiempo real. Mobile-first, dark mode.

## Testing Scope
- Home page (`/`)
- Live page (`/live`)
- Match detail page (`/match/[id]`)
- Search functionality

---

## Test Scenarios

### TS1: Home - Carga de Partidos
**Paso:**
1. Abrir `/` en el navegador
2. Esperar a que carguen los datos

**Resultado esperado:**
- Skeleton loader visible durante carga
- Lista de partidos visible después de cargar
- Tabs (All/Live/Upcoming/Finished) funcionales
- Conteo de partidos en vivo visible en el tab "Live"

---

### TS2: Home - Filtrado por Tabs
**Paso:**
1. En Home, hacer click en tab "Live"
2. Hacer click en tab "Finished"
3. Hacer click en tab "Upcoming"
4. Hacer click en tab "All"

**Resultado esperado:**
- Cada tab muestra solo los partidos con el status correspondiente
- Tab activo tiene estilo visual diferente (bg blanco, texto negro)
- Conteo en tab Live coincide con número de partidos live

---

### TS3: Home - Búsqueda por Equipo
**Paso:**
1. En Home, escribir nombre de equipo (ej: "Barcelona")
2. Esperar resultados

**Resultado esperado:**
- Dropdown con partidos que coinciden
- Filtro aplica correctamente
- Limpiar búsqueda restaura lista completa

---

### TS4: Live Page - Partidos en Vivo
**Paso:**
1. Ir a `/live`

**Resultado esperado:**
- Solo muestra partidos con status "live"
- Indicador "LIVE" animado visible en cada card
- Si no hay partidos live, mostrar mensaje apropiado

---

### TS5: Match Detail - Información del Partido
**Paso:**
1. Hacer click en un partido de la lista
2. Verificar página de detalle

**Resultado esperado:**
- Score principal visible (home vs away)
- Half-time score mostrado si existe
- Minuto actual visible si es partido live
- Timeline de eventos cargado
- Links de streaming visibles (si existen)

---

### TS6: Match Detail - Navegación
**Paso:**
1. En `/match/[id]`, hacer click en botón back

**Resultado esperado:**
- Regresa a la página anterior

---

### TS7: API - API Key Presente
**Paso:**
1. Revisar que `.env.local` tiene `API_FOOTBALL_API_KEY`

**Resultado esperado:**
- API responde con datos reales
- No usa MOCK_MATCHES como fallback

---

### TS8: API - Fallback con MOCK_MATCHES
**Paso:**
1. Temporalmente remover `API_FOOTBALL_API_KEY` de `.env.local`
2. Recargar página

**Resultado esperado:**
- UI sigue funcionando con datos de MOCK_MATCHES
- No hay errores de captura

---

## Edge Cases a Probar

### Network & API
- [ ] API retorna 500 error → mensaje de error + retry
- [ ] API timeout (>10s) → mensaje apropiado
- [ ] Rate limit (429) → mensaje + backoff visible
- [ ] Sin conexión a internet → mensaje offline

### UI/UX
- [ ] No hay partidos para la fecha → empty state visible
- [ ] Logo de equipo no carga → placeholder con inicial
- [ ] Logo de league no carga → placeholder genérico
- [ ] Scroll horizontal en mobile → no debe existir
- [ ] Partido con minutos extra (ej: 90+3) → muestra correctamente

### Data
- [ ] Partido sin score (upcoming) → muestra hora en vez de "-"
- [ ] Partido sin eventos → timeline vacío, sin errores
- [ ] Partido sin stream links → sección no visible

### Responsive
- [ ] Mobile (< 640px): single column
- [ ] Tablet (640-1024px): 2 columns
- [ ] Desktop (> 1024px): 3 columns

---

## Visual Checkpoints

| Checkpoint | Descripción |
|------------|-------------|
| VP1 | Dark background (#0a0a0a) aplicado correctamente |
| VP2 | Cards tienen surface color #141414 |
| VP3 | Live indicator tiene pulse animation |
| VP4 | Skeleton loader tiene pulse animation |
| VP5 | Tipografía Inter visible |
| VP6 | Scores en JetBrains Mono |

---

## Bugs Encontrados

| # | Descripción | Severidad | Link |
|---|-------------|-----------|------|
| - | - | - | - |

---

## Post-Deploy Checklist

- [ ] Verificar API key configurada en Vercel
- [ ] Verificar dominio configurado en next.config.ts
- [ ] Performance: Lighthouse score > 90
- [ ] Mobile: Test en Chrome DevTools device mode
- [ ] Verificar que no hay console errors en producción