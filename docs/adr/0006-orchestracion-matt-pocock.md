# ADR-0006 — Orquestación Matt Pocock con subagentes opencode

- **Estado:** accepted
- **Fecha:** 2026-06-19
- **Deciders:** deportes-orchestrator, edurikelm

## Contexto

`deportes-web` ya tiene configurado el flujo Matt Pocock: GitHub Issues como backlog, etiquetas de triage canónicas, single-context domain docs (`CONTEXT.md` + `docs/adr/`), y las skills de `mattpocock` instaladas bajo `.agents/skills/`. Las 8 issues arquitectónicas #7–#14 se cerraron.

El paso que faltaba era cablear el `opencode.json` del proyecto con un agente orquestador y subagentes operativos, de modo que el flujo de Matt Pocock se ejecutara automáticamente sin tener que repetir las instrucciones en cada sesión.

## Decisión

Adoptar la misma estructura que `saas-arriendos-v3` (ADR-0017 de ese repo), adaptada al dominio de deportes:

- **`opencode.json`** declara `default_agent: "deportes-orchestrator"` y los seis subagentes con modelos explícitos:
  - `deportes-orchestrator` → `openai/gpt-5.5` (primary, planificación y routing)
  - `explorer` → `opencode-go/north-mini-code-free` (read-only research)
  - `architect` → `opencode-go/nemotron-3-ultra-free` (diseño de seams, ADRs)
  - `implementer` → `opencode-go/deepseek-v4-flash-free` (escritura de código no trivial)
  - `tester` → `opencode-go/deepseek-v4-flash-free` (TDD, regression tests)
  - `reviewer` → `opencode-go/deepseek-v4-flash-free` (revisión por defecto en modo ahorro)
  - `docs-writer` → `opencode-go/mimo-v2.5-free` (mantiene `CONTEXT.md` y ADRs)
- **`.opencode/agent/<nombre>.md`** con frontmatter (`description`, `mode`, `model`) y prompt enfocado. Los prompts son ASCII-only y referencian `CONTEXT.md`, `docs/adr/`, y el bloque "This is NOT the Next.js you know" de `AGENTS.md`.
- **`AGENTS.md`** se simplificó a guía permanente del proyecto: bloque `## Agent skills` (Matt Pocock) + bloque `## Orchestration` (3 niveles N1/N2/N3, cleanup de artifacts, `DESIGN.md` condicional).
- **Las skills de Matt Pocock** (`/diagnose`, `/grill-me`, `/to-prd`, `/to-issues`, `/tdd`, `/zoom-out`, `/improve-codebase-architecture`, `/triage`) siguen siendo la fuente de verdad del flujo. El orchestrator las compone con los subagentes en lugar de re-implementarlas.

## Consecuencias

- **Positivas:** cada sesión arranca con el flujo Matt Pocock + subagentes listos, sin repetir setup. La clasificación N1/N2/N3 evita que cambios cosméticos disparen planificación innecesaria. La regla de cleanup de artifacts mantiene el repo limpio.
- **Positivas:** los subagentes especializados pueden correr en paralelo cuando tocan archivos disjuntos, acelerando el ciclo issue → PR.
- **Negativas:** cambios en `opencode.json` o en `.opencode/agent/*.md` requieren reiniciar opencode — el config no se hot-reloada.
- **Negativas:** los IDs de modelo (`openai/gpt-5.5`, `opencode-go/deepseek-v4-flash-free`, etc.) son específicos de la suscripción actual. Si cambian, hay que actualizar los frontmatters.
- **Actualización 2026-06-24:** se cambió la ruta por defecto de subagentes a modelos `*-free` de OpenCode Zen para reducir consumo mensual de OpenCode Go. `openai/gpt-5.5` queda reservado para razonamiento/orquestación; modelos pagos/pro deben usarse solo bajo petición explícita o tareas N3 críticas.

## Work levels (recap)

| Level | Ejemplo                                                | Ruta                                                |
| ----- | ------------------------------------------------------ | --------------------------------------------------- |
| N1    | Copy fix, rename de clase, dead code removal           | Orchestrator inline, sin subagentes                 |
| N2    | Feature detrás de flag, cambio no crítico              | `implementer` + `reviewer`                          |
| N3    | API pública, schema, refactor cross-cutting, dominio crítico | `architect` → `implementer` + `tester` (TDD) → `reviewer` → `docs-writer` |

## Cleanup de verification artifacts

Screenshots, lighthouse reports, traces, heapsnapshots y cualquier otro artifact de verificación deben:

- Guardarse en `C:\Users\eduri\AppData\Local\Temp\opencode\deportes-web\` mientras la tarea esté activa.
- Borrarse o moverse fuera del árbol del repo antes de que el orchestrator reporte "done" o pida commit.

Nunca dejar `*.png`, `*.trace.json*`, `*.heapsnapshot`, o `lighthouse-*.html` dentro del repo.

## `DESIGN.md` condicional

`DESIGN.md` no es session-global. Siempre leer `CONTEXT.md`. Leer `DESIGN.md` **solo** cuando el trabajo toque UI, styling, layout, componentes, breakpoints responsive o dark mode. El subagente `docs-writer` mantiene `DESIGN.md` con las decisiones visuales durables.

## Alternativas consideradas

- **Sin subagentes, solo skills:** las skills de Matt Pocock seguirían funcionando, pero cada paso (explorar, planear, implementar, testear, revisar, documentar) lo haría el mismo modelo caro, sin paralelización real. Descartado.
- **Un solo subagente "do-everything":** evita la fragmentación de prompts pero pierde la separación de responsabilidades. Descartado.
- **Replicar exactamente la config de `saas-arriendos-v3`:** tentador, pero el dominio (deportes multi-sport, no SaaS de arriendos) merece nombres y ejemplos adaptados. Adoptamos la estructura, ajustamos el contenido.
