<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Communication

- User wants all communication in **Spanish**.

## Agent skills (Matt Pocock workflow)

These skills run alongside the OpenCode subagents below — the orchestrator composes them.

### Backlog

GitHub Issues en `edurikelm/deportes-web`. Usar `gh` CLI para todas las operaciones. Ver `docs/agents/backlog.md`.

### Triage labels

Usa los defaults canonicos. Ver `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` en la raiz, ADRs en `docs/adr/`. Ver `docs/agents/domain.md`.

### Skill entry points

| Request shape                                                | Skill / subagent                                |
| ------------------------------------------------------------ | ----------------------------------------------- |
| Bug, regression, "this is broken / slow / throwing"          | `/diagnose`                                     |
| New feature or capability described informally               | `/grill-me` → `/to-prd` → `/to-issues`          |
| Wants a high-level map of an unfamiliar area                 | `/zoom-out` (delegate to `explorer`)            |
| Wants a deep refactor / seam proposal                        | `/improve-codebase-architecture` (`architect`)  |
| Issue with acceptance criteria from the backlog              | `/tdd` (`implementer` + `tester`)               |
| "Is this right?" / verify a fix / review a PR                | `reviewer` subagent                             |
| Glossary or ADR drift                                        | `docs-writer` subagent                          |

## Orchestration

The default agent is `deportes-orchestrator` (defined in `opencode.json` and `.opencode/agent/deportes-orchestrator.md`). It delegates to six operational subagents: `explorer`, `architect`, `implementer`, `tester`, `reviewer`, `docs-writer`. Each subagent has a focused prompt — see `.opencode/agent/<name>.md`.

### Work levels

Classify the request before acting. Do not skip classification even if the change "looks small".

| Level    | Example                                                              | Route                                                                              |
| -------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **N1**   | Cosmetic tweak, copy fix, single-class rename, dead code removal     | Orchestrator edits inline. No subagent delegation.                                 |
| **N2**   | Non-trivial behaviour in a non-critical domain, feature behind a flag| `implementer` (in a worktree) + `reviewer`.                                        |
| **N3**   | Critical domain change, public API, schema, cross-cutting refactor  | `architect` (plan + ADR draft) → `implementer` + `tester` (TDD) → `reviewer` → `docs-writer` |

Parallel delegation is allowed only when the subagents touch disjoint files. If two issues both need `src/lib/types.ts`, combine them into one brief and one agent.

### Verification artifacts

Screenshots, lighthouse reports, traces, heapsnapshots and any other verification artifact MUST be:

- Saved under `C:\Users\eduri\AppData\Local\Temp\opencode\deportes-web\` while the task is active.
- Deleted or moved out of the repo tree before the orchestrator reports "done" or asks to commit.

Never leave `*.png`, `*.trace.json*`, `*.heapsnapshot`, or `lighthouse-*.html` inside the repo.

### DESIGN.md

`DESIGN.md` is conditional context, not session-global. Always read `CONTEXT.md`. Read `DESIGN.md` only when the work touches UI, styling, layout, components, responsive breakpoints, or dark mode. The `docs-writer` subagent maintains `DESIGN.md` for durable visual decisions.
