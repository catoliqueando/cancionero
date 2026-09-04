const MOMENTOS_MISA = [
  { nombre: "Entrada", icono: "🎵", categorias: ["Entrada"] },
  { nombre: "Piedad", icono: "🙏", categorias: ["Piedad"] },
  { nombre: "Gloria", icono: "☀️", categorias: ["Gloria"] },
  { nombre: "Salmo", icono: "📜", categorias: ["Salmo"] },
  { nombre: "Aleluya", icono: "📖", categorias: ["Aleluya"] },
  { nombre: "Ofertorio", icono: "🍞", categorias: ["Ofertorio"] },
  { nombre: "Santo", icono: "🏆", categorias: ["Santo"] },
  { nombre: "Aclamación", icono: "🙌", categorias: ["Aclamación"] },
  { nombre: "Padre Nuestro", icono: "🕯️", categorias: ["Padre Nuestro"] },
  { nombre: "Cordero", icono: "🐑", categorias: ["Cordero", "Cordero de Dios"] },
  { nombre: "Comunión", icono: "✝️", categorias: ["Comunión"] },
  { nombre: "Acción de gracias", icono: "💛", categorias: ["Acción de gracias", "Adoración"] },
  { nombre: "Salida / Mariana", icono: "🌹", categorias: ["Salida", "Marianos"] }
];

