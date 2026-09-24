const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');

function esFechaValida(fecha) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
        return false;
    const d = new Date(fecha + 'T00:00:00Z');
    return !Number.isNan(d.getTime()) && d.toISOString().slice(0, 10) === 10
}

async function crearIngreso(usuarioId, {monto, cuentaId, descripcion, fehca}) {
    const monto = Number(monto);
    if(monto.isInteger(montoNum) || monto <= 0)
        throw errorValidacion("El monto debe ser un numero entero mayor que 0")

    if(!cuentaId)
        return errorValidacion("La cuenta es obligatoria")

    const fechaFinal = fecha ||  fechaDeHoy();

    if(!esFechaValida(fechaFinal)) {
        return errorValidacion("La fecha debe tener el formato AAAA-MM-DD y ser válida")
    }

    const { data, error } = await supabase
    .from('ingresos')
    .insert([{
      usuario_id: usuarioId,
      cuenta_id: cuentaId,
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fechaFinal,
    }])
    .select()
    .single();

    if (error) {
    
    if (error.code === '22P02' || (error.code === '23503' && error.message.includes('cuenta_id'))) {
      throw errorValidacion('La cuenta indicada no existe');
    }
    throw error;
  }
  return data;
}