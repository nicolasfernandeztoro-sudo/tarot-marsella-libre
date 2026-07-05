import { MAJOR_ARCANA } from "./knowledge/major-arcana.js";
import { buildExpandedSymbolicLayer, MARSEILLE_MAJOR_ARCANA_MEANINGS } from "./knowledge/marseille-major-arcana.js";

const DISCLAIMER =
  "Lectura simbólica para autoconocimiento; no sustituye ayuda profesional.";

const CRISIS_DISCLAIMER =
  "Esta página no reemplaza atención médica, psicológica ni ayuda de urgencia.";

// Etiquetas legibles de la fuente simbólica declarada en fuentes_usadas.
const SOURCE_LABELS = {
  observacion_carta: "Observación directa de la imagen del Tarot de Marsella",
  interpretacion_tecnica: "Interpretación estructural de la app: eje, tensión, orden y agencia",
  jodorowsky_inspirado: "Síntesis transformada inspirada en la tarología de Alejandro Jodorowsky",
  psicodinamica_prudente: "Lectura psicodinámica prudente de la pregunta, no diagnóstica"
};

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

// Nuevo formulario de 5 preguntas (método Carta -> Pregunta -> Tensión -> Orden).
const ALLOWED_EN_JUEGO = new Set(["elegir", "soltar", "entender"]);
const ALLOWED_EMOCION = new Set(["angustia_miedo", "tristeza_duelo", "rabia_frustracion"]);
const ALLOWED_TENSION = new Set(["deseo_deber", "apego_autonomia", "ideal_realidad"]);
const ALLOWED_BUSQUEDA = new Set(["claridad", "calma", "movimiento"]);

