const SOURCE = {
  base: "Síntesis original inspirada en la tarología de Alejandro Jodorowsky, La vía del Tarot y el Tarot de Marsella.",
  nota: "No es cita literal ni representación oficial de Alejandro Jodorowsky."
};

export const SYMBOLIC_SOURCE_TAXONOMY = {
  fuente_primaria: "Observacion directa de imagen, numero, postura, objetos, direccion y escena visible del Tarot de Marsella.",
  investigacion_web: "Contexto contrastivo opcional; no reemplaza observacion de la carta ni se presenta como autoridad unica.",
  interpretacion_tecnica_tarot: "Lectura estructural propia de la app: eje, tension, desplazamiento narrativo y agencia.",
  jodorowsky_inspirado: "Sintesis transformada e indirecta inspirada en tarologia de Alejandro Jodorowsky y Tarot de Marsella; no cita ni representacion oficial.",
  numerologia_externa_app: "Capa opcional agregada por la app; nunca destino fijo ni diagnostico.",
  decision_diseno_programacion: "Reglas de seguridad, UX, tono, privacidad, fallback y no prediccion."
};

const ARCANA_RELATIONS = {
  potencia_y_realizacion: ["el-mago", "la-fuerza", "el-mundo"],
  saber_transmision_busqueda: ["la-papisa", "el-papa", "el-ermitano"],
  expresion_y_estructura: ["la-emperatriz", "el-emperador"],
  eleccion_direccion_medida: ["el-enamorado", "el-carro", "la-justicia"],
  ciclo_pausa_transformacion: ["la-rueda", "el-colgado", "arcano-sin-nombre"],
  regulacion_deseo_apertura: ["la-templanza", "el-diablo", "la-torre"],
  confianza_emocion_claridad: ["la-estrella", "la-luna", "el-sol"],
  llamado_integracion_umbral: ["el-juicio", "el-mundo", "el-loco"]
};

const ARCANA_SAFETY_NOTES = {
  "arcano-sin-nombre": {
    no_decir: ["muerte literal", "final inevitable", "castigo"],
    reformular_como: "limpieza, corte simbolico, renovacion y espacio para otra forma"
  },
  "la-torre": {
    no_decir: ["catastrofe", "desastre inevitable", "todo se derrumba"],
    reformular_como: "apertura de una estructura rigida, salida de presion acumulada"
  },
  "el-diablo": {
    no_decir: ["maldad", "carta mala", "condena", "posesion"],
    reformular_como: "deseo, atadura, materia, lucidez y fuerza vital que pide nombre"
  },
  "el-colgado": {
    no_decir: ["sacrificate", "aguanta todo", "quedate inmovil"],
    reformular_como: "pausa, perspectiva y cambio de angulo sin glorificar sufrimiento"
  },
  "la-luna": {
    no_decir: ["locura", "paranoia validada", "diagnostico emocional"],
    reformular_como: "emocion intensa, memoria, sueno, niebla y necesidad de distinguir hechos"
  },
  "el-enamorado": {
    no_decir: ["si te ama", "va a volver", "elige ya"],
    reformular_como: "ambivalencia, deseo, voces internas, vinculo y eleccion presente"
  }
};

const ARCANA_VISUAL_LENSES = {
  "el-loco": ["movimiento", "equipaje", "animal o impulso", "salida del marco"],
  "el-mago": ["mesa", "herramientas", "mano", "inicio practico"],
  "la-papisa": ["libro", "velo", "quietud", "saber en gestacion"],
  "la-emperatriz": ["escudo", "mirada frontal", "alas o expansion", "lenguaje"],
  "el-emperador": ["trono", "piernas", "escudo", "materia y limite"],
  "el-papa": ["mano que bendice", "dos figuras", "puente", "transmision"],
  "el-enamorado": ["tres figuras", "miradas cruzadas", "cupido", "eleccion afectiva"],
  "el-carro": ["vehiculo", "caballos", "corona", "direccion"],
  "la-justicia": ["balanza", "espada", "frontalidad", "medida"],
  "el-ermitano": ["lampara", "baston", "paso lento", "luz cercana"],
  "la-rueda": ["rueda", "eje", "figuras moviles", "ciclo"],
  "la-fuerza": ["boca del animal", "manos", "sombrero", "suavidad activa"],
  "el-colgado": ["suspension", "pierna cruzada", "manos ocultas", "perspectiva invertida"],
  "arcano-sin-nombre": ["guadana", "suelo", "restos", "limpieza"],
  "la-templanza": ["vasijas", "flujo", "alas", "ritmo"],
  "el-diablo": ["cadenas", "figura central", "materia", "deseo"],
  "la-torre": ["torre abierta", "figuras", "fuego o luz", "salida"],
  "la-estrella": ["agua", "desnudez", "estrellas", "gesto humilde"],
  "la-luna": ["agua", "animales", "torres", "noche"],
  "el-sol": ["dos figuras", "muro", "luz", "encuentro"],
  "el-juicio": ["angel", "llamada", "figuras emergentes", "despertar"],
  "el-mundo": ["mandorla", "cuatro esquinas", "figura central", "integracion"]
};

function relationFamiliesFor(id) {
  return Object.entries(ARCANA_RELATIONS)
    .filter(([, ids]) => ids.includes(id))
    .map(([familia, ids]) => ({
      familia,
      cartas_relacionadas: ids.filter((relatedId) => relatedId !== id)
    }));
}

export function buildExpandedSymbolicLayer(meaning, area = "otro") {
  if (!meaning) return null;

  return {
    version: "biblioteca-simbolica-v2",
    fuentes: SYMBOLIC_SOURCE_TAXONOMY,
    lentes_visuales: ARCANA_VISUAL_LENSES[meaning.id] || [],
    familias_narrativas: relationFamiliesFor(meaning.id),
    polaridades_no_predictivas: {
      potencia: meaning.eje_simbolico,
      tension: meaning.tension_narrativa,
      exceso_a_evitar: meaning.evitar,
      agencia: meaning.devolucion_agencia
    },
    seguridad_carta: ARCANA_SAFETY_NOTES[meaning.id] || {
      no_decir: meaning.evitar || [],
      reformular_como: "imagen simbolica no predictiva que devuelve agencia al consultante"
    },
    capa_area: {
      area,
      nota: meaning.areas?.[area] || meaning.areas?.otro || ""
    },
    uso_con_notas_externas: "Si existen notas de lectura de un libro o proyecto externo, usarlas solo como sintesis transformada: conceptos, no citas; nunca declarar metodo oficial."
  };
}

