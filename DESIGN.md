# DESIGN.md — MatchDetail Tabs y Lineups

Decisiones visuales durables para los componentes de MatchDetail. Dark mode por defecto, paleta por league donde se indique.

---

## MatchDetailTabs

### Apariencia general

- Fondo: `#09090b` (zinc-950).
- Tabs en fila horizontal, no envuelven — scroll horizontal en mobile.
- Separador inferior: borde `1px solid #27272a` (zinc-800).

### Tab activo

- Texto: `white`, font-weight `600`, `14px`.
- Barra inferior: `2px solid {league.color}` — el color de la league del partido.
- Sin background de pill, sin fondo.

### Tab inactivo

- Texto: `#71717a` (zinc-500), font-weight `400`, `14px`.
- Hover: texto `#a1a1aa` (zinc-400), transición `150ms ease`.

### Mobile

- Scroll horizontal con `overflow-x-auto` y `scrollbar-none` (scrollbar oculta).
- Tab activo se centra con `scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })` cuando cambia.

### Empty state (tab sin datos)

- Icono centrad (⚽ para Resumen vacío, 📋 para Cronología vacía, 👥 para Alineaciones vacía).
- Texto: `"No hay datos para esta sección"`, `text-zinc-500`, `text-sm`.
- Sin borde, sin card — solo el mensaje centrado con `py-12`.

---

## MatchDetailHeader (Score + Teams)

### Posición

- Sticky en el top de la página (`position: sticky; top: 0`).
- Z-index alto (`z-20`), fondo `#09090b` para que oculte el scroll de abajo.
- Border inferior: `1px solid #27272a`.

### ScoreDisplay

- Números grandes: `text-4xl font-bold tabular-nums`.
- Logos de equipo: `40px × 40px`.
- Nombres de equipo: `text-sm font-medium text-zinc-300`.
- Goleadores debajo de cada nombre: `text-xs text-zinc-500`, líneas separadas.

---

## LineupView

### Estructura

- Dos columnas (home / away), cada una con `TeamLineup` — formación, capitanes marcados con `(C)`.
- Fila de titulares arriba, suplentes abajo con `text-zinc-500`.
- Posiciones: `G` (Arquero), `D` (Defensa), `M` (Mediocampista), `F` (Delantero).

### Empty state (no lineup)

- Mensaje: `"Alineaciones no disponibles"`.
- Texto `text-zinc-500`, centrado, `py-8`.

### Loading state

- Skeleton pulsante con `animate-pulse bg-zinc-800 rounded`.
- Mismo layout que `LineupView` pero con rectángulos en vez de texto.

---

## Dark Mode

Todas las especificaciones son para dark mode (defecto). No hay specs para light mode — no es requisito de v1.

---

## Tokens

| Token | Valor |
|---|---|
| `tab-inactive` | `#71717a` |
| `tab-active` | `white` |
| `tab-bar` | `{league.color}` |
| `bg-page` | `#09090b` |
| `border-subtle` | `#27272a` |
| `text-muted` | `#71717a` |
| `text-secondary` | `#a1a1aa` |