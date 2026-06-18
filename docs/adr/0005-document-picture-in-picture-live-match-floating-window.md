# Document Picture-in-Picture para ventana flotante de partido en vivo

## Context

Queremos que el usuario siga el resultado de un partido en vivo seleccionado mientras usa otras aplicaciones en computador. Una tarjeta flotante dentro de la web no cumple esa necesidad, y una app de escritorio haria la solucion mucho mas costosa.

**Status**: accepted

## Decision

Usaremos Document Picture-in-Picture para abrir una unica Ventana flotante de partido en vivo, desktop-only, de 360x220 px, con marcador compacto y polling cada 30s mientras la ventana este abierta. Si el navegador no soporta Document Picture-in-Picture, la accion se mostrara deshabilitada con un mensaje de incompatibilidad; no habra fallback a popup normal ni widget interno.

## Considered Options

| Opcion | Decision | Rationale |
|---|---|---|
| Document Picture-in-Picture | Elegida | Permite HTML arbitrario en una ventana always-on-top, alineada con el caso de uso. |
| Widget interno | Rechazada | Es mas compatible, pero solo flota dentro de la pestaña y no resuelve el uso sobre otras apps. |
| Popup normal | Rechazada | Sale de la pestaña, pero no garantiza always-on-top y crea una experiencia inferior. |
| App de escritorio | Rechazada para v1 | Podria garantizar mejor integracion con el OS, pero multiplica alcance y distribucion. |

## Consequences

- La funcionalidad depende de soporte del navegador y contexto seguro.
- Solo se permite una ventana flotante activa por pestaña; abrir otro partido reemplaza el contenido.
- Mientras la ventana este abierta, el polling del partido debe continuar aunque la pestaña principal este oculta.
- La ventana no sobrevive al cierre o recarga de la pestaña que la abrio.
