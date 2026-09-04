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
  ["YOUTUBE", "youtube"],
  ["AUDIO", "audio"],
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

function obtenerYoutubeId(valor) {
  if (!valor) return "";
  try {
    const url = new URL(valor);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";

    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com") {
      id = url.searchParams.get("v") || "";
      if (!id && /^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch (_error) {
    return "";
  }
}

function audioValido(valor) {
  if (!valor) return true;
  if (/^https:\/\/[^\s<>"']+$/i.test(valor)) return true;
  return /^assets\/audio\/[A-Za-z0-9._/-]+$/i.test(valor) && !valor.includes("..");
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
  const tieneAcordes = /\[[^\]\r\n]+\]/.test(letra);
  const letraSinAcordes = letra.replace(/\[[^\]\r\n]+\]/g, "").trim();
  const id = crearId(nombreArchivo);

  if (!id) throw new Error(`${nombreArchivo}: el nombre del archivo no permite crear un ID.`);
  if (!datos.titulo) throw new Error(`${nombreArchivo}: falta TITULO.`);
  if (!datos.categoria) throw new Error(`${nombreArchivo}: falta CATEGORIA.`);
  if (!letraSinAcordes) throw new Error(`${nombreArchivo}: la LETRA está vacía.`);
  if (datos.youtube && !obtenerYoutubeId(datos.youtube)) {
    throw new Error(`${nombreArchivo}: YOUTUBE no contiene un enlace válido de YouTube.`);
  }
  if (!audioValido(datos.audio)) {
    throw new Error(`${nombreArchivo}: AUDIO debe ser una URL https o una ruta dentro de assets/audio/.`);
  }

  return {
    id,
    titulo: datos.titulo,
    categoria: datos.categoria,
    autor: datos.autor || "",
    ...(datos.compositor ? { compositor: datos.compositor } : {}),
    ...(datos.anio ? { anio: datos.anio } : {}),
    ...(datos.tono ? { tono: datos.tono } : {}),
    ...(datos.youtube ? { youtube: datos.youtube } : {}),
    ...(datos.audio ? { audio: datos.audio } : {}),
    ...(datos.observaciones ? { observaciones: datos.observaciones } : {}),
    ...(datos.momento ? { momento: datos.momento } : {}),
    letra: letraSinAcordes,
    ...(tieneAcordes ? { letraAcordes: letra } : {})
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
