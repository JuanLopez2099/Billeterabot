# SCM - Billeterabot

Equipo: Juan Camilo Lopez Gonzalez - Versión del documento: 1.5 - Actualizado: 2026-11-14

## 1. Ítems de configuración

| Item | Donde vive | Como se nombra |
|---|---|---|
| Frontend (React + Vite) | `client/` | Componentes y páginas en PascalCase, servicios en minúscula |
| Backend (Node + Express + bot de Telegram) | `server/` (`bot/`, `routes/`, `services/`) | un servicio por módulo. Ej: `gastosService.js` |
| Historias de usuario | Issues y tablero de github | `Hu<>` / `HU001` a `HU0025` |
| Documentación | `README.md`, `docs/`, `CHANGELOG.md` | nombre fijo |

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

Versionado semántico `MAJOR.MINOR.PATCH`: PATCH corrige un error, MINOR agrega o mejora algo de forma compatible y MAJOR rompe la compatibilidad. Cada línea base es una etiqueta `X.Y.Z` sobre master, y su contenido queda registrado en `CHANGELOG.md`.

| Línea base | Contenido | Aprobó | Fecha |
|---|---|---|---|
| 1.0.0 | Primera versión: autenticación con Google y correo, gastos con categorías, ingresos, transferencias, dashboard y bot de Telegram | Desarrollador principal | 2026-10-07 |
| 1.1.0 | Cuentas propias con nombre y color, junto con las cuentas predefinidas | Desarrollador principal | 2026-11-08 |
| 1.2.0 | Registro de gastos, ingresos y transferencias directamente desde el dashboard | Desarrollador principal | 2026-11-09 |
| 1.3.0 | Mejoras conversacionales del bot: correcciones, creación sugerida, fechas naturales, consultas y múltiples movimientos | Desarrollador principal | 2026-11-13 |
| 1.4.0 | Interfaz adaptable a móviles con menú de navegación y dashboard reorganizado para pantallas pequeñas | Desarrollador principal | 2026-11-14 |

## 4. Control de cambios

Flujo: solicitud (issue de GitHub) → ficha en este documento → decisión (desarrollar o aplazar) → rama y pull request → nueva línea base. Base de cálculo: Estimación de 3 puntos por tarea, en horas de trabajo con E = (O + 4M + P) / 6 y rango E ± σ donde σ = (P − O) / 6. Costo: COP COP 8.338 por hora.

### CR-001 Seleccion con botones y botón deshacer en el bot

| Campo | Respuesta |
|---|---|
| Ítems afectados | `server/bot/`, `interpretacionService.js`. HU005, HU013 y HU021 |
| Impacto | O 1 h · M 2 h · P 4 h → E ≈ 2,2 h (de 1,7 a 2,7 h) ≈ COP 18.100 (de 13.900 a 22.200) |
| Riesgo | Preguntas pendientes que se pueden pisar |
| Decisión | Aprobada: el usuario no escribe nombres de cuentas y puede corregir un registro hecho por error |
| Nueva linea base | 1.0.0 |

### CR-002 Cuentas propias

| Campo | Respuesta |
|---|---|
| Ítems afectados | Tabla `cuentas` y `usuario_id`; página y contexto de cuentas; rutas y servicios de cuentas y movimientos |
| Impacto | Permite crear cuentas propias con nombre y color, junto con las predefinidas. Las propias pueden eliminarse cuando no tienen movimientos |
| Riesgo | Eliminar una cuenta con movimientos podría afectar el historial; el servicio bloquea esa eliminación |
| Decisión | Aprobada: cada usuario puede gestionar cuentas propias y seguir utilizando las cuentas predefinidas |
| Nueva linea base | 1.1.0 |

### CR-003 Registro de movimientos desde el dashboard

| Campo | Respuesta |
|---|---|
| Ítems afectados | `client/src/pages/General.jsx`, nuevo componente `NuevoMovimientoModal.jsx` y estilos del dashboard y movimientos; servicios existentes de gastos, ingresos y transferencias |
| Impacto | Permite iniciar desde el dashboard el registro de gastos, ingresos y transferencias, sin tener que entrar a una categoría |
| Riesgo | Datos incompletos o selección incorrecta de cuenta/categoría; el formulario exige los campos requeridos y conserva la validación de los servicios existentes |
| Decisión | Aprobada: acceso directo al formulario unificado desde el dashboard |
| Nueva linea base | 1.2.0 |

### CR-004 Mejoras de lenguaje natural y consultas en el bot

| Campo | Respuesta |
|---|---|
| Ítems afectados | `server/bot/`, servicios de interpretación, consultas e historial, y utilidades de conversación, fechas y periodos |
| Impacto | El bot permite corregir o deshacer movimientos con texto, sugiere crear cuentas o categorías faltantes, interpreta fechas naturales, responde consultas financieras y registra varios movimientos de un mensaje |
| Riesgo | Interpretación incorrecta del mensaje, fechas o periodo; el servidor valida los datos y aplica las reglas de los servicios existentes antes de guardar |
| Decisión | Aprobada: ampliar el registro por lenguaje natural y habilitar consultas financieras |
| Nueva linea base | 1.3.0 |

### CR-005 Rediseño de interfaz móvil

| Campo | Respuesta |
|---|---|
| Ítems afectados | `client/src/App.jsx`, `client/src/components/Topbar.jsx`, `client/src/styles/topbar.css`, `client/src/styles/dashboard.css` y nuevo hook `client/src/utils/useEsMovil.js` |
| Impacto | La navegación se adapta a pantallas móviles mediante un menú hamburguesa; el menú permite cambiar de sección, vincular Telegram y cerrar sesión, y el dashboard reorganiza sus tarjetas en una columna |
| Riesgo | Un cambio de tamaño de pantalla podría dejar desactualizada la vista móvil; el hook escucha cambios del ancho de pantalla y actualiza el modo de navegación |
| Decisión | Aprobada: adaptar la navegación y la distribución del dashboard a dispositivos móviles |
| Nueva linea base | 1.4.0 |

## 5. Ambiente y estado

| Ambiente | Rama | Versión | Estado |
|---|---|---|---|
| Desarrollo | Develop | 1.4.0 | Cambio integrado en develop; pendiente de publicación |
| Producción | Master | 1.3.0 | Integrada mediante PR #51 |

Volver atrás: como master se despliega solo, revertir el merge con un pull request vuelve a desplegar la versión anterior. También se puede restaurar un despliegue previo desde el panel de Vercel y de Railway.
