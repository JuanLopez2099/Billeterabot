const BANCOS = {
  nequi: { color: '#DA0081' },
  daviplata: { color: '#DD141D' },
  bancolombia: { color: '#FFD200' },
  davivienda: { color: '#ED1C27' },
  'banco de bogota': { color: '#14327D' },
  nu: { color: '#820AD1' },
  bbva: { color: '#004481' },
  rappipay: { color: '#FF441F' },
  'lulo bank': { color: '#E6FF00', borde: '#7D8A11' },
  movii: { color: '#7A7A6E' }, // TODO: cambiar por el color real sacado del logo
  efectivo: { color: '#2E7D32' },
};

const COLOR_POR_DEFECTO = '#7A7A6E';


export function normalizarNombre(nombre = '') {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function colorDeCuenta(nombre) {
  return BANCOS[normalizarNombre(nombre)]?.color || COLOR_POR_DEFECTO;
}

export function colorBordeDeCuenta(nombre) {
  const banco = BANCOS[normalizarNombre(nombre)];
  return banco?.borde || banco?.color || COLOR_POR_DEFECTO;
}