import { MAJOR_ARCANA } from "./knowledge/major-arcana.js";
import { buildExpandedSymbolicLayer, MARSEILLE_MAJOR_ARCANA_MEANINGS } from "./knowledge/marseille-major-arcana.js";

const DISCLAIMER =
  "Lectura simbólica y narrativa. No reemplaza atención médica, psicológica, legal ni decisiones personales importantes.";

const CRISIS_DISCLAIMER =
  "Esta página no reemplaza atención médica, psicológica ni ayuda de urgencia.";

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "https://docfertoro.cl",
  "https://www.docfertoro.cl",
  "https://tarot-marsella-docfertoro.pages.dev",
  "https://tarot-marsella-libre.pages.dev"
  // Agregar aquí el futuro dominio público de la página de tarot.
];

const ALLOWED_AREAS = new Set(["amor", "trabajo", "decision", "familia", "creatividad", "crisis", "animo", "otro"]);
const ALLOWED_DEPTHS = new Set(["breve", "equilibrada", "profunda"]);
const ALLOWED_TONES = new Set(["directo", "poetico", "contenedor"]);

const PROHIBITED_PATTERNS = [
  /el destino ha hablado/i,
  /tu futuro est[aá] escrito/i,
  /la carta revela tu verdad/i,
  /sanaci[oó]n energ[eé]tica/i,
  /diagn[oó]stico espiritual/i,
  /el universo quiere decirte/i,
  /vibraci[oó]n/i,
  /energ[ií]a bloqueada/i,
  /canalizaci[oó]n/i,
  /respuesta definitiva/i,
  /te dir[eé] si te ama/i,
  /esto cambiar[aá] tu vida/i,
  /te va a pasar/i,
  /debes hacer/i,
  /la carta anuncia/i,
  /estilo de Alejandro Jodorowsky/i,
  /como Alejandro Jodorowsky/i
];

const GENERIC_READING_PATTERNS = [
  /esta lectura te invita a reflexionar/i,
  /conf[ií]a en tu intuici[oó]n/i,
  /todo sucede por una raz[oó]n/i,
  /abre tu coraz[oó]n/i,
  /sigue tu camino/i,
  /la respuesta est[aá] dentro de ti/i,
  /ordena pregunta/i,
  /\b[aá]rea:\s*[a-z]/i,
  /se puede abordar la situaci[oó]n con una actitud abierta y reflexiva/i,
  /sugiere la importancia de/i
];

const QUESTION_STOPWORDS = new Set([
  "para",
  "pero",
  "porque",
  "como",
  "cuando",
  "donde",
  "desde",
  "este",
  "esta",
  "esto",
  "estos",
  "estas",
  "necesito",
  "mirar",
  "saber",
  "hacer",
  "dejar",
  "seguir",
  "deberia",
  "debería",
  "quiero",
  "puedo",
  "puede",
  "tengo",
  "sobre",
  "hacia",
  "luego",
  "producto",
  "principalmente",
  "nuevamente",
  "todavia",
  "todavía",
  "vida",
  "mes",
  "medio",
  "algo",
  "mucho",
  "poco",
  "todo",
  "nada"
]);

const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 24,
  hits: new Map()
};

const GEMINI_BACKOFF = {
  until: 0
};

const DEFAULT_CLOUDFLARE_AI_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const PROVIDER_ATTEMPTS = {
  "cloudflare-workers-ai": 3,
  gemini: 2
};

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/health") {
        return jsonResponse({
          ok: true,
          service: "tarot-ia",
          timestamp: new Date().toISOString()
        }, 200, cors);
      }
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405, cors);
    }

    const rate = checkRateLimit(request);
    if (!rate.ok) {
      return jsonResponse({
        error: "Demasiadas solicitudes. Intenta nuevamente en unos segundos."
      }, 429, cors);
    }

    let input;
    try {
      input = normalizeInput(await request.json());
    } catch {
      return jsonResponse({ error: "JSON inválido." }, 400, cors);
    }

    if (!input.pregunta) {
      return jsonResponse({ error: "La pregunta es obligatoria." }, 400, cors);
    }

    if (isCrisis(input)) {
      return jsonResponse(crisisReading(), 200, cors);
    }

    const safetyProfile = buildSafetyProfile(input);
    const carta = selectCard();
    const meaning = getCardMeaning(carta);

    const reading = await callAIProvider({ input, carta, meaning, safetyProfile }, env);
    return jsonResponse(reading, 200, cors);
  }
};

function normalizeInput(body) {
  const pregunta = String(body?.pregunta || body?.question || "")
    .trim()
    .slice(0, 600);
  const areaRaw = normalizeArea(body?.area || "otro");
  const area = ALLOWED_AREAS.has(areaRaw) ? areaRaw : "otro";
  const parametros = sanitizeParams(body?.parametros);
  const profundidad = ALLOWED_DEPTHS.has(String(body?.profundidad || "").trim())
    ? String(body.profundidad).trim()
    : "equilibrada";
  const tono = ALLOWED_TONES.has(String(body?.tono || "").trim())
    ? String(body.tono).trim()
    : "contenedor";

  return {
    alias: cleanInput(body?.alias, 60),
    pregunta,
    area,
    estado_emocional: cleanInput(body?.estado_emocional, 80) || "no indicado",
    busqueda: cleanInput(body?.busqueda, 80) || "claridad",
    tipo_situacion: cleanInput(body?.tipo_situacion, 160) || "no indicado",
    profundidad,
    tono,
    contexto_vital: sanitizeLifeStageContext(body?.contexto_vital),
    numerologia: sanitizeNumerology(body?.numerologia),
    parametros
  };
}

function normalizeArea(value) {
  const area = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return area === "ánimo" ? "animo" : area;
}

function cleanInput(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeParams(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return {
    version: String(value.version || "v1-minima").slice(0, 40),
    enfoque: String(value.enfoque || "simbolico-no-predictivo").slice(0, 80)
  };
}

function sanitizeNumerology(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      camino_vida: null,
      fuente: "opcional_calculado_frontend"
    };
  }

  const lifePath = Number(value.camino_vida);
  return {
    camino_vida: Number.isInteger(lifePath) && lifePath >= 1 && lifePath <= 9 ? lifePath : null,
    fuente: cleanInput(value.fuente || "opcional_calculado_frontend", 80),
    nota: cleanInput(value.nota || "", 120)
  };
}

function sanitizeLifeStageContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const allowedStages = new Set([
    "adolescencia",
    "entrada a la adultez",
    "adultez temprana",
    "adultez media",
    "etapa de balance",
    "etapa de transmisión y síntesis",
    "etapa adulta"
  ]);
  const stage = cleanInput(value.etapa, 80).toLowerCase();
  if (!allowedStages.has(stage)) return null;

  return {
    etapa: stage,
    fuente: "fecha_transformada_en_frontend",
    nota: "contexto amplio opcional; el Worker no recibe la fecha exacta"
  };
}

