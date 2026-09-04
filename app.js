
const CATEGORIAS_BASE = [
  ["Entrada","🎵"], ["Piedad","🙏"], ["Gloria","☀️"], ["Salmo","📜"],
  ["Aleluya","📖"], ["Ofertorio","🍞"], ["Santo","🏆"], ["Aclamación","🙌"],
  ["Padre Nuestro","🕯️"], ["Cordero de Dios","🐑"], ["Comunión","✝️"],
  ["Acción de gracias","💛"], ["Marianos","🌹"], ["Espíritu Santo","🕊️"],
  ["Adoración","🙏"], ["Salida","🎶"]
];

const iconosCategoria = new Map(CATEGORIAS_BASE.map(([nombre, icono]) => [nombre.toLowerCase(), icono]));
const categoriasConocidas = new Set(CATEGORIAS_BASE.map(([nombre]) => nombre.toLowerCase()));
const categoriasNuevas = CANTOS
  .map(canto => canto.categoria)
  .filter(categoria => {
    const clave = categoria.toLowerCase();
    if(categoriasConocidas.has(clave)) return false;
    categoriasConocidas.add(clave);
    return true;
  })
  .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
const CATEGORIAS = [
  ...CATEGORIAS_BASE,
  ...categoriasNuevas.map(categoria => [categoria, iconosCategoria.get(categoria.toLowerCase()) || "🎼"])
];

const $ = (sel) => document.querySelector(sel);
const esc = (s="") => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function songById(id){ return CANTOS.find(c => c.id === id); }

function cantosDeMisa(){
  return MISA_HOY.cantos
    .map((item, indice) => ({ item, indice, canto: songById(item.id) }))
    .filter(entrada => entrada.canto);
}

function home(){
  return `
    <section class="hero-card home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <div class="eyebrow">Cancionero parroquial</div>
        <h1 id="home-title">Cantemos juntos al Señor</h1>
        <p class="lead">Ten a mano los cantos de la celebración y acompaña a la comunidad desde tu celular.</p>
        <div class="actions">
          <a class="btn btn-primary" href="#/misa">
            <span aria-hidden="true">⛪</span>
            <span>Cantos de la Misa de hoy</span>
          </a>
          <a class="btn btn-secondary" href="#/buscar">
            <span aria-hidden="true">⌕</span>
            <span>Buscar un canto</span>
          </a>
        </div>
      </div>
      <div class="hero-mark" aria-hidden="true">♫</div>
    </section>

    <section class="section">
      <div class="section-title">
        <div>
          <div class="eyebrow">Acceso rápido</div>
          <h2>Buscar por categoría</h2>
        </div>
      </div>
      <div class="grid">
        ${CATEGORIAS.map(([cat,icon]) => `
          <a class="card" href="#/categoria/${encodeURIComponent(cat)}">
            <div class="card-icon" aria-hidden="true">${icon}</div>
            <h3>${esc(cat)}</h3>
            <p>Ver cantos de ${esc(cat.toLowerCase())}</p>
          </a>
        `).join("")}
      </div>
    </section>

    <section class="section">
      <div class="note"><span aria-hidden="true">💡</span> El mismo enlace y el mismo QR pueden permanecer impresos. Solo actualizas los cantos de la Misa cuando sea necesario.</div>
    </section>
  `;
}

function misa(){
  const seleccion = cantosDeMisa();
  return `
    <a class="back" href="#/">← Inicio</a>
    <section class="hero-card page-intro">
      <div class="eyebrow">Celebración</div>
      <h2>${esc(MISA_HOY.titulo)}</h2>
      <p class="lead">${esc(MISA_HOY.subtitulo)}</p>
    </section>
    <section class="section mass-list">
      ${seleccion.map(({item, indice, canto}) => {
        return `<a class="row" href="#/misa/canto/${indice}/${encodeURIComponent(canto.id)}">
          <div class="row-icon" aria-hidden="true">${item.icono}</div>
          <div class="row-main">
            <div class="row-title">${esc(item.momento)}</div>
            <div class="row-sub">${esc(canto.titulo)}</div>
          </div>
          <div class="chev" aria-hidden="true">›</div>
        </a>`;
      }).join("")}
    </section>
  `;
}

