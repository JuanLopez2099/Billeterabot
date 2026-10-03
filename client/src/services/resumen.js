import { apiFetch } from './api';

export const obtenerResumen = (mes) =>
  apiFetch(`/resumen${mes ? `?mes=${mes}` : ''}`).then((d) => d.resumen);