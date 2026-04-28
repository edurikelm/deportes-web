# Workflow de Desarrollo con IA: De la Idea a Producción

Guía práctica basada en el framework de Matt Pocock para desarrollo asistido por IA.

## Las 7 Fases del Desarrollo con IA

---

## Fase 1: LA IDEA

Todo comienza con una idea: puede ser una app completa, una característica específica, un bug fix, o incluso un refactor.

- La idea puede ser tan grande o pequeña como necesites
- Esta idea se convertirá en un conjunto de tickets que la IA completará
- Los tickets pueden ejecutarse en paralelo o secuencialmente

**Refinando tu idea:** Antes de pasar a investigación o prototipado, refina tu idea iterativamente. Usa un skill como `/grill-me` que te haga preguntas para desarrollar el concepto.

---

## Fase 2: INVESTIGACIÓN — Opcional

Solo si tu idea involucra APIs externas o integraciones complejas (Stripe, APIs poco comunes, etc.)

**Crea un archivo `research.md`** que guarde en cache toda la investigación dentro del repositorio.

```markdown
# Research: [Nombre de la Integración]

## Endpoints relevantes
- POST /endpoint/principal

## Rate limits
- 100 req/min

## Autenticación
- Bearer token

## Caching strategy
- Guardar respuestas en Supabase
- Invalidar cada 1 hora

## Posibles errores
- 401: Token expirado
- 429: Rate limit exceeded
- 500: Server error
```

**¿Por qué?** Los agentes de IA trabajan en context windows frescos. Si la exploración es difícil (APIs externas, documentación difícil de acceder), cachear esa información evita exploración repetida.

**Nota:** La investigación generalmente solo vive durante el sprint actual. Puede quedar obsoleta y causar que el agente tome caminos equivocados.

---

## Fase 3: PROTOTIPADO — Opcional

Essential cuando necesitas imponer tu gusto en el resultado.

**Aún no sabes exactamente qué estás construyendo ni por qué**

- Crea múltiples variaciones en una ruta "desechable"
- Deja que el LLM te muestre diferentes enfoques
- Itera un par de sesiones para encontrar el mejor diseño

**Aplica para:**
- UI/UX y comportamiento visual
- Arquitectura de software
- Probar integraciones con servicios externos

**Importante:** El prototipado temprano es esencial porque te permite comprometer el mejor diseño al codebase, haciéndolo disponible para el agente cuando vaya a implementar.

### Ejemplo de estructura

```
prototype/
├── option-a-login/
├── option-b-social-auth/
└── option-c-magic-link/
```

---

## Fase 4: CREACIÓN DEL PRD

Ahora que entiendes las APIs externas y has visto código en el prototipo, es hora de describir la visión final.

**El PRD (Product Requirements Document) describe:**
- Qué verán los usuarios
- Cómo se comportará el producto
- NO los detalles de implementación

### Template de PRD

```markdown
# PRD: [Nombre del Proyecto/Feature]

## Problem Statement
[Qué problema resuelve esto?]

## Solution
[Cómo lo resolvemos?]

## User Stories

### US1: [Título]
**Como** [tipo de usuario]
**Quiero** [acción]
**Para** [beneficio]

**Criterios de aceptación:**
- [ ] [Criterio 1]
- [ ] [Criterio 2]

### US2: [Título]
...

## Design Decisions

### Layout
[Descripción del layout esperado]

### Color Palette
[Colores a usar]

### Typography
[Fuentes a usar]

## Edge Cases
- [ ] [Edge case 1] → [Cómo manejamos]
- [ ] [Edge case 2] → [Cómo manejamos]

## Testing Strategy
[Cómo probamos esto?]

## Technical Notes
[Notas técnicas importantes pero no detalles de implementación]
```

---

## Fase 5: PLANIFICACIÓN — Kanban Board

Convierte el PRD en un plan de implementación usando un Kanban board.

- Crea tickets con relaciones de dependencia (blocking)
- **Permite paralelización efectiva**: encuentra tickets no bloqueados y lanza agentes para cada uno
- Usa herramientas como **GitHub Issues** o **Linear** (Linear tiene relaciones de bloqueo explícitas)