async function callAIProvider(context, env) {
  const providerErrors = [];
  const providers = [
    {
      name: "cloudflare-workers-ai",
      call: () => callCloudflareWorkersAI(context, env)
    },
    {
      name: "gemini",
      call: () => callGemini(context, env)
    }
  ];

  for (const provider of providers) {
    const attempts = PROVIDER_ATTEMPTS[provider.name] || 1;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const result = await provider.call();
        return normalizeAiReading(result, context, provider.name);
      } catch (error) {
        const message = safeErrorMessage(error);
        providerErrors.push(`${provider.name}: ${message}`);
        console.warn(`[provider:${provider.name}] attempt ${attempt}/${attempts} failed`, message);
      }
    }
  }

  return localSymbolicReading(context.input, context.carta, context.meaning, providerErrors);
}

async function callCloudflareWorkersAI(context, env) {
  if (!env?.AI) {
    throw new Error("Cloudflare Workers AI binding not available");
  }

  const model = env.CLOUDFLARE_AI_MODEL || DEFAULT_CLOUDFLARE_AI_MODEL;
  const response = await env.AI.run(model, {
    messages: [
      {
        role: "system",
        content: buildSystemPrompt()
      },
      {
        role: "user",
        content: buildUserPrompt(context.input, context.carta, context.meaning)
      }
    ],
    max_tokens: 900,
    temperature: 0.7
  });

  const text = extractCloudflareAIText(response);
  try {
    return parseJsonFromModelText(text);
  } catch (error) {
    throw new Error(`Cloudflare Workers AI devolvió JSON inválido: ${safeTextPreview(text)}; ${safeErrorMessage(error)}`);
  }
}

async function callGemini(context, env) {
  if (Date.now() < GEMINI_BACKOFF.until) {
    throw new Error("Gemini en pausa breve por límite de cuota.");
  }

  const apiKey = env?.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en el entorno del Worker.");
  }

  const model = env?.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt() }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(context.input, context.carta, context.meaning) }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1800,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            titulo: { type: "STRING" },
            pregunta_reformulada: { type: "STRING" },
            escena_consultante: { type: "STRING" },
            validacion_emocional: { type: "STRING" },
            tension_narrativa: { type: "STRING" },
            giro_simbolico: { type: "STRING" },
            lectura: { type: "STRING" },
            frase_tarologica: { type: "STRING" },
            devolucion_agencia: { type: "STRING" },
            orientacion: { type: "STRING" },
            acto_simbolico_opcional: { type: "STRING" },
            pregunta_integracion: { type: "STRING" },
            disclaimer: { type: "STRING" }
          },
          required: [
            "titulo",
            "pregunta_reformulada",
            "escena_consultante",
            "validacion_emocional",
            "tension_narrativa",
            "giro_simbolico",
            "lectura",
            "frase_tarologica",
            "devolucion_agencia",
            "orientacion",
            "pregunta_integracion",
            "disclaimer"
          ]
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) {
      GEMINI_BACKOFF.until = Date.now() + retryDelayMs(errorBody);
    }
    throw new Error(`Gemini respondió con estado ${response.status}: ${errorBody.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = extractGeminiText(data);
  return parseJsonFromModelText(raw);
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part?.text || "").join("\n").trim();

  if (!text) {
    throw new Error("Gemini no devolvió texto usable.");
  }

  return text;
}

function extractCloudflareAIText(response) {
  if (typeof response === "string") {
    return response;
  }

  const candidates = [
    response?.response,
    response?.result,
    response?.text,
    response?.output,
    response?.choices?.[0]?.message?.content,
    response?.choices?.[0]?.text
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (response && typeof response === "object") {
    const serialized = JSON.stringify(response);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  }

  throw new Error("Cloudflare Workers AI no devolvió texto usable.");
}

function parseJsonFromModelText(raw) {
  const cleaned = String(raw)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      const labeled = parseLabeledReading(cleaned);
      if (labeled) return labeled;
      throw new Error("El proveedor IA no devolvió JSON parseable.");
    }
    const extracted = match[0].replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(extracted);
  }
}

function parseLabeledReading(text) {
  const source = String(text || "").trim();
  if (!source) return null;

  const labels = [
    ["titulo", ["título", "titulo"]],
    ["pregunta_reformulada", ["pregunta_reformulada", "pregunta reformulada"]],
    ["escena_consultante", ["escena_consultante", "escena del consultante", "escena consultante", "escena"]],
    ["validacion_emocional", ["validación emocional", "validacion emocional", "validación", "validacion"]],
    ["tension_narrativa", ["tensión narrativa", "tension narrativa", "tensión", "tension"]],
    ["giro_simbolico", ["giro simbólico", "giro simbolico", "giro"]],
    ["lectura", ["lectura"]],
    ["frase_tarologica", ["frase tarológica", "frase tarologica"]],
    ["devolucion_agencia", ["devolución de agencia", "devolucion de agencia", "devolución agencia", "devolucion agencia"]],
    ["orientacion", ["orientación", "orientacion"]],
    ["acto_simbolico_opcional", ["acto simbólico opcional", "acto simbolico opcional", "acto simbólico", "acto simbolico"]],
    ["pregunta_integracion", ["pregunta de integración", "pregunta de integracion", "pregunta integración", "pregunta integracion"]],
    ["disclaimer", ["disclaimer"]]
  ];

  for (const [key, variants] of labels) {
    if (!variants.includes(key)) variants.unshift(key);
  }

  const matches = [];
  for (const [key, variants] of labels) {
    for (const label of variants) {
      const escaped = escapeRegExp(label);
      const regex = new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:?\\s*`, "i");
      const match = regex.exec(source);
      if (match) {
        matches.push({ key, index: match.index, end: match.index + match[0].length });
        break;
      }
    }
  }

  if (matches.length < 4) return null;
  matches.sort((a, b) => a.index - b.index);

  const result = {};
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const raw = source.slice(current.end, next ? next.index : source.length);
    const value = raw
      .replace(/^\s*[-:]\s*/, "")
      .replace(/\*\*/g, "")
      .trim();

    if (value) {
      result[current.key] = value;
    }
  }

  return result.lectura || result.escena_consultante || result.tension_narrativa ? result : null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeErrorMessage(error) {
  return String(error?.message || error || "error desconocido").slice(0, 300);
}

