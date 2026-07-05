# Auditoria del comite de alivio y seguridad

Fecha: 2026-06-28

## Comite simulado

- Direccion clinica/etica.
- Psicologia clinica.
- Bioetica y etica digital.
- UX writing.
- Seguridad de IA.
- Representante de usuarios.
- Edicion simbolica/tarologica.

## Auditoria inicial

### Hallazgos

1. La pagina ya protege bien contra prediccion, crisis y dependencia.
2. El flujo transmite privacidad y gratuidad con claridad.
3. La respuesta puede aliviar, pero aun depende demasiado de la calidad variable del modelo.
4. QA detecto un problema de confianza: titulos con mezcla de idioma o frases cortadas.
5. Las recomendaciones estaban demasiado inhibidas: por seguridad no daban ordenes, pero a veces tampoco ofrecian un gesto practicable de alivio.

### Diagnostico

El sistema es eticamente prudente, pero necesita una capa mas fuerte de calidad afectiva: no basta con que la respuesta sea segura; debe sonar humana, cerrada, practicable y capaz de bajar un poco la carga sin capturar al consultante.

## Primera votacion

- Direccion clinica/etica: aprueba con cambios.
- Psicologia clinica: aprueba con cambios.
- Bioetica: aprueba con cambios.
- UX writing: rechaza hasta corregir titulos y cierre practico.
- Seguridad IA: aprueba con controles automatizados.
- Representante de usuarios: aprueba con cambios.
- Edicion simbolica: aprueba.

Resultado: plan aprobado condicionalmente.

## Plan propuesto

1. Controlar titulos: español, frase completa, sin mezcla de idioma.
2. Permitir recomendaciones solo si son opcionales, pequeñas, seguras y practicables hoy.
3. Exigir un gesto minimo de alivio o regulacion en respuestas no crisis.
4. Mantener crisis fuera del modo simbolico: seguridad primero.
5. Agregar QA para detectar titulos debiles, ingles accidental y ausencia de gesto practico.

## Segunda votacion

Modificacion solicitada por direccion clinica y bioetica:

- No llamar "recomendaciones" a instrucciones. Deben aparecer como "puedes considerar", "si te sirve", "un gesto pequeño", o formulaciones equivalentes.
- En crisis no se exige alivio simbolico: se exige contacto humano y urgencia.
- Si el modelo falla en calidad, debe caer a fallback backend seguro.

Votacion final:

- Direccion clinica/etica: aprueba.
- Psicologia clinica: aprueba.
- Bioetica: aprueba.
- UX writing: aprueba.
- Seguridad IA: aprueba.
- Representante de usuarios: aprueba.
- Edicion simbolica: aprueba.

Resultado: plan modificado aprobado por unanimidad.

## Ejecucion

Se implemento:

- Regla de prompt para titulos breves, completos y en español.
- Regla de prompt para recomendaciones opcionales, seguras y practicables.
- Filtro de calidad contra mezcla de ingles.
- Filtro de calidad contra titulos incompletos.
- Filtro de calidad que exige gesto practico de alivio en respuestas no crisis.
- QA automatizado para esos criterios.

## Criterio final del comite

Una respuesta aceptable debe aliviar sin capturar: baja un poco la carga, devuelve agencia, propone un gesto pequeño y deja claro que la vida del consultante no queda subordinada a la lectura.

