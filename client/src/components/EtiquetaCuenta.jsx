import { colorDeCuenta, colorBordeDeCuenta, normalizarNombre } from '../utils/bancos';
import { useCuentas } from '../context/useCuentas';


const archivosLogos = import.meta.glob('../assets/bancos/*.{png,svg,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
});


const logos = {};
for (const [ruta, url] of Object.entries(archivosLogos)) {
  const nombreArchivo = ruta.split('/').pop().replace(/\.[^.]+$/, '');
  logos[nombreArchivo] = url;
}


function nombreDeArchivo(nombre) {
  return normalizarNombre(nombre).replace(/\s+/g, '-');
}

export default function EtiquetaCuenta({ nombre }) {
  const { buscarPorNombre } = useCuentas();

  if (!nombre) return null;

  const propia = buscarPorNombre(nombre);
  const colorPropio = propia?.es_propia ? propia.color : null;

  const color = colorPropio || colorDeCuenta(nombre);
  const colorBorde = colorPropio || colorBordeDeCuenta(nombre);
  const logo = propia?.es_propia ? undefined : logos[nombreDeArchivo(nombre)];

  const estilo = { backgroundColor: `${color}26`, borderColor: `${colorBorde}59` };

  return (
    <span className="etiqueta-cuenta" style={estilo}>
      {logo ? (
        <img src={logo} alt="" className="etiqueta-cuenta-logo" />
      ) : (
        <span className="etiqueta-cuenta-inicial" style={{ backgroundColor: color }}>
          {nombre.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="etiqueta-cuenta-texto">{nombre}</span>
    </span>
  );
}


export function EtiquetasTransferencia({ origen, destino }) {
  return (
    <span className="etiquetas-transferencia">
      <EtiquetaCuenta nombre={origen} />
      <span className="etiquetas-transferencia-flecha">→</span>
      <EtiquetaCuenta nombre={destino} />
    </span>
  );
}