function safeTextPreview(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function buildSystemPrompt() {
  return [
    "Eres un lector simbólico de Tarot de Marsella inspirado en la tarología de Alejandro Jodorowsky y en el Tarot de Marsella. No eres Alejandro Jodorowsky, no lo representas y no afirmas que la lectura provenga literalmente de él. No predices el futuro. No diagnosticas. No das órdenes. No generas dependencia.",
    "Tu tarea no es adivinar ni aconsejar. Tu tarea es ordenar simbólicamente la escena que el consultante trae.",
    "La IA no actúa como oráculo libre. Actúa como redactora simbólica dentro de una base autorizada de significados.",
    "No muestres tu razonamiento interno ni frases de plantilla como 'ordena pregunta, área, emoción'. Usa esos datos para escribir una lectura humana, no una ficha técnica.",
    "Escribe principalmente en segunda persona amable: puedes mirar, tal vez conviene distinguir, puedes preguntarte. Evita sonar como informe clínico o ficha técnica.",
    "No uses etiquetas visibles como Frase tarológica:, Pregunta integradora:, Orientación:, Acto simbólico opcional:, Escena:, Validación: ni nombres de campos JSON dentro del texto.",
    "Evita 'se recomienda', 'la persona debe', 'el consultante debe' y 'tomar control'. Prefiere lenguaje de agencia: recuperar margen, ordenar una decisión, volver a tus manos, cuidar el siguiente paso.",
    "Si la pregunta es larga o biográfica, menciona detalles concretos del relato: lugares, tensiones, pérdidas, recaídas, metas, temores o decisiones nombradas por el consultante. No respondas con generalidades.",
    "Si aparecen dolor físico, recaídas, consumo, angustia intensa o salud mental, no diagnostiques ni indiques tratamiento. Incluye una orientación sobria hacia apoyo profesional o humano, integrada a la lectura y sin convertirla en alarma si no hay crisis explícita.",
    "Si perfil_seguridad.alerta es cuidado, baja el tono poetico y prioriza compania humana, descanso, contacto seguro y apoyo profesional si la carga persiste. No lo trates como crisis suicida si no hay crisis explicita.",
    "Si perfil_seguridad.alerta es predictiva, di claramente que la lectura no puede predecir futuro, leer la voluntad de otra persona ni entregar una sentencia. Reformula hacia lo observable, limites, necesidades y agencia presente.",
    "Si recibes contexto_vital, úsalo sólo como etapa amplia de vida, sin mencionar edad exacta, fecha, destino, numerología ni obligación. Debe matizar la lectura con sobriedad, no definir a la persona.",
    "Debes construir un arco narrativo: ESCENA -> VALIDACIÓN -> TENSIÓN -> GIRO SIMBÓLICO -> AGENCIA -> CIERRE.",
    "ESCENA: integra pregunta, área, emoción, búsqueda y tipo de situación en una frase humana, sin etiquetas técnicas.",
    "VALIDACIÓN: di por qué es comprensible que el consultante se sienta como indicó. No psicologices en exceso. No diagnostiques.",
    "TENSIÓN: formula la contradicción central. Debe sentirse precisa y humana. No juzgues.",
    "GIRO SIMBÓLICO: introduce la carta como una imagen que cambia el ángulo de mirada. La carta no responde por el consultante; propone una forma de mirar.",
    "AGENCIA: devuelve al consultante la sensación de que ya hay una claridad inicial en su pregunta. La lectura debe ayudarle a ordenar, no a depender del oráculo.",
    "CIERRE: propón una pregunta final concreta y un acto simbólico opcional, seguro, poético y no médico.",
    "Antes de interpretar la carta, alude directamente a la pregunta del consultante. No repitas la pregunta de forma mecánica: interpreta qué tensión, deseo, duda o contradicción ya aparece en la forma de preguntar.",
    "Idea central: la duda no significa ausencia de claridad. Muchas veces la duda muestra que algo ya empezó a ordenarse, pero necesita una imagen para ser visto desde otro lugar.",
    "Usa la base simbólica autorizada de la carta como marco obligatorio: escena visual, eje simbólico, tensión narrativa, giro simbólico, devolución de agencia, pregunta de integración, acto simbólico seguro y notas por área.",
    "No inventes significados externos. No agregues astrología, karma, canalización, destino, predicción ni magia literal.",
    "Usa biblioteca_simbolica_ampliada para dar mas precision: lentes visuales, familias narrativas, polaridades no predictivas, seguridad de la carta y taxonomia de fuentes. No menciones toda la taxonomia al usuario salvo que ayude a aclarar origen.",
    "Cuando uses material inspirado en Jodorowsky, tratalo como inspiracion transformada, no como cita ni metodo oficial. No digas 'segun el metodo de Jodorowsky'.",
    "La carta ya fue seleccionada por el sistema. No cambies la carta. No inventes otra carta.",
    "No usas lenguaje de vidente omnisciente, fatalista, médico, legal ni financiero.",
    "Interpreta solo la carta entregada. No uses cartas invertidas ni menciones cartas no entregadas.",
    "Usa formulaciones como: podrías observar; puede ayudarte mirar; esta carta propone una imagen; una posibilidad de lectura es; la carta no decide por ti; la pregunta ya muestra; lo que traes puede ordenarse así.",
    "El acto simbólico opcional debe ser seguro, simple, no médico, no peligroso, no prometer resultados y poder omitirse.",
    "Ajusta la extensión según profundidad: breve 250 a 350 palabras totales; equilibrada 450 a 650; profunda 750 a 950.",
    "No agregues introducciones, markdown ni comentarios fuera del JSON. No uses comillas innecesarias dentro de los campos.",
    "No uses estas frases ni variantes: El destino ha hablado; Tu futuro está escrito; La carta revela tu verdad; Sanación energética; Diagnóstico espiritual; El universo quiere decirte; Vibración; Energía bloqueada; Canalización; Respuesta definitiva; Te diré si te ama; Esto cambiará tu vida; Te va a pasar; Debes hacer; La carta anuncia; la carta dice que.",
    "Devuelve exclusivamente JSON válido. No uses markdown. No agregues texto fuera del JSON.",
    "Devuelve estas claves: titulo, pregunta_reformulada, escena_consultante, validacion_emocional, tension_narrativa, giro_simbolico, lectura, frase_tarologica, devolucion_agencia, orientacion, acto_simbolico_opcional, pregunta_integracion, disclaimer.",
    `El disclaimer debe ser exactamente: ${DISCLAIMER}`,
    "El Worker adjuntará la carta real, modo, provider y alerta."
  ].join("\n");
}

function buildUserPrompt(input, carta, meaning) {
  return JSON.stringify({
    pregunta: input.pregunta,
    area: input.area,
    alias: input.alias,
    estado_emocional: input.estado_emocional,
    busqueda: input.busqueda,
    tipo_situacion: input.tipo_situacion,
    profundidad: input.profundidad,
    tono: input.tono,
    contexto_vital: input.contexto_vital
      ? {
          etapa: input.contexto_vital.etapa,
          uso: "matiz narrativo opcional, no predictivo; no mencionar edad exacta ni fecha"
        }
      : null,
    parametros: input.parametros,
    carta,
    base_simbolica_autorizada: buildAuthorizedMeaning(meaning, input.area),
    contexto_concreto_detectado: buildQuestionContext(input.pregunta),
    temas_sensibles_detectados: detectSensitiveThemes(input.pregunta),
    perfil_seguridad: input.perfil_seguridad || buildSafetyProfile(input),
    formato: {
      titulo: "titulo sobrio, maximo 12 palabras, sin sensacionalismo",
      pregunta_reformulada: "una frase que vuelva la pregunta mas consciente sin cerrarla",
      escena_consultante: "escena humana breve que use detalles concretos; no escribir etiquetas de formato",
      validacion_emocional: "nombra por que la emocion declarada es comprensible, sin diagnosticar",
      tension_narrativa: "formula la contradiccion central de la escena, sin juzgar",
      giro_simbolico: "introduce la carta como imagen que cambia el angulo de mirada",
      lectura: "desarrollo personalizado del arco narrativo y simbolico; si hay contexto_vital, integralo como etapa amplia sin determinismo",
      frase_tarologica: "una linea simbolica sobre la carta, sin prediccion",
      devolucion_agencia: "devuelve capacidad de accion y claridad inicial sin dar ordenes",
      orientacion: "orientacion suave, sin ordenes",
      acto_simbolico_opcional: "acto seguro y opcional, no medico, no promesa, no tratamiento",
      pregunta_integracion: "una sola pregunta abierta que devuelva agencia",
      disclaimer: DISCLAIMER
    }
  });
}

function buildAuthorizedMeaning(meaning, area) {
  if (!meaning) {
    return null;
  }

  const areaKey = ALLOWED_AREAS.has(area) ? area : "otro";
  return {
    id: meaning.id,
    nombre: meaning.nombre,
    numero: meaning.numero,
    palabras_clave: meaning.palabras_clave,
    escena_visual: meaning.escena_visual,
    eje_simbolico: meaning.eje_simbolico,
    tension_narrativa: meaning.tension_narrativa,
    giro_simbolico: meaning.giro_simbolico,
    devolucion_agencia: meaning.devolucion_agencia,
    pregunta_integracion: meaning.pregunta_integracion,
    acto_simbolico_seguro: meaning.acto_simbolico_seguro,
    evitar: meaning.evitar,
    nota_area: meaning.areas?.[areaKey] || meaning.areas?.otro || "",
    biblioteca_simbolica_ampliada: buildExpandedSymbolicLayer(meaning, areaKey)
  };
}

function buildQuestionContext(question) {
  const text = cleanInput(question, 600);
  return {
    anclas_concretas: meaningfulQuestionTokens(text).slice(0, 10),
    resumen_operativo: summarizeQuestionForPrompt(text),
    requiere_cuidado_no_diagnostico: detectSensitiveThemes(text).length > 0
  };
}

function summarizeQuestionForPrompt(question) {
  const text = String(question || "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function detectSensitiveThemes(question) {
  const normalized = normalizeForMatch(question);
  const themes = [];

  if (/\b(dolor|duele|espalda|dorso|cuerpo|salud|enfermedad|sintoma|sintomas)\b/.test(normalized)) {
    themes.push("salud_fisica");
  }

  if (/\b(recaida|recai|consumo|exceso|excesos|alcohol|droga|drogas|adiccion|adicciones)\b/.test(normalized)) {
    themes.push("recaida_o_consumo");
  }

  if (/\b(angustia|temor|temores|ansiedad|depresion|miedo|panico|recluido|reclusion)\b/.test(normalized)) {
    themes.push("salud_mental_o_angustia");
  }

  return [...new Set(themes)];
}

function normalizeAiReading(value, context, provider) {
  if (!value || typeof value !== "object") {
    throw new Error("La respuesta IA no es un objeto JSON.");
  }

  const hasCoreReading = [
    value.escena_consultante,
    value.tension_narrativa,
    value.giro_simbolico,
    value.lectura,
    value.sintesis,
    value.tension_o_contradiccion
  ].some((field) => String(field || "").trim());

  if (!hasCoreReading) {
    throw new Error("La respuesta IA no incluye contenido narrativo usable.");
  }

  const normalizedCard = normalizeCard(context.carta, context.carta);
  const wordLimits = readingWordLimitsForDepth(context.input?.profundidad);
  const repair = repairReadingFields(value, context, normalizedCard);
  const reading = {
    titulo: limitWords(cleanTitle(repair.titulo), 12),
    pregunta_reformulada: limitSentences(cleanText(repair.pregunta_reformulada), 1),
    carta: normalizedCard,
    escena_consultante: limitWords(cleanText(repair.escena_consultante), 130),
    validacion_emocional: limitWords(cleanText(repair.validacion_emocional), 100),
    tension_narrativa: limitWords(cleanText(repair.tension_narrativa), 120),
    giro_simbolico: limitWords(cleanText(repair.giro_simbolico), 130),
    lectura: limitWords(cleanText(repair.lectura), wordLimits.lectura),
    frase_tarologica: limitSentences(cleanText(repair.frase_tarologica), 1),
    devolucion_agencia: limitWords(cleanText(repair.devolucion_agencia), 130),
    orientacion: limitWords(cleanText(repair.orientacion), wordLimits.orientacion),
    acto_simbolico_opcional: limitWords(cleanText(repair.acto_simbolico_opcional), 80),
    pregunta_integracion: ensureQuestion(limitSentences(cleanText(repair.pregunta_integracion), 1)),
    disclaimer: DISCLAIMER,
    modo: "ia-real",
    provider,
    base_simbolica_usada: Boolean(context.meaning),
    calidad_revision: "aprobada",
    alerta: context.safetyProfile?.alerta || null
  };

  if (reading.alerta === "predictiva") {
    reading.pregunta_reformulada = "La pregunta pide una certeza que esta lectura no puede entregar; puede mirarse mejor desde lo observable, tus limites y tu margen de accion.";
    reading.lectura = limitWords(cleanText(`Esta lectura no predice el futuro ni lee la voluntad de otra persona. ${reading.lectura}`), wordLimits.lectura);
    reading.orientacion = "Puedes reformular la pregunta asi: que señales concretas puedo observar, que limite necesito cuidar y que decision pequena depende de mi ahora.";
    reading.pregunta_integracion = "¿Qué parte de esta situación puedes observar sin convertirla en una predicción?";
  }

  if (reading.alerta === "cuidado") {
    reading.orientacion = "Mantener una lectura sobria: si la angustia se vuelve dificil de sostener, puede ayudarte hablar con alguien de confianza o con apoyo profesional.";
  }

  const joined = [
    reading.titulo,
    reading.pregunta_reformulada,
    reading.carta.nombre,
    reading.carta.palabras.join(" "),
    reading.escena_consultante,
    reading.validacion_emocional,
    reading.tension_narrativa,
    reading.giro_simbolico,
    reading.lectura,
    reading.frase_tarologica,
    reading.devolucion_agencia,
    reading.orientacion,
    reading.acto_simbolico_opcional,
    reading.pregunta_integracion
  ].join(" ");

  if (!reading.lectura || PROHIBITED_PATTERNS.some((pattern) => pattern.test(joined))) {
    throw new Error("La respuesta IA no pasó los filtros éticos.");
  }

  const quality = assessReadingQuality(reading, context);
  if (!quality.ok) {
    throw new Error(`La respuesta IA no pasó la revisión de calidad: ${quality.reasons.join(", ")}`);
  }

  return reading;
}

function assessReadingQuality(reading, context) {
  const reasons = [];
  const text = normalizeForMatch([
    reading.pregunta_reformulada,
    reading.escena_consultante,
    reading.validacion_emocional,
    reading.tension_narrativa,
    reading.giro_simbolico,
    reading.lectura,
    reading.frase_tarologica,
    reading.devolucion_agencia,
    reading.orientacion,
    reading.acto_simbolico_opcional,
    reading.pregunta_integracion
  ].join(" "));
  const questionTokens = meaningfulQuestionTokens(context.input?.pregunta);
  const matchedQuestionTokens = questionTokens.filter((token) => text.includes(token));
  const minimumQuestionMatches = minimumQuestionTokenMatches(questionTokens.length);
  const cardName = normalizeForMatch(context.carta?.nombre || "");
  const cardWords = Array.isArray(context.carta?.palabras)
    ? context.carta.palabras.map(normalizeForMatch).filter(Boolean)
    : [];
  const meaningWords = Array.isArray(context.meaning?.palabras_clave)
    ? context.meaning.palabras_clave.map(normalizeForMatch).filter(Boolean)
    : [];
  const symbolicWords = [...new Set([...cardWords, ...meaningWords])];
  const cardMentioned = cardName && text.includes(cardName);
  const symbolicBaseTouched = symbolicWords.some((word) => word && text.includes(word));
  const hasArc = [
    reading.escena_consultante,
    reading.validacion_emocional,
    reading.tension_narrativa,
    reading.giro_simbolico,
    reading.devolucion_agencia,
    reading.pregunta_integracion
  ].every((field) => String(field || "").trim().length >= 24);
  const agencyLanguage = /\b(puedes|podrias|podrías|observar|mirar|distinguir|elegir|nombrar|reconocer|vuelve a tus manos)\b/i.test([
    reading.devolucion_agencia,
    reading.orientacion,
    reading.pregunta_integracion
  ].join(" "));

  if (minimumQuestionMatches && matchedQuestionTokens.length < minimumQuestionMatches) {
    reasons.push("no toca suficientemente la pregunta concreta");
  }

  if (!cardMentioned) {
    reasons.push("no menciona la carta seleccionada");
  }

  if (context.meaning && !symbolicBaseTouched) {
    reasons.push("no usa la base simbólica de la carta");
  }

  if (!hasArc) {
    reasons.push("no sostiene escena-validacion-tension-giro-agencia");
  }

  if (!agencyLanguage) {
    reasons.push("no devuelve agencia de forma clara");
  }

  if (GENERIC_READING_PATTERNS.some((pattern) => pattern.test(text))) {
    reasons.push("usa lenguaje genérico");
  }

  const criticalReasons = reasons.filter((reason) => [
    "no sostiene escena-validacion-tension-giro-agencia",
    "usa lenguaje genérico"
  ].includes(reason));

  return {
    ok: criticalReasons.length === 0,
    reasons,
    criticalReasons
  };
}

function minimumQuestionTokenMatches(tokenCount) {
  if (tokenCount <= 0) return 0;
  if (tokenCount <= 2) return 1;
  if (tokenCount <= 7) return 2;
  return 4;
}

function meaningfulQuestionTokens(value) {
  return [...new Set(
    normalizeForMatch(value)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !QUESTION_STOPWORDS.has(token))
      .slice(0, 12)
  )];
}

function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readingWordLimitsForDepth(depth) {
  const normalized = ALLOWED_DEPTHS.has(String(depth || "")) ? String(depth) : "equilibrada";
  const limits = {
    breve: { lectura: 260, orientacion: 80 },
    equilibrada: { lectura: 520, orientacion: 140 },
    profunda: { lectura: 780, orientacion: 190 }
  };

  return limits[normalized] || limits.equilibrada;
}

function repairReadingFields(value, context, carta) {
  const input = context.input || {};
  const meaning = context.meaning;
  const area = areaLabel(input.area).toLowerCase();
  const emotion = cleanOptional(input.estado_emocional);
  const search = cleanOptional(input.busqueda) || "claridad";
  const situation = cleanOptional(input.tipo_situacion);
  const alias = input.alias ? `${input.alias}, ` : "";
  const question = input.pregunta || "la pregunta";
  const fallbackCore = value.lectura || value.escena_consultante || value.sintesis || value.giro_simbolico || value.tension_narrativa || "";
  const areaMeaning = meaning?.areas?.[input.area] || meaning?.areas?.otro || `la relación entre ${carta.palabras.join(", ")}`;
  const visualScene = meaning?.escena_visual || `${carta.nombre} pone sobre la mesa la relación entre ${carta.palabras.join(", ")}.`;
  const symbolicAxis = meaning?.eje_simbolico || `Mirar la pregunta desde ${carta.palabras.join(", ")}.`;
  const narrativeTension = meaning?.tension_narrativa || "La tensión parece estar entre querer una respuesta inmediata y necesitar mirar con más precisión.";
  const symbolicTurn = meaning?.giro_simbolico || `${carta.nombre} no decide por ti: propone cambiar el ángulo de mirada.`;
  const agency = meaning?.devolucion_agencia || "La carta no decide por ti. Te devuelve una posibilidad de observación y acción consciente.";
  const integrationQuestion = meaning?.pregunta_integracion || "¿Qué parte de esta escena vuelve ahora a tus manos?";
  const symbolicAct = meaning?.acto_simbolico_seguro || "Si te sirve, escribe la pregunta y subraya una sola palabra que hoy necesite más cuidado.";

  return {
    titulo: value.titulo || `Mirada con ${carta.nombre}`,
    pregunta_reformulada: value.pregunta_reformulada || `${alias}tu pregunta sobre ${area} puede mirarse como una tensión entre lo que quieres cuidar y lo que necesita decidirse con más claridad.`,
    escena_consultante: value.escena_consultante || value.sintesis || `Con lo que traes —"${question}"— aparece una escena que ya tiene forma suficiente para mirarla sin cerrarla de inmediato. ${visualScene}`,
    validacion_emocional: value.validacion_emocional || `Es comprensible que esta pregunta pida cuidado: no busca una sentencia, sino una forma más clara de mirar${situation ? ` una situación descrita como "${situation}"` : " lo que está en juego"}.`,
    tension_narrativa: value.tension_narrativa || value.tension_o_contradiccion || narrativeTension,
    giro_simbolico: value.giro_simbolico || value.imagen_simbolica || symbolicTurn,
    lectura: value.lectura || fallbackCore || `${carta.nombre} no entrega una respuesta cerrada. Desde su eje simbólico —${symbolicAxis}— ayuda a mirar ${areaMeaning}. La escena puede ordenarse distinguiendo qué se mueve, qué se repite y qué gesto pequeño podría dar más claridad.`,
    frase_tarologica: value.frase_tarologica || `${carta.nombre} abre una mirada, no una conclusión.`,
    devolucion_agencia: value.devolucion_agencia || agency,
    orientacion: value.orientacion || `Puedes observar ${areaMeaning} sin convertirlo en mandato ni respuesta definitiva.`,
    acto_simbolico_opcional: value.acto_simbolico_opcional || symbolicAct,
    pregunta_integracion: value.pregunta_integracion || integrationQuestion
  };
}

function crisisReading() {
  return {
    titulo: "Primero tu seguridad",
    imagen_simbolica: "",
    lectura: "Lo que escribiste suena a un momento de riesgo o dolor muy intenso. Esta pagina no va a convertirlo en lectura de cartas: lo importante es que no atravieses esto a solas.",
    orientacion: "Si puedes estar en peligro ahora, llama a emergencias de tu pais o ve a un servicio de urgencia. Si estas en Chile, puedes llamar al *4141; si estas en Estados Unidos, llama o escribe al 988. Tambien puedes contactar ahora a una persona cercana y decirle: 'necesito compania, no estoy bien'.",
    pregunta_integracion: "¿Puedes contactar ahora mismo a una persona o servicio de urgencia para no quedarte a solas con esto?",
    disclaimer: CRISIS_DISCLAIMER,
    modo: "seguridad-crisis",
    provider: "safety",
    alerta: "crisis"
  };
}

function localSymbolicReading(input, carta = selectCard(), meaning = getCardMeaning(carta), providerErrors = []) {
  const safetyProfile = buildSafetyProfile(input);
  const area = areaLabel(input.area).toLowerCase();
  const palabras = carta.palabras.join(", ");
  const fallbackFrame = meaning?.areas?.[input.area] || fallbackFrameForArea(input.area);
  const aliasIntro = input.alias ? `${input.alias}, ` : "";
  const emotion = cleanOptional(input.estado_emocional);
  const search = cleanOptional(input.busqueda) || "claridad";
  const visualScene = meaning?.escena_visual || `${carta.nombre} pone sobre la mesa la relación entre ${palabras}.`;
  const symbolicAxis = meaning?.eje_simbolico || `mirar la situación desde ${palabras}`;
  const narrativeTension = meaning?.tension_narrativa || "La tensión no parece estar sólo en encontrar una respuesta rápida, sino entre una parte que quiere claridad inmediata y otra que necesita no precipitarse.";
  const symbolicTurn = meaning?.giro_simbolico || `${carta.nombre} introduce otra mirada: no responde por ti, pero pone sobre la mesa la relación entre ${palabras}.`;
  const agency = meaning?.devolucion_agencia || "La carta no decide por ti. Te devuelve una posibilidad: separar lo vivo, lo agotado y lo pendiente.";
  const integrationQuestion = meaning?.pregunta_integracion || fallbackQuestionForArea(input.area);
  const symbolicAct = meaning?.acto_simbolico_seguro || "Si te sirve, escribe una frase de la pregunta y subraya sólo la palabra que hoy pide más cuidado. Luego déjala descansar.";
  const questionSummary = summarizeQuestionForPrompt(input.pregunta);
  const sensitiveThemes = detectSensitiveThemes(input.pregunta);
  const careLine = sensitiveThemes.length
    ? " Como aparecen señales de cuerpo, recaída o angustia, esta lectura no debe reemplazar apoyo profesional ni conversación humana concreta; puede acompañar la pregunta, no sostenerla sola."
    : "";
  const safetyLine = safetyProfile.alerta === "cuidado"
    ? " Como aparece angustia intensa, conviene que esta lectura sea una pausa sobria y que puedas hablar con alguien de confianza o con apoyo profesional si la carga se vuelve dificil de sostener."
    : safetyProfile.alerta === "predictiva"
      ? " Como la pregunta pide una certeza, esta lectura no va a predecir el futuro ni leer la voluntad de otra persona; solo puede ayudarte a mirar lo observable y lo que vuelve a tus manos."
      : "";
  const lifeStageLine = input.contexto_vital?.etapa
    ? ` Como contexto amplio, esta pregunta ocurre en ${input.contexto_vital.etapa}; esa etapa puede servir para mirar qué pide madurar, cerrar o cuidar ahora, sin definir tu camino.`
    : "";
  const pregunta = input.pregunta
    ? `${aliasIntro}la pregunta sobre ${area} busca ${search} sin convertir la carta en una orden.`
    : `${aliasIntro}esta consulta busca ${search} sin convertir la carta en una orden.`;

  return {
    titulo: `Lectura de apoyo con ${carta.nombre}`,
    pregunta_reformulada: pregunta,
    carta,
    escena_consultante: `Con lo que traes —${questionSummary || `una pregunta sobre ${area}`}— aparece una escena suficientemente precisa para mirarla sin cerrarla de inmediato. ${visualScene}`,
    validacion_emocional: emotion
      ? `Es comprensible que aparezca ${emotion}: la pregunta no pide una sentencia, sino distinguir qué parte de ${fallbackFrame} ya tiene forma y qué parte todavía necesita ser nombrada.`
      : `Es comprensible que esta pregunta pida cuidado: no busca una sentencia, sino distinguir qué parte de ${fallbackFrame} ya tiene forma y qué parte todavía necesita ser nombrada.`,
    tension_narrativa: narrativeTension,
    giro_simbolico: symbolicTurn,
    lectura: `El símbolo no decide el camino. Ante esta escena, ${carta.nombre} propone ${symbolicAxis}. En el área de ${area}, esto puede ayudar a mirar ${fallbackFrame} como una composición: algo ya muestra forma, algo está agotado o inmaduro, y algo puede probarse con un gesto pequeño antes de exigir una conclusión total.${careLine}${safetyLine}${lifeStageLine} Una posibilidad de lectura es que la claridad no aparezca como respuesta definitiva, sino como separación: qué pertenece al miedo, qué pertenece al deseo, qué pertenece al cansancio y qué pertenece a una dirección posible que aún puede tomar forma.`,
    frase_tarologica: `${carta.nombre} abre una mirada, no una conclusión.`,
    devolucion_agencia: agency,
    orientacion: safetyProfile.orientacion || fallbackOrientationForArea(input.area, palabras),
    acto_simbolico_opcional: symbolicAct,
    pregunta_integracion: integrationQuestion,
    disclaimer: DISCLAIMER,
    modo: "fallback-backend",
    provider: "fallback-backend",
    base_simbolica_usada: Boolean(meaning),
    calidad_revision: "fallback-backend",
    diagnostico_provider: providerErrors.slice(0, 3).join(" | "),
    alerta: safetyProfile.alerta
  };
}

function cleanOptional(value) {
  const text = cleanInput(value, 120);
  return text && text !== "no indicado" ? text : "";
}

function selectCard() {
  const index = pickRandomIndex(MAJOR_ARCANA.length);
  return normalizeCard(MAJOR_ARCANA[index], MAJOR_ARCANA[0]);
}

function getCardMeaning(card) {
  const id = cleanText(card?.id || "");
  return MARSEILLE_MAJOR_ARCANA_MEANINGS.find((item) => item.id === id) || null;
}

function pickRandomIndex(length) {
  if (!length) return 0;

  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}

function normalizeCard(value, fallback) {
  const base = value && typeof value === "object" ? value : fallback;
  return {
    id: cleanText(base?.id || fallback?.id || "el-mago"),
    nombre: cleanText(base?.nombre || fallback?.nombre || "El Mago"),
    numero: cleanText(base?.numero || fallback?.numero || "I"),
    tipo: cleanText(base?.tipo || fallback?.tipo || "mayor"),
    imagen: base?.imagen ? cleanImagePath(base.imagen) : null,
    palabras: Array.isArray(base?.palabras)
      ? base.palabras.map((word) => cleanText(word)).filter(Boolean).slice(0, 6)
      : [...(fallback?.palabras || ["inicio", "posibilidad"])]
  };
}

function cleanImagePath(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/\.jpg$/i, ".jpg")
    .replace(/\.jpeg$/i, ".jpeg")
    .replace(/\.png$/i, ".png")
    .trim();
}