### Ejemplo de Issue en GitHub

```markdown
# Issue: Implementar formulario de login

## Descripción
Crear formulario de login con email y password según PRD.md

## User Stories relacionadas
- US1: Login con email/password

## Criterios de aceptación
- [ ] Validación de email
- [ ] Validación de password (min 8 chars)
- [ ] Mensaje de error para credenciales inválidas
- [ ] Redirect a /dashboard tras login exitoso

## Blocking
Ninguno

## Bloqueado por
-
```

### Alternativa: Usar Linear

Linear soporta relaciones de blocking nativamente:
```bash
linear issue create "Formulario de login"
linear issue create "Página de dashboard" --blocking "formulario-de-login"
```

---

## Fase 6: EJECUCIÓN — Ralph Loop

El "Ralph Loop" es un loop autónomo que corre repetidamente sobre un plan o PRD intentando llevar el codebase al estado deseado.

### Setup de Ralph

```bash
# Crea el archivo ralph.sh
touch ralph.sh
chmod +x ralph.sh
```

```bash
#!/bin/bash
# Ralph Loop - Ejecuta Claude Code hasta completar el ticket

echo "🎯 Iniciando Ralph Loop..."
echo "Ticket: $1"

# Resume la última sesión de Claude Code
npx claude-code --resume --task "$1"

# Verifica si hay más trabajo
while [ $? -eq 0 ]; do
  echo "✅ Ticket completado. Buscando siguiente..."
  npx claude-code --resume
done

echo "🏁 Ralph loop finalizado"
```

### Uso

```bash
# Para un ticket específico
./ralph.sh "Implementar formulario de login"

# O directamente con Claude Code
npx claude-code --task "Implementar formulario de login según prd.md"
```

### Parallelización

Para ejecutar múltiples agentes en paralelo:

```bash
# Ticket 1 (no bloqueado)
npx claude-code --task "Implementar formulario de login" &

# Ticket 2 (no bloqueado)
npx claude-code --task "Crear componente Header" &

# Esperar a que terminen
wait
```

---

## Fase 7: QA E ITERACIÓN

Una vez completada la ejecución:

1. **El agente crea un QA plan** para que un humano revise el trabajo completado
2. **El humano hace QA** (leer el código, probar funcionalidades)
3. **Se generan nuevos tickets** para el Kanban board
4. **Se vuelve a ejecutar** hasta llegar a un producto pulido

### Template de QA Plan

```markdown
# QA Plan: [Feature]

##测试 Scenarios

### TS1: Happy Path
**Paso:**
1. Ir a /login
2. Ingresar email válido
3. Ingresar password correcta
4. Click en "Login"

**Resultado esperado:**
- Redirect a /dashboard
- Mensaje de bienvenida visible

### TS2: Credenciales Inválidas
**Paso:**
1. Ir a /login
2. Ingresar email inválido
3. Ingresar password incorrecta
4. Click en "Login"

**Resultado esperado:**
- Mensaje de error: "Credenciales inválidas"
- Stay en /login

## Edge Cases a Probar
- [ ] Network error durante login
- [ ] Email sin formato válido
- [ ] Password vacía
- [ ] Session expirada

## Bugs Encontrados
| # | Descripción | Severidad | Link |
|---|-------------|-----------|------|
| 1 | ... | Alta | #123 |
```

---

## Vertical Slices vs Horizontal Slices

**❌ Horizontal (MAL):**
```
Fase 1: Toda la base de datos
Fase 2: Toda la API
Fase 3: Todo el frontend
```
Problema: No obtienes feedback hasta la fase 3.

**✅ Vertical (BIEN):**
```
Fase 1: Login completo (DB + API + UI)
Fase 2: Dashboard completo (DB + API + UI)
```
Beneficio: Feedback temprano sobre si todas las capas funcionan juntas.

---

## Estructura de Proyecto Recomendada

