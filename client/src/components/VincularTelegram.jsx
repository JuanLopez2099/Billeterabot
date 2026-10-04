import { useEffect, useState } from 'react';
import { obtenerEstadoTelegram, generarVinculacionTelegram, desvincularTelegram } from '../services/telegram';
import iconoTelegram from '../assets/iconos/telegram.svg';


function formatoHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export default function VincularTelegram() {
  const [estado, setEstado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vinculacion, setVinculacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmandoDesvinculo, setConfirmandoDesvinculo] = useState(false);

  async function cargarEstado() {
    try {
      const datos = await obtenerEstadoTelegram();
      setEstado(datos);
    } catch {
      setEstado({ vinculado: false, botDisponible: false });
    }
  }

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await obtenerEstadoTelegram();
        if (activo) setEstado(datos);
      } catch {
        if (activo) setEstado({ vinculado: false, botDisponible: false });
      }
    }

    cargar();
    return () => { activo = false; };
  }, []);

  async function abrirVinculacion() {
    setModalAbierto(true);
    setError('');
    setCargando(true);
    try {
      const datos = await generarVinculacionTelegram();
      setVinculacion(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function cerrarModal() {
    setModalAbierto(false);
    setVinculacion(null);
    setError('');
  }

  async function confirmarVinculado() {
    await cargarEstado();
    cerrarModal();
  }

  async function confirmarDesvinculo() {
    setConfirmandoDesvinculo(false);
    try {
      await desvincularTelegram();
      setEstado((e) => ({ ...e, vinculado: false }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!estado) return null;

  if (estado.vinculado) {
    return (
      <>
        <button
          className="boton boton-secundario boton-telegram boton-telegram--activo"
          onClick={() => setConfirmandoDesvinculo(true)}
        >
          <img src={iconoTelegram} alt="" className="boton-telegram-icono" />
          Telegram vinculado
        </button>

        {confirmandoDesvinculo && (
          <div className="modal-overlay" onClick={() => setConfirmandoDesvinculo(false)}>
            <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
              <h3>Desvincular Telegram</h3>
              <p>El bot dejará de reconocerte hasta que vuelvas a vincular tu cuenta. ¿Seguro que quieres continuar?</p>
              <div className="modal-acciones">
                <button className="boton boton-secundario" onClick={() => setConfirmandoDesvinculo(false)}>Cancelar</button>
                <button className="boton boton-peligro" onClick={confirmarDesvinculo}>Desvincular</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        className="boton boton-secundario boton-telegram"
        onClick={abrirVinculacion}
        disabled={!estado.botDisponible}
        title={!estado.botDisponible ? 'El bot no está disponible en este momento' : undefined}
      >
        <img src={iconoTelegram} alt="" className="boton-telegram-icono" />
        Vincular Telegram
      </button>

      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-tarjeta" onClick={(e) => e.stopPropagation()}>
            <h3>Vincular Telegram</h3>

            {cargando && <p className="estado-cargando">Generando enlace...</p>}
            {error && <p className="mensaje-error">{error}</p>}

            {vinculacion && (
              <>
                <p>
                  Abre este enlace desde tu celular (donde tengas Telegram instalado) y pulsa
                  <strong> Iniciar</strong> en el chat con el bot:
                </p>
                <a
                  href={vinculacion.enlace}
                  target="_blank"
                  rel="noreferrer"
                  className="boton boton-primario enlace-telegram"
                >
                  Abrir en Telegram
                </a>
                <p className="enlace-telegram-codigo">
                  O, si ya tienes el chat abierto, escribe: <code>/start {vinculacion.codigo}</code>
                </p>
                <p className="tarjeta-encabezado-nota">
                  Válido hasta las {formatoHora(vinculacion.expiraEn)}
                </p>
              </>
            )}

            <div className="modal-acciones">
              <button className="boton boton-secundario" onClick={cerrarModal}>Cerrar</button>
              {vinculacion && (
                <button className="boton boton-primario" onClick={confirmarVinculado}>
                  Ya lo vinculé
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}