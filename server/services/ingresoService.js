const supabase = require('../config/supabaseClient');
const { errorValidacion } = require('../utils/errores');

function esFechaValida(fecha) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
        return false;
    const d = new Date(fecha + 'T00:00:00Z');
    return !Number.isNan(d.getTime()) && d.toISOString().slice(0, 10) === 10
}