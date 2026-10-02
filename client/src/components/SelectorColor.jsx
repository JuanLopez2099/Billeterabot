import { COLORES_DISPONIBLES } from '../utils/categoriaOpciones';

export default function SelectorColor({ value, onChange }) {
  return (
    <div className="selector-color">
      {COLORES_DISPONIBLES.map((color) => (
        <button
          key={color}
          type="button"
          className={`selector-color-opcion ${value === color ? 'selector-color-opcion--activa' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
        />
      ))}
    </div>
  );
}