function categoria(cat){
  const songs = CANTOS.filter(c => c.categoria.toLowerCase() === cat.toLowerCase());
  return `
    <a class="back" href="#/">← Inicio</a>
    <section class="hero-card page-intro">
      <div class="eyebrow">Categoría</div>
      <h2>${esc(cat)}</h2>
      <p class="lead">${songs.length} canto${songs.length===1?"":"s"} disponible${songs.length===1?"":"s"}.</p>
    </section>
    <section class="section song-list">
      ${songs.length ? songs.map(c => rowSong(c)).join("") : `<div class="empty">Todavía no hay cantos en esta categoría.</div>`}
    </section>
  `;
}

function rowSong(c){
  return `<a class="row" href="#/canto/${encodeURIComponent(c.id)}">
    <div class="row-icon" aria-hidden="true">🎼</div>
    <div class="row-main">
      <div class="row-title">${esc(c.titulo)}</div>
      <div class="row-sub">${esc(c.categoria)}</div>
    </div>
    <div class="chev" aria-hidden="true">›</div>
  </a>`;
}

function buscar(){
  return `
    <a class="back" href="#/">← Inicio</a>
    <section class="hero-card page-intro">
      <div class="eyebrow">Cancionero</div>
      <h2>Buscar un canto</h2>
      <div class="search-wrap">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <label class="sr-only" for="search">Buscar por nombre o categoría</label>
        <input id="search" type="search" autocomplete="off" enterkeyhint="search" placeholder="Nombre o categoría">
      </div>
    </section>
    <section class="section song-list" id="results">${CANTOS.map(rowSong).join("")}</section>
  `;
}

function enlaceMisa(entrada, texto, clase=""){
  if(!entrada) return `<span class="song-pager-link is-disabled ${clase}" aria-hidden="true"></span>`;
  return `<a class="song-pager-link ${clase}" href="#/misa/canto/${entrada.indice}/${encodeURIComponent(entrada.canto.id)}">${texto}</a>`;
}

function canto(id, indiceMisa=null){
  const c = songById(id);
  if(!c) return `<a class="back" href="#/">← Inicio</a><div class="empty">No encontré ese canto.</div>`;

  const seleccion = cantosDeMisa();
  let posicion = indiceMisa === null ? -1 : seleccion.findIndex(entrada => entrada.indice === indiceMisa && entrada.canto.id === id);
  if(posicion === -1 && indiceMisa !== null) posicion = seleccion.findIndex(entrada => entrada.canto.id === id);
  const enMisa = posicion >= 0;
  const anterior = enMisa ? seleccion[posicion - 1] : null;
  const siguiente = enMisa ? seleccion[posicion + 1] : null;
  const momento = enMisa ? seleccion[posicion].item.momento : "";

  return `
    <a class="back" href="${enMisa ? "#/misa" : "javascript:history.back()"}">← ${enMisa ? "Lista de la Misa" : "Volver"}</a>
    ${enMisa ? `
      <div class="mass-progress" aria-label="Canto ${posicion + 1} de ${seleccion.length}">
        <span>${esc(momento)}</span>
        <strong>${posicion + 1} de ${seleccion.length}</strong>
      </div>
    ` : ""}
    <div class="song-head">
      <div class="eyebrow">Letra del canto</div>
      <h2>${esc(c.titulo)}</h2>
      <div class="song-meta">
        <span class="badge">${esc(c.categoria)}</span>
        ${c.momento && c.momento !== c.categoria ? `<span class="badge">Momento: ${esc(c.momento)}</span>` : ""}
        ${c.autor ? `<span class="badge">Autor: ${esc(c.autor)}</span>` : ""}
        ${c.compositor ? `<span class="badge">Compositor: ${esc(c.compositor)}</span>` : ""}
        ${c.anio ? `<span class="badge">Año: ${esc(c.anio)}</span>` : ""}
        ${c.tono ? `<span class="badge">Tono: ${esc(c.tono)}</span>` : ""}
      </div>
      ${c.observaciones ? `<p class="song-note">${esc(c.observaciones)}</p>` : ""}
    </div>
    <div class="lyrics-controls" role="group" aria-label="Tamaño de la letra">
      <button class="small-btn" id="minusFont" aria-label="Reducir letra">A−</button>
      <button class="small-btn" id="plusFont" aria-label="Aumentar letra">A+</button>
    </div>
    <article class="lyrics" id="lyrics">${esc(c.letra)}</article>
    ${enMisa ? `
      <nav class="song-pager" aria-label="Navegación entre cantos de la Misa">
        ${enlaceMisa(anterior, `<span aria-hidden="true">←</span><span><small>Anterior</small>${anterior ? esc(anterior.canto.titulo) : ""}</span>`, "is-previous")}
        ${enlaceMisa(siguiente, `<span><small>Siguiente</small>${siguiente ? esc(siguiente.canto.titulo) : ""}</span><span aria-hidden="true">→</span>`, "is-next")}
      </nav>
    ` : ""}
  `;
}

