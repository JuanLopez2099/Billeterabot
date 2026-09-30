import { apiFetch } from './api';

export const listarGastos = () =>
  apiFetch('/gastos').then((d) => d.gastos);

export const crearGasto = (gasto) =>
  apiFetch('/gastos', { method: 'POST', body: JSON.stringify(gasto) }).then((d) => d.gasto);

export const editarGasto = (id, gasto) =>
  apiFetch(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(gasto) }).then((d) => d.gasto);

export const eliminarGasto = (id) =>
  apiFetch(`/gastos/${id}`, { method: 'DELETE' });