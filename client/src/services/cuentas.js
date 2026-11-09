import { apiFetch } from './api';

export const listarCuentas = () =>
  apiFetch('/cuentas').then((d) => d.cuentas);

export const crearCuenta = (datos) =>
  apiFetch('/cuentas', { method: 'POST', body: JSON.stringify(datos) }).then((d) => d.cuenta);

export const eliminarCuenta = (id) =>
  apiFetch(`/cuentas/${id}`, { method: 'DELETE' });