import { useEffect, useState } from 'react';

export function useEsMovil(anchoMaximo = 860) {
  const consulta = `(max-width: ${anchoMaximo}px)`;
  const [esMovil, setEsMovil] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const lista = window.matchMedia(consulta);
    const actualizar = (e) => setEsMovil(e.matches);
    lista.addEventListener('change', actualizar);
    return () => lista.removeEventListener('change', actualizar);
  }, [consulta]);

  return esMovil;
}