function isCrisis(input) {
  const riskText = [
    input.pregunta,
    input.area,
    input.estado_emocional,
    input.tipo_situacion
  ].join(" ");

  return input.area === "crisis" || hasCrisisLanguage(riskText);
}

function buildSafetyProfile(input) {
  const riskText = [
    input.pregunta,
    input.area,
    input.estado_emocional,
    input.busqueda,
    input.tipo_situacion
  ].join(" ");

  if (hasCrisisLanguage(riskText) || input.area === "crisis") {
    return {
      alerta: "crisis",
      modo_seguridad: "crisis",
      orientacion: "Priorizar seguridad inmediata y apoyo humano antes de cualquier lectura simbolica."
    };
  }

  if (hasHighDistressLanguage(riskText)) {
    return {
      alerta: "cuidado",
      modo_seguridad: "cuidado",
      orientacion: "Mantener una lectura sobria: sugerir apoyo humano o profesional si la angustia se vuelve dificil de sostener, sin diagnosticar ni alarmar."
    };
  }

  if (hasPredictiveLanguage(riskText)) {
    return {
      alerta: "predictiva",
      modo_seguridad: "reformulacion",
      orientacion: "Reformular sin prediccion: mirar lo observable, los limites, las necesidades y el margen de accion del consultante."
    };
  }

  return {
    alerta: null,
    modo_seguridad: "normal",
    orientacion: ""
  };
}