const escapeHtml = (valor="") => String(valor).replace(/[&<>"']/g, caracter => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[caracter]));

const normalizar = (valor="") => String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const porTitulo = [...CANTOS].sort((a, b) => a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" }));
let seleccion = MISA_HOY.cantos.map(item => ({ ...item }));

const titulo = document.querySelector("#massTitle");
const subtitulo = document.querySelector("#massSubtitle");
const lista = document.querySelector("#selectionList");
const salida = document.querySelector("#jsonOutput");
const estado = document.querySelector("#adminStatus");

titulo.value = MISA_HOY.titulo || "Cantos de la Santa Misa";
subtitulo.value = MISA_HOY.subtitulo || "";

function datosMomento(nombre){
  return MOMENTOS_MISA.find(item => normalizar(item.nombre) === normalizar(nombre));
}

function primerCantoPara(momento){
  const categorias = (datosMomento(momento)?.categorias || []).map(normalizar);
  return porTitulo.find(canto => categorias.includes(normalizar(canto.categoria))) || porTitulo[0];
}

function opcionesMomentos(actual){
  const conocidos = MOMENTOS_MISA.map(item => item.nombre);
  const nombres = conocidos.some(nombre => normalizar(nombre) === normalizar(actual)) ? conocidos : [actual, ...conocidos];
  return nombres.map(nombre => `<option value="${escapeHtml(nombre)}" ${normalizar(nombre) === normalizar(actual) ? "selected" : ""}>${escapeHtml(nombre)}</option>`).join("");
}

function opcionesCantos(actual){
  return porTitulo.map(canto => `<option value="${escapeHtml(canto.id)}" ${canto.id === actual ? "selected" : ""}>${escapeHtml(canto.titulo)} — ${escapeHtml(canto.categoria)}</option>`).join("");
}

function configuracion(){
  return {
    titulo: titulo.value.trim() || "Cantos de la Santa Misa",
    subtitulo: subtitulo.value.trim(),
    cantos: seleccion.map(item => ({ momento: item.momento, icono: item.icono, id: item.id }))
  };
}

function actualizarSalida(){
  salida.value = `${JSON.stringify(configuracion(), null, 2)}\n`;
}

function renderizar(){
  lista.innerHTML = seleccion.length ? seleccion.map((item, indice) => `
    <div class="admin-row" data-index="${indice}">
      <div class="admin-number" aria-label="Posición ${indice + 1}">${indice + 1}</div>
      <label>
        <span>Momento</span>
        <select data-field="momento" aria-label="Momento del canto ${indice + 1}">${opcionesMomentos(item.momento)}</select>
      </label>
      <label>
        <span>Canto</span>
        <select data-field="id" aria-label="Canto para ${escapeHtml(item.momento)}">${opcionesCantos(item.id)}</select>
      </label>
      <div class="row-actions" aria-label="Acciones para ${escapeHtml(item.momento)}">
        <button class="icon-button" type="button" data-action="up" ${indice === 0 ? "disabled" : ""} aria-label="Subir">↑</button>
        <button class="icon-button" type="button" data-action="down" ${indice === seleccion.length - 1 ? "disabled" : ""} aria-label="Bajar">↓</button>
        <button class="icon-button remove" type="button" data-action="remove" aria-label="Quitar">×</button>
      </div>
    </div>
  `).join("") : `<div class="admin-empty">Todavía no hay cantos. Pulsa “Agregar canto” para comenzar.</div>`;
  actualizarSalida();
}

function avisar(mensaje){
  estado.textContent = mensaje;
  window.setTimeout(() => {
    if(estado.textContent === mensaje) estado.textContent = "";
  }, 5000);
}

document.querySelector("#addSong").addEventListener("click", () => {
  const momento = MOMENTOS_MISA.find(candidato => !seleccion.some(item => normalizar(item.momento) === normalizar(candidato.nombre))) || MOMENTOS_MISA.find(item => item.nombre === "Comunión");
  const canto = primerCantoPara(momento.nombre);
  if(!canto){
    avisar("Primero debes agregar al menos un canto al cancionero.");
    return;
  }
  seleccion.push({ momento: momento.nombre, icono: momento.icono, id: canto.id });
  renderizar();
  lista.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
});

lista.addEventListener("change", evento => {
  const fila = evento.target.closest("[data-index]");
  if(!fila) return;
  const indice = Number(fila.dataset.index);
  if(evento.target.dataset.field === "momento"){
    const momento = datosMomento(evento.target.value);
    seleccion[indice].momento = evento.target.value;
    seleccion[indice].icono = momento?.icono || "🎼";
    const sugerido = primerCantoPara(evento.target.value);
    if(sugerido) seleccion[indice].id = sugerido.id;
    renderizar();
  }else if(evento.target.dataset.field === "id"){
    seleccion[indice].id = evento.target.value;
    actualizarSalida();
  }
});

lista.addEventListener("click", evento => {
  const boton = evento.target.closest("[data-action]");
  const fila = evento.target.closest("[data-index]");
  if(!boton || !fila) return;
  const indice = Number(fila.dataset.index);
  if(boton.dataset.action === "remove") seleccion.splice(indice, 1);
  if(boton.dataset.action === "up" && indice > 0) [seleccion[indice - 1], seleccion[indice]] = [seleccion[indice], seleccion[indice - 1]];
  if(boton.dataset.action === "down" && indice < seleccion.length - 1) [seleccion[indice + 1], seleccion[indice]] = [seleccion[indice], seleccion[indice + 1]];
  renderizar();
});

[titulo, subtitulo].forEach(campo => campo.addEventListener("input", actualizarSalida));

document.querySelector("#copyConfig").addEventListener("click", async () => {
  actualizarSalida();
  try{
    await navigator.clipboard.writeText(salida.value);
    avisar("Configuración copiada. Ya puedes pegarla en GitHub.");
  }catch(_error){
    salida.focus();
    salida.select();
    const copiado = document.execCommand("copy");
    avisar(copiado ? "Configuración copiada. Ya puedes pegarla en GitHub." : "Selecciona el texto y cópialo manualmente.");
  }
});

document.querySelector("#downloadConfig").addEventListener("click", () => {
  actualizarSalida();
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([salida.value], { type: "application/json;charset=utf-8" }));
  enlace.download = "misa-hoy.json";
  enlace.click();
  window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  avisar("Se descargó misa-hoy.json como copia de respaldo.");
});

renderizar();
