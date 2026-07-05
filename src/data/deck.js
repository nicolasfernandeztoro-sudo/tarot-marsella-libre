// Base simbólica del Tarot de Marsella — baraja completa: 22 arcanos mayores.
//
// Propósito: dar al Worker MATERIAL específico por carta para inyectar en el prompt.
// Sin este material, la IA improvisa y las respuestas salen genéricas.
//
// Encuadre (ver AGENTS.md): lectura simbólica NO predictiva, inspirada en el
// Tarot de Marsella y la tradición arquetipal junguiana. Ninguna carta es "mala".
// No se leen cartas invertidas. Las cartas "duras" (el arcano sin nombre, El Diablo,
// La Torre, La Luna) se encuadran como umbral, apego, ruptura y penumbra, nunca
// como augurio. Siempre se devuelve agencia al consultante.
//
// Estructura de cada entrada:
//   id                 slug estable (coincide con el nombre del .jpg en /cartas)
//   nombre, numero     nombre en español + numeral marsellés (El Loco no lleva número)
//   tipo               "mayor"
//   imagen             ruta relativa a la lámina
//   detalles_visuales  anclas concretas de la imagen (para que la lectura no sea abstracta)
//   palabras_clave     ejes simbólicos, no adjetivos de destino
//   significado_base   síntesis transformada: qué mira esta carta (2–4 frases)
//   tension_tipica     la contradicción viva que la carta suele sacar a la luz
//   giro_posible       el reordenamiento que puede aliviar (nunca una orden)
//   frase_simbolica    una imagen breve y evocadora para el cierre

