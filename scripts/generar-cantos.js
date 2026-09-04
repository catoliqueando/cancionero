const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const CARPETA_CANTOS = path.join(RAIZ, "cantos");
const ARCHIVO_MISA = path.join(RAIZ, "misa-hoy.json");
const ARCHIVO_SALIDA = path.join(RAIZ, "cantos.js");

const CAMPOS = new Map([
  ["TITULO", "titulo"],
  ["CATEGORIA", "categoria"],
  ["AUTOR", "autor"],
  ["COMPOSITOR", "compositor"],
  ["ANO", "anio"],
  ["TONO", "tono"],
  ["OBSERVACIONES", "observaciones"],
  ["MOMENTO", "momento"]
]);

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function crearId(nombreArchivo) {
  return path.basename(nombreArchivo, path.extname(nombreArchivo))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function leerCanto(nombreArchivo) {
  const ruta = path.join(CARPETA_CANTOS, nombreArchivo);
  const lineas = fs.readFileSync(ruta, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  const indiceLetra = lineas.findIndex(linea => normalizar(linea) === "LETRA:");

  if (indiceLetra === -1) {
    throw new Error(`${nombreArchivo}: falta la línea LETRA:`);
  }

  const datos = {};
  for (const linea of lineas.slice(0, indiceLetra)) {
    const separador = linea.indexOf(":");
    if (separador === -1) continue;

    const campo = CAMPOS.get(normalizar(linea.slice(0, separador)));
    const valor = linea.slice(separador + 1).trim();
    if (campo && valor) datos[campo] = valor;
  }

  const letra = lineas.slice(indiceLetra + 1).join("\n").trim();
  const id = crearId(nombreArchivo);

  if (!id) throw new Error(`${nombreArchivo}: el nombre del archivo no permite crear un ID.`);
  if (!datos.titulo) throw new Error(`${nombreArchivo}: falta TITULO.`);
  if (!datos.categoria) throw new Error(`${nombreArchivo}: falta CATEGORIA.`);
  if (!letra) throw new Error(`${nombreArchivo}: la LETRA está vacía.`);

  return {
    id,
    titulo: datos.titulo,
    categoria: datos.categoria,
    autor: datos.autor || "",
    ...(datos.compositor ? { compositor: datos.compositor } : {}),
    ...(datos.anio ? { anio: datos.anio } : {}),
    ...(datos.tono ? { tono: datos.tono } : {}),
    ...(datos.observaciones ? { observaciones: datos.observaciones } : {}),
    ...(datos.momento ? { momento: datos.momento } : {}),
    letra
  };
}

function ejecutar() {
  const archivos = fs.readdirSync(CARPETA_CANTOS)
    .filter(nombre => nombre.toLowerCase().endsWith(".txt"));

  if (!archivos.length) throw new Error("No hay archivos .txt dentro de /cantos.");

  const cantos = archivos
    .map(leerCanto)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" }));

  const ids = new Set();
  for (const canto of cantos) {
    if (ids.has(canto.id)) throw new Error(`ID repetido: ${canto.id}`);
    ids.add(canto.id);
  }

  const misa = JSON.parse(fs.readFileSync(ARCHIVO_MISA, "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(misa.cantos)) throw new Error("misa-hoy.json debe contener una lista llamada cantos.");

  const faltantes = misa.cantos.filter(item => !ids.has(item.id));
  if (faltantes.length) {
    throw new Error(`MISA_HOY usa IDs inexistentes: ${faltantes.map(item => item.id).join(", ")}`);
  }

  const aviso = `/*
  ARCHIVO GENERADO AUTOMÁTICAMENTE.

  Para agregar o editar un canto, modifica los archivos .txt de /cantos
  y ejecuta: node scripts/generar-cantos.js

  No edites este archivo a mano porque los cambios se reemplazarán.
*/`;

  const contenido = `${aviso}\n\nconst CANTOS = ${JSON.stringify(cantos, null, 2)};\n\nconst MISA_HOY = ${JSON.stringify(misa, null, 2)};\n`;
  fs.writeFileSync(ARCHIVO_SALIDA, contenido, "utf8");
  console.log(`Cancionero generado: ${cantos.length} canto${cantos.length === 1 ? "" : "s"}.`);
}

try {
  ejecutar();
} catch (error) {
  console.error(`No se pudo generar el cancionero: ${error.message}`);
  process.exitCode = 1;
}
