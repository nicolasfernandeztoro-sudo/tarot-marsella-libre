# Guia para ampliar la biblioteca simbolica

Esta app puede inspirarse en la tarologia de Alejandro Jodorowsky y en el Tarot de Marsella, pero no debe copiar texto de libros ni presentarse como representacion oficial.

## Objetivo

Convertir notas externas en una biblioteca propia, trazable y segura para `worker/knowledge/marseille-major-arcana.js`.

La unidad de trabajo es una ficha por carta con estos tipos de fuente:

- `fuente_primaria`: observacion directa de la imagen del Tarot de Marsella.
- `investigacion_web`: contraste externo, si existe.
- `interpretacion_tecnica_tarot`: lectura estructural propia de la app.
- `jodorowsky_inspirado`: sintesis transformada e indirecta; no cita.
- `numerologia_externa_app`: capa opcional agregada por la app.
- `decision_diseno_programacion`: reglas de seguridad, UX, privacidad y no prediccion.

## Prompt para el proyecto que leyo el libro

Usar este pedido, sin pedir citas extensas:

```txt
Necesito notas transformadas, no citas, para una app gratuita de lectura simbolica no predictiva del Tarot de Marsella.

Para cada arcano mayor, entrega:
1. conceptos recurrentes en lenguaje propio, maximo 6 bullets;
2. observaciones visuales de la carta, sin copiar texto del libro;
3. tensiones simbolicas posibles, sin prediccion;
4. errores a evitar;
5. preguntas de integracion que devuelvan agencia;
6. relaciones con otros arcanos;
7. advertencias eticas para no diagnosticar, no ordenar y no generar dependencia.

No incluyas citas textuales largas.
No escribas "segun el metodo de Jodorowsky".
Marca todo como inspiracion transformada, no oficial.
```

## Criterios de aceptacion

- La nota no contiene frases largas copiadas.
- La nota no promete resultados.
- La nota no diagnostica.
- La nota no predice futuro como destino fijo.
- La nota no usa cartas invertidas.
- La nota no llama mala a ninguna carta.
- La nota devuelve agencia al consultante.
- La nota distingue fuente primaria, inspiracion transformada y decision de app.

## Formato recomendado para integrar

```js
{
  id: "la-torre",
  fuente_primaria: ["torre abierta", "figuras saliendo", "presion liberada"],
  jodorowsky_inspirado: ["apertura de estructura cerrada", "salida de energia contenida"],
  interpretacion_tecnica_tarot: ["ruptura de forma rigida", "verdad que ya no cabe"],
  decision_diseno_programacion: ["no anunciar catastrofes", "no asustar", "no forzar rupturas"],
  relaciones: ["arcano-sin-nombre", "la-templanza", "el-juicio"]
}
```

## Como usarlo en codigo

1. Agregar la nota como capa breve y transformada.
2. Mantener los campos actuales para compatibilidad.
3. No pegar parrafos del libro.
4. Si hay duda de copyright, resumir mas y volverlo estructura propia.
5. Probar con preguntas de crisis, angustia y prediccion antes de publicar.
