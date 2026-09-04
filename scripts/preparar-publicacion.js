const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const SALIDA = path.join(RAIZ, "_site");
const VERSION = (process.env.GITHUB_SHA || "local").slice(0, 12);
const ARCHIVOS_PUBLICOS = [
  "index.html",
  "styles.css",
  "app.js",
  "cantos.js",
  "admin-misa.html",
  "admin-misa.css",
  "admin-misa.js"
];

if(path.dirname(SALIDA) !== RAIZ || path.basename(SALIDA) !== "_site"){
  throw new Error("La carpeta pública calculada no es segura.");
}

fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA, { recursive: true });

for(const nombre of ARCHIVOS_PUBLICOS){
  const origen = path.join(RAIZ, nombre);
  const destino = path.join(SALIDA, nombre);
  let contenido = fs.readFileSync(origen, "utf8");
  contenido = contenido.replaceAll("__SITE_VERSION__", VERSION);
  fs.writeFileSync(destino, contenido, "utf8");
}

fs.cpSync(path.join(RAIZ, "assets"), path.join(SALIDA, "assets"), { recursive: true });
fs.writeFileSync(path.join(SALIDA, "version.json"), `${JSON.stringify({
  version: VERSION,
  updatedAt: new Date().toISOString()
}, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(SALIDA, ".nojekyll"), "", "utf8");

console.log(`Publicación preparada en _site con versión ${VERSION}.`);
