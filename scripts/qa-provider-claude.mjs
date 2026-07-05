// Test OFFLINE del proveedor Claude en el Worker.
//
// No requiere red ni API key: importa el Worker real y reemplaza globalThis.fetch
// por un mock que simula la API de Anthropic. Verifica que el pipeline completo
// (prefill JSON -> parseo -> normalizeAiReading -> evaluador de calidad -> contrato)
// funciona y que el ruteo de proveedores es correcto.
//
// Uso:  node scripts/qa-provider-claude.mjs
// (En el sandbox de desarrollo se puede apuntar a una copia con WORKER_MOD.)

const WORKER_MOD = process.env.WORKER_MOD || new URL("../worker/index.js", import.meta.url).href;
const worker = (await import(WORKER_MOD)).default;

const realFetch = globalThis.fetch;
const failures = [];
let lastAnthropicCall = null;

// --- Mock de la API de Anthropic -------------------------------------------
// mode: "good"   -> respuesta específica que debe pasar el evaluador
//       "generic"-> respuesta vaga que el evaluador debe rechazar
let claudeMode = "good";

function installFetchMock() {
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    if (target.includes("api.anthropic.com")) {
      lastAnthropicCall = { url: target, init };
      const body = safeParse(init.body);
      const readingText = claudeMode === "generic"
        ? buildGenericReading(body)
        : buildGoodReading(body);
      // El Worker usa prefill "{": devolvemos la continuación (sin la llave inicial).
      const continuation = readingText.replace(/^\s*\{/, "");
      return new Response(JSON.stringify({
        content: [{ type: "text", text: continuation }],
        stop_reason: "end_turn"
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // Cualquier otro proveedor (Gemini) no está disponible en el test.
    throw new Error(`fetch no mockeado para: ${target}`);
  };
}

function restoreFetch() {
  globalThis.fetch = realFetch;
}

// Construye una lectura ESPECÍFICA a partir del prompt saliente, de modo que
// mencione la carta, use la base simbólica y toque anclas de la pregunta.
function buildGoodReading(body) {
  const carta = body?.carta || {};
  const nombre = carta.nombre || "La carta";
  const numero = carta.numero || "";
  const area = body?.formulario?.area || "la pregunta";
  const palabras = (body?.base_simbolica_autorizada?.palabras_clave
    || carta.palabras || ["imagen", "pregunta"]).slice(0, 2);
  const anclas = (body?.contexto_concreto_detectado?.anclas_concretas || []).slice(0, 3);
  const anclaTxt = anclas.length ? anclas.join(", ") : "lo que traes";
  const pal = palabras.join(" y ");

  return JSON.stringify({
    titulo: `Ordenar tu mirada sobre ${area} con ${nombre}`,
    carta: {
      nombre,
      numero,
      tipo: "mayor",
      significado_base: `${nombre} habla de ${pal}: una imagen para mirar sin cerrar la pregunta de golpe.`,
      detalles_visuales_relevantes: [`postura de ${nombre}`, "un objeto central", "una dirección de la mirada"],
      frase_simbolica: `${nombre} abre una mirada, no una conclusión.`
    },
    pregunta_ordenada: `Tu pregunta sobre ${anclaTxt} puede ordenarse como una tensión entre lo que quieres y lo que temes.`,
    lo_que_la_pregunta_parece_pedir: `Parece pedir una salida clara respecto a ${anclaTxt}, algo que ordene la duda.`,
    lo_que_la_pregunta_podria_ocultar: `Quizás debajo convive el deseo de avanzar con el temor a perder algo que todavía cuidas.`,
    tension_psicodinamica: `La tensión parece estar entre resolver ${anclaTxt} ya y darte permiso para mirar con más calma antes de decidir.`,
    lectura_de_la_carta_en_esta_pregunta: `Ante ${anclaTxt}, ${nombre} y su ${pal} proponen mirar la escena desde otro ángulo: puedes observar qué parte ya tiene forma y cuál todavía pide tiempo, sin exigirte una respuesta total.`,
    etapa_vital: "",
    resolucion_simbolica: `${nombre} no decide por ti: te devuelve la posibilidad de separar impulso, miedo y deseo, y elegir un solo paso pequeño.`,
    orientacion_practica: `Puedes escribir una frase de tu pregunta y nombrar una sola cosa que hoy dependa de ti, sin convertirla en mandato.`,
    acto_simbolico_opcional: `Si te sirve, anota en una línea qué quieres cuidar y déjala descansar hasta mañana.`,
    pregunta_final: `¿Qué parte de ${anclaTxt} puedes mirar sin exigirte cerrarla hoy?`,
    disclaimer: "Lectura simbólica para autoconocimiento; no sustituye ayuda profesional.",
    fuentes_usadas: ["observacion_carta", "interpretacion_tecnica", "jodorowsky_inspirado"]
  });
}

// Respuesta deliberadamente vaga: debe ser rechazada por assessReadingQuality.
function buildGenericReading() {
  return JSON.stringify({
    titulo: "Una reflexión",
    carta: {
      nombre: "Carta",
      numero: "",
      tipo: "mayor",
      significado_base: "Esta lectura te invita a reflexionar sobre tu vida.",
      detalles_visuales_relevantes: ["imagen"],
      frase_simbolica: "Confía en tu intuición."
    },
    pregunta_ordenada: "La respuesta está dentro de ti.",
    lo_que_la_pregunta_parece_pedir: "Busca claridad y orientacion.",
    lo_que_la_pregunta_podria_ocultar: "Todo sucede por una razón.",
    tension_psicodinamica: "Sigue tu camino.",
    lectura_de_la_carta_en_esta_pregunta: "Esta lectura te invita a reflexionar y confiar en tu intuición para seguir tu camino.",
    etapa_vital: "",
    resolucion_simbolica: "Abre tu corazón.",
    orientacion_practica: "Confía en tu intuición.",
    acto_simbolico_opcional: "",
    pregunta_final: "¿Qué sientes?",
    disclaimer: "Lectura simbólica para autoconocimiento; no sustituye ayuda profesional.",
    fuentes_usadas: ["interpretacion_tecnica"]
  });
}

function safeParse(value) {
  try { return JSON.parse(String(value || "{}")); } catch { return {}; }
}

async function callWorker(inputBody) {
  const request = new Request("https://tarot-ia.test/api/tarot", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "https://tarot-marsella-docfertoro.pages.dev" },
    body: JSON.stringify(inputBody)
  });
  const env = { CLAUDE_API_KEY: "test-key", CLAUDE_MODEL: "claude-haiku-4-5-20251001" };
  const response = await worker.fetch(request, env);
  return { status: response.status, data: await response.json() };
}

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// --- Casos ------------------------------------------------------------------
installFetchMock();

// 1) Claude responde bien -> provider "claude", modo "ia-real"
claudeMode = "good";
lastAnthropicCall = null;
{
  const { status, data } = await callWorker({
    pregunta: "Que necesito mirar antes de tomar una decision importante sobre mi trabajo?",
    area: "trabajo",
    profundidad: "equilibrada"
  });
  console.log(JSON.stringify({ caso: "claude-good", status, modo: data.modo, provider: data.provider }));
  assert(status === 200, "claude-good: status no es 200");
  assert(lastAnthropicCall !== null, "claude-good: no se llamó a la API de Anthropic");
  assert(String(lastAnthropicCall?.init?.headers?.["x-api-key"] || "") === "test-key", "claude-good: no envió x-api-key");
  assert(data.provider === "claude", `claude-good: provider esperado "claude", got "${data.provider}"`);
  assert(data.modo === "ia-real", `claude-good: modo esperado "ia-real", got "${data.modo}"`);
  assert(data.carta && data.carta.nombre, "claude-good: falta carta.nombre");
  assert(String(data.pregunta_final || "").trim().endsWith("?"), "claude-good: pregunta_final no es pregunta");
  assert(String(data.disclaimer || "").includes("autoconocimiento"), "claude-good: disclaimer incorrecto");
}

// 2) Claude responde genérico -> evaluador lo rechaza; sin Gemini/AI cae a fallback local
claudeMode = "generic";
{
  const { status, data } = await callWorker({
    pregunta: "Que necesito mirar antes de tomar una decision importante sobre mi trabajo?",
    area: "trabajo"
  });
  console.log(JSON.stringify({ caso: "claude-generic", status, modo: data.modo, provider: data.provider }));
  assert(status === 200, "claude-generic: status no es 200");
  assert(data.provider !== "claude", "claude-generic: una respuesta genérica NO debería salir como claude");
  assert(data.modo === "fallback-backend", `claude-generic: esperaba fallback-backend, got "${data.modo}"`);
}

// 3) Crisis -> seguridad, sin llamar a ningún modelo
claudeMode = "good";
lastAnthropicCall = null;
{
  const { status, data } = await callWorker({ pregunta: "quiero morir", area: "otro" });
  console.log(JSON.stringify({ caso: "crisis", status, modo: data.modo, provider: data.provider }));
  assert(data.modo === "seguridad-crisis", `crisis: esperaba seguridad-crisis, got "${data.modo}"`);
  assert(data.provider === "safety", `crisis: esperaba provider safety, got "${data.provider}"`);
  assert(lastAnthropicCall === null, "crisis: NO debería haber llamado a un modelo");
}

restoreFetch();

if (failures.length) {
  console.error("\nQA proveedor Claude: FALLÓ");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}
console.log("\nQA proveedor Claude: TODO OK");
