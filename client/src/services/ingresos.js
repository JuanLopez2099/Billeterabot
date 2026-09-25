import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;

async function obtenerToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function listarIngresos() {
  const token = await obtenerToken();
  const response = await fetch(`${API_URL}/ingresos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al listar ingresos');
  return data.ingresos;
}

export async function crearIngreso(ingreso) {
  const token = await obtenerToken();
  const response = await fetch(`${API_URL}/ingresos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ingreso),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al crear el ingreso');
  return data.ingreso;
}

export async function eliminarIngreso(id) {
  const token = await obtenerToken();
  const response = await fetch(`${API_URL}/ingresos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Error al eliminar el ingreso');
  }
}

export async function listarCuentas() {
  const token = await obtenerToken();
  const response = await fetch(`${API_URL}/cuentas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al listar cuentas');
  return data.cuentas;
}

export async function editarIngreso(id, ingreso) {
  const token = await obtenerToken();
  const response = await fetch(`${API_URL}/ingresos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ingreso),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al editar el ingreso');
  return data.ingreso;
}