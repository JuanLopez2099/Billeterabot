import { apiFetch } from './api';

export const obtenerEstadoTelegram = () => apiFetch('/telegram/estado');

export const generarVinculacionTelegram = () =>
  apiFetch('/telegram/vinculacion', { method: 'POST' });

export const desvincularTelegram = () =>
  apiFetch('/telegram/vinculacion', { method: 'DELETE' });