function router(){
  const app = $("#app");
  const hash = decodeURIComponent(location.hash || "#/");
  const parts = hash.slice(2).split("/");
  const route = parts[0] || "";

  if(route === "misa" && parts[1] === "canto") {
    const indice = Number.parseInt(parts[2], 10);
    app.innerHTML = canto(parts.slice(3).join("/"), Number.isNaN(indice) ? null : indice);
  }
  else if(route === "misa") app.innerHTML = misa();
  else if(route === "buscar") app.innerHTML = buscar();
  else if(route === "categoria") app.innerHTML = categoria(parts.slice(1).join("/"));
  else if(route === "canto") app.innerHTML = canto(parts.slice(1).join("/"));
  else app.innerHTML = home();

  window.scrollTo({top:0, behavior:"instant"});
  bind();
}

function bind(){
  const search = $("#search");
  if(search){
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      const filtered = CANTOS.filter(c =>
        c.titulo.toLowerCase().includes(q) ||
        c.categoria.toLowerCase().includes(q)
      );
      $("#results").innerHTML = filtered.length
        ? filtered.map(rowSong).join("")
        : `<div class="empty">No encontramos cantos con “${esc(search.value)}”.</div>`;
    });
  }

  const lyrics = $("#lyrics");
  if(lyrics){
    let size = Number(localStorage.getItem("lyricsFontSize") || 1.22);
    lyrics.style.fontSize = size + "rem";
    $("#plusFont")?.addEventListener("click", () => {
      size = Math.min(1.8, size + .1);
      lyrics.style.fontSize = size + "rem";
      localStorage.setItem("lyricsFontSize", size);
    });
    $("#minusFont")?.addEventListener("click", () => {
      size = Math.max(.95, size - .1);
      lyrics.style.fontSize = size + "rem";
      localStorage.setItem("lyricsFontSize", size);
    });
  }
}

window.addEventListener("hashchange", router);

const VERSION_SITIO = document.querySelector('meta[name="site-version"]')?.content || "";
let revisionEnCurso = false;

function recargarVersion(version){
  const url = new URL(location.href);
  url.searchParams.set("version", version);
  location.replace(url.toString());
}

function mostrarActualizacion(version){
  if(document.querySelector("#updateNotice")) return;
  const aviso = document.createElement("button");
  aviso.id = "updateNotice";
  aviso.className = "update-notice";
  aviso.type = "button";
  aviso.innerHTML = `<span aria-hidden="true">↻</span> Hay cantos nuevos. Toca para actualizar.`;
  aviso.addEventListener("click", () => recargarVersion(version));
  document.body.appendChild(aviso);
}

async function revisarActualizacion(){
  if(revisionEnCurso || !VERSION_SITIO || VERSION_SITIO.includes("__") || VERSION_SITIO === "local") return;
  revisionEnCurso = true;
  try{
    const respuesta = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if(!respuesta.ok) return;
    const datos = await respuesta.json();
    if(!datos.version || datos.version === VERSION_SITIO) return;
    const ruta = location.hash || "#/";
    if(ruta === "#/" || ruta === "#/misa") recargarVersion(datos.version);
    else mostrarActualizacion(datos.version);
  }catch(_error){
    // Sin conexión: el cancionero sigue funcionando con la versión ya cargada.
  }finally{
    revisionEnCurso = false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  router();
  window.setTimeout(revisarActualizacion, 1500);
  window.setInterval(revisarActualizacion, 60 * 1000);
});
window.addEventListener("focus", revisarActualizacion);
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible") revisarActualizacion();
});