const EN_JUEGO_LABELS = {
  elegir: "elegir entre opciones",
  soltar: "soltar algo",
  entender: "entender qué está pasando"
};
const EMOCION_LABELS = {
  angustia_miedo: "angustia o miedo",
  tristeza_duelo: "tristeza o duelo",
  rabia_frustracion: "rabia o frustración"
};
const TENSION_LABELS = {
  deseo_deber: "deseo frente a deber",
  apego_autonomia: "apego frente a autonomía",
  ideal_realidad: "ideal frente a realidad"
};
const BUSQUEDA_LABELS = {
  claridad: "claridad",
  calma: "calma",
  movimiento: "movimiento"
};

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
  /una persona que/i,
  /claridad y orientacion/i,
  /respuesta correcta/i,
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
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_BACKOFF = {
  until: 0
};
const PROVIDER_ATTEMPTS = {
  claude: 2,
  gemini: 2,
  "cloudflare-workers-ai": 2
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

  // Nuevas 5 preguntas del formulario mínimo. La búsqueda del formulario nuevo usa
  // valores acotados (claridad/calma/movimiento); si llega texto libre antiguo se conserva.
  const enJuego = ALLOWED_EN_JUEGO.has(String(body?.en_juego || "").trim())
    ? String(body.en_juego).trim()
    : null;
  const emocionDominante = ALLOWED_EMOCION.has(String(body?.emocion_dominante || "").trim())
    ? String(body.emocion_dominante).trim()
    : null;
  const tensionPrincipal = ALLOWED_TENSION.has(String(body?.tension_principal || "").trim())
    ? String(body.tension_principal).trim()
    : null;
  const busquedaRaw = String(body?.busqueda || "").trim();
  const busqueda = ALLOWED_BUSQUEDA.has(busquedaRaw)
    ? busquedaRaw
    : cleanInput(body?.busqueda, 80) || "claridad";

  return {
    alias: cleanInput(body?.alias, 60),
    pregunta,
    area,
    en_juego: enJuego,
    emocion_dominante: emocionDominante,
    tension_principal: tensionPrincipal,
    // estado_emocional legible: usa la nueva emoción dominante o el campo antiguo.
    estado_emocional: emocionDominante
      ? EMOCION_LABELS[emocionDominante]
      : cleanInput(body?.estado_emocional, 80) || "no indicado",
    busqueda,
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
      name: "claude",
      call: () => callClaude(context, env)
    },
    {
      name: "gemini",
      call: () => callGemini(context, env)
    },
    {
      name: "cloudflare-workers-ai",
      call: () => callCloudflareWorkersAI(context, env)
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

async function callClaude(context, env) {
  if (Date.now() < CLAUDE_BACKOFF.until) {
    throw new Error("Claude en pausa breve por límite de cuota.");
  }

  const apiKey = env?.CLAUDE_API_KEY || env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Falta CLAUDE_API_KEY en el entorno del Worker.");
  }

  const model = env?.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.6,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt(context.input, context.carta, context.meaning)
        },
        {
          // Prefill: fuerza al modelo a continuar un JSON ya abierto.
          role: "assistant",
          content: "{"
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429 || response.status === 529) {
      CLAUDE_BACKOFF.until = Date.now() + retryDelayMs(errorBody);
    }
    throw new Error(`Claude respondió con estado ${response.status}: ${errorBody.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = extractClaudeText(data);
  // Se usó prefill "{": si el texto no empieza con la llave, se restituye antes de parsear.
  return parseJsonFromModelText(raw.trim().startsWith("{") ? raw : `{${raw}`);
}

function extractClaudeText(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const text = blocks.map((block) => block?.text || "").join("\n").trim();

  if (!text) {
    throw new Error("Claude no devolvió texto usable.");
  }

  return text;
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
            carta: {
              type: "OBJECT",
              properties: {
                nombre: { type: "STRING" },
                numero: { type: "STRING" },
                tipo: { type: "STRING" },
                significado_base: { type: "STRING" },
                detalles_visuales_relevantes: { type: "ARRAY", items: { type: "STRING" } },
                frase_simbolica: { type: "STRING" }
              },
              required: ["nombre", "significado_base", "frase_simbolica"]
            },
            pregunta_ordenada: { type: "STRING" },
            lo_que_la_pregunta_parece_pedir: { type: "STRING" },
            lo_que_la_pregunta_podria_ocultar: { type: "STRING" },
            tension_psicodinamica: { type: "STRING" },
            lectura_de_la_carta_en_esta_pregunta: { type: "STRING" },
            etapa_vital: { type: "STRING" },
            resolucion_simbolica: { type: "STRING" },
            orientacion_practica: { type: "STRING" },
            acto_simbolico_opcional: { type: "STRING" },
            pregunta_final: { type: "STRING" },
            disclaimer: { type: "STRING" },
            fuentes_usadas: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: [
            "titulo",
            "carta",
            "pregunta_ordenada",
            "lo_que_la_pregunta_parece_pedir",
            "lo_que_la_pregunta_podria_ocultar",
            "tension_psicodinamica",
            "lectura_de_la_carta_en_esta_pregunta",
            "resolucion_simbolica",
            "orientacion_practica",
            "pregunta_final",
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
    ["pregunta_ordenada", ["pregunta_ordenada", "pregunta ordenada", "pregunta reformulada"]],
    ["lo_que_la_pregunta_parece_pedir", ["lo que la pregunta parece pedir", "lo que parece pedir", "parece pedir"]],
    ["lo_que_la_pregunta_podria_ocultar", ["lo que la pregunta podría ocultar", "lo que la pregunta podria ocultar", "lo que podría ocultar", "lo que podria ocultar", "podría ocultar", "podria ocultar"]],
    ["tension_psicodinamica", ["tensión psicodinámica", "tension psicodinamica", "tensión", "tension"]],
    ["lectura_de_la_carta_en_esta_pregunta", ["lectura de la carta en esta pregunta", "lectura de la carta", "lectura"]],
    ["etapa_vital", ["etapa vital", "etapa"]],
    ["resolucion_simbolica", ["resolución simbólica", "resolucion simbolica", "resolución", "resolucion"]],
    ["orientacion_practica", ["orientación práctica", "orientacion practica", "orientación", "orientacion"]],
    ["acto_simbolico_opcional", ["acto simbólico opcional", "acto simbolico opcional", "acto simbólico", "acto simbolico"]],
    ["pregunta_final", ["pregunta final", "pregunta de cierre", "pregunta reflexiva"]],
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

  return result.lectura_de_la_carta_en_esta_pregunta || result.resolucion_simbolica || result.tension_psicodinamica ? result : null;
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
    "Tu función no es adivinatoria. Es simbólica: ayudar al consultante a ordenar una duda que ocupa su mente. La pregunta expresa una tensión; debajo puede haber deseo, miedo, ambivalencia, defensa, repetición, idealización, culpa, duelo, rabia o dificultad para decidir.",
    "La IA no actúa como oráculo libre. Actúa como redactora simbólica dentro de una base autorizada de significados.",
    "Aplica el método Carta -> Pregunta -> Tensión -> Orden, en este orden: 1) presenta la carta como protagonista; 2) explica su significado tarológico base; 3) relaciona la carta con la pregunta concreta; 4) ordena la pregunta del consultante; 5) formula una tensión psicodinámica prudente; 6) resuelve esa tensión simbólicamente; 7) devuelve agencia; 8) da orientación práctica no directiva; 9) propón un acto simbólico opcional, seguro y no médico; 10) cierra con una pregunta reflexiva.",
    "No muestres tu razonamiento interno ni etiquetas de plantilla ('paso 1', 'tensión:', nombres de campos JSON) dentro del texto de los campos.",
    "Escribe principalmente en segunda persona amable: puedes mirar, tal vez conviene distinguir, puedes preguntarte. Evita sonar como informe clínico o ficha técnica.",
    "Escribe todo en español natural. No mezcles palabras en inglés como clarity, healing, energy, shadow, insight o guidance.",
    "El titulo debe ser una frase breve y cerrada en español, sin cortar ideas a medio camino.",
    "El campo carta.significado_base explica el sentido simbólico de la carta en general (no aún ligado a la pregunta). detalles_visuales_relevantes es una lista breve de elementos de la imagen (objetos, postura, dirección) tomados de la base autorizada. frase_simbolica es una sola línea evocadora, sin predicción.",
    "pregunta_ordenada reformula la duda del consultante de forma más consciente y precisa, sin cerrarla ni responderla.",
    "lo_que_la_pregunta_parece_pedir nombra el pedido explícito y aparente. lo_que_la_pregunta_podria_ocultar nombra con prudencia el deseo, miedo, ambivalencia, defensa, idealización, culpa, duelo o rabia que puede estar debajo. No afirmes certezas psicológicas: usa 'quizás', 'podría', 'tal vez'.",
    "tension_psicodinamica formula la contradicción central entre lo que se pide y lo que se oculta, de forma prudente, precisa y no diagnóstica.",
    "lectura_de_la_carta_en_esta_pregunta conecta la imagen de la carta con la pregunta concreta: cómo esa imagen ilumina la tensión. Menciona detalles concretos del relato del consultante si los hay.",
    "resolucion_simbolica ofrece una salida simbólica a la tensión y devuelve agencia: la carta no decide, pero propone un modo de mirar que ordena la duda y la devuelve a las manos del consultante.",
    "orientacion_practica da una orientación no directiva: sugiere, no ordena. Puede incluir un gesto pequeño, seguro y practicable hoy (pausar, escribir una frase, hablar con alguien de confianza, distinguir un límite). Nunca la presentes como solución garantizada.",
    "acto_simbolico_opcional debe ser seguro, simple, no médico, no peligroso, sin promesa de resultado y poder omitirse.",
    "pregunta_final es una sola pregunta abierta y reflexiva que devuelve agencia.",
    "etapa_vital: si recibes contexto_vital, descríbela como etapa amplia de vida (sin edad exacta, fecha, destino ni numerología) que matiza la lectura con sobriedad. Si no hay contexto_vital, deja etapa_vital como cadena vacía.",
    "fuentes_usadas: lista breve de las fuentes simbólicas realmente usadas, con estas claves permitidas: observacion_carta, interpretacion_tecnica, jodorowsky_inspirado, psicodinamica_prudente.",
    "Cada campo debe cumplir una función distinta. No repitas la misma idea con otras palabras entre lectura_de_la_carta_en_esta_pregunta, resolucion_simbolica, orientacion_practica, acto_simbolico_opcional y pregunta_final.",
    "Si aparecen dolor físico, recaídas, consumo, angustia intensa o salud mental, no diagnostiques ni indiques tratamiento. Incluye una orientación sobria hacia apoyo profesional o humano, integrada y sin convertirla en alarma si no hay crisis explícita.",
    "Si perfil_seguridad.alerta es cuidado, baja el tono poético y prioriza compañía humana, descanso, contacto seguro y apoyo profesional si la carga persiste. No lo trates como crisis suicida si no hay crisis explícita.",
    "Si perfil_seguridad.alerta es predictiva, di claramente que la lectura no puede predecir el futuro, leer la voluntad de otra persona ni entregar una sentencia. Reformula hacia lo observable, los límites, las necesidades y la agencia presente.",
    "Si la pregunta está escrita en primera persona, responde en segunda persona. No digas 'una persona', 'el consultante' ni describas la escena desde afuera.",
    "Idea central: la duda no significa ausencia de claridad. Muchas veces la duda muestra que algo ya empezó a ordenarse, pero necesita una imagen para ser visto desde otro lugar.",
    "Usa la base simbólica autorizada de la carta como marco obligatorio: escena visual, eje simbólico, tensión narrativa, giro simbólico, devolución de agencia, acto simbólico seguro y notas por área.",
    "No inventes significados externos. No agregues astrología, karma, canalización, destino, predicción ni magia literal.",
    "Cuando uses material inspirado en Jodorowsky, trátalo como inspiración transformada, no como cita ni método oficial. No digas 'según el método de Jodorowsky'.",
    "La carta ya fue seleccionada por el sistema. No cambies la carta. No inventes otra carta. No uses cartas invertidas ni menciones cartas no entregadas.",
    "No usas lenguaje de vidente omnisciente, fatalista, médico, legal ni financiero. No llames mala a ninguna carta.",
    "Ajusta la extensión según profundidad: breve 250 a 350 palabras totales; equilibrada 450 a 650; profunda 750 a 950.",
    "No agregues introducciones, markdown ni comentarios fuera del JSON. No uses comillas innecesarias dentro de los campos.",
    "No uses estas frases ni variantes: El destino ha hablado; Tu futuro está escrito; La carta revela tu verdad; Sanación energética; Diagnóstico espiritual; El universo quiere decirte; Vibración; Energía bloqueada; Canalización; Respuesta definitiva; Te diré si te ama; Esto cambiará tu vida; Te va a pasar; Debes hacer; La carta anuncia; la carta dice que.",
    "Devuelve exclusivamente JSON válido. No uses markdown. No agregues texto fuera del JSON.",
    "Devuelve estas claves: titulo, carta (con nombre, numero, tipo, significado_base, detalles_visuales_relevantes, frase_simbolica), pregunta_ordenada, lo_que_la_pregunta_parece_pedir, lo_que_la_pregunta_podria_ocultar, tension_psicodinamica, lectura_de_la_carta_en_esta_pregunta, etapa_vital, resolucion_simbolica, orientacion_practica, acto_simbolico_opcional, pregunta_final, disclaimer, fuentes_usadas.",
    `El disclaimer debe ser exactamente: ${DISCLAIMER}`,
    "El Worker adjuntará la carta real, el modo, el provider y la alerta."
  ].join("\n");
}

function buildUserPrompt(input, carta, meaning) {
  return JSON.stringify({
    pregunta: input.pregunta,
    formulario: {
      area: input.area,
      en_juego: input.en_juego ? EN_JUEGO_LABELS[input.en_juego] : null,
      emocion_dominante: input.emocion_dominante ? EMOCION_LABELS[input.emocion_dominante] : null,
      tension_principal: input.tension_principal ? TENSION_LABELS[input.tension_principal] : null,
      busqueda: BUSQUEDA_LABELS[input.busqueda] || input.busqueda
    },
    alias: input.alias,
    contexto_vital: input.contexto_vital
      ? {
          etapa: input.contexto_vital.etapa,
          uso: "matiz narrativo opcional, no predictivo; no mencionar edad exacta ni fecha"
        }
      : null,
    profundidad: input.profundidad,
    tono: input.tono,
    parametros: input.parametros,
    carta,
    base_simbolica_autorizada: buildAuthorizedMeaning(meaning, input.area),
    contexto_concreto_detectado: buildQuestionContext(input.pregunta),
    temas_sensibles_detectados: detectSensitiveThemes(input.pregunta),
    perfil_seguridad: input.perfil_seguridad || buildSafetyProfile(input),
    metodo: "Carta -> Pregunta -> Tensión -> Orden",
    formato: {
      titulo: "titulo sobrio, maximo 12 palabras, sin sensacionalismo",
      carta: {
        nombre: "nombre de la carta entregada; no cambiarla",
        numero: "numero romano de la carta entregada",
        tipo: "mayor",
        significado_base: "sentido simbolico general de la carta, aun no ligado a la pregunta",
        detalles_visuales_relevantes: "lista breve de elementos de la imagen tomados de la base autorizada",
        frase_simbolica: "una sola linea evocadora sobre la carta, sin prediccion"
      },
      pregunta_ordenada: "reformula la duda de forma mas consciente y precisa, sin responderla",
      lo_que_la_pregunta_parece_pedir: "el pedido explicito y aparente de la pregunta",
      lo_que_la_pregunta_podria_ocultar: "con prudencia (quizas, podria), el deseo, miedo, ambivalencia, defensa, idealizacion, culpa, duelo o rabia debajo",
      tension_psicodinamica: "la contradiccion central entre lo que se pide y lo que se oculta, no diagnostica",
      lectura_de_la_carta_en_esta_pregunta: "conecta la imagen de la carta con la pregunta concreta usando detalles del relato",
      etapa_vital: "si hay contexto_vital, etapa amplia sin edad ni destino; si no, cadena vacia",
      resolucion_simbolica: "salida simbolica a la tension que devuelve agencia; la carta no decide",
      orientacion_practica: "orientacion no directiva, con un gesto pequeno seguro y opcional",
      acto_simbolico_opcional: "acto seguro y opcional, no medico, no promesa, poder omitirse",
      pregunta_final: "una sola pregunta abierta y reflexiva que devuelve agencia",
      disclaimer: DISCLAIMER,
      fuentes_usadas: "lista con claves: observacion_carta, interpretacion_tecnica, jodorowsky_inspirado, psicodinamica_prudente"
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
    pregunta_en_primera_persona: isFirstPersonQuestion(text),
    temor_a_dependencia_o_consulta: hasConsultationDependenceConcern(text),
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
    value.lectura_de_la_carta_en_esta_pregunta,
    value.tension_psicodinamica,
    value.resolucion_simbolica,
    // Compatibilidad defensiva por si el modelo responde con claves antiguas.
    value.lectura,
    value.escena_consultante,
    value.giro_simbolico
  ].some((field) => String(field || "").trim());

  if (!hasCoreReading) {
    throw new Error("La respuesta IA no incluye contenido narrativo usable.");
  }

  const normalizedCard = normalizeCard(context.carta, context.carta);
  const wordLimits = readingWordLimitsForDepth(context.input?.profundidad);
  const repair = repairReadingFields(value, context, normalizedCard);
  const title = normalizeReadingTitle(repair.titulo, context, normalizedCard);
  const cartaObject = buildCartaObject(value.carta, context.meaning, normalizedCard, repair);
  const etapa = cleanText(repair.etapa_vital || context.input?.contexto_vital?.etapa || "");

  const reading = {
    titulo: title,
    carta: cartaObject,
    pregunta_ordenada: limitSentences(cleanText(repair.pregunta_ordenada), 2),
    lo_que_la_pregunta_parece_pedir: limitWords(cleanText(repair.lo_que_la_pregunta_parece_pedir), 90),
    lo_que_la_pregunta_podria_ocultar: limitWords(cleanText(repair.lo_que_la_pregunta_podria_ocultar), 110),
    tension_psicodinamica: limitWords(cleanText(repair.tension_psicodinamica), 120),
    lectura_de_la_carta_en_esta_pregunta: limitWords(cleanText(repair.lectura_de_la_carta_en_esta_pregunta), wordLimits.lectura),
    etapa_vital: etapa,
    resolucion_simbolica: limitWords(cleanText(repair.resolucion_simbolica), 150),
    orientacion_practica: limitWords(cleanText(repair.orientacion_practica), wordLimits.orientacion),
    acto_simbolico_opcional: limitWords(cleanText(repair.acto_simbolico_opcional), 90),
    pregunta_final: ensureQuestion(limitSentences(cleanText(repair.pregunta_final), 1)),
    disclaimer: DISCLAIMER,
    fuentes_usadas: normalizeSources(value.fuentes_usadas, context.meaning),
    modo: "ia-real",
    provider,
    base_simbolica_usada: Boolean(context.meaning),
    calidad_revision: "aprobada",
    alerta: context.safetyProfile?.alerta || null
  };

  if (reading.alerta === "predictiva") {
    reading.pregunta_ordenada = "La pregunta pide una certeza que esta lectura no puede entregar; puede mirarse mejor desde lo observable, tus límites y tu margen de acción.";
    reading.lo_que_la_pregunta_parece_pedir = "Pide una certeza sobre el futuro o sobre la voluntad de otra persona.";
    reading.lectura_de_la_carta_en_esta_pregunta = limitWords(cleanText(`Esta lectura no predice el futuro ni lee la voluntad de otra persona. ${reading.lectura_de_la_carta_en_esta_pregunta}`), wordLimits.lectura);
    reading.orientacion_practica = "Puedes reformular la pregunta así: qué señales concretas puedo observar, qué límite necesito cuidar y qué decisión pequeña depende de mí ahora.";
    reading.pregunta_final = "¿Qué parte de esta situación puedes observar sin convertirla en una predicción?";
  }

  if (reading.alerta === "cuidado") {
    reading.orientacion_practica = "Mantener una lectura sobria: si la angustia se vuelve difícil de sostener, puede ayudarte hablar con alguien de confianza o con apoyo profesional.";
  }

  const joined = [
    reading.titulo,
    reading.carta.nombre,
    reading.carta.significado_base,
    reading.carta.frase_simbolica,
    (reading.carta.detalles_visuales_relevantes || []).join(" "),
    reading.pregunta_ordenada,
    reading.lo_que_la_pregunta_parece_pedir,
    reading.lo_que_la_pregunta_podria_ocultar,
    reading.tension_psicodinamica,
    reading.lectura_de_la_carta_en_esta_pregunta,
    reading.resolucion_simbolica,
    reading.orientacion_practica,
    reading.acto_simbolico_opcional,
    reading.pregunta_final
  ].join(" ");

  if (!reading.lectura_de_la_carta_en_esta_pregunta || PROHIBITED_PATTERNS.some((pattern) => pattern.test(joined))) {
    throw new Error("La respuesta IA no pasó los filtros éticos.");
  }

  const quality = assessReadingQuality(reading, context);
  if (!quality.ok) {
    throw new Error(`La respuesta IA no pasó la revisión de calidad: ${quality.reasons.join(", ")}`);
  }

  return reading;
}

function buildCartaObject(value, meaning, normalizedCard) {
  const source = value && typeof value === "object" ? value : {};
  const expanded = meaning ? buildExpandedSymbolicLayer(meaning) : null;
  const visualFromLenses = Array.isArray(expanded?.lentes_visuales) ? expanded.lentes_visuales : [];
  const aiDetalles = Array.isArray(source.detalles_visuales_relevantes)
    ? source.detalles_visuales_relevantes.map((detail) => cleanText(detail)).filter(Boolean)
    : [];
  const detalles = (aiDetalles.length ? aiDetalles : visualFromLenses)
    .map((detail) => cleanText(detail))
    .filter(Boolean)
    .slice(0, 6);

  const significadoBase = limitWords(cleanText(
    source.significado_base || meaning?.eje_simbolico || `Mirar la pregunta desde ${normalizedCard.palabras.join(", ")}.`
  ), 70);
  const fraseSimbolica = limitSentences(cleanText(
    source.frase_simbolica || meaning?.giro_simbolico || `${normalizedCard.nombre} abre una mirada, no una conclusión.`
  ), 1);

  return {
    nombre: normalizedCard.nombre,
    numero: normalizedCard.numero,
    tipo: normalizedCard.tipo || "mayor",
    imagen: normalizedCard.imagen,
    significado_base: significadoBase,
    detalles_visuales_relevantes: detalles.length ? detalles : normalizedCard.palabras.slice(0, 4),
    frase_simbolica: fraseSimbolica,
    palabras_clave: normalizedCard.palabras
  };
}

function normalizeSources(value, meaning) {
  const out = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const raw = String(item || "").trim();
      if (!raw) continue;
      const key = raw.toLowerCase().replace(/\s+/g, "_");
      out.push(SOURCE_LABELS[key] || cleanText(raw));
    }
  }
  if (!out.length) {
    const keys = meaning
      ? ["observacion_carta", "interpretacion_tecnica", "jodorowsky_inspirado"]
      : ["interpretacion_tecnica"];
    keys.forEach((key) => out.push(SOURCE_LABELS[key]));
  }
  return [...new Set(out)].slice(0, 6);
}

function assessReadingQuality(reading, context) {
  const reasons = [];
  const text = normalizeForMatch([
    reading.pregunta_ordenada,
    reading.lo_que_la_pregunta_parece_pedir,
    reading.lo_que_la_pregunta_podria_ocultar,
    reading.tension_psicodinamica,
    reading.lectura_de_la_carta_en_esta_pregunta,
    reading.resolucion_simbolica,
    reading.orientacion_practica,
    reading.acto_simbolico_opcional,
    reading.pregunta_final
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
  const cardText = normalizeForMatch([
    reading.carta?.nombre,
    reading.carta?.significado_base,
    reading.carta?.frase_simbolica,
    (reading.carta?.detalles_visuales_relevantes || []).join(" ")
  ].join(" "));
  const fullText = `${cardText} ${text}`;
  const cardMentioned = cardName && fullText.includes(cardName);
  const symbolicBaseTouched = symbolicWords.some((word) => word && fullText.includes(word));
  const hasArc = [
    reading.pregunta_ordenada,
    reading.lo_que_la_pregunta_parece_pedir,
    reading.lo_que_la_pregunta_podria_ocultar,
    reading.tension_psicodinamica,
    reading.resolucion_simbolica,
    reading.pregunta_final
  ].every((field) => String(field || "").trim().length >= 24);
  const agencyLanguage = /\b(puedes|podrias|podrías|observar|mirar|distinguir|elegir|nombrar|reconocer|vuelve a tus manos)\b/i.test([
    reading.resolucion_simbolica,
    reading.orientacion_practica,
    reading.pregunta_final
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

  if (hasEnglishLeak(reading.titulo) || hasEnglishLeak(text)) {
    reasons.push("mezcla idioma no solicitado");
  }

  if (hasWeakTitle(reading.titulo)) {
    reasons.push("titulo incompleto o poco confiable");
  }

  if (!hasPracticalReliefGesture(reading)) {
    reasons.push("no ofrece un gesto practico de alivio");
  }

  if (isFirstPersonQuestion(context.input?.pregunta) && /\b(una persona|el consultante|la persona)\b/i.test(text)) {
    reasons.push("toma distancia generica de una pregunta en primera persona");
  }

  if (hasConsultationDependenceConcern(context.input?.pregunta)) {
    const dependenceAnchors = [
      /\b(engancharse|depender|dependencia|oraculo|oraculo|tarot|consulta|consultar)\b/i,
      /\b(agencia|margen|limite|limites|cuidar|cerrar)\b/i,
      /\b(claridad|respuesta|certeza)\b/i
    ];
    const touchedAnchors = dependenceAnchors.filter((pattern) => pattern.test(text)).length;
    if (touchedAnchors < 3) {
      reasons.push("no aborda el temor a depender de la consulta");
    }
  }

  if (hasRepeatedFieldCore(reading)) {
    reasons.push("repite demasiado la misma idea entre campos");
  }

  const criticalReasons = reasons.filter((reason) => [
    "no sostiene escena-validacion-tension-giro-agencia",
    "usa lenguaje genérico",
    "mezcla idioma no solicitado",
    "titulo incompleto o poco confiable",
    "no ofrece un gesto practico de alivio",
    "toma distancia generica de una pregunta en primera persona",
    "no aborda el temor a depender de la consulta",
    "repite demasiado la misma idea entre campos"
  ].includes(reason));

  return {
    ok: criticalReasons.length === 0,
    reasons,
    criticalReasons
  };
}

function normalizeReadingTitle(value, context, card) {
  const cleaned = limitWords(cleanTitle(value), 12)
    .replace(/\bClarity\b/gi, "claridad")
    .replace(/\bGuidance\b/gi, "orientacion")
    .replace(/\bInsight\b/gi, "mirada")
    .trim();

  if (!hasWeakTitle(cleaned) && !hasEnglishLeak(cleaned)) {
    return cleaned;
  }

  const area = areaLabel(context.input?.area).toLowerCase();
  const cardName = cleanText(card?.nombre || "la carta");
  if (context.safetyProfile?.alerta === "predictiva") {
    return "Una pausa antes de buscar certeza";
  }
  if (context.safetyProfile?.alerta === "cuidado") {
    return "Una pausa para bajar la carga";
  }
  if (hasConsultationDependenceConcern(context.input?.pregunta)) {
    return "Consultar sin ceder agencia";
  }
  return `Mirar ${area} con ${cardName}`;
}

function hasWeakTitle(value) {
  const title = String(value || "").trim();
  if (!title || title.length < 6) return true;
  if (title.length > 90) return true;
  if (/\b(la|el|de|del|que|para|con|sin|hacia|desde|y|o)$/i.test(title)) return true;
  if (/[,:;]$/.test(title)) return true;
  return false;
}

function hasEnglishLeak(value) {
  return /\b(clarity|guidance|healing|energy|shadow|insight|journey|mindfulness|self-care)\b/i.test(String(value || ""));
}

function hasPracticalReliefGesture(reading) {
  const text = normalizeForMatch([
    reading.orientacion_practica,
    reading.acto_simbolico_opcional,
    reading.pregunta_final,
    reading.resolucion_simbolica
  ].join(" "));
  return /\b(respira|respirar|pausa|pausar|escribe|escribir|anota|nombrar|hablar|conversacion|limite|accion pequena|gesto pequeno|descanso|acompan)\b/.test(text);
}

function isFirstPersonQuestion(value) {
  const text = normalizeForMatch(value);
  return /\b(yo|me|mi|mis|conmigo|quiero|temo|necesito|puedo|estoy|siento)\b/.test(text);
}

function hasConsultationDependenceConcern(value) {
  const text = normalizeForMatch(value);
  return /\b(consultar|consulta|tarot|oraculo|respuesta|certeza|enganchar\w*|dependencia|depender|darle poder|cede agencia|ceder agencia)\b/.test(text) &&
    /\b(temo|temor|miedo|enganchar\w*|depender|poder|agencia|limite|limites|cuidar)\b/.test(text);
}

function hasRepeatedFieldCore(reading) {
  const fields = [
    reading.lectura_de_la_carta_en_esta_pregunta,
    reading.tension_psicodinamica,
    reading.resolucion_simbolica,
    reading.orientacion_practica,
    reading.acto_simbolico_opcional,
    reading.pregunta_final
  ].map((field) => normalizeForMatch(field)
    .split(/\s+/)
    .filter((word) => word.length > 4 && !QUESTION_STOPWORDS.has(word))
    .slice(0, 14)
    .join(" "))
    .filter(Boolean);

  return fields.some((field, index) => fields.slice(index + 1).some((other) => {
    if (field === other) return true;
    const left = new Set(field.split(" "));
    const right = other.split(" ");
    const overlap = right.filter((word) => left.has(word)).length;
    return left.size >= 6 && right.length >= 6 && overlap / Math.min(left.size, right.length) >= 0.75;
  }));
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
  const question = input.pregunta || "la pregunta";
  const alias = input.alias ? `${input.alias}, ` : "";
  const enJuego = input.en_juego ? EN_JUEGO_LABELS[input.en_juego] : "";
  const emotion = input.emocion_dominante ? EMOCION_LABELS[input.emocion_dominante] : cleanOptional(input.estado_emocional);
  const tensionSel = input.tension_principal ? TENSION_LABELS[input.tension_principal] : "";
  const search = BUSQUEDA_LABELS[input.busqueda] || cleanOptional(input.busqueda) || "claridad";
  const palabras = carta.palabras.join(", ");
  const areaMeaning = meaning?.areas?.[input.area] || meaning?.areas?.otro || `la relación entre ${palabras}`;
  const eje = meaning?.eje_simbolico || `mirar la pregunta desde ${palabras}`;
  const tensionBase = meaning?.tension_narrativa || "La tensión parece estar entre querer una respuesta inmediata y necesitar mirar con más precisión.";
  const giro = meaning?.giro_simbolico || `${carta.nombre} no decide por ti: propone cambiar el ángulo de mirada.`;
  const agency = meaning?.devolucion_agencia || "La carta no decide por ti; te devuelve una posibilidad de observación y acción consciente.";
  const integrationQuestion = meaning?.pregunta_integracion || "¿Qué parte de esta pregunta vuelve ahora a tus manos?";
  const symbolicAct = meaning?.acto_simbolico_seguro || "Si te sirve, escribe la pregunta y subraya una sola palabra que hoy necesite más cuidado.";

  return {
    titulo: value.titulo || `Mirada con ${carta.nombre}`,
    etapa_vital: value.etapa_vital || input.contexto_vital?.etapa || "",
    pregunta_ordenada: value.pregunta_ordenada || value.pregunta_reformulada
      || `${alias}tu pregunta sobre ${area} puede ordenarse como una tensión${tensionSel ? ` entre ${tensionSel}` : ""}, buscando ${search}.`,
    lo_que_la_pregunta_parece_pedir: value.lo_que_la_pregunta_parece_pedir
      || `Parece pedir ${enJuego || `una forma más clara de mirar ${area}`}, buscando ${search}.`,
    lo_que_la_pregunta_podria_ocultar: value.lo_que_la_pregunta_podria_ocultar
      || `Quizás debajo conviven ${emotion || "una emoción no del todo nombrada"} y el temor a decidir sin estar seguro: el deseo de avanzar podría convivir con el miedo a perder algo.`,
    tension_psicodinamica: value.tension_psicodinamica || value.tension_narrativa || value.tension_o_contradiccion
      || (tensionSel
        ? `La tensión central parece estar entre ${tensionSel}: dos fuerzas legítimas que hoy tiran en direcciones distintas.`
        : tensionBase),
    lectura_de_la_carta_en_esta_pregunta: value.lectura_de_la_carta_en_esta_pregunta || value.lectura || value.giro_simbolico || value.escena_consultante
      || `Ante "${question}", ${carta.nombre} propone ${eje}. En ${area}, su imagen ayuda a mirar ${areaMeaning}: qué ya tiene forma, qué está agotado y qué gesto pequeño podría ordenar la duda.`,
    resolucion_simbolica: value.resolucion_simbolica || value.devolucion_agencia || `${giro} ${agency}`,
    orientacion_practica: value.orientacion_practica || value.orientacion
      || `Puedes observar ${areaMeaning} sin convertirlo en mandato: nombra una sola cosa que hoy dependa de ti y déjala escrita.`,
    acto_simbolico_opcional: value.acto_simbolico_opcional || symbolicAct,
    pregunta_final: value.pregunta_final || value.pregunta_integracion || integrationQuestion
  };
}

function crisisReading() {
  return {
    titulo: "Primero tu seguridad",
    carta: null,
    pregunta_ordenada: "",
    lo_que_la_pregunta_parece_pedir: "",
    lo_que_la_pregunta_podria_ocultar: "",
    tension_psicodinamica: "",
    lectura_de_la_carta_en_esta_pregunta: "Lo que escribiste suena a un momento de riesgo o dolor muy intenso. Esta página no va a convertirlo en lectura de cartas: lo importante es que no atravieses esto a solas.",
    etapa_vital: "",
    resolucion_simbolica: "",
    orientacion_practica: "Si puedes estar en peligro ahora, llama a emergencias de tu país o ve a un servicio de urgencia. Si estás en Chile, puedes llamar al *4141; si estás en Estados Unidos, llama o escribe al 988. También puedes contactar ahora a una persona cercana y decirle: 'necesito compañía, no estoy bien'.",
    acto_simbolico_opcional: "",
    pregunta_final: "¿Puedes contactar ahora mismo a una persona o servicio de urgencia para no quedarte a solas con esto?",
    disclaimer: CRISIS_DISCLAIMER,
    fuentes_usadas: [],
    modo: "seguridad-crisis",
    provider: "safety",
    alerta: "crisis"
  };
}

function localSymbolicReading(input, carta = selectCard(), meaning = getCardMeaning(carta), providerErrors = []) {
  const safetyProfile = buildSafetyProfile(input);
  const area = areaLabel(input.area).toLowerCase();
  const palabras = carta.palabras.join(", ");
  const alias = input.alias ? `${input.alias}, ` : "";
  const enJuego = input.en_juego ? EN_JUEGO_LABELS[input.en_juego] : "";
  const emotion = input.emocion_dominante ? EMOCION_LABELS[input.emocion_dominante] : cleanOptional(input.estado_emocional);
  const tensionSel = input.tension_principal ? TENSION_LABELS[input.tension_principal] : "";
  const search = BUSQUEDA_LABELS[input.busqueda] || cleanOptional(input.busqueda) || "claridad";
  const fallbackFrame = meaning?.areas?.[input.area] || fallbackFrameForArea(input.area);
  const eje = meaning?.eje_simbolico || `mirar la situación desde ${palabras}`;
  const giro = meaning?.giro_simbolico || `${carta.nombre} introduce otra mirada: no responde por ti, pero pone sobre la mesa la relación entre ${palabras}.`;
  const agency = meaning?.devolucion_agencia || "La carta no decide por ti. Te devuelve una posibilidad: separar lo vivo, lo agotado y lo pendiente.";
  const integrationQuestion = meaning?.pregunta_integracion || fallbackQuestionForArea(input.area);
  const symbolicAct = meaning?.acto_simbolico_seguro || "Si te sirve, escribe una frase de la pregunta y subraya sólo la palabra que hoy pide más cuidado. Luego déjala descansar.";
  const questionSummary = summarizeQuestionForPrompt(input.pregunta);
  const sensitiveThemes = detectSensitiveThemes(input.pregunta);
  const hasDependenceConcern = hasConsultationDependenceConcern(input.pregunta);

  const careLine = sensitiveThemes.length
    ? " Como aparecen señales de cuerpo, recaída o angustia, esta lectura no reemplaza apoyo profesional ni una conversación humana concreta; puede acompañar la pregunta, no sostenerla sola."
    : "";
  const safetyLine = safetyProfile.alerta === "cuidado"
    ? " Como aparece angustia intensa, conviene que esta lectura sea una pausa sobria y que puedas hablar con alguien de confianza o con apoyo profesional si la carga se vuelve difícil de sostener."
    : safetyProfile.alerta === "predictiva"
      ? " Como la pregunta pide una certeza, esta lectura no predice el futuro ni lee la voluntad de otra persona; sólo puede ayudarte a mirar lo observable y lo que vuelve a tus manos."
      : "";
  const lifeStageLine = input.contexto_vital?.etapa
    ? ` Como contexto amplio, esta pregunta ocurre en ${input.contexto_vital.etapa}; esa etapa puede servir para mirar qué pide madurar, cerrar o cuidar ahora, sin definir tu camino.`
    : "";

  const tensionField = hasDependenceConcern
    ? "La tensión está entre el deseo legítimo de claridad y el temor a ceder agencia a una respuesta externa. La pregunta no pide más oráculo: pide un modo de consultar que tenga límite, cierre y devolución a tus manos."
    : tensionSel
      ? `La tensión central parece estar entre ${tensionSel}: dos fuerzas legítimas que hoy tiran en direcciones distintas.`
      : (meaning?.tension_narrativa || "La tensión no parece estar sólo en encontrar una respuesta rápida, sino entre una parte que quiere claridad inmediata y otra que necesita no precipitarse.");
  const hiddenField = hasDependenceConcern
    ? "Debajo puede convivir el deseo de claridad con el temor a depender de una respuesta externa; ese cuidado ya es un límite sano de uso."
    : `Quizás debajo conviven ${emotion || "una emoción no del todo nombrada"} y el temor a decidir sin estar seguro: el deseo de avanzar podría convivir con el miedo a perder algo.`;
  const orientationField = hasDependenceConcern
    ? "Puedes usar esta lectura con un límite concreto: una sola consulta, una nota escrita y una acción pequeña fuera de la página antes de volver a preguntar."
    : (safetyProfile.orientacion || fallbackOrientationForArea(input.area, palabras));
  const actField = hasDependenceConcern
    ? "Antes de cerrar, escribe dos columnas: qué claridad buscabas y qué poder no quieres entregarle a la lectura. Quédate con una frase de cada columna."
    : symbolicAct;
  const finalQuestion = hasDependenceConcern
    ? "¿Qué límite de uso haría que esta consulta siga siendo una herramienta y no una autoridad?"
    : integrationQuestion;

  return {
    titulo: `Lectura de apoyo con ${carta.nombre}`,
    carta: buildCartaObject(null, meaning, carta),
    pregunta_ordenada: input.pregunta
      ? `${alias}tu pregunta sobre ${area} puede ordenarse${tensionSel ? ` como una tensión entre ${tensionSel}` : ""}, buscando ${search} sin convertir la carta en una orden.`
      : `${alias}esta consulta busca ${search} sin convertir la carta en una orden.`,
    lo_que_la_pregunta_parece_pedir: `Parece pedir ${enJuego || `una forma más clara de mirar ${area}`}, buscando ${search}.`,
    lo_que_la_pregunta_podria_ocultar: hiddenField,
    tension_psicodinamica: tensionField,
    lectura_de_la_carta_en_esta_pregunta: `Ante ${questionSummary || `una pregunta sobre ${area}`}, ${carta.nombre} propone ${eje}. En el área de ${area}, su imagen ayuda a mirar ${fallbackFrame} como una composición: algo ya muestra forma, algo está agotado o inmaduro, y algo puede probarse con un gesto pequeño antes de exigir una conclusión total.${careLine}${safetyLine}${lifeStageLine} Una posibilidad de lectura es que la claridad no aparezca como respuesta definitiva, sino como separación: qué pertenece al miedo, qué al deseo, qué al cansancio y qué a una dirección posible que aún puede tomar forma.`,
    etapa_vital: input.contexto_vital?.etapa || "",
    resolucion_simbolica: `${giro} ${agency}`,
    orientacion_practica: orientationField,
    acto_simbolico_opcional: actField,
    pregunta_final: finalQuestion,
    disclaimer: DISCLAIMER,
    fuentes_usadas: normalizeSources(null, meaning),
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

// Worker Tarot de Marsella Libre — método Carta -> Pregunta -> Tensión -> Orden.
// Proveedores (en orden): Claude Haiku (primario) -> Gemini 2.5-flash -> Cloudflare Workers AI -> fallback local.
// Test offline del ruteo: node scripts/qa-provider-claude.mjs