```
tu-proyecto/
├── research.md              # Fase 2
├── prd.md                  # Fase 4
├── qa-plan.md              # Fase 7
├── prototype/              # Fase 3
│   ├── option-a/
│   └── option-b/
├── src/
│   ├── components/
│   ├── lib/
│   └── app/
├── tests/
│   └── *.test.ts
├── .github/
│   └── workflows/
└── scripts/
    ├── ralph.sh
    └── prd-to-issues.js
```

---

## Scripts de Automatización

### prd-to-issues.js

```javascript
const fs = require('fs');
const { execSync } = require('child_process');

function parseAndCreateIssues() {
  const prd = fs.readFileSync('prd.md', 'utf8');

  // Extraer user stories
  const userStories = prd.match(/### US\d+:[\s\S]*?(?=###|##|$)/g) || [];

  userStories.forEach((story, i) => {
    const title = story.match(/\*\*Título:\*\* (.+)/)?.[1] || `Task ${i+1}`;
    const description = story.match(/\*\*Descripción:\*\*([\s\S]*?)(?=\*\*|###)/)?.[1]?.trim();

    const cmd = `gh issue create --title "${title}" --body "${description || ''}"`;
    console.log(`Creating: ${title}`);
    execSync(cmd, { stdio: 'inherit' });
  });
}

parseAndCreateIssues();
```

### setup-project.sh

```bash
#!/bin/bash

PROJECT_NAME=$1

# Crear estructura
mkdir -p $PROJECT_NAME/{src,tests,prototype,.github/workflows,scripts}
touch $PROJECT_NAME/{research.md,prd.md,qa-plan.md}

# Inicializar git
cd $PROJECT_NAME
git init
git checkout -b feature/nueva-caracteristica

echo "✅ Proyecto $PROJECT_NAME creado con estructura base"
echo "📝 Archivos creados:"
echo "   - research.md"
echo "   - prd.md"
echo "   - qa-plan.md"
echo "   - prototype/"
echo "   - src/"
echo "   - tests/"
```

---

## Herramientas Recomendadas por Fase

| Fase | Herramienta | Alternativa |
|------|-------------|-------------|
| Investigación | `research.md` (manual) | Notion, Obsidian |
| Prototipado | Next.js, Figma | CodeSandbox, StackBlitz |
| PRD | VS Code + Markdown | Notion, Confluence |
| Kanban | **Linear** | GitHub Projects, Jira |
| Ejecución | Claude Code | Cursor, Codex, GitHub Copilot |
| QA | Playwright, Jest | Cypress, Vitest |

---

## Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         IDEA                                     │
│            "Quiero una app de tareas con IA"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESEARCH (si aplica)                          │
│              research.md con info de APIs externas                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROTOTYPE                                   │
│         Experimentar con UI/UX en /prototype/                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          PRD                                     │
│              prd.md con user stories y criterios                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     KANBAN BOARD                                 │
│         GitHub Issues / Linear con blocking relations            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               RALPH LOOP (Ejecución)                             │
│     Claude Code trabajando en tickets no bloqueados              │
│         (posible paralelización múltiples agentes)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          QA                                      │
│        Plan de QA → Revisión humana → Nuevos tickets             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Iterar 5-7    │
                    │   hasta fin     │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCCIÓN                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recursos

- **Skills de Matt Pocock:** https://github.com/mattpocock/skills
- **Ralph Loop:** https://www.aihero.dev/getting-started-with-ralph
- **Linear (Kanban con blocking):** https://linear.app
- **Claude Code:** https://claude.ai/code

---

## Notas Importantes

1. **No todos los proyectos necesitan todas las fases.** Un bug fix simple puede saltarse investigación y prototipado.

2. **Los vertical slices son cruciales.** Permiten feedback temprano y evitan trabajo desperdiciado.

3. **El QA humano sigue siendo esencial.** La IA puede generar código, pero la calidad final requiere supervisión humana.

4. **La investigación puede quedar obsoleta.** No guardes research.md por demasiado tiempo.

5. **Los skills son personalizables.** Adáptalos a tu flujo de trabajo específico.