function hasCrisisLanguage(text) {
  const normalized = normalizeForMatch(text);
  return /\b(crisis|urgente|urgencia|desesperacion|dolor intenso|no puedo mas|no quiero seguir|no quiero vivir|no quiero seguir viviendo|suicidio|suicidarme|autolesion|autolesionarme|matarme|morirme|morir|quiero morir|queria morir|quisiera morir|deseo morir|prefiero morir|quitarme la vida|hacerme dano|danarme|lastimarme)\b/i.test(normalized);
}

function hasHighDistressLanguage(text) {
  const normalized = normalizeForMatch(text);
  if (hasCrisisLanguage(normalized)) return false;
  return /\b(angustia intensa|muy angustiado|muy angustiada|estoy colapsado|estoy colapsada|colapsado|colapsada|desbordado|desbordada|no puedo dormir|ataque de panico|panico|ansiedad fuerte|ansiedad intensa|me siento perdido|me siento perdida|me siento roto|me siento rota|no doy mas|me supera|me sobrepasa|estoy al limite|estoy al limite emocional)\b/i.test(normalized);
}

function hasPredictiveLanguage(text) {
  const normalized = normalizeForMatch(text);
  return /\b(que va a pasar|que pasara|va a volver|volver[aá]|me ama|me quiere|me extrana|me extraña|me ira bien|me va a ir bien|voy a ganar|ganare|me conviene invertir|saldr[aá] bien|tendre exito|tendré exito|se va a resolver|cuando ocurrira|cuando va a pasar|mi futuro|destino)\b/i.test(normalized);
}

