# Billeterabot

Aplicación web para llevar el control de tus finanzas personales: registra gastos, ingresos y transferencias entre cuentas desde un dashboard o escribiéndole al bot de Telegram en lenguaje natural (por ejemplo, "gasté 15000 en cena").

> **Estado:** cerca del 95 %. Falta afinar la versión móvil.

## Funcionalidades

- Inicio de sesión con Google o con correo y contraseña, y recuperación de contraseña.
- Gastos con categorías propias (incluye gastos sin categoría), ingresos y transferencias entre cuentas.
- Dashboard con resumen mensual, saldo por cuenta, gráficos por categoría, top de gastos e historial de movimientos.
- Bot de Telegram: se vincula a tu cuenta, entiende mensajes con IA (Groq), pregunta con botones lo que falte y permite deshacer un registro.

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
   cp .env.example .env     # completa los valores
   npm install
   npm run dev
   ```
3. Frontend (http://localhost:5173), en otra terminal:
   ```
   cd client
   cp .env.example .env     # completa los valores
   npm install
   npm run dev
   ```

Sin `TELEGRAM_WEBHOOK_URL` el bot funciona por polling, así que no necesitas exponer tu servidor para probarlo.

## Documentación

- Gestión de la configuración: [`docs/SCM.md`](docs/SCM.md)
- Historial de versiones: [`CHANGELOG.md`](CHANGELOG.md)