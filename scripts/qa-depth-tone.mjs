// QA de personalización: comprueba que profundidad y tono cambian la respuesta real.
// Hace la MISMA pregunta variando profundidad/tono, mide palabras y muestra un
// fragmento para juzgar el registro. Gasta tokens de Claude (una lectura por caso).
//
// Uso:  node scripts/qa-depth-tone.mjs
// Endpoint configurable con la variable de entorno TAROT_QA_URL.

const endpoint =
  process.env.TAROT_QA_URL || "https://tarot-marsella-docfertoro.pages.dev/api/tarot";

// Pregunta y contexto fijos para TODOS los casos: así lo único que varía es
// profundidad/tono y la comparación es justa.
const preguntaBase = {
  pregunta:
    "Estoy entre seguir con un proyecto personal o dejarlo descansar un tiempo. Que necesito mirar para decidir con calma?",
  area: "decision",
  estado_emocional: "duda",
  busqueda: "claridad",
  tipo_situacion: "Estoy entre dos opciones",
  parametros: { version: "qa-depth-tone", enfoque: "simbolico-no-predictivo" }
};

// Los 4 casos: prueban profundidad (breve vs profunda) Y tono (directo/poetico/contenedor).
const casos = [
  { name: "breve · directo", profundidad: "breve", tono: "directo" },
  { name: "profunda · contenedor", profundidad: "profunda", tono: "contenedor" },
  { name: "breve · poetico", profundidad: "breve", tono: "poetico" },
  { name: "profunda · directo", profundidad: "profunda", tono: "directo" }
];

// Campos narrativos de la lectura cuyo largo escala con la profundidad.
const camposNarrativos = [
  "lo_que_la_pregunta_parece_pedir",
  "lo_que_la_pregunta_podria_ocultar",
  "tension_psicodinamica",
  "lectura_de_la_carta_en_esta_pregunta",
  "etapa_vital",
  "resolucion_simbolica",
  "orientacion_practica",
  "acto_simbolico_opcional",
  "pregunta_final"
];

function contarPalabras(texto) {
  return String(texto || "").trim().split(/\s+/).filter(Boolean).length;
}

function palabrasTotales(data) {
  return camposNarrativos.reduce((total, campo) => total + contarPalabras(data[campo]), 0);
}

function fragmento(texto, max = 200) {
  const limpio = String(texto || "").replace(/\s+/g, " ").trim();
  return limpio.length > max ? limpio.slice(0, max) + "…" : limpio;
}

const rangosEsperados = {
  breve: [250, 350],
  equilibrada: [450, 650],
  profunda: [750, 950]
};

const resultados = [];

for (const caso of casos) {
  const body = { ...preguntaBase, profundidad: caso.profundidad, tono: caso.tono };
  const respuesta = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  const data = await respuesta.json();

  const palabras = palabrasTotales(data);
  resultados.push({
    caso: caso.name,
    profundidad: caso.profundidad,
    tono: caso.tono,
    provider: data.provider || null,
    modo: data.modo || null,
    palabras,
    carta: data.carta?.nombre || null,
    resolucion: fragmento(data.resolucion_simbolica),
    orientacion: fragmento(data.orientacion_practica, 160)
  });

  // Pausa breve entre llamadas para no chocar con el rate limit del Worker.
  await new Promise((r) => setTimeout(r, 1500));
}

console.log("\n===== RESULTADOS: profundidad y tono =====\n");
for (const r of resultados) {
  const [min, max] = rangosEsperados[r.profundidad] || [];
  const enRango = min ? (r.palabras >= min && r.palabras <= max ? "OK" : "fuera") : "";
  const objetivo = min ? `(objetivo ${min}-${max}, ${enRango})` : "";
  console.log(`• ${r.caso}`);
  console.log(`    provider=${r.provider}  modo=${r.modo}  carta=${r.carta}`);
  console.log(`    palabras=${r.palabras} ${objetivo}`);
  console.log(`    resolucion_simbolica: ${r.resolucion}`);
  console.log(`    orientacion_practica: ${r.orientacion}\n`);
}

// Conclusión automática: promedio breve vs profunda.
const prom = (nivel) => {
  const xs = resultados.filter((r) => r.profundidad === nivel).map((r) => r.palabras);
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
};
const promBreve = prom("breve");
const promProfunda = prom("profunda");
console.log("===== CONCLUSIÓN =====");
console.log(`Promedio de palabras  ->  breve: ${promBreve}   profunda: ${promProfunda}`);
if (promProfunda > promBreve * 1.4) {
  console.log("✅ La profundidad SÍ cambia el largo: 'profunda' es claramente más extensa que 'breve'.");
} else {
  console.log("⚠️  Diferencia menor a la esperada. Revisar (¿provider no-claude? ¿fallback?).");
}
const providers = [...new Set(resultados.map((r) => r.provider))];
console.log(`Providers que respondieron: ${providers.join(", ")}`);