export const deck = [
  {
    id: "el-loco",
    nombre: "El Loco",
    numero: "",
    tipo: "mayor",
    imagen: "./cartas/el-loco.jpg",
    detalles_visuales: [
      "camina llevando un bastón y un hatillo al hombro",
      "un animal le muerde o le tira de la pierna",
      "viste colores de bufón, sin armadura",
      "mira hacia adelante, no al suelo"
    ],
    palabras_clave: ["movimiento", "libertad", "impulso", "viaje sin mapa", "lo que no se deja fijar"],
    significado_base:
      "El Loco es el único arcano sin número: encarna el movimiento mismo, la energía que avanza antes de saber a dónde. " +
      "No es tonto ni sabio; es puro andar, disponibilidad, comienzo sin garantías. " +
      "Aparece cuando algo empuja a moverse aunque el destino todavía no esté claro.",
    tension_tipica:
      "Querer un destino fijo antes de dar el paso, cuando la carta es el paso mismo.",
    giro_posible:
      "Quizá la pregunta no sea '¿a dónde voy?', sino '¿qué me está poniendo en movimiento ahora?'.",
    frase_simbolica: "Camina antes de saber a dónde."
  },
  {
    id: "el-mago",
    nombre: "El Mago",
    numero: "I",
    tipo: "mayor",
    imagen: "./cartas/el-mago.jpg",
    detalles_visuales: [
      "una mesa con objetos de los cuatro palos, aún sin usar",
      "una mano apunta al cielo y la otra baja hacia la tierra",
      "el sombrero dibuja una lemniscata (un ocho tumbado)",
      "la mirada va de lado, no de frente"
    ],
    palabras_clave: ["comienzo", "recursos disponibles", "potencial sin desplegar", "habilidad", "dispersión"],
    significado_base:
      "El Mago es el punto de partida: tiene todas las herramientas sobre la mesa, pero todavía no ha elegido cuál tomar. " +
      "Habla del momento en que hay capacidad y materiales, y falta el gesto de comprometerse con uno. " +
      "No promete éxito; señala que el poder de empezar está en las manos de quien mira.",
    tension_tipica:
      "Tener muchas opciones y confundir la abundancia de recursos con la incapacidad de elegir uno.",
    giro_posible:
      "La pregunta quizá no sea '¿qué me falta?', sino '¿qué de todo lo que ya tengo estoy postergando usar?'.",
    frase_simbolica: "Todo está sobre la mesa; falta la mano que decide."
  },
  {
    id: "la-papisa",
    nombre: "La Papisa",
    numero: "II",
    tipo: "mayor",
    imagen: "./cartas/la-papisa.jpg",
    detalles_visuales: [
      "un libro entreabierto sobre el regazo, no cerrado ni del todo abierto",
      "un velo tenso detrás, que separa dos espacios",
      "está sentada, quieta, en actitud de espera",
      "una tiara de tres niveles"
    ],
    palabras_clave: ["saber en gestación", "interioridad", "paciencia", "límite entre lo dicho y lo callado", "estudio"],
    significado_base:
      "La Papisa es el saber que madura en silencio, todavía sin necesidad de mostrarse. " +
      "Sostiene un libro que no termina de abrir: hay algo que se está entendiendo por dentro y aún no pide acción. " +
      "Invita a respetar los tiempos de lo que se cocina sin ruido, sin forzar una respuesta antes de que llegue.",
    tension_tipica:
      "Exigirse una respuesta o una decisión ya, cuando algo dentro todavía se está formando.",
    giro_posible:
      "Tal vez no toque resolver hoy, sino cuidar el espacio donde una comprensión aún está tomando forma.",
    frase_simbolica: "El libro entreabierto no se apura."
  },
  {
    id: "la-emperatriz",
    nombre: "La Emperatriz",
    numero: "III",
    tipo: "mayor",
    imagen: "./cartas/la-emperatriz.jpg",
    detalles_visuales: [
      "sostiene un cetro con soltura, sin apretarlo",
      "un escudo con un águila apoyado a su lado",
      "sentada con el cuerpo abierto, no rígido",
      "una corona amplia y una mirada receptiva"
    ],
    palabras_clave: ["creación", "abundancia", "expansión", "cuidado fecundo", "deseo que da forma"],
    significado_base:
      "La Emperatriz es la fuerza que da forma y hace crecer: imaginación fértil, capacidad de crear y sostener lo que se crea. " +
      "No se reduce a la maternidad; es todo lo que uno hace nacer —una idea, un proyecto, un vínculo—. " +
      "Habla del gusto de generar y del cuidado que permite que algo prospere.",
    tension_tipica:
      "Querer controlar el resultado de lo que se crea, cuando crear implica soltar lo creado a su propia vida.",
    giro_posible:
      "Quizá no toque forzar un fruto, sino cuidar las condiciones para que algo pueda crecer a su ritmo.",
    frase_simbolica: "Da forma a lo que aún no existe."
  },
  {
    id: "el-emperador",
    nombre: "El Emperador",
    numero: "IIII",
    tipo: "mayor",
    imagen: "./cartas/el-emperador.jpg",
    detalles_visuales: [
      "las piernas cruzadas dibujan un cuatro",
      "sostiene un cetro con firmeza tranquila",
      "sentado de perfil sobre piedra, estable",
      "viste armadura bajo el manto"
    ],
    palabras_clave: ["estructura", "orden", "límite", "responsabilidad", "poder concreto"],
    significado_base:
      "El Emperador es la carta de construir sobre la tierra: dar estructura, poner límites, sostener lo que se decide. " +
      "Es el poder que se ejerce con los pies en el suelo, más de organización que de conquista. " +
      "Aparece cuando algo pide firmeza, marco y responsabilidad para poder avanzar.",
    tension_tipica:
      "Confundir firmeza con rigidez, o querer controlarlo todo por miedo a que se derrumbe.",
    giro_posible:
      "Quizá la pregunta no sea '¿cómo domino esto?', sino '¿qué estructura mínima me daría sostén sin encerrarme?'.",
    frase_simbolica: "Construir pide poner una piedra, no cargar el muro entero."
  },
  {
    id: "el-papa",
    nombre: "El Papa",
    numero: "V",
    tipo: "mayor",
    imagen: "./cartas/el-papa.jpg",
    detalles_visuales: [
      "dos figuras escuchan de espaldas, frente a él",
      "una mano se alza en gesto de bendecir o señalar",
      "una tiara de tres pisos une lo alto y lo bajo",
      "sostiene un báculo, en actitud de transmitir"
    ],
    palabras_clave: ["sentido", "guía", "transmisión", "pertenencia", "palabra que ordena"],
    significado_base:
      "El Papa es la carta del sentido compartido y la transmisión: buscar o dar una palabra que ordene, un vínculo con algo mayor que uno. " +
      "Hace de puente entre lo alto y lo cotidiano, entre lo que se cree y lo que se vive. " +
      "Habla de guía, enseñanza y de la necesidad humana de pertenecer a algo.",
    tension_tipica:
      "Buscar afuera una autoridad que dé permiso, cuando parte de la respuesta ya se sostiene adentro.",
    giro_posible:
      "Tal vez no busques quién te diga qué hacer, sino con quién pensar lo que ya intuyes.",
    frase_simbolica: "Un puente necesita dos orillas."
  },
  {
    id: "el-enamorado",
    nombre: "El Enamorado",
    numero: "VI",
    tipo: "mayor",
    imagen: "./cartas/el-enamorado.jpg",
    detalles_visuales: [
      "una figura de pie entre otras dos",
      "un arquero apunta desde arriba, listo para inclinar la escena",
      "los pies aún no eligen dirección",
      "un sol ilumina el momento de la elección"
    ],
    palabras_clave: ["elección", "deseo", "vínculo", "encrucijada", "lo que el corazón inclina"],
    significado_base:
      "El Enamorado es la carta de la elección afectiva: estar entre dos caminos o dos amores y sentir hacia dónde tira el deseo. " +
      "No representa la certeza, sino el instante de inclinarse, con el cuerpo y no solo con la razón. " +
      "Aparece cuando hay que elegir y la balanza se juega en el afecto.",
    tension_tipica:
      "Querer elegir solo con la cabeza, cuando la carta muestra que el deseo ya está inclinando la balanza.",
    giro_posible:
      "Quizá la pregunta no sea '¿cuál es la opción correcta?', sino '¿hacia qué me inclino cuando dejo de justificarme?'.",
    frase_simbolica: "El deseo se inclina antes que la razón."
  },
  {
    id: "el-carro",
    nombre: "El Carro",
    numero: "VII",
    tipo: "mayor",
    imagen: "./cartas/el-carro.jpg",
    detalles_visuales: [
      "dos caballos miran hacia lados distintos",
      "el conductor va de pie, sereno, con las riendas",
      "un palio cubre la cabeza como un cielo propio",
      "una ciudad queda atrás, ya partió"
    ],
    palabras_clave: ["avance", "dirección", "voluntad", "conducir fuerzas opuestas", "partida"],
    significado_base:
      "El Carro es la carta de ponerse en marcha y conducir: dirigir fuerzas que tiran distinto sin detener el avance. " +
      "Es un triunfo que consiste más en partir que en llegar, en sostener el rumbo entre tensiones. " +
      "Aparece cuando hay energía para moverse y el desafío es gobernarla.",
    tension_tipica:
      "Querer que ambas fuerzas (o ambos deseos) vayan al mismo paso, cuando conducir es sostener la tensión sin soltar las riendas.",
    giro_posible:
      "Tal vez avanzar no exija que todo en ti esté de acuerdo, solo que elijas hacia dónde miran las riendas.",
    frase_simbolica: "Conducir es sostener dos caballos que no miran igual."
  },
  {
    id: "la-justicia",
    nombre: "La Justicia",
    numero: "VIII",
    tipo: "mayor",
    imagen: "./cartas/la-justicia.jpg",
    detalles_visuales: [
      "una balanza sostenida en equilibrio",
      "una espada vertical, firme, sin amenazar",
      "mira de frente, sin desviar los ojos",
      "está sentada, estable, entre dos columnas"
    ],
    palabras_clave: ["medida", "responsabilidad", "claridad", "consecuencia", "equilibrio"],
    significado_base:
      "La Justicia pide mirar de frente y con medida: pesar lo que hay, reconocer la parte propia y nombrar las cosas por su nombre. " +
      "La espada no castiga, corta la confusión; la balanza no condena, ordena. " +
      "Habla de honestidad con uno mismo más que de un veredicto externo.",
    tension_tipica:
      "Buscar afuera un juez o un permiso, cuando la carta devuelve la medida a las propias manos.",
    giro_posible:
      "Tal vez la pregunta no sea '¿quién tiene razón?', sino '¿qué parte de esto me corresponde sostener?'.",
    frase_simbolica: "La balanza no condena: ordena."
  },
  {
    id: "el-ermitano",
    nombre: "El Ermitaño",
    numero: "VIIII",
    tipo: "mayor",
    imagen: "./cartas/el-ermitano.jpg",
    detalles_visuales: [
      "un farol que alumbra solo unos pasos por delante",
      "un bastón que sostiene y mide el camino",
      "una capa que cubre y protege del frío",
      "avanza despacio, con la cabeza algo inclinada"
    ],
    palabras_clave: ["retiro", "luz breve y honesta", "paso a paso", "búsqueda propia", "soledad elegida"],
    significado_base:
      "El Ermitaño no ilumina todo el camino: su farol alcanza apenas para el próximo paso, y eso basta. " +
      "Habla del momento en que conviene bajar el ritmo, apartarse del ruido y avanzar con una luz pequeña pero propia. " +
      "No es aislamiento por herida, sino un retiro que ordena.",
    tension_tipica:
      "Querer ver el camino completo antes de moverse, cuando la carta solo ofrece luz para el tramo inmediato.",
    giro_posible:
      "Quizá la claridad que buscas no sea un mapa entero, sino saber cuál es el único paso siguiente.",
    frase_simbolica: "Una luz pequeña alcanza para el próximo paso."
  },
  {
    id: "la-rueda",
    nombre: "La Rueda de la Fortuna",
    numero: "X",
    tipo: "mayor",
    imagen: "./cartas/la-rueda.jpg",
    detalles_visuales: [
      "figuras que suben por un lado y bajan por el otro",
      "una manivela al costado, como si algo o alguien la girara",
      "una figura arriba que observa el movimiento",
      "la rueda no se detiene"
    ],
    palabras_clave: ["ciclo", "cambio", "lo que gira", "momento del proceso", "aceptar el movimiento"],
    significado_base:
      "La Rueda es la carta del movimiento cíclico: lo que sube baja y lo que baja sube. " +
      "Invita a reconocer en qué punto del ciclo estás sin creer que ese punto es el final. " +
      "No anuncia suerte ni desgracia: recuerda que casi nada se queda quieto.",
    tension_tipica:
      "Querer detener la rueda en el punto que gusta, cuando su naturaleza es girar.",
    giro_posible:
      "Quizá no toque frenar el cambio, sino preguntar qué parte de este giro depende de ti y cuál solo pide paciencia.",
    frase_simbolica: "Lo que gira no pide que lo detengas, sino que lo mires girar."
  },
  {
    id: "la-fuerza",
    nombre: "La Fuerza",
    numero: "XI",
    tipo: "mayor",
    imagen: "./cartas/la-fuerza.jpg",
    detalles_visuales: [
      "unas manos abren o cierran las fauces de un león sin violencia",
      "un sombrero en forma de ocho tumbado",
      "el rostro sereno, sin esfuerzo tenso",
      "el cuerpo firme pero relajado"
    ],
    palabras_clave: ["fuerza serena", "dominio suave", "vitalidad", "instinto", "temple"],
    significado_base:
      "La Fuerza es la potencia que no somete: manejar el propio impulso, miedo o deseo con firmeza amable, sin apagarlo. " +
      "El león no se vence, se acompaña; la fuerza real se ejerce con la mano abierta. " +
      "Habla de temple, de sostener lo intenso sin volverse violento con uno mismo.",
    tension_tipica:
      "Creer que hay que vencer al león —el impulso, la rabia, el deseo— cuando la carta muestra que se lo puede acompañar.",
    giro_posible:
      "Tal vez no debas eliminar esa fuerza tuya, sino aprender a sostenerla con la mano abierta.",
    frase_simbolica: "La verdadera fuerza abre las fauces sin herir."
  },
  {
    id: "el-colgado",
    nombre: "El Colgado",
    numero: "XII",
    tipo: "mayor",
    imagen: "./cartas/el-colgado.jpg",
    detalles_visuales: [
      "cuelga de un pie con el rostro sereno",
      "las manos quedan atrás, fuera de la acción",
      "una pierna cruza formando un cuatro invertido",
      "dos árboles podados lo sostienen"
    ],
    palabras_clave: ["suspensión", "entrega", "otro punto de vista", "pausa voluntaria", "espera fértil"],
    significado_base:
      "El Colgado mira el mundo al revés y encuentra valor en la pausa: detenerse a propósito, soltar el control, dejar que otra perspectiva llegue. " +
      "No es castigo ni tiempo perdido; es una posición que, elegida, ordena. " +
      "Aparece cuando forzar no sirve y lo que ayuda es cambiar el ángulo desde el que se mira.",
    tension_tipica:
      "Vivir la suspensión como castigo o pérdida de tiempo, cuando puede ser una posición elegida que ordena.",
    giro_posible:
      "Quizá la pregunta no sea '¿cuándo termina esta espera?', sino '¿qué veo desde aquí que no vería de pie?'.",
    frase_simbolica: "Colgado, la cabeza al fin mira distinto."
  },
  {
    id: "arcano-sin-nombre",
    nombre: "El Arcano sin nombre",
    numero: "XIII",
    tipo: "mayor",
    imagen: "./cartas/arcano-sin-nombre.jpg",
    detalles_visuales: [
      "una guadaña que siega y a la vez limpia el terreno",
      "manos y pies asoman de la tierra oscura, vivos",
      "la carta no lleva nombre escrito",
      "un movimiento firme de izquierda a derecha"
    ],
    palabras_clave: ["umbral", "soltar", "transformación", "limpieza", "lo que termina para dejar sitio"],
    significado_base:
      "La carta sin nombre no anuncia una muerte literal ni un mal augurio: habla de lo que termina para que algo nuevo tenga lugar. " +
      "Siega lo seco, limpia el terreno, marca un umbral entre una etapa y otra. " +
      "Es tránsito y renovación, no castigo; lo que cae ya había cumplido su ciclo.",
    tension_tipica:
      "Aferrarse a lo que ya terminó por miedo al vacío que deja al soltarlo.",
    giro_posible:
      "Tal vez no se trate de qué pierdes, sino de qué espacio queda libre cuando sueltas lo que ya cumplió su ciclo.",
    frase_simbolica: "Siega lo seco para que la tierra respire."
  },
  {
    id: "la-templanza",
    nombre: "La Templanza",
    numero: "XIIII",
    tipo: "mayor",
    imagen: "./cartas/la-templanza.jpg",
    detalles_visuales: [
      "un ángel vierte líquido entre dos copas sin derramar",
      "el trasvase es continuo, tranquilo, sin prisa",
      "las alas sugieren un cuidado que sostiene",
      "los pies firmes, la postura serena"
    ],
    palabras_clave: ["mezcla", "proporción", "pausa", "regulación", "cuidado"],
    significado_base:
      "La Templanza es el arte de mezclar sin desbordar: pasar algo de una copa a otra con paciencia, encontrar la proporción justa. " +
      "Aparece cuando algo pide temperar los extremos, dosificar, no resolver de golpe. " +
      "Es la carta del cuidado que regula, no de la renuncia.",
    tension_tipica:
      "Querer solucionar todo de una vez, cuando lo que la escena pide es dosis, pausa y mezcla.",
    giro_posible:
      "Quizá el alivio no venga de decidir el todo, sino de encontrar la próxima proporción habitable.",
    frase_simbolica: "Algo pide mezcla, pausa y proporción."
  },
  {
    id: "el-diablo",
    nombre: "El Diablo",
    numero: "XV",
    tipo: "mayor",
    imagen: "./cartas/el-diablo.jpg",
    detalles_visuales: [
      "dos figuras atadas con cuerdas flojas que podrían soltarse",
      "una antorcha que ilumina hacia abajo",
      "una figura central sobre un pedestal",
      "las cadenas no aprietan del todo"
    ],
    palabras_clave: ["apego", "deseo intenso", "vitalidad", "lo negado", "atadura elegida"],
    significado_base:
      "El Diablo es la carta de la fuerza vital y del apego, no del mal: lo que nos ata con placer, lo que deseamos y tememos a la vez. " +
      "Señala vínculos, hábitos o pasiones cuyas cuerdas suelen estar más flojas de lo que creemos. " +
      "Es la energía cruda del cuerpo y el deseo, y la pregunta por qué hacemos con ella.",
    tension_tipica:
      "Creerse totalmente preso de un deseo o un vínculo, cuando la carta muestra que las ataduras se pueden aflojar.",
    giro_posible:
      "Quizá la pregunta no sea '¿cómo escapo?', sino '¿qué me da esto que todavía no quiero soltar, y qué me cuesta?'.",
    frase_simbolica: "Las cuerdas están más flojas de lo que parecen."
  },
  {
    id: "la-torre",
    nombre: "La Torre",
    numero: "XVI",
    tipo: "mayor",
    imagen: "./cartas/la-torre.jpg",
    detalles_visuales: [
      "un techo o corona salta por un golpe súbito",
      "dos figuras caen de lo alto de la torre",
      "gotas de colores quedan suspendidas en el aire",
      "la base de la torre sigue en pie"
    ],
    palabras_clave: ["ruptura súbita", "liberación", "caída de lo falso", "sacudida", "aire nuevo"],
    significado_base:
      "La Torre es el quiebre repentino de algo que ya no sostenía: una estructura, una certeza o una fachada que se cae de golpe. " +
      "Duele, pero abre; lo que se derrumba suele ser lo que aprisionaba. " +
      "No es catástrofe sin sentido, sino aire que entra cuando cae lo que pesaba.",
    tension_tipica:
      "Querer sostener a toda costa una estructura que ya se estaba cayendo sola.",
    giro_posible:
      "Tal vez no se trate de reconstruir igual, sino de mirar qué quedó libre cuando cayó lo que pesaba.",
    frase_simbolica: "Cae el techo y por fin entra el cielo."
  },
  {
    id: "la-estrella",
    nombre: "La Estrella",
    numero: "XVII",
    tipo: "mayor",
    imagen: "./cartas/la-estrella.jpg",
    detalles_visuales: [
      "una figura desnuda vierte agua sobre la tierra y sobre el río",
      "una rodilla apoyada en el suelo, sin tensión",
      "estrellas abiertas en el cielo, uniformes",
      "el cuerpo entregado, sin defensa"
    ],
    palabras_clave: ["calma", "esperanza sobria", "vulnerabilidad confiada", "donación", "respiro"],
    significado_base:
      "La Estrella es un respiro después de la tormenta: alguien se muestra sin armadura y vuelve a dar sin miedo a vaciarse. " +
      "No promete que todo saldrá bien; ofrece una imagen de calma para volver a mirar con menos urgencia. " +
      "Habla de confianza que se sostiene aun en lo abierto.",
    tension_tipica:
      "Confundir mostrarse vulnerable con quedar desprotegido, cuando la carta muestra entrega sin alarma.",
    giro_posible:
      "Tal vez no haga falta blindarse para estar a salvo; a veces bajar la guardia también ordena.",
    frase_simbolica: "Una imagen de calma para volver a mirar."
  },
  {
    id: "la-luna",
    nombre: "La Luna",
    numero: "XVIII",
    tipo: "mayor",
    imagen: "./cartas/la-luna.jpg",
    detalles_visuales: [
      "dos torres a los lados de un camino que se aleja",
      "dos perros aúllan hacia la luna",
      "un cangrejo asoma en el agua, abajo",
      "gotas que suben en vez de caer"
    ],
    palabras_clave: ["lo incierto", "emoción profunda", "imaginación", "miedo y sueño", "penumbra"],
    significado_base:
      "La Luna es la carta de lo que no se ve del todo: el terreno emocional y nocturno donde crecen a la vez la imaginación y el miedo. " +
      "Invita a caminar sin exigir plena claridad, a confiar en lo que se intuye más que en lo que se demuestra. " +
      "No anuncia engaño ni peligro: nombra la penumbra como parte del camino.",
    tension_tipica:
      "Exigir certeza y luz plena en un territorio que es, por naturaleza, de penumbra.",
    giro_posible:
      "Quizá no toque disipar toda la niebla, sino aprender a moverte con lo poco que ya alumbra la luna.",
    frase_simbolica: "No toda claridad llega de día."
  },
  {
    id: "el-sol",
    nombre: "El Sol",
    numero: "XVIIII",
    tipo: "mayor",
    imagen: "./cartas/el-sol.jpg",
    detalles_visuales: [
      "dos figuras juntas bajo un sol radiante",
      "un muro bajo detrás, que contiene sin encerrar",
      "gotas doradas caen desde el sol",
      "los cuerpos a la vista, sin máscara ni vergüenza"
    ],
    palabras_clave: ["claridad cálida", "alegría simple", "encuentro", "vitalidad compartida", "presencia"],
    significado_base:
      "El Sol es la luz que reúne y calienta: claridad amable, alegría sencilla, el gusto de estar y de compartir sin máscara. " +
      "Es lo que se ve bien de día y se puede nombrar sin miedo, el vínculo a plena luz. " +
      "Aparece cuando algo se vuelve claro y cálido, y solo pide ser habitado.",
    tension_tipica:
      "Desconfiar de lo bueno cuando llega, buscarle una trampa a la claridad.",
    giro_posible:
      "Tal vez no haya que merecer la luz ni sospechar de ella: a veces solo toca dejarse calentar.",
    frase_simbolica: "Hay días en que la claridad no esconde trampa."
  },
  {
    id: "el-juicio",
    nombre: "El Juicio",
    numero: "XX",
    tipo: "mayor",
    imagen: "./cartas/el-juicio.jpg",
    detalles_visuales: [
      "un ángel toca la trompeta desde lo alto",
      "figuras se levantan como despertando",
      "un estandarte flota sobre la escena",
      "un llamado convoca a salir de un estado"
    ],
    palabras_clave: ["llamado", "despertar", "renacer", "vocación", "respuesta a algo mayor"],
    significado_base:
      "El Juicio es el llamado que despierta: algo convoca a salir de un estado, a renacer a una etapa nueva o a responder a una vocación. " +
      "No es sentencia ni condena; es el momento de levantarse ante algo que pide respuesta. " +
      "Habla de escuchar un llamado propio y de la decisión de atenderlo.",
    tension_tipica:
      "Oír el llamado y quedarse quieto por miedo a lo que implica responder que sí.",
    giro_posible:
      "Quizá la pregunta no sea '¿estoy listo?', sino '¿qué me está llamando y qué me cuesta responderle?'.",
    frase_simbolica: "Algo llama; falta decidir si te levantas."
  },
  {
    id: "el-mundo",
    nombre: "El Mundo",
    numero: "XXI",
    tipo: "mayor",
    imagen: "./cartas/el-mundo.jpg",
    detalles_visuales: [
      "una figura danza dentro de una guirnalda ovalada",
      "cuatro criaturas ocupan las esquinas",
      "el movimiento es sereno y completo",
      "un espacio que contiene sin apretar"
    ],
    palabras_clave: ["plenitud", "integración", "cierre de ciclo", "pertenencia", "síntesis"],
    significado_base:
      "El Mundo es la carta de la integración y el cierre logrado: las partes que antes tiraban distinto ahora danzan juntas. " +
      "Es una plenitud que no es final estático, sino un estar completo en movimiento. " +
      "Aparece cuando un ciclo se redondea y uno puede, por fin, habitarlo entero.",
    tension_tipica:
      "Creer que la plenitud es un punto de llegada fijo, cuando la carta muestra una danza, no un descanso.",
    giro_posible:
      "Tal vez la completitud no sea dejar de moverte, sino moverte ya sin pelear contigo mismo.",
    frase_simbolica: "Estar completo también se baila."
  }
];

// Devuelve una carta por id (o null si no existe).
export function getCard(id) {
  return deck.find((carta) => carta.id === id) || null;
}

// Selección aleatoria con azar criptográfico si está disponible.
export function pickRandomCard() {
  if (!deck.length) return null;
  let index;
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    index = values[0] % deck.length;
  } else {
    index = Math.floor(Math.random() * deck.length);
  }
  return deck[index];
}

// Proyecta una carta al formato de "carta" del contrato JSON del Worker (bloque 12).
// El significado_base, la tensión y el giro NO se envían crudos al frontend:
// son material para que el modelo construya una lectura específica.
export function toContractCard(carta) {
  if (!carta) return null;
  return {
    nombre: carta.nombre,
    numero: carta.numero,
    imagen: carta.imagen,
    detalles_visuales_relevantes: carta.detalles_visuales.slice(0, 3),
    palabras_clave: carta.palabras_clave.slice(0, 5),
    significado_base: carta.significado_base,
    frase_simbolica: carta.frase_simbolica
  };
}
