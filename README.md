# Billeterabot

Aplicación web para llevar el control de las finanzas personales: permite registrar gastos, ingresos y transferencias desde el dashboard o conversando con un bot de Telegram.

## Enlaces

| Recurso | Enlace |
|---|---|
| Aplicación desplegada | https://billeterabot.vercel.app/ |
| Wiki del proyecto (historias de usuario, requerimientos, mock-ups, diagramas) | [github.com/JuanLopez2099/Billeterabot/wiki](https://github.com/JuanLopez2099/Billeterabot/wiki) |
| Gestión de la configuración | [`docs/SCM.md`](docs/SCM.md) |
| Historial de versiones | [`CHANGELOG.md`](CHANGELOG.md) |

## Funcionalidades

- Inicio de sesión con Google o con correo y contraseña, y recuperación de contraseña.
- Gastos con categorías propias (incluye gastos sin categoría), ingresos y transferencias entre cuentas.
- Gestión de cuentas: cuentas predefinidas y cuentas propias con nombre y color.
- Dashboard con resumen mensual, saldo por cuenta, gráficos por categoría, top de gastos e historial. Los movimientos también se registran desde un formulario directo.
- Interfaz adaptable a celulares, con menú de navegación desplegable.
- Bot de Telegram con interpretación de lenguaje natural: registra movimientos, permite corregirlos o deshacerlos, sugiere crear cuentas o categorías faltantes, entiende fechas naturales, responde consultas financieras y admite varios movimientos en un mensaje.

## Tecnologías

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | React, Vite y Recharts | Vercel |
| Backend | Node.js, Express y grammY (bot de Telegram) | Railway |
| Base de datos y autenticación | PostgreSQL y Supabase Auth | Supabase |
| Interpretación del lenguaje natural | Groq API | Groq |

El navegador usa Supabase únicamente para autenticarse. Todas las demás operaciones pasan por la API del backend, que valida el token del usuario en cada petición.

## Estructura del repositorio

```
client/   Frontend (React + Vite)
server/   Backend (Express, bot de Telegram y servicios)
docs/     Documentación del proyecto
```

## Guía de instalación

### Requisitos previos

- Node.js 22 o superior y Git.
- Una cuenta de [Supabase](https://supabase.com) (obligatoria).
- Una cuenta de [Groq](https://console.groq.com) y un bot de Telegram creado con [@BotFather](https://t.me/BotFather) (solo para probar el bot; la parte web funciona sin ellos).

### 1. Clonar el repositorio

```
git clone https://github.com/JuanLopez2099/Billeterabot.git
cd Billeterabot
```

### 2. Crear la base de datos en Supabase

1. Crear un proyecto nuevo en Supabase.
2. Abrir **SQL Editor**, pegar el script de la sección [Esquema de la base de datos](#esquema-de-la-base-de-datos) y ejecutarlo una sola vez.
3. Abrir **Authentication → Providers** y comprobar que **Email** esté habilitado.
4. Para el inicio de sesión con Google, habilitar el proveedor **Google** con el Client ID y el Client Secret creados en Google Cloud Console. La URL de retorno autorizada en Google debe ser `https://<id-del-proyecto>.supabase.co/auth/v1/callback`.
5. En **Authentication → URL Configuration**, agregar `http://localhost:5173` como Site URL y en Redirect URLs (y la URL de la aplicación desplegada, si existe).
6. En **Project Settings → API** copiar la **Project URL**, la clave **anon** (pública) y la clave **service_role** (secreta).

### 3. Obtener las credenciales del bot (opcional)

1. Groq: crear una API key en [console.groq.com](https://console.groq.com).
2. Telegram: enviar `/newbot` a @BotFather y copiar el token. Se recomienda un bot para pruebas y otro para producción.

### 4. Configurar las variables de entorno

En cada carpeta, copiar el archivo de ejemplo y completar los valores según la sección [Variables de entorno](#variables-de-entorno):

```
cd server && cp .env.example .env
cd ../client && cp .env.example .env
```

Los archivos `.env` están en `.gitignore` y nunca deben subirse al repositorio.

### 5. Ejecutar la aplicación

Backend (http://localhost:3000):

```
cd server
npm install
npm run dev
```

Frontend (http://localhost:5173), en otra terminal:

```
cd client
npm install
npm run dev
```

En consola, el backend debe mostrar que el servidor está corriendo. Si `TELEGRAM_BOT_TOKEN` está vacío, el bot queda desactivado y la parte web funciona igual. Si hay token y `TELEGRAM_WEBHOOK_URL` está vacío, el bot funciona por polling.

### 6. Comprobar que todo funciona

1. Abrir http://localhost:5173 y crear una cuenta con correo y contraseña.
2. Registrar un gasto desde **Nuevo movimiento**.
3. (Opcional) Pulsar **Vincular Telegram**, abrir el enlace generado y escribir al bot, por ejemplo: `Gasté 15000 en almuerzo con Nequi`.

## Variables de entorno

### Backend (`server/.env`)

| Variable | Obligatoria | Descripción | Dónde obtenerla |
|---|---|---|---|
| `PORT` | No (por defecto 3000) | Puerto del servidor | En Railway se asigna automáticamente |
| `SUPABASE_URL` | Sí | URL del proyecto de Supabase | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave secreta con acceso total a la base de datos. Solo existe en el backend | Project Settings → API |
| `GROQ_API_KEY` | Para el bot | Clave de Groq para interpretar los mensajes | console.groq.com |
| `TELEGRAM_BOT_TOKEN` | Para el bot | Token del bot. Si está vacío, el bot queda desactivado | @BotFather |
| `TELEGRAM_WEBHOOK_URL` | Solo en producción | URL pública del backend, sin ruta (por ejemplo `https://mi-backend.up.railway.app`). Si está vacía, el bot usa polling | URL del despliegue |
| `TELEGRAM_WEBHOOK_SECRET` | Si hay webhook | Cadena aleatoria con la que Telegram firma sus peticiones. Es obligatoria cuando se define `TELEGRAM_WEBHOOK_URL` | Se inventa (por ejemplo, 32 caracteres aleatorios) |

### Frontend (`client/.env`)

Las variables `VITE_` quedan visibles en el navegador: nunca deben contener secretos.

| Variable | Obligatoria | Descripción | Dónde obtenerla |
|---|---|---|---|
| `VITE_API_URL` | Sí | URL del backend (`http://localhost:3000` en local) | URL del despliegue |
| `VITE_SUPABASE_URL` | Sí | URL del proyecto de Supabase | Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave pública (anon) de Supabase | Project Settings → API |

## Esquema de la base de datos

| Tabla | Contenido |
|---|---|
| `usuarios` | Perfil del usuario (su `id` coincide con el de Supabase Auth) y su chat de Telegram |
| `categorias` | Categorías de gasto de cada usuario (nombre, color e ícono) |
| `cuentas` | Cuentas predefinidas (sin `usuario_id`) y cuentas propias de cada usuario |
| `gastos` | Gastos, con categoría opcional |
| `ingresos` | Ingresos |
| `transferencias` | Transferencias entre dos cuentas |
| `codigos_vinculacion` | Códigos temporales para vincular Telegram |

El diagrama entidad-relación está en la [wiki](https://github.com/JuanLopez2099/Billeterabot/wiki/Diagrama-ER).

Notas del diseño:

- Los nombres de categoría no se repiten dentro de un mismo usuario, sin importar mayúsculas ni tildes (función `normalizar_nombre`, basada en la extensión `unaccent`).
- Las cuentas sin `usuario_id` son las predefinidas (Nequi, Bancolombia, Efectivo, etc.) y las ven todos los usuarios.
- Al eliminar una categoría, sus gastos se conservan y quedan sin categoría (`on delete set null`).
- Row Level Security está activo en todas las tablas y no hay políticas: el acceso a los datos solo es posible a través del backend, con la clave `service_role`.

<details>
<summary>Script SQL completo (ejecutar en Supabase → SQL Editor)</summary>

```sql
-- Billeterabot: esquema de la base de datos (PostgreSQL en Supabase).
-- Ejecutar una sola vez en Supabase > SQL Editor.

-- Extensión usada para comparar nombres sin tildes ni mayúsculas.
create extension if not exists unaccent with schema extensions;

create or replace function public.normalizar_nombre(texto text)
returns text
language sql
immutable
set search_path to ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto));
$$;

-- El id coincide con el del usuario en Supabase Auth (lo asigna el backend).
create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text not null unique,
  categorias_sembradas boolean not null default false,
  telegram_chat_id bigint
);
create unique index usuarios_telegram_chat_id_key on public.usuarios (telegram_chat_id) where telegram_chat_id is not null;

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  nombre text not null,
  es_predefinida boolean not null,
  icono text not null default 'otros',
  color text not null default '#7a7a6e',
  constraint categorias_usuario_nombre_unico unique (usuario_id, nombre)
);
create unique index categorias_usuario_nombre_normalizado_uq on public.categorias (usuario_id, public.normalizar_nombre(nombre));

-- usuario_id nulo = cuenta predefinida (catálogo), visible para todos los usuarios.
create table public.cuentas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  usuario_id uuid references public.usuarios (id) on delete cascade,
  color text
);
create unique index cuentas_nombre_por_usuario_idx on public.cuentas (coalesce(usuario_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(nombre));

create table public.codigos_vinculacion (
  codigo text primary key,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  expira_en timestamptz not null,
  usado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index codigos_vinculacion_usuario_idx on public.codigos_vinculacion (usuario_id);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  cuenta_id uuid not null references public.cuentas (id),
  monto bigint not null,
  descripcion text,
  creado_en timestamptz not null default now(),
  fecha date not null
);

create table public.ingresos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id),
  cuenta_id uuid not null references public.cuentas (id) on delete cascade,
  monto bigint not null,
  descripcion text,
  fecha date not null,
  creado_en timestamp not null default now()
);

create table public.transferencias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  cuenta_origen_id uuid not null references public.cuentas (id),
  cuenta_destino_id uuid not null references public.cuentas (id),
  monto bigint not null,
  fecha date not null,
  creado_en timestamp not null default now()
);

-- Seguridad: el backend usa la clave service_role (ignora RLS) y el navegador
-- solo usa la clave anon para autenticarse. Con RLS activo y sin políticas,
-- las tablas no son accesibles con la clave anon.
alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.cuentas enable row level security;
alter table public.codigos_vinculacion enable row level security;
alter table public.gastos enable row level security;
alter table public.ingresos enable row level security;
alter table public.transferencias enable row level security;

-- Cuentas predefinidas.
insert into public.cuentas (nombre) values
  ('Banco de Bogotá'), ('Daviplata'), ('Nequi'), ('Davivienda'), ('Nu'), ('RappiPay'),
  ('Movii'), ('BBVA'), ('Bancolombia'), ('Lulo Bank'), ('Efectivo')
on conflict do nothing;
```

</details>

## Despliegue

**Frontend en Vercel**

1. Importar el repositorio y configurar **Root Directory** como `client` (el framework Vite se detecta automáticamente).
2. Definir `VITE_API_URL` (URL pública del backend), `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Agregar la URL de Vercel en Supabase, en **Authentication → URL Configuration**.

**Backend en Railway**

1. Crear un servicio desde el repositorio con **Root Directory** `server` y comando de inicio `npm start`.
2. Definir todas las variables del backend. En producción deben estar `TELEGRAM_WEBHOOK_URL` (URL pública del servicio) y `TELEGRAM_WEBHOOK_SECRET`.
3. Al iniciar, el backend registra por sí mismo el webhook en `/webhook/telegram`.

## Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| `email rate limit exceeded` al registrarse o recuperar la contraseña | El correo compartido de Supabase tiene un límite bajo de envíos por hora. Esperar un rato o configurar un SMTP propio |
| El frontend muestra `Failed to fetch` | El backend no está corriendo o `VITE_API_URL` apunta a otra dirección |
| El inicio de sesión con Google devuelve un error de redirección | Falta agregar la URL en **Authentication → URL Configuration** de Supabase |
| El bot no responde en local | Revisar `TELEGRAM_BOT_TOKEN`. Si `TELEGRAM_WEBHOOK_URL` está definida, el bot espera un webhook en vez de usar polling. No ejecutar dos instancias con el mismo token |
| El backend falla al iniciar con `Falta configurar TELEGRAM_WEBHOOK_SECRET` | Se definió `TELEGRAM_WEBHOOK_URL` sin el secreto. Definir ambos o dejar los dos vacíos |

## Documentación

- [Wiki del proyecto](https://github.com/JuanLopez2099/Billeterabot/wiki): historias de usuario, requerimientos no funcionales, mock-ups, flujos de usuario, diagramas y gestión de riesgos.
- [Gestión de la configuración](docs/SCM.md)
- [Historial de versiones](CHANGELOG.md)

## Autor

Juan Camilo Lopez. Proyecto de la asignatura Ingeniería de Software.