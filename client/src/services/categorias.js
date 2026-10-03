import { apiFetch } from './api';

export const listarCategorias = () =>
  apiFetch('/categorias').then((d) => d.categorias);

export const crearCategoria = (datos) =>
  apiFetch('/categorias', { method: 'POST', body: JSON.stringify(datos) }).then((d) => d.categoria);

export const editarCategoria = (id, datos) =>
  apiFetch(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(datos) }).then((d) => d.categoria);

export const eliminarCategoria = (id) =>
  apiFetch(`/categorias/${id}`, { method: 'DELETE' });