function areaLabel(value) {
  const labels = {
    amor: "amor",
    trabajo: "trabajo",
    decision: "decisión",
    familia: "familia",
    creatividad: "creatividad",
    crisis: "crisis",
    animo: "ánimo",
    otro: "la pregunta"
  };

  return labels[value] || labels.otro;
}

function cleanText(value) {
  const cleaned = softenReadingLanguage(String(value || ""))
    .replace(/\s+/g, " ")
    .replace(/\bdestino\b/gi, "dirección posible")
    .replace(/\bte va a pasar\b/gi, "podrías observar")
    .replace(/\benerg[ií]a bloqueada\b/gi, "tensión")
    .replace(/\bvibraci[oó]n\b/gi, "tono interno")
    .replace(/\bcanalizaci[oó]n\b/gi, "imagen simbólica")
    .replace(/\bla carta dice que\b/gi, "la carta propone mirar")
    .replace(/\brevelaci[oó]n\w*\b/gi, "imagen")
    .replace(/\brevelador\w*\b/gi, "claro")
    .replace(/\brevela\b/gi, "muestra")
    .replace(/\brevelar\b/gi, "mostrar")
    .replace(/\banuncia\b/gi, "propone")
    .replace(/\banunciar\b/gi, "proponer")
    .replace(/\bfrase tarol[oó]gica\s*:\s*/gi, "")
    .replace(/\bfrase tar[oó]logica\s*:\s*/gi, "")
    .replace(/\bfrase tar[oó]logica\b/gi, "")
    .replace(/\bpregunta integradora\s*:\s*/gi, "")
    .replace(/\bpregunta de integraci[oó]n\s*:\s*/gi, "")
    .replace(/\borientaci[oó]n\s*:\s*/gi, "")
    .replace(/\bacto simb[oó]lico opcional\s*:\s*/gi, "")
    .replace(/\bse recomienda\b/gi, "puedes considerar")
    .replace(/\bes hora de\b/gi, "puede ser útil")
    .replace(/\bdebe\b/gi, "puede")
    .replace(/\bdeben\b/gi, "pueden")
    .replace(/\bla carta te sugiere que\b/gi, "la carta propone mirar cómo")
    .replace(/\bla carta nos recuerda que\b/gi, "la carta puede recordarte que")
    .replace(/\bte invito a\b/gi, "puedes considerar")
    .replace(/\bte invito\b/gi, "puedes considerar")
    .replace(/\btomar el control\b/gi, "recuperar margen")
    .replace(/\bla persona puede\b/gi, "puedes")
    .replace(/\bel consultante puede\b/gi, "puedes")
    .replace(/\bla persona\b/gi, "quien consulta")
    .replace(/\bel consultante\b/gi, "quien consulta")
    .trim();

  return dedupeRepeatedSentences(cleaned).slice(0, 900);
}

