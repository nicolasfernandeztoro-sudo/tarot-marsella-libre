# Especificacion de la app

## Objetivo

Tarot de Marsella Libre ofrece una lectura simbolica gratuita, no predictiva y sin historial. La carta funciona como imagen para pensar una pregunta, no como mandato ni sustituto de ayuda profesional.

## Flujo principal

1. La persona llega a la pantalla inicial y ve el marco: gratis, sin datos guardados, inspirado en tarologia de Alejandro Jodorowsky y Tarot de Marsella.
2. Escribe una pregunta o usa "No se como preguntar".
3. Puede reformular una pregunta predictiva hacia limites, observables y agencia.
4. Elige area y, opcionalmente, prepara la lectura con emocion, busqueda, tipo de situacion, profundidad, tono y etapa vital amplia.
5. El frontend envia al Worker solo los datos necesarios. La fecha exacta no se envia.
6. El Worker selecciona una carta, construye el prompt final y devuelve JSON.
7. El frontend muestra la lectura, nota etica, metodo y contacto.
8. Despues de la lectura aparece un cierre anti-dependencia para llevar algo fuera de la pagina antes de volver a consultar.

## Estados especiales

- Crisis: no se hace lectura; se prioriza seguridad y apoyo humano.
- Angustia alta: lectura sobria, sin alarmismo ni diagnostico.
- Pregunta predictiva: se reformula hacia lo observable y el margen de accion.
- Falla de conexion: no se inventa lectura local; se muestra aviso simple y detalle tecnico solo en el panel de metodo/consola.
- Usuario indeciso: la app debe nombrar deseo de claridad, temor a ceder agencia, limite de uso y forma de cierre.

## Datos

No hay login, cookies, analytics, localStorage ni historial. La pregunta viaja al Worker solo para generar la respuesta. El backend no debe exponer claves API al frontend.

## QA minimo

- Pregunta normal.
- Pregunta predictiva.
- Angustia alta.
- Crisis.
- Usuario indeciso o temor a dependencia.
- Falla del Worker o ruta `/api/tarot` no disponible.

