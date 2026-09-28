import { useEffect, useState } from 'react';
import { CategoriasContext } from './CategoriasContext';
import * as api from '../services/categorias';
import { normalizar } from '../utils/texto';

function ordenar(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function CategoriasProvider({ children }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const lista = await api.listarCategorias();
        if (activo) setCategorias(lista);
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => { activo = false; };
  }, []);


  function buscarPorNombre(nombre) {
    const buscado = normalizar(nombre);
    if (!buscado) return undefined;
    return categorias.find((c) => normalizar(c.nombre) === buscado);
  }

  async function crear(nombre) {
    const nueva = await api.crearCategoria(nombre);
    setCategorias((actuales) => ordenar([...actuales, nueva]));
    return nueva; 
  }

  async function editar(id, nombre) {
    const actualizada = await api.editarCategoria(id, nombre);
    setCategorias((actuales) =>
      ordenar(actuales.map((c) => (c.id === id ? actualizada : c)))
    );
    return actualizada;
  }

  async function eliminar(id) {
    await api.eliminarCategoria(id);
    setCategorias((actuales) => actuales.filter((c) => c.id !== id));
  }

  const value = { categorias, cargando, error, buscarPorNombre, crear, editar, eliminar };

  return (
    <CategoriasContext.Provider value={value}>{children}</CategoriasContext.Provider>
  );
}