// client/src/services/ingresos.js
import { apiFetch } from './api';

export const listarIngresos = () =>
  apiFetch('/ingresos').then((d) => d.ingresos);

export const crearIngreso = (ingreso) =>
  apiFetch('/ingresos', { method: 'POST', body: JSON.stringify(ingreso) }).then((d) => d.ingreso);

export const editarIngreso = (id, ingreso) =>
  apiFetch(`/ingresos/${id}`, { method: 'PUT', body: JSON.stringify(ingreso) }).then((d) => d.ingreso);

export const eliminarIngreso = (id) =>
  apiFetch(`/ingresos/${id}`, { method: 'DELETE' });

export const listarCuentas = () =>
  apiFetch('/cuentas').then((d) => d.cuentas);