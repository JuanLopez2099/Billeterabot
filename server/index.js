const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./config/supabaseClient');
const requireAuth = require('./middleware/auth');
const ingresosRoutes = require('./routes/ingresos');
const cuentasRoutes = require('./routes/cuentas');
const transferenciasRoutes = require('./routes/transferencias');
const categoriasRoutes = require('./routes/categorias');
const categoriaService = require('./services/categoriaService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});


app.post('/usuarios', requireAuth, async (req, res) => {
  const { nombre } = req.body;
  const id = req.user.id;         
  const email = req.user.email;   
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .upsert([{ id, nombre, email }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  try {
    await categoriaService.sembrarPredefinidasSiNoTiene(id);
  } catch (err) {
    console.error('No se pudieron sembrar las categorías predefinidas:', err);
  }

  res.status(200).json({ usuario: data[0] });

  res.status(200).json({ usuario: data[0] });
});

app.use('/ingresos', ingresosRoutes);
app.use('/cuentas', cuentasRoutes);
app.use('/transferencias', transferenciasRoutes);
app.use('/categorias', categoriasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});