function dedupeRepeatedSentences(value) {
  const sentences = String(value || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  if (sentences.length <= 1) return String(value || "");

  const seen = new Set();
  const kept = [];

  for (const sentence of sentences) {
    const cleaned = sentence.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = normalizeForMatch(cleaned)
      .split(" ")
      .filter((word) => word.length > 3 && !QUESTION_STOPWORDS.has(word))
      .slice(0, 14)
      .join(" ");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    kept.push(cleaned);
  }

  return kept.join(" ");
}

function cleanTitle(value) {
  return cleanText(value)
    .replace(/\b(pregunta_reformulada|pregunta reformulada|escena_consultante|escena del consultante|validacion_emocional|validación emocional|tension_narrativa|tensión narrativa|giro_simbolico|giro simbólico|lectura|frase_tarologica|frase tarológica|devolucion_agencia|devolución de agencia|orientacion|orientación|acto_simbolico_opcional|acto simbólico opcional|pregunta_integracion|pregunta de integración)\s*:.*$/i, "")
    .trim();
}

function softenReadingLanguage(value) {
  return String(value || "")
    .replace(/\bprofundamente\b/gi, "con cuidado")
    .replace(/\bprofundidad\b/gi, "atención")
    .replace(/\bprofundo\b/gi, "importante")
    .replace(/\bprofunda\b/gi, "importante")
    .replace(/\bsanaci[oó]n\b/gi, "cuidado")
    .replace(/\bsanar\b/gi, "cuidar")
    .replace(/\bte invita a\b/gi, "puede ayudarte a")
    .replace(/\binvita a\b/gi, "propone")
    .replace(/\bte pide\b/gi, "señala")
    .replace(/\bpide que\b/gi, "señala que")
    .replace(/\bes momento de\b/gi, "puede ser útil")
    .replace(/\bse recomienda\b/gi, "puedes considerar")
    .replace(/\bdebe\b/gi, "puede")
    .replace(/\bdeben\b/gi, "pueden")
    .replace(/\bdebes\b/gi, "puedes")
    .replace(/\btienes que\b/gi, "puedes");
}

function limitWords(value, maxWords) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");

  const clipped = words.slice(0, maxWords).join(" ");
  return closeSentence(clipped);
}

