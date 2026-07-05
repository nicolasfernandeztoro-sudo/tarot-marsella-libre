# Prompt backend y motor del Worker

Documentación del motor de lecturas (`worker/index.js`), desplegado como el Worker
`tarot-ia` en Cloudflare. La página lo llama a través del proxy `dist/_worker.js`
(ruta `/api/tarot`).

Última actualización: julio 2026 — se cambió el modelo primario a Claude Haiku.

---

## 1. Orden de proveedores (motor)

El Worker intenta los modelos en este orden y se queda con la primera respuesta que
pase los filtros éticos y la revisión de calidad (`assessReadingQuality`):

1. **Claude Haiku** (primario) — `claude-haiku-4-5-20251001`, vía API de Anthropic.
2. **Gemini 2.5-flash** (respaldo) — vía Google Generative Language API.
3. **Cloudflare Workers AI** (respaldo) — `@cf/meta/llama-3.2-3b-instruct`.
4. **Lectura local** (`localSymbolicReading`) — sin IA, si todos fallan.

Cada proveedor tiene reintentos definidos en `PROVIDER_ATTEMPTS` (2 cada uno).

> **Por qué Claude primario:** antes el primario era el Llama 3B, un modelo muy
> pequeño para escritura simbólica-psicodinámica en español. Producía texto correcto
> en estructura pero genérico. Ese era el origen de las "respuestas vagas".

Si un proveedor falla (sin key, cuota, error), el sistema **cae al siguiente en
silencio**. Por eso, para saber qué modelo respondió, hay que mirar el campo
`provider` de la respuesta (ver sección 5).

---

## 2. Variables y secretos

En `wrangler.toml` (`[vars]`, valores públicos, no sensibles):

| Variable | Valor por defecto |
|---|---|
| `CLAUDE_MODEL` | `claude-haiku-4-5-20251001` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `CLOUDFLARE_AI_MODEL` | `@cf/meta/llama-3.2-3b-instruct` |

Secretos (cifrados en Cloudflare, **nunca** en el código):

| Secreto | Para qué |
|---|---|
| `CLAUDE_API_KEY` | Autenticar con Anthropic (motor primario) |
| `GEMINI_API_KEY` | Autenticar con Google (respaldo) |

El binding `AI` (Cloudflare Workers AI) se declara en `[ai]` de `wrangler.toml`.

---

## 3. El prompt

El prompt vive en el código, no en este archivo, para no duplicarlo:

- **System prompt:** función `buildSystemPrompt()` en `worker/index.js`. Define rol,
  método (Carta → Pregunta → Tensión → Orden en 10 pasos), prohibiciones, y exige
  responder solo JSON.
- **User prompt:** función `buildUserPrompt()`. Inyecta la pregunta, el formulario,
  la carta seleccionada y la **base simbólica autorizada** de esa carta.

La base simbólica de las 22 cartas está en `worker/knowledge/marseille-major-arcana.js`
(eje, tensión, giro, notas por área, reencuadres de seguridad para las cartas duras).

> Nota: `src/data/deck.js` es una base equivalente para el frontend/documentación,
> pero **el Worker no la usa**: usa la de `worker/knowledge/`.

---

## 4. Contrato JSON de respuesta

El Worker devuelve (y el frontend espera) estas claves. Los nombres deben coincidir
exactamente o el frontend cae a fallback.

```
titulo, modo, provider, alerta,
carta: { nombre, numero, tipo, imagen, significado_base,
         detalles_visuales_relevantes[], frase_simbolica, palabras_clave[] },
pregunta_ordenada,
lo_que_la_pregunta_parece_pedir,
lo_que_la_pregunta_podria_ocultar,
tension_psicodinamica,
lectura_de_la_carta_en_esta_pregunta,
etapa_vital,
resolucion_simbolica,
orientacion_practica,
acto_simbolico_opcional,
pregunta_final,
disclaimer,
fuentes_usadas[]
```

- `modo`: `ia-real` | `fallback-backend` | `seguridad-crisis`.
- `provider`: `claude` | `gemini` | `cloudflare-workers-ai` | `fallback-backend` | `safety`.
- `alerta`: `null` | `predictiva` | `cuidado` | `crisis`.

Con Claude se usa un *prefill* (`{`) para forzar JSON válido; ver `callClaude()`.

---

## 5. Runbook: desplegar y verificar

Desde la carpeta del proyecto (`C:\Users\vcata\Desktop\Tarot`), en PowerShell.
Si `wrangler` no se reconoce, usar `npx wrangler`.

### Desplegar el Worker (motor)

```
npx wrangler login                          # una vez, autoriza en el navegador
npx wrangler secret put CLAUDE_API_KEY      # pegar la key sk-ant-... (queda cifrada)
npx wrangler deploy                          # sube worker/index.js -> tarot-ia
```

### Verificar (sin gastar tokens)

```
node scripts/qa-provider-claude.mjs          # test offline del ruteo -> "TODO OK"
```

### Verificar en vivo (qué modelo responde)

```
npm run qa:ethical
```

Imprime una línea por caso; mirar el campo `provider`:

- `"provider":"claude"` → Claude Haiku está respondiendo. ✅
- `"provider":"gemini"` / `"cloudflare-workers-ai"` → la key no tomó, cayó a respaldo.
- Caso `crisis` → `"provider":"safety"` (correcto: no llama a ningún modelo).

---

## 6. Seguridad y filtros (ya implementados)

- Detección de crisis / angustia / lenguaje predictivo (`buildSafetyProfile`).
- Reencuadre no predictivo automático para preguntas adivinatorias.
- Filtros de lenguaje prohibido y evaluador de genericidad (`assessReadingQuality`)
  que rechaza respuestas vagas y fuerza reintento/otro proveedor.
- CORS restringido a los orígenes de la página (`ALLOWED_ORIGINS`).
- Rate limit por IP (24 solicitudes/minuto).

---

## 7. Estado de fases

### Hecho (julio 2026)

- **Fase 4 (profundidad y tono):** COMPLETADA y en vivo. El frontend (`src/main.js`
  y `dist/src/main.js`) muestra los selectores de `profundidad` (breve/equilibrada/
  profunda) y `tono` (directo/poetico/contenedor) en la sección plegable "PREPARAR
  LA LECTURA", y los envía en el payload a `/api/tarot`. Los valores calzan con
  `ALLOWED_DEPTHS` y `ALLOWED_TONES` del Worker. Defaults: `equilibrada` y `contenedor`.
- **Deploy de la página (Cloudflare Pages):** ESTABLECIDO. Comando en
  `docs/checklist-publicacion.md`. Clave: la rama de producción del proyecto se
  llama `production`, así que hay que desplegar con `--branch=production` (sin ese
  flag el deploy va a una preview `master` y NO actualiza el dominio público).

### Pendiente / futuro

- (Sin pendientes técnicos abiertos por ahora.)

> Recordatorio de higiene del repo: `src/main.js` (fuente) y `dist/src/main.js`
> (espejo desplegado) deben mantenerse idénticos. Tras cualquier edición del
> frontend, sincronizar ambos antes de desplegar.
