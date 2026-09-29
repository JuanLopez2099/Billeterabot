import { apiFetch } from './api';

export const listarHistorial = (limite = 20) =>
  apiFetch(`/historial?limite=${limite}`).then((d) => d.historial);