function areas(base) {
  return {
    amor: base.amor,
    trabajo: base.trabajo,
    decision: base.decision,
    familia: base.familia,
    creatividad: base.creatividad,
    animo: base.animo,
    crisis: base.crisis,
    otro: base.otro
  };
}

export const MARSEILLE_MAJOR_ARCANA_MEANINGS = [
  {
    id: "el-loco",
    nombre: "El Loco",
    numero: "sin número",
    tipo: "mayor",
    imagen: "/cartas/el-loco.jpg",
    palabras_clave: ["tránsito", "libertad", "impulso", "umbral"],
    escena_visual: "Una figura camina fuera de una forma estable, acompañada por una fuerza que lo empuja o lo despierta.",
    eje_simbolico: "Entrar en movimiento sin convertir el impulso en fuga ni la libertad en desorientación.",
    tension_narrativa: "La tensión aparece entre salir de lo conocido y saber qué parte del movimiento tiene sentido.",
    giro_simbolico: "La carta no exige partir: pregunta qué necesita moverse para que la vida no quede detenida.",
    devolucion_agencia: "El consultante puede distinguir entre impulso vivo, evasión y primer paso posible.",
    pregunta_integracion: "¿Qué movimiento pequeño abre aire sin romper lo que todavía necesita cuidado?",
    acto_simbolico_seguro: "Escribe una cosa que quieres dejar atrás y una que sí quieres llevar contigo.",
    evitar: ["presentarlo como irresponsabilidad", "prometer aventura", "ordenar abandonar", "romantizar la fuga"],
    areas: areas({
      amor: "Mirar si el vínculo necesita aire, distancia o una forma menos rígida de encuentro.",
      trabajo: "Observar deseo de cambio, cansancio de estructura o necesidad de probar otro modo de avanzar.",
      decision: "Distinguir entre salto impulsivo y primer movimiento consciente.",
      familia: "Ver qué mandato heredado pesa y qué movimiento propio empieza a aparecer.",
      creatividad: "Dar permiso a una exploración inicial sin exigir resultado inmediato.",
      animo: "Reconocer una necesidad de movimiento sin convertirla en obligación.",
      crisis: "Bajar intensidad y buscar apoyo real antes de actuar desde desborde.",
      otro: "Preguntar qué quiere moverse y qué necesita permanecer protegido."
    }),
    fuente: SOURCE
  },
  {
    id: "el-mago",
    nombre: "El Mago",
    numero: "I",
    tipo: "mayor",
    imagen: "/cartas/el-mago.jpg",
    palabras_clave: ["inicio", "herramienta", "posibilidad", "elección"],
    escena_visual: "Una mesa con herramientas disponibles ante una figura que todavía está aprendiendo a usarlas.",
    eje_simbolico: "Pasar de la idea dispersa al gesto concreto que permite comenzar.",
    tension_narrativa: "La tensión está entre tener recursos y no saber aún cuál activar primero.",
    giro_simbolico: "La carta no pide resolver todo: propone mirar qué herramienta real ya está sobre la mesa.",
    devolucion_agencia: "El consultante puede elegir una acción mínima para probar la dirección antes de definirse por completo.",
    pregunta_integracion: "¿Qué herramienta concreta tienes hoy para ensayar un primer paso?",
    acto_simbolico_seguro: "Nombra tres recursos disponibles y elige uno para una prueba pequeña de veinte minutos.",
    evitar: ["prometer éxito", "confundir inicio con garantía", "exigir productividad", "inflar el control"],
    areas: areas({
      amor: "Mirar cómo se inicia una conversación o un gesto sincero sin exigir respuesta total.",
      trabajo: "Identificar recursos concretos, habilidades y una prueba pequeña antes de decidir.",
      decision: "Elegir un primer ensayo en lugar de buscar certeza completa.",
      familia: "Buscar una palabra o gesto simple que abra diálogo sin imponerlo.",
      creatividad: "Pasar de imaginar a tocar una herramienta, escribir una línea o hacer un boceto.",
      animo: "Recuperar capacidad de acción en una escala pequeña y posible.",
      crisis: "No resolver en soledad; usar el recurso más inmediato: pedir apoyo humano.",
      otro: "Ver qué posibilidad ya existe en forma de recurso, contacto, palabra o gesto."
    }),
    fuente: SOURCE
  },
  {
    id: "la-papisa",
    nombre: "La Papisa",
    numero: "II",
    tipo: "mayor",
    imagen: "/cartas/la-papisa.jpg",
    palabras_clave: ["silencio", "maduración", "estudio", "interioridad"],
    escena_visual: "Una figura sentada sostiene un libro cerrado o semiabierto, guardando un saber que aún madura.",
    eje_simbolico: "Respetar el tiempo de comprensión sin convertir la pausa en inmovilidad.",
    tension_narrativa: "La tensión aparece entre querer hablar o decidir y necesitar leer mejor lo que ya está escrito en la experiencia.",
    giro_simbolico: "La carta propone escuchar lo no dicho antes de producir una respuesta.",
    devolucion_agencia: "El consultante puede darse permiso para observar, estudiar y nombrar sin precipitarse.",
    pregunta_integracion: "¿Qué dato silencioso de la situación todavía no has leído con calma?",
    acto_simbolico_seguro: "Anota lo que sabes, lo que sospechas y lo que falta confirmar, en tres columnas.",
    evitar: ["volverla pasividad", "misticismo cerrado", "secreto fatal", "silenciar necesidades urgentes"],
    areas: areas({
      amor: "Observar lo no dicho, los tiempos internos y lo que necesita madurar antes de conversar.",
      trabajo: "Revisar información, contratos, aprendizajes o procesos antes de moverse.",
      decision: "Separar intuición, evidencia y miedo sin apurar conclusión.",
      familia: "Escuchar silencios y lealtades sin convertirlos en sentencia.",
      creatividad: "Permitir investigación, lectura y gestación antes de exponer la obra.",
      animo: "Validar la necesidad de recogimiento sin aislarse de apoyos reales.",
      crisis: "Priorizar contacto humano si el silencio se vuelve encierro o riesgo.",
      otro: "Mirar qué parte de la pregunta necesita lectura lenta."
    }),
    fuente: SOURCE
  },
  {
    id: "la-emperatriz",
    nombre: "La Emperatriz",
    numero: "III",
    tipo: "mayor",
    imagen: "/cartas/la-emperatriz.jpg",
    palabras_clave: ["creación", "expresión", "lenguaje", "fertilidad"],
    escena_visual: "Una figura frontal irradia lenguaje, imaginación y fuerza de expresión en expansión.",
    eje_simbolico: "Dar forma visible a una idea sin confundir expresión con desborde.",
    tension_narrativa: "La tensión está entre imaginar mucho y encontrar una forma clara para comunicarlo.",
    giro_simbolico: "La carta lleva la pregunta hacia lo que quiere nacer en palabras, imagen o gesto.",
    devolucion_agencia: "El consultante puede probar una forma expresiva concreta antes de pedir aprobación externa.",
    pregunta_integracion: "¿Qué necesita ser expresado con más forma y menos ruido?",
    acto_simbolico_seguro: "Escribe la idea en una frase simple y elimina todo lo que busque impresionar.",
    evitar: ["prometer fertilidad literal", "exigir exposición", "idealizar carisma", "confundir creación con obligación"],
    areas: areas({
      amor: "Mirar cómo se expresa deseo, afecto o malestar sin actuarlo de forma confusa.",
      trabajo: "Dar forma comunicable a una idea, propuesta o proyecto.",
      decision: "Preguntar qué opción permite expresar mejor lo que está vivo.",
      familia: "Nombrar una necesidad propia sin convertirla en ataque.",
      creatividad: "Pasar de potencia imaginativa a una pieza concreta y compartible.",
      animo: "Reconocer deseo de expresión como señal de vida, sin exigirse brillo.",
      crisis: "Si hay desborde, bajar estímulos y buscar compañía antes de interpretar.",
      otro: "Ver qué quiere tomar forma clara en la pregunta."
    }),
    fuente: SOURCE
  },
  {
    id: "el-emperador",
    nombre: "El Emperador",
    numero: "IIII",
    tipo: "mayor",
    imagen: "/cartas/el-emperador.jpg",
    palabras_clave: ["estructura", "materia", "límite", "estabilidad"],
    escena_visual: "Una figura asentada sostiene una posición concreta, apoyada en materia, límite y presencia.",
    eje_simbolico: "Convertir una intención en estructura sin endurecerla hasta volverla prisión.",
    tension_narrativa: "La tensión aparece entre necesitar sostén y temer que el límite quite movimiento.",
    giro_simbolico: "La carta pregunta qué estructura mínima permitiría cuidar lo importante.",
    devolucion_agencia: "El consultante puede ordenar tiempos, límites y recursos antes de decidir desde presión.",
    pregunta_integracion: "¿Qué límite concreto protegería mejor esta situación?",
    acto_simbolico_seguro: "Dibuja un cuadrado y escribe dentro sólo lo que sí puedes sostener esta semana.",
    evitar: ["autoritarismo", "mandatos rígidos", "confundir límite con control", "prometer estabilidad total"],
    areas: areas({
      amor: "Mirar acuerdos, límites y presencia concreta más que promesas vagas.",
      trabajo: "Ordenar recursos, responsabilidades, plazos y condiciones materiales.",
      decision: "Elegir desde lo sostenible, no desde fantasía o presión.",
      familia: "Distinguir cuidado, autoridad, límite y control.",
      creatividad: "Dar horario, formato o contorno a una idea para que exista.",
      animo: "Buscar suelo: rutina pequeña, cuerpo, descanso y apoyo práctico.",
      crisis: "Priorizar seguridad concreta y ayuda externa antes de cualquier símbolo.",
      otro: "Preguntar qué estructura haría la escena más habitable."
    }),
    fuente: SOURCE
  },
  {
    id: "el-papa",
    nombre: "El Papa",
    numero: "V",
    tipo: "mayor",
    imagen: "/cartas/el-papa.jpg",
    palabras_clave: ["puente", "escucha", "transmisión", "sentido"],
    escena_visual: "Una figura media entre niveles distintos, escuchando y transmitiendo una orientación.",
    eje_simbolico: "Buscar sentido compartido sin entregar la propia autoridad interior.",
    tension_narrativa: "La tensión está entre pedir guía y no volverse dependiente de una voz externa.",
    giro_simbolico: "La carta invita a encontrar una mediación: conversación, aprendizaje o consejo que no sustituya tu criterio.",
    devolucion_agencia: "El consultante puede pedir orientación y conservar la decisión en sus propias manos.",
    pregunta_integracion: "¿Qué conversación podría ayudarte sin reemplazar tu responsabilidad?",
    acto_simbolico_seguro: "Escribe una pregunta para alguien confiable y otra para ti mismo antes de hablar.",
    evitar: ["moralizar", "dar sermones", "presentar autoridad absoluta", "crear dependencia"],
    areas: areas({
      amor: "Abrir conversación honesta o pedir mediación sin imponer doctrina.",
      trabajo: "Buscar mentoría, criterio técnico o transmisión de experiencia.",
      decision: "Escuchar consejo y distinguirlo de obediencia.",
      familia: "Revisar mandatos, creencias y diálogos posibles entre generaciones.",
      creatividad: "Aprender de una tradición sin copiarla ni quedar encerrado en ella.",
      animo: "Recordar que pedir apoyo puede ser un acto de agencia.",
      crisis: "Buscar ayuda humana y profesional si la carga supera lo simbólico.",
      otro: "Preguntar qué puente de sentido falta construir."
    }),
    fuente: SOURCE
  },
  {
    id: "el-enamorado",
    nombre: "El Enamorado",
    numero: "VI",
    tipo: "mayor",
    imagen: "/cartas/el-enamorado.jpg",
    palabras_clave: ["vínculo", "deseo", "elección", "ambivalencia"],
    escena_visual: "Varias figuras forman una escena de elección donde deseo, mirada ajena y voz propia se cruzan.",
    eje_simbolico: "Reconocer una elección afectiva o vital sin reducirla a sí o no inmediato.",
    tension_narrativa: "La tensión aparece entre deseo, aprobación, miedo a perder y necesidad de elegir con presencia.",
    giro_simbolico: "La carta no decide por el corazón: muestra que la elección ya vive en una red de vínculos.",
    devolucion_agencia: "El consultante puede nombrar qué desea, qué teme y qué parte decide por costumbre.",
    pregunta_integracion: "¿Qué voz dentro de ti queda menos escuchada cuando intentas elegir?",
    acto_simbolico_seguro: "Escribe tres voces de la situación: deseo, miedo y cuidado. No elijas todavía; escúchalas.",
    evitar: ["decir si alguien ama", "romantizar dependencia", "forzar elección", "prometer pareja"],
    areas: areas({
      amor: "Explorar deseo, ambivalencia, elección y conversación sin adivinación sentimental.",
      trabajo: "Mirar opciones, alianzas y presión de aprobación externa.",
      decision: "Separar deseo propio, expectativa ajena y miedo a equivocarse.",
      familia: "Observar lealtades afectivas que influyen en una elección.",
      creatividad: "Elegir una dirección expresiva entre varias voces internas.",
      animo: "Validar ambivalencia sin convertirla en defecto.",
      crisis: "No decidir desde urgencia; buscar apoyo si la ambivalencia se vuelve riesgo.",
      otro: "Mirar qué vínculo o elección organiza la pregunta."
    }),
    fuente: SOURCE
  },
  {
    id: "el-carro",
    nombre: "El Carro",
    numero: "VII",
    tipo: "mayor",
    imagen: "/cartas/el-carro.jpg",
    palabras_clave: ["avance", "dirección", "decisión", "salida"],
    escena_visual: "Una figura avanza en un vehículo que necesita dirección para no dispersarse.",
    eje_simbolico: "Moverse con dirección sin confundir avance con huida.",
    tension_narrativa: "La tensión está entre querer salir rápido y necesitar conducir fuerzas que tiran en direcciones distintas.",
    giro_simbolico: "La carta pregunta qué dirección concreta vuelve útil la energía disponible.",
    devolucion_agencia: "El consultante puede elegir un trayecto acotado y revisar si lo acerca a su centro.",
    pregunta_integracion: "¿Hacia dónde avanzas si no necesitas demostrar nada?",
    acto_simbolico_seguro: "Escribe un destino de corto plazo y una condición para detenerte a revisar.",
    evitar: ["triunfalismo", "prometer victoria", "empujar decisiones bruscas", "glorificar prisa"],
    areas: areas({
      amor: "Ver si la relación avanza por deseo, presión o necesidad de escapar.",
      trabajo: "Ordenar dirección, metas y ritmo de avance posible.",
      decision: "Elegir un movimiento verificable en vez de una definición total.",
      familia: "Salir de un patrón sin cortar desde rabia si no es necesario.",
      creatividad: "Llevar una idea al mundo con dirección y límite.",
      animo: "Usar energía disponible en un paso concreto y medible.",
      crisis: "Detener velocidad y buscar apoyo antes de actuar impulsivamente.",
      otro: "Mirar qué salida tiene sentido y cuál es sólo descarga."
    }),
    fuente: SOURCE
  },
  {
    id: "la-justicia",
    nombre: "La Justicia",
    numero: "VIII",
    tipo: "mayor",
    imagen: "/cartas/la-justicia.jpg",
    palabras_clave: ["medida", "claridad", "equilibrio", "responsabilidad"],
    escena_visual: "Una figura frontal sostiene medida y corte, mirando la situación sin adornarla.",
    eje_simbolico: "Buscar proporción entre deseo, límite, responsabilidad y consecuencia.",
    tension_narrativa: "La tensión aparece entre querer alivio y aceptar la medida real de lo que ocurre.",
    giro_simbolico: "La carta no juzga: propone mirar qué necesita precisión para no confundir justicia con dureza.",
    devolucion_agencia: "El consultante puede nombrar hechos, límites y responsabilidades sin condenarse.",
    pregunta_integracion: "¿Qué sería justo mirar con precisión, sin exagerar ni minimizar?",
    acto_simbolico_seguro: "Haz dos listas: hechos observables y suposiciones. Trabaja sólo con la primera por un momento.",
    evitar: ["sentenciar", "culpar", "dar consejo legal", "hablar de castigo"],
    areas: areas({
      amor: "Mirar reciprocidad, acuerdos, límites y hechos, no sólo intensidad.",
      trabajo: "Ordenar responsabilidades, condiciones y límites concretos.",
      decision: "Distinguir lo justo, lo posible y lo deseado.",
      familia: "Nombrar responsabilidades sin convertirlas en culpa eterna.",
      creatividad: "Revisar forma, proporción y criterio de edición.",
      animo: "Separar autocrítica útil de juicio destructivo.",
      crisis: "Si hay riesgo o daño, priorizar ayuda y seguridad concretas.",
      otro: "Buscar medida y claridad en una escena confusa."
    }),
    fuente: SOURCE
  },
  {
    id: "el-ermitano",
    nombre: "El Ermitaño",
    numero: "VIIII",
    tipo: "mayor",
    imagen: "/cartas/el-ermitano.jpg",
    palabras_clave: ["búsqueda", "prudencia", "tiempo", "mirada"],
    escena_visual: "Una figura avanza lentamente con una lámpara, iluminando sólo el tramo cercano.",
    eje_simbolico: "Aceptar un ritmo lento que permite ver mejor sin aislarse de la vida.",
    tension_narrativa: "La tensión está entre necesitar respuesta y sólo poder iluminar el próximo paso.",
    giro_simbolico: "La carta cambia la pregunta de 'todo el camino' a 'el tramo que puedo ver ahora'.",
    devolucion_agencia: "El consultante puede bajar escala, mirar señales pequeñas y elegir con prudencia.",
    pregunta_integracion: "¿Qué parte cercana del camino sí puedes iluminar hoy?",
    acto_simbolico_seguro: "Apaga distracciones cinco minutos y escribe una observación concreta, no una conclusión.",
    evitar: ["idealizar aislamiento", "volverlo soledad obligatoria", "prometer sabiduría", "demorar por miedo"],
    areas: areas({
      amor: "Tomar distancia para ver sin castigar ni desaparecer.",
      trabajo: "Revisar experiencia, timing y señales antes de avanzar.",
      decision: "Aceptar una decisión por etapas cuando no hay visión total.",
      familia: "Observar patrones antiguos con calma y sin acusación inmediata.",
      creatividad: "Investigar, corregir y madurar una obra sin apurar exposición.",
      animo: "Distinguir pausa nutritiva de aislamiento riesgoso.",
      crisis: "No quedarse solo si hay riesgo; la lámpara puede ser una persona de apoyo.",
      otro: "Bajar la pregunta al próximo paso visible."
    }),
    fuente: SOURCE
  },
  {
    id: "la-rueda",
    nombre: "La Rueda de la Fortuna",
    numero: "X",
    tipo: "mayor",
    imagen: "/cartas/la-rueda.jpg",
    palabras_clave: ["ciclo", "giro", "cambio", "tránsito"],
    escena_visual: "Una rueda muestra movimiento, ciclos y posiciones que cambian sin volverse destino fijo.",
    eje_simbolico: "Reconocer un ciclo en movimiento y encontrar dónde participar sin controlar todo.",
    tension_narrativa: "La tensión aparece entre repetir una vuelta conocida y abrir un giro más consciente.",
    giro_simbolico: "La carta pregunta qué parte del ciclo puede girar si introduces un gesto distinto.",
    devolucion_agencia: "El consultante puede observar patrones, ritmos y puntos de intervención concretos.",
    pregunta_integracion: "¿Qué repetición reconoces y qué gesto pequeño podría cambiar el giro?",
    acto_simbolico_seguro: "Dibuja un círculo y marca dónde estás: inicio, repetición, cansancio, apertura o cierre.",
    evitar: ["hablar de suerte fija", "predicción de cambios", "fatalismo", "azar mágico"],
    areas: areas({
      amor: "Mirar ciclos repetidos del vínculo y posibilidades de interrupción consciente.",
      trabajo: "Observar ritmos, oportunidades y repeticiones de proceso.",
      decision: "Elegir dónde intervenir en un ciclo, no controlarlo completo.",
      familia: "Reconocer patrones heredados sin darlos por destino.",
      creatividad: "Aprovechar un giro de etapa para variar método o formato.",
      animo: "Recordar que un estado se mueve, sin prometer alivio inmediato.",
      crisis: "Si el ciclo se vuelve riesgoso, pedir ayuda concreta para salir de la repetición.",
      otro: "Leer la pregunta como parte de una vuelta mayor."
    }),
    fuente: SOURCE
  },
  {
    id: "la-fuerza",
    nombre: "La Fuerza",
    numero: "XI",
    tipo: "mayor",
    imagen: "/cartas/la-fuerza.jpg",
    palabras_clave: ["instinto", "suavidad", "coraje", "cuerpo"],
    escena_visual: "Una figura se relaciona con una fuerza animal sin destruirla ni someterse a ella.",
    eje_simbolico: "Dialogar con el instinto para que la fuerza no se vuelva violencia ni represión.",
    tension_narrativa: "La tensión está entre controlar demasiado y dejar que el impulso tome toda la escena.",
    giro_simbolico: "La carta propone fuerza como presencia suave, no como dominio.",
    devolucion_agencia: "El consultante puede reconocer energía disponible y darle cauce consciente.",
    pregunta_integracion: "¿Qué fuerza interna necesita ser escuchada sin dejar que conduzca sola?",
    acto_simbolico_seguro: "Respira tres veces y nombra en voz baja una emoción corporal antes de responder o decidir.",
    evitar: ["mandar controlar emociones", "romantizar agresividad", "diagnosticar cuerpo", "prometer valentía"],
    areas: areas({
      amor: "Mirar deseo, rabia, ternura y límite como fuerzas que necesitan lenguaje.",
      trabajo: "Usar coraje y constancia sin forzar el cuerpo ni avasallar.",
      decision: "Preguntar qué opción integra instinto y cuidado.",
      familia: "Nombrar fuerza emocional sin convertirla en ataque.",
      creatividad: "Dar cauce a una potencia expresiva primaria.",
      animo: "Reconocer que la fuerza puede ser suave, no espectacular.",
      crisis: "Si hay riesgo de hacerse daño o dañar, buscar apoyo inmediato.",
      otro: "Observar qué impulso necesita cauce."
    }),
    fuente: SOURCE
  },
  {
    id: "el-colgado",
    nombre: "El Colgado",
    numero: "XII",
    tipo: "mayor",
    imagen: "/cartas/el-colgado.jpg",
    palabras_clave: ["pausa", "perspectiva", "entrega", "suspensión"],
    escena_visual: "Una figura suspendida mira el mundo desde otro ángulo, sin avanzar por fuerza.",
    eje_simbolico: "Aceptar una pausa fértil sin convertirla en sacrificio inútil.",
    tension_narrativa: "La tensión aparece entre querer actuar y descubrir que la escena pide otro punto de vista.",
    giro_simbolico: "La carta desplaza la pregunta: no qué hacer ya, sino qué se ve desde la suspensión.",
    devolucion_agencia: "El consultante puede usar la pausa para cambiar mirada, no para desaparecer.",
    pregunta_integracion: "¿Qué ves distinto si dejas de empujar por un momento?",
    acto_simbolico_seguro: "Escribe una decisión pendiente y posponla veinticuatro horas si no es urgente.",
    evitar: ["idealizar sufrimiento", "pedir sacrificios", "bloquear acción necesaria", "culpar por detenerse"],
    areas: areas({
      amor: "Mirar qué se comprende al dejar de perseguir una respuesta inmediata.",
      trabajo: "Revisar si una pausa estratégica evita repetir un esfuerzo inútil.",
      decision: "Suspender el sí/no para mirar el marco completo.",
      familia: "Dejar de ocupar siempre el mismo lugar en la escena.",
      creatividad: "Cambiar perspectiva, formato o método antes de forzar producción.",
      animo: "Distinguir descanso de abandono de uno mismo.",
      crisis: "Si la pausa es hundimiento o riesgo, buscar apoyo real ahora.",
      otro: "Preguntar qué revela la situación cuando no se la fuerza."
    }),
    fuente: SOURCE
  },
  {
    id: "arcano-sin-nombre",
    nombre: "El Arcano sin Nombre",
    numero: "XIII",
    tipo: "mayor",
    imagen: "/cartas/arcano-sin-nombre.jpg",
    palabras_clave: ["corte", "limpieza", "transformación", "renovación"],
    escena_visual: "Una figura realiza una limpieza radical del terreno para que otra forma pueda aparecer.",
    eje_simbolico: "Cortar lo agotado sin convertir la transformación en amenaza.",
    tension_narrativa: "La tensión aparece entre conservar una forma conocida y permitir que algo se reorganice.",
    giro_simbolico: "La carta no anuncia pérdida: pregunta qué necesita despejarse para que haya vida disponible.",
    devolucion_agencia: "El consultante puede distinguir qué terminó, qué duele y qué aún puede regenerarse.",
    pregunta_integracion: "¿Qué forma agotada pide ser soltada para no seguir ocupando todo el espacio?",
    acto_simbolico_seguro: "Tacha en un papel una frase vieja que ya no quieres repetir y escribe una más honesta.",
    evitar: ["asustar", "hablar de muerte literal", "forzar rupturas", "presentar castigo"],
    areas: areas({
      amor: "Mirar hábitos agotados, cierres necesarios o formas nuevas de vínculo.",
      trabajo: "Eliminar tareas, proyectos o acuerdos que ya no sostienen vida útil.",
      decision: "Preguntar qué queda si se retira lo que ya no funciona.",
      familia: "Cortar repeticiones sin negar afectos ni complejidad.",
      creatividad: "Editar, limpiar y permitir que una obra pierda lo innecesario.",
      animo: "Nombrar cansancio de una forma vieja sin convertirlo en identidad.",
      crisis: "No tomar decisiones radicales en riesgo; buscar apoyo inmediato.",
      otro: "Mirar qué limpieza simbólica devuelve espacio."
    }),
    fuente: SOURCE
  },
  {
    id: "la-templanza",
    nombre: "La Templanza",
    numero: "XIIII",
    tipo: "mayor",
    imagen: "/cartas/la-templanza.jpg",
    palabras_clave: ["mezcla", "ritmo", "cuidado", "circulación"],
    escena_visual: "Una figura trasvasa entre recipientes, regulando flujo, proporción y continuidad.",
    eje_simbolico: "Encontrar un ritmo de intercambio que cuide sin estancar.",
    tension_narrativa: "La tensión aparece entre extremos: exceso y falta, prisa y demora, aislamiento y contacto.",
    giro_simbolico: "La carta propone regular el flujo antes de decidir desde saturación.",
    devolucion_agencia: "El consultante puede ajustar ritmo, dosis y comunicación sin exigir solución total.",
    pregunta_integracion: "¿Qué necesita circular con más cuidado y mejor medida?",
    acto_simbolico_seguro: "Escribe dos extremos de la situación y una medida intermedia posible esta semana.",
    evitar: ["prometer sanación", "hablar de energía", "pedir aguantar todo", "neutralizar conflictos reales"],
    areas: areas({
      amor: "Regular comunicación, tiempos, cercanía y distancia.",
      trabajo: "Buscar ritmo sostenible entre exigencia, descanso y colaboración.",
      decision: "Probar una vía intermedia antes de polarizar opciones.",
      familia: "Facilitar intercambio sin cargar con todo.",
      creatividad: "Mezclar materiales, tonos o etapas con paciencia.",
      animo: "Bajar intensidad y cuidar ritmo cotidiano sin aislarse.",
      crisis: "Priorizar apoyo humano, respiración y compañía; no interpretar urgencias como destino.",
      otro: "Mirar qué flujo necesita cuidado."
    }),
    fuente: SOURCE
  },
  {
    id: "el-diablo",
    nombre: "El Diablo",
    numero: "XV",
    tipo: "mayor",
    imagen: "/cartas/el-diablo.jpg",
    palabras_clave: ["deseo", "materia", "atadura", "lucidez"],
    escena_visual: "Una figura central reúne deseo, materia y zonas menos domesticadas de la experiencia.",
    eje_simbolico: "Mirar aquello que ata, seduce o concentra fuerza vital sin convertirlo en condena.",
    tension_narrativa: "La tensión suele aparecer entre impulso y conciencia, deseo y dependencia, vitalidad y repetición.",
    giro_simbolico: "La carta no condena el deseo: invita a verlo con lucidez para que deje de actuar a oscuras.",
    devolucion_agencia: "El consultante puede distinguir qué parte de la situación tiene vida propia y qué parte lo captura.",
    pregunta_integracion: "¿Qué deseo, miedo o apego necesita ser nombrado antes de elegir?",
    acto_simbolico_seguro: "Escribe una palabra que represente la atadura y otra que represente la fuerza disponible. Míralas juntas antes de decidir.",
    evitar: ["demonizar", "hablar de maldad", "presentar la carta como castigo", "usar miedo"],
    areas: areas({
      amor: "Explorar deseo, dependencia, atracción, pacto y libertad.",
      trabajo: "Mirar ambición, desgaste, poder, dependencia material o deseo de control.",
      decision: "Distinguir entre elección libre, impulso, presión y apego.",
      familia: "Observar lealtades, dependencias y zonas no dichas sin culpar.",
      creatividad: "Reconocer fuerza instintiva, potencia expresiva y riesgo de repetición.",
      animo: "Nombrar lo que pesa sin convertirlo en identidad.",
      crisis: "Bajar intensidad, nombrar la atadura y buscar apoyo humano si hay riesgo.",
      otro: "Mirar qué vínculo, impulso o repetición pide lucidez."
    }),
    fuente: SOURCE
  },
  {
    id: "la-torre",
    nombre: "La Torre",
    numero: "XVI",
    tipo: "mayor",
    imagen: "/cartas/la-torre.jpg",
    palabras_clave: ["apertura", "ruptura", "límite", "salida"],
    escena_visual: "Una construcción se abre y libera presión acumulada, mostrando una salida inesperada.",
    eje_simbolico: "Permitir que una estructura rígida se abra sin confundir apertura con desastre.",
    tension_narrativa: "La tensión aparece entre sostener una forma cerrada y reconocer que ya no contiene la vida.",
    giro_simbolico: "La carta pregunta qué muro se abrió para que algo pueda respirar.",
    devolucion_agencia: "El consultante puede revisar qué estructura falló, qué protegía y qué salida deja visible.",
    pregunta_integracion: "¿Qué apertura, aunque incomoda, permite ver la situación con más verdad?",
    acto_simbolico_seguro: "Dibuja una torre con una puerta abierta y escribe qué puede salir sin destruirte.",
    evitar: ["anunciar catástrofes", "asustar", "forzar rupturas", "celebrar crisis"],
    areas: areas({
      amor: "Mirar quiebres de forma, verdades dichas y necesidad de aire.",
      trabajo: "Revisar estructuras agotadas, límites rebasados o cambios de marco.",
      decision: "Preguntar qué evidencia ya rompió la ilusión anterior.",
      familia: "Observar tensiones acumuladas que piden salida sin humillar a nadie.",
      creatividad: "Romper una forma rígida para dejar entrar otra composición.",
      animo: "Nombrar saturación sin convertirla en derrumbe total.",
      crisis: "Si la apertura se vive como riesgo, buscar contención humana inmediata.",
      otro: "Mirar qué estructura dejó de contener la pregunta."
    }),
    fuente: SOURCE
  },
  {
    id: "la-estrella",
    nombre: "La Estrella",
    numero: "XVII",
    tipo: "mayor",
    imagen: "/cartas/la-estrella.jpg",
    palabras_clave: ["desnudez", "confianza", "fuente", "calma"],
    escena_visual: "Una figura desnuda vierte agua con sencillez, en contacto con tierra, cielo y fuente.",
    eje_simbolico: "Volver a una confianza sobria, sin máscara, después de la tensión.",
    tension_narrativa: "La tensión está entre protegerse demasiado y permitir una entrega simple y cuidadosa.",
    giro_simbolico: "La carta no promete alivio: propone regresar a una fuente pequeña de verdad y calma.",
    devolucion_agencia: "El consultante puede reconocer qué gesto simple lo devuelve a sí mismo.",
    pregunta_integracion: "¿Qué gesto humilde te ayuda a volver a una verdad más desnuda?",
    acto_simbolico_seguro: "Toma agua lentamente y escribe una frase sin adornos sobre lo que necesitas cuidar.",
    evitar: ["prometer sanación", "idealizar pureza", "hablar de destino luminoso", "negar dolor"],
    areas: areas({
      amor: "Buscar sinceridad, vulnerabilidad y cuidado sin exigencia de perfección.",
      trabajo: "Reconectar con sentido simple y condiciones humanas de trabajo.",
      decision: "Elegir desde una verdad menos defensiva.",
      familia: "Abrir un gesto de calma sin negar heridas.",
      creatividad: "Volver a la fuente de una obra sin adornos innecesarios.",
      animo: "Encontrar un cuidado pequeño y realista que no prometa curarlo todo.",
      crisis: "Si hay riesgo, la fuente debe ser apoyo humano y profesional.",
      otro: "Mirar qué parte de la pregunta necesita sencillez."
    }),
    fuente: SOURCE
  },
  {
    id: "la-luna",
    nombre: "La Luna",
    numero: "XVIII",
    tipo: "mayor",
    imagen: "/cartas/la-luna.jpg",
    palabras_clave: ["emoción", "sueño", "memoria", "profundidad"],
    escena_visual: "Un paisaje nocturno muestra aguas, animales y caminos ambiguos entre memoria e imaginación.",
    eje_simbolico: "Atravesar lo confuso sin exigir claridad diurna inmediata.",
    tension_narrativa: "La tensión aparece entre intuición, miedo, recuerdo y fantasía.",
    giro_simbolico: "La carta propone escuchar la emoción sin obedecerla como si fuera prueba.",
    devolucion_agencia: "El consultante puede distinguir sensación, hecho, memoria y posibilidad.",
    pregunta_integracion: "¿Qué sientes intensamente, y qué hecho concreto confirma o no esa sensación?",
    acto_simbolico_seguro: "Divide una hoja en cuatro: hecho, miedo, recuerdo, deseo. Escribe una línea en cada zona.",
    evitar: ["validar paranoia", "diagnosticar", "hablar de señales ocultas", "convertir sueño en mandato"],
    areas: areas({
      amor: "Separar emoción intensa, recuerdo, deseo y hechos del vínculo.",
      trabajo: "Mirar incertidumbre, ambiente confuso o información incompleta.",
      decision: "No decidir sólo desde miedo nocturno; buscar datos y pausa.",
      familia: "Reconocer memorias y climas afectivos sin darlos por verdad total.",
      creatividad: "Usar imagen, sueño y profundidad sin perder contorno.",
      animo: "Nombrar confusión con cuidado y buscar apoyo si se vuelve pesada.",
      crisis: "Si la emoción desborda o hay riesgo, priorizar compañía y ayuda profesional.",
      otro: "Mirar qué parte de la pregunta está bajo niebla emocional."
    }),
    fuente: SOURCE
  },
  {
    id: "el-sol",
    nombre: "El Sol",
    numero: "XVIIII",
    tipo: "mayor",
    imagen: "/cartas/el-sol.jpg",
    palabras_clave: ["claridad", "alegría", "vínculo", "presencia"],
    escena_visual: "Dos figuras se encuentran bajo una luz directa que permite ver y compartir.",
    eje_simbolico: "Reconocer claridad compartida sin transformarla en obligación de alegría.",
    tension_narrativa: "La tensión aparece entre esconderse por protección y exponerse con cuidado a una verdad simple.",
    giro_simbolico: "La carta pregunta qué se vuelve más claro cuando la escena se ilumina sin adornos.",
    devolucion_agencia: "El consultante puede buscar una conversación o gesto donde haya más transparencia.",
    pregunta_integracion: "¿Qué verdad simple se ve mejor cuando dejas de complicarla?",
    acto_simbolico_seguro: "Escribe la versión más simple de la situación en una frase de menos de diez palabras.",
    evitar: ["prometer felicidad", "negar sombra", "imponer optimismo", "idealizar vínculos"],
    areas: areas({
      amor: "Mirar reciprocidad, encuentro claro y posibilidad de hablar sin teatro.",
      trabajo: "Identificar qué se ve con claridad y qué colaboración puede ayudar.",
      decision: "Elegir desde lo evidente, no desde exceso de vueltas.",
      familia: "Buscar un punto de encuentro realista y visible.",
      creatividad: "Mostrar una obra o idea en su forma más limpia.",
      animo: "Reconocer claridad pequeña sin exigirse entusiasmo.",
      crisis: "En riesgo, la claridad es pedir ayuda y no quedarse solo.",
      otro: "Preguntar qué parte de la escena ya está iluminada."
    }),
    fuente: SOURCE
  },
  {
    id: "el-juicio",
    nombre: "El Juicio",
    numero: "XX",
    tipo: "mayor",
    imagen: "/cartas/el-juicio.jpg",
    palabras_clave: ["llamado", "escucha", "revisión", "pasaje"],
    escena_visual: "Una llamada despierta a figuras que emergen de una forma antigua hacia otra escucha.",
    eje_simbolico: "Escuchar un llamado de cambio sin convertirlo en mandato externo.",
    tension_narrativa: "La tensión está entre permanecer en una versión vieja y responder a una revisión necesaria.",
    giro_simbolico: "La carta no ordena renacer: pregunta qué voz interna o externa pide ser atendida.",
    devolucion_agencia: "El consultante puede revisar su historia y elegir qué respuesta sí le pertenece.",
    pregunta_integracion: "¿Qué llamado merece escucha, y cuál es sólo ruido de exigencia?",
    acto_simbolico_seguro: "Escribe una frase que empiece con 'me doy cuenta de...' y otra con 'todavía no sé...'.",
    evitar: ["juicio moral", "mandatos espirituales", "prometer renacimiento", "culpar por no cambiar"],
    areas: areas({
      amor: "Escuchar una verdad que pide revisión del vínculo o de la propia posición.",
      trabajo: "Atender una llamada vocacional, corrección o cierre de etapa.",
      decision: "Distinguir llamado auténtico de presión externa.",
      familia: "Revisar historias antiguas sin quedar definido por ellas.",
      creatividad: "Responder a una obra que pide salir, revisarse o cambiar de escala.",
      animo: "Validar una toma de conciencia sin exigirse transformación inmediata.",
      crisis: "Si el llamado se vive como urgencia peligrosa, buscar apoyo humano ahora.",
      otro: "Mirar qué parte de la pregunta está despertando."
    }),
    fuente: SOURCE
  },
  {
    id: "el-mundo",
    nombre: "El Mundo",
    numero: "XXI",
    tipo: "mayor",
    imagen: "/cartas/el-mundo.jpg",
    palabras_clave: ["integración", "cierre", "conjunto", "centro"],
    escena_visual: "Una figura central aparece rodeada por un marco completo, integrando partes distintas.",
    eje_simbolico: "Reconocer una totalidad posible sin exigir perfección.",
    tension_narrativa: "La tensión aparece entre cerrar una etapa y querer que todo quede resuelto antes de hacerlo.",
    giro_simbolico: "La carta propone mirar el conjunto: qué ya se integró y qué queda como aprendizaje.",
    devolucion_agencia: "El consultante puede reconocer avance, límite y cierre parcial sin borrar lo pendiente.",
    pregunta_integracion: "¿Qué parte del proceso ya puede reconocerse como completa, aunque no sea perfecta?",
    acto_simbolico_seguro: "Enumera cuatro partes de la situación: cuerpo, emoción, vínculo y acción posible.",
    evitar: ["prometer realización total", "perfeccionismo", "cerrar por obligación", "negar asuntos pendientes"],
    areas: areas({
      amor: "Mirar el vínculo como conjunto: encuentro, límites, historia y presente.",
      trabajo: "Reconocer cierre de ciclo, integración de aprendizajes o visión global.",
      decision: "Elegir desde el mapa completo, no desde un fragmento aislado.",
      familia: "Ver la trama entera sin justificar daños ni negar afectos.",
      creatividad: "Cerrar una pieza, reunir materiales o aceptar una forma suficiente.",
      animo: "Reconocer lo avanzado sin exigirse estar completo.",
      crisis: "Si no hay sostén, priorizar red humana antes de intentar integrar todo.",
      otro: "Mirar el conjunto de la pregunta y su centro posible."
    }),
    fuente: SOURCE
  }
];
