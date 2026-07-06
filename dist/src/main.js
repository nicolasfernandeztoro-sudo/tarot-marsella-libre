const WORKER_URL = "/api/tarot";
const WORKER_HEALTH_URL = "/api/health";

const AREAS = [
  { value: "amor", label: "Amor" },
  { value: "trabajo", label: "Trabajo" },
  { value: "decision", label: "Decisión" },
  { value: "familia", label: "Familia" },
  { value: "creatividad", label: "Creatividad" },
  { value: "animo", label: "Ánimo" },
  { value: "crisis", label: "Crisis" },
  { value: "otro", label: "Otro" }
];

const EMOTIONAL_STATES = ["confusión", "ansiedad", "duda", "cansancio", "esperanza", "rabia", "tristeza", "presión"];
const READING_GOALS = ["claridad", "decisión", "comprensión", "cierre", "impulso", "calma"];
const SITUATION_TYPES = [
  "Estoy entre dos opciones",
  "Algo terminó o está terminando",
  "Quiero iniciar algo",
  "No sé qué siento",
  "Me cuesta soltar",
  "Necesito ordenar una conversación"
];
const DEPTHS = [
  { value: "breve", label: "Breve" },
  { value: "equilibrada", label: "Equilibrada" },
  { value: "profunda", label: "Profunda" }
];
const TONES = [
  { value: "directo", label: "Directo" },
  { value: "poetico", label: "Poético" },
  { value: "contenedor", label: "Contenedor" }
];

const SYMBOLIC_CARDS = [
  {
    title: "La Papisa",
    image: "./cartas/la-papisa.jpg",
    phrase: "El saber que madura en silencio."
  },
  {
    title: "La Estrella",
    image: "./cartas/la-estrella.jpg",
    phrase: "Una imagen de calma para volver a mirar."
  },
  {
    title: "La Justicia",
    image: "./cartas/la-justicia.jpg",
    phrase: "La pregunta busca medida y claridad."
  },
  {
    title: "El Ermitaño",
    image: "./cartas/el-ermitano.jpg",
    phrase: "Una luz pequeña alcanza para ordenar el camino inmediato."
  },
  {
    title: "La Templanza",
    image: "./cartas/la-templanza.jpg",
    phrase: "Algo pide mezcla, pausa y proporción."
  }
];

const QUESTION_SEEDS = [
  "¿Qué necesito mirar con más claridad en este momento?",
  "¿Qué parte de esta situación vuelve hoy a mis manos?",
  "¿Qué tensión puedo observar sin exigirme una respuesta inmediata?",
  "¿Qué límite, gesto o palabra podría ordenar mejor esta escena?",
  "¿Qué estoy intentando resolver demasiado rápido?"
];

const ETHICAL_NOTE =
  "Lectura simbólica y narrativa. No reemplaza atención médica, psicológica, legal ni decisiones personales importantes.";

const FREE_ACCESS_NOTE =
  "Este espacio es gratuito. No cobramos, no guardamos tus datos y no vendemos certezas.";

const PRIVACY_NOTE =
  "Privacidad: no hay login, cookies, analytics ni historial. La pregunta viaja al Worker sólo para generar esta respuesta y la página no la guarda.";

const SUPPORT_NOTE =
  "Si hay riesgo inmediato, llama a emergencias o ve a urgencias. En Chile puedes llamar al *4141; en Estados Unidos, llama o escribe al 988. Tambien puedes contactar ahora a una persona cercana y decirle: 'necesito compania, no estoy bien'.";

const CARE_NOTE =
  "Como aparece angustia intensa, la lectura baja el tono simbólico: si esta carga se vuelve difícil de sostener, habla con alguien de confianza o con apoyo profesional.";

const PREDICTIVE_NOTE =
  "Esta lectura no predice el futuro ni lee la voluntad de otra persona. Reformula la pregunta hacia lo observable, tus límites y tu margen de acción.";

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

const app = document.querySelector("#app");
let state = {
  alias: "",
  question: "",
  area: "decision",
  emotionalState: "",
  readingGoal: "claridad",
  situationType: "",
  depth: "equilibrada",
  tone: "contenedor",
  birthDate: "",
  copyMessage: "",
  loading: false,
  result: null,
  error: "",
  readingCount: 0
};

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  if (options.className) node.className = options.className;
  if (options.id) node.id = options.id;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([name, value]) => {
      if (value !== false && value !== null && value !== undefined) {
        node.setAttribute(name, String(value));
      }
    });
  }
  if (options.disabled) node.disabled = true;
  if (options.checked) node.checked = true;
  if (options.value !== undefined) node.value = options.value;

  children.forEach((child) => {
    if (child) node.append(child);
  });

  return node;
}

function Hero() {
  const dailyCard = getDailyCard();
  return el("header", { className: "hero" }, [
    el("div", { className: "hero-copy" }, [
      el("p", {
        className: "kicker",
        text: "Tarot simbólico gratuito"
      }),
      el("h1", { text: "Tarot de Marsella Libre" }),
      el("p", { className: "hero-phrase", text: "Una mesa breve para mirar mejor una pregunta." }),
      el("p", {
        className: "microcopy",
        text: `${FREE_ACCESS_NOTE} Inspirado en la tarología de Alejandro Jodorowsky y en el Tarot de Marsella.`
      })
    ]),
    el("figure", { className: "daily-card" }, [
      el("img", {
        attributes: {
          src: dailyCard.image,
          alt: dailyCard.title,
          loading: "eager"
        }
      }),
      el("figcaption", {}, [
        el("span", { className: "daily-card-kicker", text: "Carta para mirar hoy" }),
        el("strong", { text: dailyCard.title }),
        el("span", { text: dailyCard.phrase })
      ])
    ])
  ]);
}

