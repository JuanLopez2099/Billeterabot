import { ICONOS_DISPONIBLES } from '../utils/categoriaOpciones';

export default function SelectorIcono({ value, onChange }) {
  return (
    <div className="selector-icono">
      {ICONOS_DISPONIBLES.map(({ clave, url }) => (
        <button
          key={clave}
          type="button"
          className={`selector-icono-opcion ${value === clave ? 'selector-icono-opcion--activa' : ''}`}
          onClick={() => onChange(clave)}
          aria-label={clave}
        >
          {url ? <img src={url} alt="" /> : clave.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}