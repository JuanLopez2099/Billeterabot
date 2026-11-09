import { useEffect, useState } from 'react';
import { CuentasContext } from './CuentasContext';
import * as api from '../services/cuentas';
import { normalizar } from '../utils/texto';

function ordenar(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function CuentasProvider({ children }) {
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const lista = await api.listarCuentas();
        if (activo) setCuentas(lista);
      } catch (err) {
        if (activo) console.error('No se pudieron cargar las cuentas:', err);
      }
    }

    cargar();
    return () => { activo = false; };
  }, []);

  function buscarPorNombre(nombre) {
    const buscado = normalizar(nombre);
    if (!buscado) return undefined;
    return cuentas.find((c) => normalizar(c.nombre) === buscado);
  }

  async function crear(datos) {
    const nueva = await api.crearCuenta(datos);
    setCuentas((actuales) => ordenar([...actuales, nueva]));
    return nueva;
  }

  async function eliminar(id) {
    await api.eliminarCuenta(id);
    setCuentas((actuales) => actuales.filter((c) => c.id !== id));
  }

  const value = { cuentas, buscarPorNombre, crear, eliminar };

  return (
    <CuentasContext.Provider value={value}>{children}</CuentasContext.Provider>
  );
}