function getDailyCard() {
  const now = new Date();
  const dayKey = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`);
  return SYMBOLIC_CARDS[dayKey % SYMBOLIC_CARDS.length];
}

function reframeQuestion(question) {
  const text = String(question || "").trim();
  if (!text) return QUESTION_SEEDS[pickRandomIndex(QUESTION_SEEDS.length)];

  const normalized = normalizeForMatch(text);
  if (hasPredictiveLanguage(normalized)) {
    return "¿Qué señales concretas puedo observar, qué límite necesito cuidar y qué parte de esta situación vuelve a mis manos?";
  }

  if (/deberia|deberia/.test(normalized)) {
    return "¿Qué tensión aparece entre lo que deseo, lo que temo y lo que puedo sostener ahora?";
  }

  return `¿Qué necesito mirar con más claridad en esta situación: ${text.replace(/[¿?]+/g, "").slice(0, 180)}?`;
}

function Manifesto() {
  return el("section", { className: "manifesto-panel" }, [
    el("p", {
      className: "manifesto-lead",
      text: "Tarot de Marsella Libre es una lectura simbólica gratuita, inspirada en la tarología de Alejandro Jodorowsky y en el Tarot de Marsella."
    }),
    el("p", {
      className: "manifesto-compact",
      text: "No predice el futuro. No da respuestas definitivas. No reemplaza ayuda profesional. No guarda tus datos. No cobra. No busca que dependas del oráculo."
    }),
    el("p", {
      className: "manifesto-compact",
      text: "La carta no decide por ti: ofrece una imagen para mirar tu pregunta desde otro lugar."
    }),
    el("details", { className: "manifesto-details" }, [
      el("summary", { text: "Manifiesto" }),
      el("ol", {}, [
        manifestoItem("No adivinamos.", "Esta página no responde qué va a pasar. Ayuda a mirar qué aparece en la pregunta."),
        manifestoItem("No damos órdenes.", "La lectura no decide por ti. Puede proponer una imagen, una tensión o una pregunta."),
        manifestoItem("No vendemos certeza.", "No prometemos amor, éxito, dinero, sanación ni destino."),
        manifestoItem("Leemos imágenes.", "El Tarot de Marsella se trata aquí como lenguaje visual, simbólico y proyectivo."),
        manifestoItem("La duda ya contiene una forma.", "Cuando alguien pregunta, algo ya empezó a ordenarse. La lectura ayuda a mirar esa tensión desde otro lugar."),
        manifestoItem("Devolvemos agencia.", "La carta no toma poder sobre tu vida. Te ayuda a reconocer una posibilidad de mirada y una acción consciente."),
        manifestoItem("Cuidamos la privacidad.", "No pedimos login, no guardamos tus datos y no usamos contacto personal.")
      ])
    ])
  ]);
}

function manifestoItem(title, body) {
  return el("li", {}, [
    el("strong", { text: title }),
    document.createTextNode(` ${body}`)
  ]);
}

function QuestionGuide() {
  const examples = [
    {
      before: "¿Qué va a pasar con esta relación?",
      after: "¿Qué necesito mirar con más honestidad en este vínculo?"
    },
    {
      before: "¿Me irá bien en el trabajo?",
      after: "¿Qué recurso o límite necesito ordenar en mi trabajo?"
    },
    {
      before: "¿Debo dejar este proyecto?",
      after: "¿Qué tensión aparece entre seguir, descansar y cambiar de forma?"
    },
    {
      before: "¿El tarot me dirá qué hacer?",
      after: "¿Qué espero encontrar en esta consulta y qué límite necesito cuidar?"
    }
  ];

  return el("section", { className: "question-guide" }, [
    el("div", {}, [
      el("p", { className: "kicker", text: "guía breve" }),
      el("h2", { text: "Preguntar mejor" }),
      el("p", {
        text: "La lectura funciona mejor cuando la pregunta no busca cerrar el futuro, sino mirar con más precisión el presente."
      }),
      el("p", {
        className: "install-note",
        text: "Puedes guardar esta página en la pantalla de inicio del celular: funciona como una app liviana, sin cuenta y sin datos guardados."
      })
    ]),
    el("ul", { className: "question-examples" }, examples.map((example) => (
      el("li", {}, [
        el("span", { className: "question-before", text: example.before }),
        el("span", { className: "question-after", text: example.after })
      ])
    )))
  ]);
}

function QuestionForm() {
  const aliasInput = el("input", {
    id: "alias",
    value: state.alias,
    attributes: {
      name: "alias",
      type: "text",
      maxlength: "60",
      placeholder: "Puedes usar un alias",
      autocomplete: "off"
    }
  });

  const textarea = el("textarea", {
    id: "question",
    value: state.question,
    attributes: {
      name: "question",
      rows: "5",
      maxlength: "600",
      placeholder: "¿Qué necesito comprender de esta situación?",
      required: "required",
      "aria-describedby": state.error ? "form-error" : "question-help"
    }
  });

  const birthDateInput = el("input", {
    id: "birth-date",
    value: state.birthDate,
    attributes: {
      name: "birthDate",
      type: "date"
    }
  });

  const children = [
    el("p", { className: "form-intro", text: "Prepara la lectura: escribe una pregunta que abra mirada, no una sentencia." }),
    el("label", { className: "field-label", text: "Nombre o alias", attributes: { for: "alias" } }),
    aliasInput,
    el("label", { className: "field-label", text: "Tu pregunta", attributes: { for: "question" } }),
    textarea,
    el("p", { id: "question-help", className: "field-help", text: "Mejor una pregunta para mirar que una pregunta para adivinar. También puedes preguntar por tu forma de consultar: qué esperas, qué temes y qué límite quieres cuidar." }),
    QuestionTools(),
    el("fieldset", { className: "area-group" }, [
      el("legend", { text: "Área" }),
      renderChipOptions("area", AREAS, state.area)
    ]),
    el("details", { className: "advanced-options" }, [
      el("summary", { text: "Preparar la lectura" }),
      el("div", { className: "advanced-content" }, [
        renderChipField("emotionalState", "¿Cómo estás frente a esto?", EMOTIONAL_STATES, state.emotionalState),
        renderChipField("readingGoal", "¿Qué buscas de esta lectura?", READING_GOALS, state.readingGoal),
        renderChipField("situationType", "¿Qué forma tiene la situación?", SITUATION_TYPES, state.situationType),
        renderChipField("depth", "Profundidad", DEPTHS, state.depth),
        renderChipField("tone", "Tono", TONES, state.tone),
        el("label", { className: "field-label", text: "Fecha de nacimiento — opcional", attributes: { for: "birth-date" } }),
        birthDateInput,
        el("p", {
          className: "field-help",
          text: "Consentimiento opcional: se usa sólo en tu navegador para calcular una etapa vital amplia. El Worker no recibe la fecha exacta, no se guarda y puedes omitirla."
        })
      ])
    ]),
    el("p", {
      className: "privacy-note",
      text: `Puedes usar un alias. ${PRIVACY_NOTE}`
    })
  ];

  if (state.error) {
    children.push(el("p", {
      id: "form-error",
      className: "form-error",
      text: state.error,
      attributes: { role: "alert" }
    }));
  }

  children.push(el("button", {
    className: "primary-button",
    text: state.loading ? "Leyendo la imagen..." : "Iniciar lectura",
    disabled: state.loading,
    attributes: { type: "submit" }
  }));

  const form = el("form", { id: "question-form", className: "question-form" }, children);
  form.addEventListener("submit", handleSubmit);
  aliasInput.addEventListener("input", (event) => {
    state.alias = event.target.value;
  });
  textarea.addEventListener("input", (event) => {
    state.question = event.target.value;
  });
  birthDateInput.addEventListener("input", (event) => {
    state.birthDate = event.target.value;
  });
  form.querySelectorAll("input[type='radio']").forEach((input) => {
    input.addEventListener("change", handleOptionChange);
  });

  return form;
}

function renderChipField(name, legend, options, selectedValue) {
  return el("fieldset", { className: "area-group" }, [
    el("legend", { text: legend }),
    renderChipOptions(name, options, selectedValue)
  ]);
}

function QuestionTools() {
  const seedButton = el("button", {
    className: "secondary-button question-tool-button",
    text: "No sé cómo preguntar",
    attributes: { type: "button" }
  });
  const reframeButton = el("button", {
    className: "secondary-button question-tool-button",
    text: "Reformular mi pregunta",
    attributes: { type: "button" }
  });

  seedButton.addEventListener("click", () => {
    state = { ...state, question: QUESTION_SEEDS[pickRandomIndex(QUESTION_SEEDS.length)], error: "" };
    render();
    document.querySelector("#question")?.focus();
  });

  reframeButton.addEventListener("click", () => {
    state = { ...state, question: reframeQuestion(state.question), error: "" };
    render();
    document.querySelector("#question")?.focus();
  });

  return el("div", { className: "question-tools" }, [
    seedButton,
    reframeButton
  ]);
}

function renderChipOptions(name, options, selectedValue) {
  return el("div", { className: "area-options" }, options.map((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    const input = el("input", {
      checked: selectedValue === value,
      value,
      attributes: {
        type: "radio",
        name
      }
    });

    return el("label", { className: "area-pill" }, [
      input,
      el("span", { text: label })
    ]);
  }));
}

function handleOptionChange(event) {
  const { name, value } = event.target;
  const stateKeyByName = {
    area: "area",
    emotionalState: "emotionalState",
    readingGoal: "readingGoal",
    situationType: "situationType",
    depth: "depth",
    tone: "tone"
  };
  const stateKey = stateKeyByName[name];
  if (stateKey) {
    state = { ...state, [stateKey]: value };
  }
}

function getQuestionHelpMessage(question) {
  const normalized = String(question || "").trim();
  const placeholder = "¿Qué necesito comprender de esta situación?";

  if (!normalized || normalized === placeholder) {
    return "Escribe una pregunta breve. La carta necesita una escena para poder reflejar algo.";
  }

  const compact = normalized.replace(/[¿?¡!\s.]/g, "").toLowerCase();
  if (normalized.length < 12 || compact === "deberia" || compact === "debería") {
    return "Agrega un poco más de contexto: ¿debería qué?, ¿en relación con qué situación?";
  }

  return "";
}

function ReadingResult() {
  if (state.loading) {
    return el("section", {
      className: "result-panel result-panel--loading",
      attributes: { "aria-live": "polite", "aria-busy": "true" }
    }, [
      el("div", { className: "symbol-card skeleton-card" }),
      el("div", {}, [
        el("p", { className: "result-mode", text: "consulta en curso" }),
        el("h2", { text: "Ordenando la pregunta" }),
        el("p", { text: "La lectura está buscando una forma breve y simbólica de responder." })
      ])
    ]);
  }

  if (!state.result) {
    return el("section", { className: "empty-result", attributes: { "aria-live": "polite" } }, [
      el("p", { text: "Una carta no decide por ti: abre una conversación." })
    ]);
  }

  const result = state.result;
  const isCrisisResult = result.source === "seguridad-crisis";
  const card = result.card || {
    nombre: result.symbolicCard,
    numero: "",
    imagen: result.image,
    palabras: []
  };
  const sourceLabels = {
    "ia-real": "Modo: IA real vía Worker",
    "seguridad-crisis": "Modo: seguridad",
    "fallback-backend": "Modo: base simbólica segura",
    "fallback-local": "Modo: base local segura — sin IA",
    "connection-error": "Modo: conexión no disponible"
  };
  const source = sourceLabels[result.source] || "Modo: fallback local";
  const media = isCrisisResult ? null : el("figure", { className: "symbol-card" });

  if (media && card.imagen) {
    const image = el("img", {
      attributes: {
        src: card.imagen,
        alt: card.nombre,
        loading: "lazy"
      }
    });
    image.addEventListener("error", () => {
      image.remove();
      media.append(el("span", { text: card.nombre }));
    }, { once: true });
    media.append(image);
  } else if (media) {
    media.append(el("span", { text: card.nombre }));
  }

  if (media) {
    media.append(el("figcaption", { className: "card-caption" }, [
      el("span", { className: "card-number", text: card.numero }),
      el("span", { className: "card-name", text: card.nombre })
    ]));
  }

  const copyChildren = [
    el("p", { className: "result-mode", text: source }),
    result.fallbackNotice ? el("p", { className: "fallback-notice", text: result.fallbackNotice }) : null,
    el("h2", { text: result.title }),
    isCrisisResult ? null : el("p", { className: "symbol-name", text: card.numero ? `${card.numero} · ${card.nombre}` : card.nombre }),
    isCrisisResult ? null : renderKeywords(card.palabras),
    result.emotionalValidation ? el("p", { className: "reading-section", text: result.emotionalValidation }) : null,
    result.narrativeTension ? el("p", { className: "reading-section reading-section--tension", text: result.narrativeTension }) : null,
    result.symbolicTurn ? el("p", { className: "reading-section", text: result.symbolicTurn }) : null,
    el("p", { text: result.briefReading }),
    result.tarotPhrase ? el("p", { className: "tarot-phrase", text: result.tarotPhrase }) : null,
    result.agencyReturn ? el("p", { className: "reading-section", text: result.agencyReturn }) : null,
    el("p", { className: "soft-guidance", text: result.softGuidance }),
    result.symbolicAct ? el("p", { className: "symbolic-act", text: result.symbolicAct }) : null,
    el("p", { className: "integration-question", text: result.integrationQuestion }),
    el("p", { className: "result-note", text: result.ethicalNote }),
    UseBoundaryNote(),
    MethodPanel(result),
    ContactPanel(result)
  ];

  if (result.supportNote) {
    copyChildren.splice(4, 0, el("p", {
      className: "support-note",
      text: result.supportNote,
      attributes: { role: "note" }
    }));
  }

  return el("section", { className: isCrisisResult ? "result-panel result-panel--crisis" : "result-panel", attributes: { "aria-live": "polite" } }, [
    media,
    el("div", { className: "result-copy" }, copyChildren)
  ]);
}

function renderKeywords(words = []) {
  const validWords = Array.isArray(words) ? words.filter(Boolean).slice(0, 6) : [];
  if (!validWords.length) return null;

  return el("ul", { className: "card-keywords", attributes: { "aria-label": "Palabras simbólicas" } },
    validWords.map((word) => el("li", { text: word }))
  );
}

function UseBoundaryNote() {
  const text = state.readingCount >= 2
    ? "Tal vez ya hay suficiente material para mirar por ahora. Antes de volver a consultar, anota una decisión pequeña, una pregunta nueva o un límite que quieras cuidar."
    : "Antes de volver a consultar, escribe qué parte de la lectura quieres llevar a una acción pequeña o a una conversación real.";

  return el("p", { className: "use-boundary-note", text });
}

function EthicalNote() {
  return el("footer", { className: "ethical-note" }, [
    el("p", { text: ETHICAL_NOTE })
  ]);
}

function PrivacyPanel() {
  return el("section", { className: "privacy-panel" }, [
    el("p", { className: "kicker", text: "privacidad" }),
    el("h2", { text: "Sin historial ni cuenta" }),
    el("ul", {}, [
      el("li", { text: "No hay login, correo, WhatsApp ni perfil de usuario." }),
      el("li", { text: "No usamos analytics, cookies, localStorage ni sessionStorage para guardar lecturas." }),
      el("li", { text: "La fecha de nacimiento es opcional y no se envía: sólo se transforma en una etapa vital amplia." }),
      el("li", { text: "El prompt final se construye en backend; ninguna clave API vive en el frontend." })
    ])
  ]);
}

function MethodPanel(result) {
  if (result.source === "seguridad-crisis") return null;

  const providerText = result.source === "ia-real"
    ? "La redacción fue generada por IA en el Worker y revisada por filtros éticos locales."
    : result.source === "fallback-backend"
      ? "La respuesta se generó con una base simbólica local del Worker porque la IA no quedó disponible o no pasó revisión."
      : "La respuesta se generó con una base local de seguridad.";

  return el("details", { className: "method-panel" }, [
    el("summary", { text: "Cómo se construye esta lectura" }),
    el("ul", {}, [
      el("li", { text: "Fuente primaria: observación de imagen, número, postura, objetos y escena del Tarot de Marsella." }),
      el("li", { text: "Inspiración: tarología de Alejandro Jodorowsky y Tarot de Marsella, como síntesis transformada, no representación oficial." }),
      el("li", { text: "Interpretación técnica: eje simbólico, tensión narrativa, giro y devolución de agencia." }),
      el("li", { text: "Decisión de diseño: no predicción, no diagnóstico, no cartas invertidas, no dependencia." }),
      el("li", { text: providerText }),
      result.fallbackDetail ? el("li", { text: `Detalle técnico: ${result.fallbackDetail}` }) : null
    ])
  ]);
}

function ContactPanel(result) {
  if (result.source === "seguridad-crisis") {
    const copyHelpButton = el("button", {
      className: "primary-button copy-reading-button",
      text: "Copiar mensaje para pedir ayuda",
      attributes: { type: "button" }
    });
    copyHelpButton.addEventListener("click", copyHelpMessage);

    return el("section", { className: "contact-panel contact-panel--crisis" }, [
      el("h3", { text: "Pedir compañía ahora" }),
      el("p", { text: "Puedes enviar un mensaje breve a alguien cercano sin explicar todo de una vez." }),
      el("div", { className: "reading-actions" }, [copyHelpButton]),
      state.copyMessage ? el("p", { className: "copy-message", text: state.copyMessage }) : null
    ].filter(Boolean));
  }

  if (result.source === "connection-error") {
    const retryButton = el("button", {
      className: "primary-button copy-reading-button",
      text: "Reintentar lectura",
      attributes: { type: "button" }
    });
    const healthButton = el("button", {
      className: "secondary-button",
      text: "Probar conexión al Worker",
      attributes: { type: "button" }
    });
    retryButton.addEventListener("click", () => {
      const form = document.querySelector("#question-form");
      if (form) form.requestSubmit();
    });
    healthButton.addEventListener("click", () => {
      window.open(`${WORKER_HEALTH_URL}?from=page`, "_blank", "noopener,noreferrer");
    });

    return el("section", { className: "contact-panel" }, [
      el("h3", { text: "La lectura completa no se generó" }),
      el("p", { text: "Este aviso evita confundir una falla técnica con una interpretación simbólica." }),
      el("div", { className: "reading-actions" }, [retryButton]),
      el("div", { className: "contact-actions page-share-actions" }, [healthButton]),
      state.copyMessage ? el("p", { className: "copy-message", text: state.copyMessage }) : null
    ].filter(Boolean));
  }

  const sharePageButton = el("button", {
    className: "secondary-button",
    text: "Compartir este espacio",
    attributes: { type: "button" }
  });
  const copyLinkButton = el("button", {
    className: "secondary-button",
    text: "Copiar enlace",
    attributes: { type: "button" }
  });
  const copyButton = el("button", {
    className: "primary-button copy-reading-button",
    text: "Copiar lectura",
    attributes: { type: "button" }
  });
  sharePageButton.addEventListener("click", sharePage);
  copyLinkButton.addEventListener("click", copyPageLink);
  copyButton.addEventListener("click", () => copyReading(result));

  return el("section", { className: "contact-panel" }, [
    el("h3", { text: "Guardar esta lectura" }),
    el("p", { text: "Puedes copiarla para leerla con calma. No guardamos tu pregunta ni tu resultado." }),
    el("div", { className: "reading-actions" }, [copyButton]),
    el("div", { className: "page-share-block" }, [
      el("p", { text: "Compartir la página libre" }),
      el("div", { className: "contact-actions page-share-actions" }, [sharePageButton, copyLinkButton])
    ]),
    el("p", { className: "free-note-inline", text: FREE_ACCESS_NOTE }),
    state.copyMessage ? el("p", { className: "copy-message", text: state.copyMessage }) : null
  ].filter(Boolean));
}

async function copyHelpMessage() {
  const text = "Necesito compañía ahora. No estoy bien y prefiero no quedarme a solas con esto. ¿Puedes llamarme o acompañarme?";
  try {
    await navigator.clipboard.writeText(text);
    state = { ...state, copyMessage: "Mensaje de ayuda copiado." };
  } catch {
    state = { ...state, copyMessage: `No se pudo copiar automáticamente. Mensaje: ${text}` };
  }
  render();
}

async function copyReading(result) {
  const text = buildReadingCopy(result);
  try {
    await navigator.clipboard.writeText(text);
    state = { ...state, copyMessage: "Lectura copiada." };
  } catch {
    state = { ...state, copyMessage: "No se pudo copiar automáticamente. Selecciona el texto de la lectura para copiarlo." };
  }
  render();
}

async function sharePage() {
  const shareData = {
    title: "Tarot de Marsella Libre",
    text: "Un espacio gratuito de lectura simbólica. No preguntes qué va a pasar: pregunta qué necesitas mirar.",
    url: getPublicPageUrl()
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      state = { ...state, copyMessage: "Gracias por compartir la página." };
      render();
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  await copyPageLink();
}

async function copyPageLink() {
  try {
    await navigator.clipboard.writeText(getPublicPageUrl());
    state = { ...state, copyMessage: "Enlace copiado." };
  } catch {
    state = { ...state, copyMessage: `No se pudo copiar automáticamente. Enlace: ${getPublicPageUrl()}` };
  }
  render();
}

function getPublicPageUrl() {
  return "https://tarot-marsella-libre.pages.dev/";
}

function buildReadingCopy(result) {
  const card = result.card || {};
  return [
    result.title,
    card.nombre ? `Carta: ${card.numero ? `${card.numero} · ` : ""}${card.nombre}` : "",
    result.emotionalValidation,
    result.narrativeTension,
    result.symbolicTurn,
    result.briefReading,
    result.tarotPhrase,
    result.agencyReturn,
    result.softGuidance,
    result.symbolicAct,
    result.integrationQuestion,
    result.ethicalNote
  ].filter(Boolean).join("\n\n");
}

function render() {
  app.replaceChildren(
    el("main", { className: "app-shell" }, [
      Hero(),
      el("div", { className: "experience-grid" }, [
        QuestionForm(),
        ReadingResult()
      ]),
      Manifesto(),
      QuestionGuide(),
      PrivacyPanel(),
      EthicalNote()
    ])
  );
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const alias = String(form.get("alias") || "").trim();
  const question = String(form.get("question") || "").trim();
  const area = String(form.get("area") || "otro");
  const emotionalState = String(form.get("emotionalState") || "").trim();
  const readingGoal = String(form.get("readingGoal") || "claridad").trim();
  const situationType = String(form.get("situationType") || "").trim();
  const depth = String(form.get("depth") || "equilibrada").trim();
  const tone = String(form.get("tone") || "contenedor").trim();
  const birthDate = String(form.get("birthDate") || "").trim();
  const questionHelp = getQuestionHelpMessage(question);

  if (questionHelp) {
    state = { ...state, alias, question, area, emotionalState, readingGoal, situationType, depth, tone, birthDate, error: questionHelp };
    render();
    return;
  }

  state = {
    ...state,
    alias,
    question,
    area,
    emotionalState,
    readingGoal,
    situationType,
    depth,
    tone,
    birthDate,
    copyMessage: "",
    loading: true,
    error: "",
    result: null
  };
  render();

  const result = await requestTarotReading({ alias, question, area, emotionalState, readingGoal, situationType, depth, tone, birthDate });
  state = { ...state, loading: false, result, readingCount: state.readingCount + 1 };
  render();
}

export async function requestTarotReading(input) {
  const normalizedInput = normalizeInput(input);
  const riskText = [
    normalizedInput.question,
    normalizedInput.area,
    normalizedInput.emotionalState,
    normalizedInput.situationType
  ].join(" ");
  const risk = hasBasicRiskLanguage(riskText) || normalizedInput.area === "crisis";
  const urgent = hasUrgencyLanguage(riskText);
  const care = hasHighDistressLanguage(riskText);
  const predictive = hasPredictiveLanguage(riskText);
  const card = pickSymbolicCard();
  const payload = {
    alias: normalizedInput.alias,
    pregunta: normalizedInput.question,
    area: normalizedInput.area,
    estado_emocional: normalizedInput.emotionalState,
    busqueda: normalizedInput.readingGoal,
    tipo_situacion: normalizedInput.situationType,
    profundidad: normalizedInput.depth,
    tono: normalizedInput.tone,
    contexto_vital: normalizedInput.lifeStageContext,
    parametros: {
      version: "v2-personalizacion-minima",
      enfoque: "simbolico-no-predictivo"
    }
  };

  try {
    const data = await postWorkerReading(payload);
    try {
      return normalizeWorkerReading(data, normalizedInput, card);
    } catch (normalizeError) {
      normalizeError.kind = "normalize";
      normalizeError.workerData = data;
      throw normalizeError;
    }
  } catch (error) {
    console.info("Lectura IA no disponible.", error);
    if (risk || urgent || care || predictive) {
      return generateFallbackReading({ ...normalizedInput, card, risk, urgent, care, predictive });
    }
    if (error?.kind === "normalize") {
      return generateWorkerFormatFallback({ ...normalizedInput, card, error });
    }
    return generateConnectionFallback({ ...normalizedInput, card, error });
  }
}

async function postWorkerReading(payload) {
  const body = JSON.stringify(payload);
  const firstError = await postWorkerOnce(WORKER_URL, body).catch((error) => error);

  if (!(firstError instanceof Error)) {
    return firstError;
  }

  const retryUrl = `${WORKER_URL}?retry=${Date.now()}`;
  const secondError = await postWorkerOnce(retryUrl, body).catch((error) => error);

  if (!(secondError instanceof Error)) {
    return secondError;
  }

  secondError.firstError = firstError;
  throw secondError;
}

async function postWorkerOnce(url, body) {
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
    redirect: "follow",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const error = new Error(`Worker respondió con estado ${response.status}`);
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  return response.json();
}

function generateConnectionFallback(input) {
  const card = input.card || pickSymbolicCard();
  const status = input.error?.status || 0;
  const isRateLimit = status === 429;
  const title = isRateLimit
    ? "Hiciste varias lecturas muy seguidas"
    : "No pudimos conectar con la lectura completa";
  const briefReading = isRateLimit
    ? "El servicio recibió demasiadas solicitudes en poco tiempo. Espera alrededor de un minuto y vuelve a intentarlo."
    : "Puede ser una conexión temporalmente incompleta o una vista local sin acceso al servicio de lectura. Reintenta en unos segundos desde la página publicada.";
  const fallbackNotice = isRateLimit
    ? "Límite temporal de solicitudes. No se generó una lectura local."
    : "No se generó una lectura local para no confundir una falla de conexión con una interpretación simbólica.";
  const diagnostic = status
    ? `Estado técnico: Worker HTTP ${status}.`
    : `Estado técnico: sin respuesta HTTP del Worker (${input.error?.name || "error de red"}).`;
  console.info("[tarot] connection fallback", diagnostic, input.error);

  return {
    title,
    symbolicCard: `Carta simbólica: ${card.title}`,
    image: card.image,
    card: normalizeCard({
      id: slugify(card.title),
      nombre: card.title,
      numero: "",
      imagen: card.image,
      palabras: ["conexión", "pausa", "reintento"]
    }),
    emotionalValidation: isRateLimit
      ? "Tu pregunta quedó escrita, pero el sistema necesita una pausa breve para evitar abusos y mantener el servicio gratuito."
      : "Tu pregunta quedó escrita, pero esta vez la página no logró comunicarse con el Worker que construye la lectura completa.",
    narrativeTension: "Prefiero no disfrazar una falla técnica como si fuera una lectura simbólica real.",
    symbolicTurn: `${card.title} queda sólo como imagen de pausa mientras recuperamos la conexión.`,
    briefReading,
    softGuidance: "No se guardó tu pregunta. Puedes volver a enviarla cuando la conexión esté disponible.",
    agencyReturn: "La lectura completa debe venir del Worker; este mensaje sólo protege la claridad del proceso.",
    symbolicAct: "",
    integrationQuestion: "¿Puedes reintentar la lectura desde la página abierta en el navegador?",
    ethicalNote: ETHICAL_NOTE,
    fallbackNotice,
    fallbackDetail: diagnostic,
    source: "connection-error"
  };
}

function generateWorkerFormatFallback(input) {
  const card = input.card || pickSymbolicCard();
  const message = String(input.error?.message || "La respuesta no pudo normalizarse.").slice(0, 160);
  return {
    title: "El Worker respondió, pero la página no pudo mostrar la lectura",
    symbolicCard: `Carta simbólica: ${card.title}`,
    image: card.image,
    card: normalizeCard({
      id: slugify(card.title),
      nombre: card.title,
      numero: "",
      imagen: card.image,
      palabras: ["formato", "revisión", "reintento"]
    }),
    emotionalValidation: "La conexión con el Worker sí ocurrió, pero la página encontró un problema al preparar la lectura para mostrarla.",
    narrativeTension: "Prefiero mostrar este aviso antes que deformar una respuesta simbólica o presentarla incompleta.",
    symbolicTurn: `${card.title} queda como imagen de revisión: la lectura necesita volver a generarse con un formato más claro.`,
    briefReading: "Reintenta la lectura. Si vuelve a ocurrir, el problema está en el formato de respuesta o en un filtro local demasiado estricto, no en la conexión.",
    softGuidance: "No se guardó tu pregunta. Puedes volver a enviarla.",
    agencyReturn: "Este aviso protege la claridad del proceso: una lectura dudosa no debe hacerse pasar por respuesta final.",
    symbolicAct: "",
    integrationQuestion: "¿Puedes reintentar la lectura para pedir una respuesta estructurada nuevamente?",
    ethicalNote: ETHICAL_NOTE,
    fallbackNotice: `Diagnóstico: Worker respondió, error local de formato. ${message}`,
    source: "connection-error"
  };
}

export function generateFallbackReading(input) {
  const card = input.card || pickSymbolicCard();
  const alias = input.alias ? `${input.alias}, ` : "";
  const emotion = input.emotionalState || "no indicado";
  const goal = input.readingGoal || "claridad";
  const situation = input.situationType || "la situación";
  const area = areaLabel(input.area).toLowerCase();
  const questionSummary = summarizeQuestionForLocalFallback(input.question);
  const anchors = extractQuestionAnchors(input.question);
  const sensitiveThemes = detectSensitiveThemes(input.question);
  const anchorText = anchors.length
    ? `En tu relato aparecen puntos concretos —${anchors.join(", ")}— que conviene mirar sin reducirlos a una respuesta rápida.`
    : `En tu relato aparece una escena que necesita más precisión que una respuesta rápida.`;
  const careText = sensitiveThemes.length
    ? "Como también aparecen señales de cuerpo, angustia, recaída o exposición a contextos difíciles, esta lectura no reemplaza apoyo profesional ni una conversación humana segura."
    : "";

  if (input.urgent) {
    const crisisCard = normalizeCard({
      id: "la-templanza",
      nombre: "La Templanza",
      numero: "XIIII",
      imagen: "./cartas/la-templanza.jpg",
      palabras: ["pausa", "cuidado", "apoyo"]
    });
    return {
      title: "Pausa y apoyo cercano",
      symbolicCard: "Carta simbólica: La Templanza",
      image: crisisCard.imagen,
      card: crisisCard,
      briefReading: "Esta página no interpreta urgencias ni situaciones de riesgo como oráculo.",
      softGuidance: "Lo importante ahora es no quedar a solas con la carga de la pregunta.",
      supportNote: SUPPORT_NOTE,
      integrationQuestion: "¿Quién puede acompañarte en este momento concreto?",
      ethicalNote: ETHICAL_NOTE,
      source: "fallback-local"
    };
  }

  if (input.risk) {
    const riskCard = normalizeCard({
      id: "la-templanza",
      nombre: "La Templanza",
      numero: "XIIII",
      imagen: "./cartas/la-templanza.jpg",
      palabras: ["pausa", "cuidado", "apoyo"]
    });
    return {
      title: "Una pregunta para mirar con cuidado",
      symbolicCard: "Carta simbólica: La Templanza",
      image: riskCard.imagen,
      card: riskCard,
      briefReading: "Cuando una pregunta toca crisis o sufrimiento intenso, conviene bajar el tono simbólico y priorizar acompañamiento real.",
      softGuidance: "Puedes usar esta pausa para ordenar una frase simple sobre lo que necesitas contarle a alguien de confianza.",
      supportNote: SUPPORT_NOTE,
      integrationQuestion: "¿Qué sería útil decirle a una persona segura, sin adornarlo?",
      ethicalNote: ETHICAL_NOTE,
      source: "fallback-local"
    };
  }

  if (input.care) {
    return {
      title: "Una pausa con cuidado",
      symbolicCard: `Carta simbólica: ${card.title}`,
      image: card.image,
      card: normalizeCard({
        id: slugify(card.title),
        nombre: card.title,
        numero: "",
        imagen: card.image,
        palabras: ["pausa", "cuidado", "apoyo"]
      }),
      briefReading: "La pregunta trae angustia intensa, pero no aparece una señal explícita de riesgo inmediato. Por eso la lectura baja el tono: la carta puede servir como pausa, no como sostén principal.",
      softGuidance: "Si esta carga se vuelve difícil de sostener, puede ayudarte hablar con una persona segura o con apoyo profesional. No tienes que ordenar todo a solas para que la pregunta sea válida.",
      supportNote: CARE_NOTE,
      agencyReturn: "Lo que vuelve a tus manos ahora puede ser pequeño: nombrar lo que sientes, bajar una exigencia inmediata y elegir una persona o espacio donde puedas decirlo con claridad.",
      integrationQuestion: "¿Qué apoyo humano concreto haría esta hora un poco más acompañada?",
      ethicalNote: ETHICAL_NOTE,
      source: "fallback-local",
      alert: "cuidado"
    };
  }

  if (input.predictive) {
    return {
      title: "Reformular sin predecir",
      symbolicCard: `Carta simbólica: ${card.title}`,
      image: card.image,
      card: normalizeCard({
        id: slugify(card.title),
        nombre: card.title,
        numero: "",
        imagen: card.image,
        palabras: ["pregunta", "limite", "agencia"]
      }),
      briefReading: "La pregunta parece pedir una certeza sobre el futuro o sobre otra persona. Esta app no predice ni habla por alguien ausente.",
      softGuidance: "Puedes transformar la pregunta en algo más útil: qué señales sí puedes observar, qué límite necesitas cuidar y qué decisión pequeña depende de ti ahora.",
      supportNote: PREDICTIVE_NOTE,
      agencyReturn: "La carta no cierra el resultado: devuelve la atención a tu margen de acción.",
      integrationQuestion: "¿Qué parte de esta situación puedes observar sin convertirla en una predicción?",
      ethicalNote: ETHICAL_NOTE,
      source: "fallback-local",
      alert: "predictiva"
    };
  }

  return {
    title: `Pausa simbólica con ${card.title}`,
    symbolicCard: `Carta simbólica: ${card.title}`,
    image: card.image,
    card: normalizeCard({
      id: slugify(card.title),
      nombre: card.title,
      numero: "",
      imagen: card.image,
      palabras: ["imagen", "pregunta", "claridad"]
    }),
    reframedQuestion: `${alias}tu pregunta sobre ${area} puede mirarse desde ${emotion}, buscando ${goal}.`,
    consultantScene: `${alias}${questionSummary}`,
    emotionalValidation: `Tiene sentido que aparezca ${emotion}: no estás preguntando por una curiosidad liviana, sino por una escena donde cuerpo, deseo de avanzar, temor y cuidado necesitan ordenarse.`,
    narrativeTension: `La tensión no parece ser simplemente "${situation}". Parece estar entre volver a exponerte a una vida que deseas y reconocer que ciertos contextos también pueden reactivar lo que te desordena.`,
    symbolicTurn: `${card.title} no decide si quedarte o volver atrás. Propone mirar el ritmo: qué parte de la decisión necesita mezcla, pausa, compañía y límites antes de exigir una conclusión.`,
    briefReading: `${anchorText} ${card.phrase} En este modo local, la carta sólo ofrece una imagen breve: no resuelve la tensión, pero ayuda a separar esperanza, miedo, recaída, meta y cuidado concreto. ${careText}`,
    softGuidance: "Si la pregunta toca salud, consumo, angustia o recaídas, lo más lúcido no es decidir solo: es pensar la decisión con alguien confiable o profesional que pueda acompañar el proceso.",
    agencyReturn: "La carta te devuelve una posibilidad pequeña: no elegir entre esperanza y protección como enemigos, sino preguntar qué condiciones reales harían más habitable el lugar donde quieres construir tu vida.",
    symbolicAct: "Escribe dos columnas: lo que Santiago promete y lo que Santiago activa. Luego agrega una tercera: qué apoyo concreto necesitarías para no quedar solo frente a eso.",
    integrationQuestion: "¿Qué condición concreta tendría que existir para que avanzar no signifique volver a exponerte sin cuidado?",
    ethicalNote: ETHICAL_NOTE,
    fallbackNotice: "No hubo conexión con la IA del Worker. Esta es una lectura local básica y no reemplaza una lectura completa.",
    source: "fallback-local"
  };
}

function normalizeWorkerReading(data, input, card) {
  const isStructured = data && (
    "lectura" in data ||
    "orientacion" in data ||
    "pregunta_integracion" in data ||
    "imagen_simbolica" in data ||
    "modo" in data
  );

  if (isStructured) {
    const title = String(data?.titulo || "Lectura simbólica").trim();
    const responseCard = normalizeCard(data?.carta, {
      id: slugify(card.title),
      nombre: card.title,
      numero: "",
      imagen: card.image,
      palabras: ["imagen", "pregunta", "claridad"]
    });
    const symbolicImage = String(data?.imagen_simbolica || responseCard.nombre || `Carta simbólica: ${card.title}`).trim();
    const reading = prepareWorkerText(String(data?.lectura || "").trim());
    const guidance = prepareWorkerText(String(data?.orientacion || "Toma esta lectura como una imagen para pensar, no como una instrucción.").trim());
    const integration = prepareWorkerText(String(data?.pregunta_integracion || "¿Qué cambia en tu pregunta después de mirarla con esta imagen?").trim());
    const mode = String(data?.modo || "ia-real");
    const alert = data?.alerta === "crisis" ? "crisis" : null;
    const safetyNote = supportNoteForAlert(data?.alerta);

    if (alert === "crisis") {
      return {
        title: title || "Primero tu seguridad",
        reframedQuestion: "",
        consultantScene: "",
        emotionalValidation: "",
        narrativeTension: "",
        symbolicTurn: "",
        symbolicCard: "",
        image: "",
        card: null,
        briefReading: reading || "Lo que escribiste suena a un momento de riesgo o dolor muy intenso. Esta pagina no va a convertirlo en lectura de cartas.",
        tarotPhrase: "",
        agencyReturn: "",
        softGuidance: guidance || SUPPORT_NOTE,
        symbolicAct: "",
        supportNote: SUPPORT_NOTE,
        integrationQuestion: integration || "¿Puedes contactar ahora mismo a una persona o servicio de urgencia para no quedarte a solas con esto?",
        ethicalNote: String(data?.disclaimer || data?.notaEtica || data?.ethicalNote || ETHICAL_NOTE),
        source: "seguridad-crisis",
        alert: "crisis",
        area: input.area
      };
    }

    return {
      title,
      reframedQuestion: String(data?.pregunta_reformulada || "").trim(),
      consultantScene: prepareOptionalWorkerText(String(data?.escena_consultante || data?.sintesis || "").trim()),
      emotionalValidation: prepareOptionalWorkerText(String(data?.validacion_emocional || "").trim()),
      narrativeTension: prepareOptionalWorkerText(String(data?.tension_narrativa || data?.tension_o_contradiccion || "").trim()),
      symbolicTurn: prepareOptionalWorkerText(String(data?.giro_simbolico || data?.imagen_simbolica || "").trim()),
      symbolicCard: responseCard.nombre || symbolicImage,
      image: responseCard.imagen || String(data?.imagen || data?.image || ""),
      card: responseCard,
      briefReading: reading,
      tarotPhrase: String(data?.frase_tarologica || "").trim(),
      agencyReturn: prepareOptionalWorkerText(String(data?.devolucion_agencia || "").trim()),
      softGuidance: guidance,
      symbolicAct: prepareOptionalWorkerText(String(data?.acto_simbolico_opcional || "").trim()),
      supportNote: safetyNote,
      integrationQuestion: integration,
      ethicalNote: String(data?.disclaimer || data?.notaEtica || data?.ethicalNote || ETHICAL_NOTE),
      source: mode,
      alert: data?.alerta || null,
      area: input.area
    };
  }

  const text = prepareWorkerText(String(data?.text || data?.reading || "").trim());
  const title = String(data?.titulo || data?.title || "Lectura simbólica").trim();
  const guidance = String(data?.orientacion || data?.softGuidance || "").trim();
  const integration = String(data?.preguntaIntegracion || data?.integrationQuestion || "").trim();

  if (!text) {
    throw new Error("El Worker no devolvió una lectura usable.");
  }

  return {
    title,
    symbolicCard: String(data?.carta || data?.symbolicCard || `Carta simbólica: ${card.title}`),
    image: String(data?.imagen || data?.image || card.image),
    card: normalizeCard(data?.carta, {
      id: slugify(card.title),
      nombre: String(data?.carta || data?.symbolicCard || card.title),
      numero: "",
      imagen: String(data?.imagen || data?.image || card.image),
      palabras: ["imagen", "pregunta", "claridad"]
    }),
    briefReading: text,
    consultantScene: "",
    emotionalValidation: "",
    narrativeTension: "",
    symbolicTurn: "",
    agencyReturn: "",
    softGuidance: guidance || "Toma esta lectura como una imagen para pensar, no como una instrucción.",
    symbolicAct: "",
    integrationQuestion: integration || "¿Qué cambia en tu pregunta después de mirarla con esta imagen?",
    ethicalNote: String(data?.notaEtica || data?.ethicalNote || ETHICAL_NOTE),
    source: "ia-real",
    area: input.area
  };
}

function supportNoteForAlert(alert) {
  if (alert === "crisis") return SUPPORT_NOTE;
  if (alert === "cuidado") return CARE_NOTE;
  if (alert === "predictiva") return PREDICTIVE_NOTE;
  return "";
}

function prepareWorkerText(text) {
  if (!text) {
    return "La lectura no entregó contenido suficiente para este campo. Reintenta si necesitas una respuesta más completa.";
  }

  const cleaned = dedupeRepeatedSentences(sanitizeReadingText(text)
    .replace(/^querid[oa]\s+consultante,?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim());

  if (!cleaned) {
    return "La lectura fue filtrada por seguridad local. Reintenta para obtener una formulación más clara.";
  }

  if (cleaned.length <= 620) {
    return cleaned;
  }

  const clipped = cleaned.slice(0, 620);
  const lastSentence = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("?"),
    clipped.lastIndexOf("!")
  );
  const end = lastSentence > 240 ? lastSentence + 1 : 620;

  return `${clipped.slice(0, end).trim()} La lectura completa se mantiene como una referencia simbólica, no como una instrucción.`;
}

function prepareOptionalWorkerText(text) {
  if (!text) return "";
  return prepareWorkerText(text);
}

function sanitizeReadingText(text) {
  return String(text || "")
    .replace(/el destino ha hablado/gi, "la lectura propone una pausa")
    .replace(/tu futuro est[aá] escrito/gi, "tu futuro no está cerrado")
    .replace(/la carta revela tu verdad/gi, "la carta ofrece una imagen")
    .replace(/sanaci[oó]n energ[eé]tica/gi, "cuidado simbólico")
    .replace(/diagn[oó]stico espiritual/gi, "lectura simbólica")
    .replace(/el universo quiere decirte/gi, "una forma de mirar esto es")
    .replace(/vibraci[oó]n/gi, "tono")
    .replace(/energ[ií]a bloqueada/gi, "tensión")
    .replace(/canalizaci[oó]n/gi, "imagen simbólica")
    .replace(/respuesta definitiva/gi, "respuesta provisoria")
    .replace(/te dir[eé] si te ama/gi, "no puedo responder por otra persona")
    .replace(/esto cambiar[aá] tu vida/gi, "esto puede ayudarte a mirar mejor")
    .replace(/te va a pasar/gi, "podrías observar")
    .replace(/debes hacer/gi, "puedes considerar")
    .replace(/la carta anuncia/gi, "la carta propone mirar")
    .replace(/la carta dice que/gi, "la carta propone mirar")
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
    .replace(/\bla persona puede\b/gi, "puedes")
    .replace(/\bel consultante puede\b/gi, "puedes")
    .replace(/\bla persona\b/gi, "quien consulta")
    .replace(/\bel consultante\b/gi, "quien consulta");
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
      .filter((word) => word.length > 3)
      .slice(0, 14)
      .join(" ");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    kept.push(cleaned);
  }

  return kept.join(" ");
}

function normalizeInput(input) {
  const birthDate = String(input?.birthDate || "").trim();
  return {
    alias: String(input?.alias || "").trim().slice(0, 60),
    question: String(input?.question || "").trim().slice(0, 600),
    area: AREAS.some((area) => area.value === input?.area) ? input.area : "otro",
    emotionalState: EMOTIONAL_STATES.includes(input?.emotionalState) ? input.emotionalState : "",
    readingGoal: READING_GOALS.includes(input?.readingGoal) ? input.readingGoal : "claridad",
    situationType: SITUATION_TYPES.includes(input?.situationType) ? input.situationType : "",
    depth: DEPTHS.some((depth) => depth.value === input?.depth) ? input.depth : "equilibrada",
    tone: TONES.some((tone) => tone.value === input?.tone) ? input.tone : "contenedor",
    lifeStageContext: calculateLifeStageContext(birthDate)
  };
}

function summarizeQuestionForLocalFallback(question) {
  const text = String(question || "").replace(/\s+/g, " ").trim();
  if (!text) return "lo que traes todavía necesita una escena más concreta.";

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const summary = sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return `con lo que traes —${summary.slice(0, 260)}${summary.length > 260 ? "..." : ""}— aparece una escena que pide cuidado, no una sentencia.`;
}

function extractQuestionAnchors(question) {
  const text = normalizeForMatch(question);
  const candidates = [
    ["santiago", "Santiago"],
    ["quirihue", "Quirihue"],
    ["espalda", "dolor de espalda"],
    ["dorso", "dolor del cuerpo"],
    ["reca", "recaída"],
    ["exceso", "excesos"],
    ["angustia", "angustia"],
    ["temor", "temores"],
    ["psiquiatra", "ser psiquiatra"],
    ["objetivo", "objetivos"],
    ["meta", "metas"],
    ["decision", "decisión"],
    ["impulsiva", "impulso"],
    ["esperanza", "esperanza"],
    ["feliz", "vida feliz"]
  ];

  return [...new Set(
    candidates
      .filter(([needle]) => text.includes(needle))
      .map(([, label]) => label)
  )].slice(0, 7);
}

function detectSensitiveThemes(question) {
  const text = normalizeForMatch(question);
  const themes = [];

  if (/\b(dolor|duele|espalda|dorso|cuerpo|salud|sintoma|sintomas)\b/.test(text)) {
    themes.push("salud física");
  }

  if (/\b(reca|consumo|exceso|excesos|alcohol|droga|drogas|adiccion|adicciones)\b/.test(text)) {
    themes.push("recaída o consumo");
  }

  if (/\b(angustia|temor|temores|ansiedad|depresion|miedo|panico|recluido|reclusion)\b/.test(text)) {
    themes.push("angustia");
  }

  return [...new Set(themes)];
}

function calculateLifeStageContext(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;

  const birthDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hadBirthday) age -= 1;
  if (age < 13 || age > 110) return null;

  let etapa = "etapa adulta";
  if (age < 18) etapa = "adolescencia";
  else if (age < 26) etapa = "entrada a la adultez";
  else if (age < 36) etapa = "adultez temprana";
  else if (age < 51) etapa = "adultez media";
  else if (age < 66) etapa = "etapa de balance";
  else etapa = "etapa de transmisión y síntesis";

  return {
    etapa,
    fuente: "fecha_transformada_en_frontend",
    nota: "contexto amplio opcional; no se envía la fecha exacta"
  };
}

function normalizeCard(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : fallback;
  return {
    id: String(source.id || fallback.id || "").trim(),
    nombre: String(source.nombre || source.name || fallback.nombre || fallback.name || "Carta simbólica").trim(),
    numero: String(source.numero || source.number || fallback.numero || fallback.number || "").trim(),
    tipo: String(source.tipo || source.type || fallback.tipo || fallback.type || "mayor").trim(),
    imagen: String(source.imagen || source.image || fallback.imagen || fallback.image || "").trim(),
    palabras: Array.isArray(source.palabras || source.words)
      ? (source.palabras || source.words).map((word) => String(word).trim()).filter(Boolean)
      : Array.isArray(fallback.palabras || fallback.words)
        ? (fallback.palabras || fallback.words).map((word) => String(word).trim()).filter(Boolean)
        : []
  };
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function pickSymbolicCard() {
  return SYMBOLIC_CARDS[pickRandomIndex(SYMBOLIC_CARDS.length)];
}

function pickRandomIndex(length) {
  if (!length) return 0;

  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % length;
  }

  return Math.floor(Math.random() * length);
}

function hasBasicRiskLanguage(text) {
  return hasCrisisLanguage(text);
}

function hasUrgencyLanguage(text) {
  return hasCrisisLanguage(text);
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
  return /\b(que va a pasar|que pasara|va a volver|volvera|me ama|me quiere|me extrana|me ira bien|me va a ir bien|voy a ganar|ganare|me conviene invertir|saldra bien|tendre exito|se va a resolver|cuando ocurrira|cuando va a pasar|mi futuro|destino)\b/i.test(normalized);
}

function areaLabel(value) {
  return AREAS.find((area) => area.value === value)?.label || "Otro";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.info("Service worker no disponible.", error);
    });
  });
}

render();
registerServiceWorker();
