const archivosIconos = import.meta.glob('../assets/iconos/categorias/*.svg', {
  eager: true,
  import: 'default',
});


const mapaIconos = {};
for (const [ruta, url] of Object.entries(archivosIconos)) {
  const clave = ruta.split('/').pop().replace(/\.svg$/, '');
  mapaIconos[clave] = url;
}

export function iconoPorClave(clave) {
  return mapaIconos[clave];
}

export const CLAVES_ICONOS = [
  'alimentacion', 'transporte', 'servicios', 'ocio', 'cuidado-personal',
  'hogar', 'salud', 'educacion', 'mascotas', 'ropa', 'tecnologia',
  'viajes', 'regalos', 'otros',
];

export const ICONOS_DISPONIBLES = CLAVES_ICONOS.map((clave) => ({
  clave,
  url: mapaIconos[clave],
}));

export const COLORES_DISPONIBLES = [
  '#1f5c3f', '#b3413a', '#35618c', '#c9a227', '#7a7a6e', '#6c4f8a',
  '#5c8a6e', '#a85c32', '#4a7c8c', '#8a4a63', '#94792c', '#3d5a99',
];