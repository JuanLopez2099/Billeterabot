const NOMBRES_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];


function formatoMesLargo(mes) {
  const [anio, numero] = mes.split('-');
  return `${NOMBRES_MES[Number(numero) - 1]} ${anio}`;
}

function sumarMes(mes, cantidad) {
  const [anio, numero] = mes.split('-').map(Number);
  return new Date(Date.UTC(anio, numero - 1 + cantidad, 1)).toISOString().slice(0, 7);
}

export default function SelectorMes({ mes, mesMaximo, onCambiar }) {
  const esMesActual = mes === mesMaximo;

  return (
    <div className="selector-mes">
      <button
        type="button"
        className="selector-mes-boton"
        onClick={() => onCambiar(sumarMes(mes, -1))}
        aria-label="Mes anterior"
      >
        ←
      </button>
      <span className="selector-mes-texto">{formatoMesLargo(mes)}</span>
      <button
        type="button"
        className="selector-mes-boton"
        onClick={() => onCambiar(sumarMes(mes, 1))}
        disabled={esMesActual}
        aria-label="Mes siguiente"
      >
        →
      </button>
    </div>
  );
}