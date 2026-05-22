# Unificar páginas, rutas de API, y cache de red en módulos compartidos

El código tenía el patrón de página de deporte, ruta de API, y fetchWithCache triplicado para football, basketball, y MMA. Cada copia era ~95% idéntica. Decidimos consolidar lo que es igual en módulos parametrizados por deporte, y mantener separado solo lo que realmente varía (endpoint, normalizer, leagues).

La alternativa — mantener 3 copias y tratar cada adición de deporte como copy-paste — fue rechazada porque duplica bugs (el handleSearch destructivo afectaba 3 páginas), duplica esfuerzo de testing, y hace que añadir un 4º deporte cueste ~600 líneas de duplicado en vez de una configuración.

**Status**: accepted
