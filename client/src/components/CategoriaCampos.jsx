import SelectorColor from './SelectorColor';
import SelectorIcono from './SelectorIcono';

export default function CategoriaCampos({
  nombre, onNombreChange,
  color, onColorChange,
  icono, onIconoChange,
  idPrefix = 'categoria',
}) {
  return (
    <>
      <div className="campo-ancho">
        <label htmlFor={`${idPrefix}-nombre`}>Nombre</label>
        <input
          id={`${idPrefix}-nombre`}
          type="text"
          placeholder="Ej. Mascotas"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          maxLength={40}
          required
        />
      </div>
      <div className="campo-ancho">
        <label>Color</label>
        <SelectorColor value={color} onChange={onColorChange} />
      </div>
      <div className="campo-ancho">
        <label>Ícono</label>
        <SelectorIcono value={icono} onChange={onIconoChange} />
      </div>
    </>
  );
}