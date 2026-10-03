import { iconoPorClave } from '../utils/categoriaOpciones';

export default function EtiquetaCategoria({ categoria }) {
  if (!categoria) {
    return <span className="pill">Sin categoría</span>;
  }

  const logo = iconoPorClave(categoria.icono);

  return (
    <span
      className="etiqueta-cuenta"
      style={{ backgroundColor: `${categoria.color}26`, borderColor: `${categoria.color}59` }}
    >
      {logo ? (
        <img src={logo} alt="" className="etiqueta-cuenta-logo" />
      ) : (
        <span className="etiqueta-cuenta-inicial" style={{ backgroundColor: categoria.color }}>
          {categoria.nombre.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="etiqueta-cuenta-texto">{categoria.nombre}</span>
    </span>
  );
}