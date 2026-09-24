function errorValidacion(mensaje) {
    const err = new Error(mensaje);
    err.status = 400
    return err
}

function manejoError(err, res) {
    if(err.status) {
        return res.status(err.status).json({ error: err.message })
    }
    console.err(err);
    res.status(500).json({ error: 'error interno intenta de nuevo'})
}



module.exports = {errorValidacion, manejoError};