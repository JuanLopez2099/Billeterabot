const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./config/supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ conectado: true, usuarios: data });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.post('/usuarios', async (req, res) => {
  const { id, nombre, email } = req.body;

  if (!id || !nombre || !email) {
    return res.status(400).json({ error: 'Faltan datos: id, nombre y email son obligatorios' });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ id, nombre, email }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ usuario: data[0] });
});