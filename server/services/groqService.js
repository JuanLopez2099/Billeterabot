
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELO = 'openai/gpt-oss-20b';
const TIEMPO_MAXIMO_MS = 8000;

const ESQUEMA = {
  name: 'movimiento_interpretado',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      tipo: { type: 'string', enum: ['gasto', 'ingreso', 'transferencia', 'desconocido'] },
      monto: { type: ['integer', 'null'] },
      cuenta: { type: ['string', 'null'] },
      cuentaDestino: { type: ['string', 'null'] },
      categoria: { type: ['string', 'null'] },
      descripcion: { type: ['string', 'null'] },
    },
    required: ['tipo', 'monto', 'cuenta', 'cuentaDestino', 'categoria', 'descripcion'],
    additionalProperties: false,
  },
};

function construirPrompt({ cuentas, categorias }) {
  const nombresCuentas = cuentas.map((c) => c.nombre).join(', ');
  const nombresCategorias = categorias.map((c) => c.nombre).join(', ');

  return `Eres un asistente que interpreta mensajes en español sobre finanzas personales de un usuario colombiano, y los convierte en un movimiento financiero estructurado. Todos los movimientos se registran con la fecha de hoy; no interpretes ni menciones fechas.

Tipos de movimiento:
- "gasto": el usuario pagó o gastó dinero.
- "ingreso": el usuario recibió dinero.
- "transferencia": el usuario movió dinero entre DOS cuentas propias.
- "desconocido": el mensaje no describe un movimiento financiero claro.

Reglas:
- "monto": en pesos colombianos, como entero sin decimales (ignora puntos de miles y la palabra "pesos"). Ej: "15.000 pesos" -> 15000. "20 mil" -> 20000.
- "cuenta": para "gasto" e "ingreso" es la cuenta usada. Para "transferencia" es la cuenta de ORIGEN. Elige el nombre más parecido entre estas cuentas reales del usuario: ${nombresCuentas || '(sin cuentas registradas)'}. Si no se menciona, usa null.
- "cuentaDestino": solo para "transferencia", de la misma lista. Para los demás tipos, siempre null.
- "categoria": solo para "gasto". Usa el nombre de una de estas si aplica: ${nombresCategorias || '(sin categorías)'}. Si ninguna encaja o no estás seguro, usa null.
- "descripcion": una frase muy corta (máximo 5 palabras) que resuma el movimiento. Si no aplica, null.
- Si el mensaje no tiene monto, o no es sobre dinero, usa tipo "desconocido" con los demás campos en null.

Responde ÚNICAMENTE con el JSON pedido, sin texto adicional.`;
}

async function interpretarMensaje(texto, contexto) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Falta configurar GROQ_API_KEY');

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  let respuesta;
  try {
    respuesta = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: construirPrompt(contexto) },
          { role: 'user', content: texto },
        ],
        response_format: { type: 'json_schema', json_schema: ESQUEMA },
      }),
      signal: controlador.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Groq tardó demasiado en responder');
    throw error;
  } finally {
    clearTimeout(limite);
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`Groq respondió ${respuesta.status}: ${detalle}`);
  }

  const data = await respuesta.json();
  const contenido = data.choices?.[0]?.message?.content;
  if (!contenido) throw new Error('Groq no devolvió contenido');

  return JSON.parse(contenido);
}

module.exports = { interpretarMensaje };