import { apiFetch } from './api';

export const listarTransferencias = () =>
  apiFetch('/transferencias').then((d) => d.transferencias);

export const crearTransferencia = (transferencia) =>
  apiFetch('/transferencias', { method: 'POST', body: JSON.stringify(transferencia) }).then((d) => d.transferencia);

export const editarTransferencia = (id, transferencia) =>
  apiFetch(`/transferencias/${id}`, { method: 'PUT', body: JSON.stringify(transferencia) }).then((d) => d.transferencia);

export const eliminarTransferencia = (id) =>
  apiFetch(`/transferencias/${id}`, { method: 'DELETE' });