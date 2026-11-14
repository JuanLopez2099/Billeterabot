# Billeterabot

Aplicación web para llevar el control de tus finanzas personales: registra gastos, ingresos y transferencias desde el dashboard o conversando con el bot de Telegram.

## Funcionalidades

- Inicio de sesión con Google o con correo y contraseña, y recuperación de contraseña.
- Gastos con categorías propias (incluye gastos sin categoría), ingresos y transferencias entre cuentas.
- Gestión de cuentas: usa cuentas predefinidas y crea cuentas propias con nombre y color.
- Dashboard con resumen mensual, saldo por cuenta, gráficos por categoría, top de gastos e historial. Permite iniciar registros de gastos, ingresos y transferencias desde un formulario directo.
- Interfaz adaptable a móviles con menú de navegación, acceso a las secciones, vinculación de Telegram y cierre de sesión.
- Bot de Telegram con interpretación de lenguaje natural: registra movimientos, permite corregirlos o deshacerlos, sugiere crear cuentas o categorías faltantes, entiende fechas y responde consultas financieras. También admite varios movimientos en un mensaje.

## Tecnologías

React + Vite y Recharts (frontend) · Node.js + Express y grammY (backend) · PostgreSQL y autenticación con Supabase · Groq API · Vercel (frontend) y Railway (backend).

## Estructura

```
client/   Frontend (React)
server/   Backend (Express, bot de Telegram y servicios)
docs/     Documentación del proyecto
```

## Cómo correrlo en local

Requisitos: Node.js 22 o superior, y cuentas en Supabase, Groq y Telegram (token de @BotFather).

1. Clona el repositorio:
   ```
   git clone https://github.com/JuanLopez2099/Billeterabot.git
   cd Billeterabot
   ```
2. Backend (http://localhost:3000):
   ```
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Frontend (http://localhost:5173), en otra terminal:
   ```
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

Sin `TELEGRAM_WEBHOOK_URL` el bot funciona por polling.

## Documentación

- Gestión de configuración: [`docs/SCM.md`](docs/SCM.md)
- Historial de versiones: [`CHANGELOG.md`](CHANGELOG.md)
