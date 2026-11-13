const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELO = 'openai/gpt-oss-20b';
const TIEMPO_MAXIMO_MS = 8000;

const ESQUEMA = {
  name: 'mensaje_interpretado',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      intencion: { type: 'string', enum: ['registrar', 'corregir', 'deshacer', 'crear_cuenta', 'crear_categoria', 'saludo', 'agradecimiento', 'ayuda', 'desconocido'] },
      tipo: { type: 'string', enum: ['gasto', 'ingreso', 'transferencia', 'ninguno'] },
      monto: { type: ['integer', 'null'] },
      cuenta: { type: ['string', 'null'] },
      cuentaDestino: { type: ['string', 'null'] },
      categoria: { type: ['string', 'null'] },
      descripcion: { type: ['string', 'null'] },
      nombre: { type: ['string', 'null'] },
      fecha: { type: ['string', 'null'] },
    },
    required: ['intencion', 'tipo', 'monto', 'cuenta', 'cuentaDestino', 'categoria', 'descripcion', 'nombre', 'fecha'],
    additionalProperties: false,
  },
};


function describirUltimo(ultimo) {
  if (!ultimo) return 'El usuario no tiene ningún movimiento reciente que corregir o deshacer.';
  const partes = [`${ultimo.tipo} de ${ultimo.monto} pesos`];
  if (ultimo.cuentaNombre) {
    partes.push(ultimo.tipo === 'transferencia' ? `desde ${ultimo.cuentaNombre}` : `con la cuenta ${ultimo.cuentaNombre}`);
  }
  if (ultimo.cuentaDestinoNombre) partes.push(`hacia ${ultimo.cuentaDestinoNombre}`);
  if (ultimo.categoriaNombre) partes.push(`categoría ${ultimo.categoriaNombre}`);
  if (ultimo.descripcion) partes.push(`descripción "${ultimo.descripcion}"`);
  return `Último movimiento registrado por el usuario: ${partes.join(', ')}.`;
}

function construirPrompt({ cuentas, categorias, ultimo }) {
  const nombresCuentas = cuentas.map((c) => c.nombre).join(', ');
  const nombresCategorias = categorias.map((c) => c.nombre).join(', ');

  return `Eres el asistente de un bot de finanzas personales para un usuario colombiano. Interpretas su mensaje en español y lo conviertes en datos estructurados. Si el usuario dice cuándo ocurrió el movimiento, cópialo en "fecha" tal como lo dijo: tú no conviertes ni calculas fechas.

${describirUltimo(ultimo)}

Primero decide la "intencion" del mensaje:
- "registrar": el usuario cuenta un gasto, un ingreso o una transferencia NUEVOS, aunque le falte algún dato (por ejemplo, el monto).
- "corregir": el usuario quiere cambiar algo del último movimiento ya registrado ("no, eran 20000", "ponlo en Bancolombia", "era de transporte", "me equivoqué, fue con Nequi").
- "deshacer": el usuario quiere borrar o anular el último movimiento ("deshaz eso", "bórralo", "elimina eso", "me equivoqué, quítalo").
- "crear_cuenta": el usuario pide crear o agregar una cuenta nueva SIN contar ningún movimiento ("crea la cuenta Binance", "agrega una cuenta llamada Ahorros viaje").
- "crear_categoria": el usuario pide crear o agregar una categoría nueva SIN contar ningún movimiento ("crea la categoría Maquillaje", "quiero una categoría de mascotas").
- "saludo": solo saluda ("hola", "buenas", "qué tal").
- "agradecimiento": agradece, confirma o se despide ("gracias", "listo", "perfecto", "chao").
- "ayuda": pregunta qué puedes hacer o cómo se usa el bot.
- "desconocido": cualquier otra cosa.
Un mensaje que cuenta un movimiento nuevo completo ("gasté 20000 en taxi") es "registrar", aunque se parezca al último. Si el mensaje trae un monto, nunca uses "crear_cuenta" ni "crear_categoria".

Si la intención es "crear_cuenta" o "crear_categoria", usa tipo "ninguno", escribe en "nombre" solo el nombre que pidió el usuario tal como lo dijo (sin artículos como "la" o "el" y sin las palabras "cuenta" o "categoría") y deja los demás campos en null. Si no dijo ningún nombre, "nombre" va en null.

Si la intención NO es "registrar", "corregir", "crear_cuenta" ni "crear_categoria", usa tipo "ninguno" y todos los demás campos en null.

Si la intención es "corregir", usa tipo "ninguno" y llena SOLO los campos que el usuario quiere cambiar (monto, cuenta, cuentaDestino, categoria); los demás van en null. "descripcion" va en null, salvo que el usuario pida expresamente cambiar la descripción.

Si la intención es "registrar", elige el "tipo":
- "gasto": el usuario pagó o gastó dinero.
- "ingreso": el usuario recibió dinero.
- "transferencia": el usuario movió dinero entre DOS cuentas propias.

Reglas para los campos (en "registrar" y "corregir"):
- "monto": en pesos colombianos, como entero sin decimales (ignora puntos de miles y la palabra "pesos"). Ej: "15.000 pesos" -> 15000. "20 mil" -> 20000. Si el usuario no menciona ningún monto, usa null. Nunca inventes un monto.
- "cuenta": para "gasto" e "ingreso" es la cuenta usada. Para "transferencia" es la cuenta de ORIGEN. Si el nombre se parece a una de estas cuentas reales del usuario, usa el nombre de la cuenta real: ${nombresCuentas || '(sin cuentas registradas)'}. Si menciona una cuenta que no se parece a ninguna, escribe el nombre tal como lo dijo. Si no menciona cuenta, usa null. Una cuenta es un banco, una billetera digital, una tarjeta, una alcancía o el efectivo donde el usuario guarda su dinero. Un comercio, lugar, persona, producto o servicio NO es una cuenta (por ejemplo "en el Éxito", "a Juan" o "en tinto" no son cuentas).
- "cuentaDestino": solo para "transferencia", con las mismas reglas. Para los demás tipos, siempre null.
- "categoria": solo para gastos. Categorías del usuario: ${nombresCategorias || '(sin categorías)'}. Si por su significado el gasto encaja claramente con una de ellas, usa el nombre exacto de esa categoría aunque el usuario no la haya dicho (por ejemplo, un labial encaja con una categoría de maquillaje y un taxi con una de transporte). Si el gasto no encaja con ninguna, usa null: no inventes categorías ni uses el nombre de un producto, comercio o lugar como categoría. Solo si el usuario dice expresamente una categoría que no está en la lista (por ejemplo "categoría Mascotas"), escribe ese nombre tal como lo dijo. Si no estás seguro, usa null.
- "descripcion": en "registrar", una frase muy corta (máximo 5 palabras) que resuma el movimiento. Si no aplica, null.
- "nombre": solo se usa en "crear_cuenta" y "crear_categoria". En cualquier otra intención va en null.
- "fecha": la expresión que usó el usuario para decir CUÁNDO ocurrió el movimiento, copiada tal cual y sin convertirla en una fecha: "ayer", "anteayer", "el lunes", "el viernes pasado", "el 3 de noviembre", "hace 3 días", "el 15", "mañana". Si no dice cuándo, usa null. No incluyas horas ni otras palabras del mensaje. En "corregir", llena "fecha" solo si el usuario quiere cambiar la fecha ("no, fue ayer", "era del lunes"); en cualquier otro caso va en null.

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