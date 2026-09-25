const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./config/supabaseClient');
const requireAuth = require('./middleware/auth');
const ingresosRoutes = require('./routes/ingresos');
const cuentasRoutes = require('./routes/cuentas');

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

  res.status(200).json({ usuario: data[0] });
});

app.use('/ingresos', ingresosRoutes);
app.use('/cuentas', cuentasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});