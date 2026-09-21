import { useState, useEffect } from 'react';
import { testConnection } from './services/api';

function App() {
  const [mensaje, setMensaje] = useState('Conectando...');

  useEffect(() => {
    testConnection()
      .then(setMensaje)
      .catch(() => setMensaje('No se pudo conectar al servidor'));
  }, []);

  return (
    <div>
      <h1>Billeterabot</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;