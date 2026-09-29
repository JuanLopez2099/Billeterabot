import { apiFetch } from './api';

export const obtenerResumen = () =>
  apiFetch('/resumen').then((d) => d.resumen);