import { apiFetch } from './api';

export const listarCategorias = () =>
  apiFetch('/categorias').then((d) => d.categorias);

export const crearCategoria = (nombre) =>
  apiFetch('/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }).then((d) => d.categoria);

export const editarCategoria = (id, nombre) =>
  apiFetch(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }).then((d) => d.categoria);

export const eliminarCategoria = (id) =>
  apiFetch(`/categorias/${id}`, { method: 'DELETE' });