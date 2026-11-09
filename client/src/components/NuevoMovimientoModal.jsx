import { useState } from 'react';
import { useCuentas } from '../context/useCuentas';
import { useCategorias } from '../context/useCategorias';
import { crearGasto } from '../services/gastos';
import { crearIngreso } from '../services/ingresos';
import { crearTransferencia } from '../services/transferencias';

const SIN_CATEGORIA = '__ninguna__';

const TIPOS = [
  { clave: 'gasto', texto: 'Gasto' },
  { clave: 'ingreso', texto: 'Ingreso' },
  { clave: 'transferencia', texto: 'Transferencia' },
];

const TEXTO_BOTON = {
  gasto: 'Agregar gasto',
  ingreso: 'Agregar ingreso',
  transferencia: 'Agregar transferencia',
};

export default function NuevoMovimientoModal({ onCerrar, onGuardado }) {
  const { cuentas } = useCuentas();
  const { categorias } = useCategorias();
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

  const [tipo, setTipo] = useState('gasto');
  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [cuentaOrigenId, setCuentaOrigenId] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setError('');
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (tipo === 'gasto') {
        await crearGasto({
          monto,
          cuentaId,
          categoriaId: categoriaId === SIN_CATEGORIA ? null : categoriaId,
          descripcion,
          fecha,
        });
      } else if (tipo === 'ingreso') {
        await crearIngreso({ monto, cuentaId, descripcion, fecha });
      } else {
        await crearTransferencia({ monto, cuentaOrigenId, cuentaDestinoId, fecha });
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  function opcionesDeCuentas() {
    return cuentas.map((c) => (
      <option key={c.id} value={c.id}>{c.nombre}</option>
    ));
  }

  return (
    <div className="modal-overlay">
      <div className="modal-tarjeta modal-tarjeta--formulario">
        <h3>Nuevo movimiento</h3>

        <div className="selector-tipo" role="group" aria-label="Tipo de movimiento">
          {TIPOS.map((t) => (
            <button
              key={t.clave}
              type="button"
              className={`selector-tipo-opcion ${tipo === t.clave ? 'selector-tipo-opcion--activa' : ''}`}
              aria-pressed={tipo === t.clave}
              onClick={() => cambiarTipo(t.clave)}
            >
              {t.texto}
            </button>
          ))}
        </div>

        <form onSubmit={manejarSubmit} className="formulario-grid">
          <div>
            <label htmlFor="nm-monto">Monto</label>
            <input
              id="nm-monto"
              type="number"
              placeholder="Ej. 45000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="nm-fecha">Fecha</label>
            <input
              id="nm-fecha"
              type="date"
              value={fecha}
              max={hoy}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          {tipo === 'transferencia' ? (
            <>
              <div>
                <label htmlFor="nm-origen">Desde</label>
                <select
                  id="nm-origen"
                  value={cuentaOrigenId}
                  onChange={(e) => setCuentaOrigenId(e.target.value)}
                  required
                >
                  <option value="">Cuenta de origen</option>
                  {opcionesDeCuentas()}
                </select>
              </div>
              <div>
                <label htmlFor="nm-destino">Hacia</label>
                <select
                  id="nm-destino"
                  value={cuentaDestinoId}
                  onChange={(e) => setCuentaDestinoId(e.target.value)}
                  required
                >
                  <option value="">Cuenta de destino</option>
                  {opcionesDeCuentas()}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className={tipo === 'ingreso' ? 'campo-ancho' : ''}>
                <label htmlFor="nm-cuenta">Cuenta</label>
                <select
                  id="nm-cuenta"
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {opcionesDeCuentas()}
                </select>
              </div>

              {tipo === 'gasto' && (
                <div>
                  <label htmlFor="nm-categoria">Categoría</label>
                  <select
                    id="nm-categoria"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                    <option value={SIN_CATEGORIA}>Sin categoría</option>
                  </select>
                </div>
              )}

              <div className="campo-ancho">
                <label htmlFor="nm-descripcion">Descripción (opcional)</label>
                <input
                  id="nm-descripcion"
                  type="text"
                  placeholder={tipo === 'gasto' ? 'Ej. Almuerzo con amigos' : 'Ej. Pago de salario'}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <div className="mensaje-error campo-ancho">{error}</div>}

          <div className="formulario-acciones campo-ancho">
            <button type="submit" className="boton boton-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : TEXTO_BOTON[tipo]}
            </button>
            <button type="button" className="boton boton-secundario" onClick={onCerrar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}