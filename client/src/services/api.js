import { supabase } from '../lib/supabaseClient';

export const API_URL = import.meta.env.VITE_API_URL;

async function obtenerToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}


export async function apiFetch(path, options = {}) {
  const token = await obtenerToken();
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return null; 

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}