import { readFileSync, writeFileSync } from "fs";

const ROOT = "/sessions/beautiful-gracious-goldberg/mnt/Desktop--Tarot";
const BASE = "https://tarot-marsella-docfertoro.pages.dev";

let css = readFileSync(`${ROOT}/src/styles/main.css`, "utf8");
let js  = readFileSync(`${ROOT}/src/main.js`, "utf8");

// --- Transformar main.js para que corra como <script> CLÁSICO desde file:// ---
// 1) Quitar la palabra 'export' (no hay imports en main.js).
js = js.replace(/^\s*export\s+(async\s+function|function|const|let)/gm, "$1");

// 2) Worker y health a URLs absolutas (relativas no resuelven desde file://).
js = js.replace('const WORKER_URL = "/api/tarot";',        `const WORKER_URL = "${BASE}/api/tarot";`);
js = js.replace('const WORKER_HEALTH_URL = "/api/health";', `const WORKER_HEALTH_URL = "${BASE}/api/health";`);

// 3) Imágenes de cartas a URL absoluta (para que se vean en el archivo suelto).
js = js.split('"./cartas/').join(`"${BASE}/cartas/`);

// 4) Normalizar también imágenes que devuelva el Worker en runtime (./cartas -> absoluta).
//    Se envuelve el valor 'imagen' de normalizeCard.
js = js.replace(
  'imagen: String(source.imagen || source.image || fallback.imagen || fallback.image || "").trim(),',
  'imagen: String(source.imagen || source.image || fallback.imagen || fallback.image || "").trim().replace(/^\\.\\/cartas\\//, "' + BASE + '/cartas/"),'
);

// 5) El service worker no aplica desde file://; se neutraliza (ya estaba guardado, pero limpiamos ruido).
js = js.replace(/registerServiceWorker\(\);\s*$/m, "// registerServiceWorker() omitido en el build compartible");

const sanityFlags = {
  quedanExport: /^\s*export\s/m.test(js),
  quedanImport: /^\s*import\s/m.test(js),
  workerAbsoluto: js.includes(`${BASE}/api/tarot`),
  cartasRelativas: js.includes('"./cartas/'),
};

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Tarot de Marsella Libre: lectura simbólica gratuita. No cobra, no predice y no guarda tus datos.">
<meta name="theme-color" content="#101116">
<title>Tarot de Marsella Libre</title>
<!--
  ARCHIVO COMPARTIBLE (build de un solo archivo).
  Generado desde src/main.js + src/styles/main.css.
  · Script clásico (sin módulos ES) para que funcione al abrirlo desde file://.
  · Worker e imágenes apuntan a ${BASE} (funcionan con conexión).
  · Sin conexión: cae a la lectura local, nunca a "solo el fondo".
  NO editar a mano: regenerar con scripts/bundle.mjs.
-->
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;

const OUT = `${ROOT}/Tarot-Libre-compartible.html`;
writeFileSync(OUT, html, "utf8");

console.log("Escrito:", OUT);
console.log("Tamaño KB:", (Buffer.byteLength(html, "utf8") / 1024).toFixed(1));
console.log("Chequeos:", JSON.stringify(sanityFlags, null, 0));
