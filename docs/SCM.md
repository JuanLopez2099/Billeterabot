# SCM - Billeterabot

Equipo: Juan Camilo Lopez Gonzalez - Versión del documento: 1.0 - Actualizado: 2026-10-07

## 1. Ítems de configuración

| Item | Donde vive | Como se nombra |
|---|---|---|
| Frontend (React + Vite) | `client/` | Componentes y páginas en PascalCase, servicios en minúscula |
| Backend (Node + Express + bot de Telegram) | `server/` (`bot/`, `routes/`, `services/`) | un servicio por módulo. Ej: `gastosService.js` |
| Historias de usuario | Issues y tablero de github | `Hu<>` / `HU001` a `HU0025` |
| Documentación | `README.md`, `docs/`, `SCM.md`, `CHANGELOG.md` | nombre fijo |

No se versiona: `.env` y `node_modules/`, están en `.gitignore`. Los secretos viven en las variables de entorno donde se despliega el proyecto, railway para el backend contiene: `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`. y vercel para el frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 2. Estrategia de ramas

Use gitflow simplificado sin ramas release o hotfix por que el proyecto lo desarrolla una sola persona, no hay pruebas automatizadas ni QA, cada cambio se prueba a mano en develop antes de llegar a master que es la rama de produccion y la que siempre debe estar estable. Costo que se acepta: dos pasos para publicar rama → develop → master.

| Rama | Sale de | Se fusiona en | Nombre |
|---|---|---|---|
| master | — | — | `master` |
| develop | master | master | `develop` |
| feature | develop | develop | `feature/nombre` |
| fix | develop | develop | `fix/nombre` |

**Reglas:** Todos los cambios entran por pull request para que quede registro de que cambio. No se hacen commits directos en master.

**Commits:** "que hace lo que se agregó"

Ejemplo: "función para eliminar un gasto"

## 3. Versionado y líneas base

Versionado semántico `MAJOR.MINOR.PATCH`: PATCH corrige un error, MINOR agrega o mejora algo de forma compatible y MAJOR rompe la compatibilidad. Cada línea base es una etiqueta `vX.Y.Z` sobre master, y su contenido queda registrado en `CHANGELOG.md`.

| Línea base | Contenido | Aprobó | Fecha |
|---|---|---|---|
| v1.0.0 | Primera versión: autenticación con Google y correo, gastos con categorías, ingresos, transferencias, dashboard y bot de Telegram | Desarrollador principal. | 2026-10-07 |

## 4. Control de cambios

Flujo: solicitud (issue de GitHub) → ficha en este documento → decisión (desarrollar o aplazar) → rama y pull request → nueva línea base. Base de cálculo: Estimación de 3 puntos por tarea, en horas de trabajo con E = (O + 4M + P) / 6 y rango E ± σ donde σ = (P − O) / 6. Costo: COP COP 8.338 por hora.

### CR-001 Seleccion con botones y botón deshacer en el bot

| Campo | Respuesta |
|---|---|
| Ítems afectados | `server/bot/`, `interpretacionService.js`. HU005, HU013 y HU021 |
| Impacto | O 1 h · M 2 h · P 4 h → E ≈ 2,2 h (de 1,7 a 2,7 h) ≈ COP 18.100 (de 13.900 a 22.200) |
| Riesgo | Preguntas pendientes que se pueden pisar |
| Decisión | Aprobada: el usuario no escribe nombres de cuentas y puede corregir un registro hecho por error |
| Nueva linea base | v1.0.0 |

## 5. Ambiente y estado

| Ambiente | Rama | Versión | Estado |
|---|---|---|---|
| Desarrollo | Develop | 1.0.0 | Ajustes para la versión en móvil pendientes. |
| Producción | Master | v1.0.0 | Desplegado y estable |

Volver atrás: como master se despliega solo, revertir el merge con un pull request vuelve a desplegar la versión anterior. También se puede restaurar un despliegue previo desde el panel de Vercel y de Railway.