function limitSentences(value, maxSentences) {
  const text = String(value || "").trim();
  if (!text) return "";

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return closeSentence(sentences.slice(0, maxSentences).join(" ").trim());
}

function closeSentence(value) {
  const text = String(value || "").trim().replace(/[,;:]$/, "");
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function ensureQuestion(value) {
  const text = String(value || "").trim();
  if (!text) return "¿Qué parte de la pregunta vuelve a tus manos después de mirar esta carta?";
  return text.endsWith("?") || text.endsWith("¿") ? text : `${text.replace(/[.!]+$/, "")}?`;
}

function fallbackFrameForArea(area) {
  const frames = {
    amor: "el vínculo",
    trabajo: "tu lugar en el trabajo",
    decision: "la decisión",
    animo: "el estado de ánimo",
    otro: "la pregunta"
  };

  return frames[area] || frames.otro;
}

function fallbackOrientationForArea(area, palabras) {
  const frames = {
    amor: `Puedes observar qué palabra de la serie —${palabras}— toca el modo en que te vinculas ahora.`,
    trabajo: `Puedes observar qué palabra de la serie —${palabras}— ordena mejor tu posición actual en el trabajo.`,
    decision: `Puedes observar qué palabra de la serie —${palabras}— ayuda a separar impulso, límite y elección.`,
    animo: `Puedes observar qué palabra de la serie —${palabras}— nombra con más calma lo que sientes.`,
    otro: `Puedes observar qué palabra de la serie —${palabras}— toca mejor el centro de la pregunta.`
  };

  return frames[area] || frames.otro;
}

function fallbackQuestionForArea(area) {
  const questions = {
    amor: "¿Qué parte del vínculo puedes mirar sin exigirte una respuesta inmediata?",
    trabajo: "¿Qué aspecto de tu lugar en el trabajo necesita una palabra más precisa?",
    decision: "¿Qué elemento de la decisión vuelve a tus manos al mirar esta carta?",
    animo: "¿Qué emoción puede ser nombrada con más calma ahora?",
    otro: "¿Qué parte de la pregunta vuelve a tus manos después de mirar esta carta?"
  };

  return questions[area] || questions.otro;
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "") ||
    /^https:\/\/[a-z0-9-]+\.tarot-marsella-docfertoro\.pages\.dev$/.test(origin || "") ||
    /^https:\/\/[a-z0-9-]+\.tarot-marsella-libre\.pages\.dev$/.test(origin || "");
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function checkRateLimit(request) {
  const now = Date.now();
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const record = RATE_LIMIT.hits.get(ip);

  if (!record || now > record.resetAt) {
    RATE_LIMIT.hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    cleanupRateLimit(now);
    return { ok: true };
  }

  record.count += 1;
  if (record.count > RATE_LIMIT.maxRequests) {
    return { ok: false };
  }

  return { ok: true };
}

function retryDelayMs(errorBody) {
  const retryMatch = String(errorBody || "").match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    return Math.ceil(Number(retryMatch[1]) * 1000) + 1000;
  }

  return 60_000;
}

function cleanupRateLimit(now) {
  if (RATE_LIMIT.hits.size < 500) return;

  for (const [key, value] of RATE_LIMIT.hits.entries()) {
    if (now > value.resetAt) {
      RATE_LIMIT.hits.delete(key);
    }
  }
}
