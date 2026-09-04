
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

function extraerYoutubeId(valor=""){
  try{
    const url = new URL(valor);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";
    if(host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if(host === "youtube.com" || host === "m.youtube.com"){
      id = url.searchParams.get("v") || "";
      if(!id && /^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }catch(_error){
    return "";
  }
}

function urlAudioSegura(valor=""){
  if(/^https:\/\/[^\s<>"']+$/i.test(valor)) return valor;
  if(/^assets\/audio\/[A-Za-z0-9._/-]+$/i.test(valor) && !valor.includes("..")) return valor;
  return "";
}

const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const INDICES_NOTAS = { C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3, E:4, F:5, "F#":6, Gb:6, G:7, "G#":8, Ab:8, A:9, "A#":10, Bb:10, B:11 };

function transponerParte(parte, pasos){
  const coincidencia = parte.match(/^([A-G](?:#|b)?)(.*)$/);
  if(!coincidencia || INDICES_NOTAS[coincidencia[1]] === undefined) return parte;
  const indice = (INDICES_NOTAS[coincidencia[1]] + pasos + 120) % 12;
  return `${NOTAS[indice]}${coincidencia[2]}`;
}

function transponerAcorde(acorde, pasos){
  const [principal, bajo, ...resto] = acorde.split("/");
  const acordeTranspuesto = transponerParte(principal, pasos);
  if(!bajo) return acordeTranspuesto;
  return `${acordeTranspuesto}/${transponerParte(bajo, pasos)}${resto.length ? `/${resto.join("/")}` : ""}`;
}

function renderizarLetraConAcordes(texto){
  return texto.split("\n").map(linea => {
    if(!linea) return `<div class="chord-line is-empty" aria-hidden="true">&nbsp;</div>`;

    const segmentos = [];
    const patron = /\[([^\]\r\n]+)\]/g;
    let acordePendiente = "";
    let ultimoIndice = 0;
    let coincidencia;

    while((coincidencia = patron.exec(linea))){
      const textoAnterior = linea.slice(ultimoIndice, coincidencia.index);
      if(textoAnterior || acordePendiente) segmentos.push({ acorde: acordePendiente, texto: textoAnterior });
      acordePendiente = coincidencia[1];
      ultimoIndice = patron.lastIndex;
    }
    segmentos.push({ acorde: acordePendiente, texto: linea.slice(ultimoIndice) });

    return `<div class="chord-line">${segmentos.map(segmento => `<span class="chord-segment"><span class="chord-name" data-chord="${esc(segmento.acorde)}" aria-hidden="true">${esc(segmento.acorde)}</span><span class="chord-text">${esc(segmento.texto) || "&nbsp;"}</span></span>`).join("")}</div>`;
  }).join("");
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
  const youtubeId = extraerYoutubeId(c.youtube);
  const audio = urlAudioSegura(c.audio);

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
    <div class="song-toolbar">
      <div class="media-actions">
        ${c.letraAcordes ? `<button class="tool-btn" id="toggleChords" type="button" aria-pressed="false"><span aria-hidden="true">🎸</span> Ver acordes</button>` : ""}
        ${youtubeId ? `<button class="tool-btn" id="toggleYoutube" type="button" aria-expanded="false"><span aria-hidden="true">▶</span> Ver video</button>` : ""}
      </div>
      <div class="lyrics-controls" role="group" aria-label="Tamaño de la letra">
        <button class="small-btn" id="minusFont" aria-label="Reducir letra">A−</button>
        <button class="small-btn" id="plusFont" aria-label="Aumentar letra">A+</button>
      </div>
    </div>
    ${c.letraAcordes ? `
      <div class="transpose-controls" id="transposeControls" hidden>
        <span>Transportar acordes</span>
        <button class="small-btn" id="transposeDown" type="button" aria-label="Bajar medio tono">−</button>
        <strong id="transposeLabel">Tono: ${esc(c.tono || "original")}</strong>
        <button class="small-btn" id="transposeUp" type="button" aria-label="Subir medio tono">＋</button>
      </div>
    ` : ""}
    ${youtubeId ? `
      <div class="media-panel youtube-panel" id="youtubePlayer" data-youtube-id="${youtubeId}" hidden>
        <div class="video-slot"></div>
        <a href="https://www.youtube.com/watch?v=${youtubeId}" target="_blank" rel="noopener">Abrir este canto en YouTube ↗</a>
      </div>
    ` : ""}
    ${audio ? `
      <div class="media-panel audio-panel">
        <strong>Audio MP3</strong>
        <audio controls preload="none" src="${esc(audio)}">Tu navegador no puede reproducir este audio.</audio>
      </div>
    ` : ""}
    <article class="lyrics" id="lyrics" data-song-id="${esc(c.id)}">${esc(c.letra)}</article>
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
    const cantoActual = songById(lyrics.dataset.songId);
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

    const toggleChords = $("#toggleChords");
    const transposeControls = $("#transposeControls");
    if(toggleChords && cantoActual?.letraAcordes){
      let acordesVisibles = false;
      let semitonos = 0;

      const actualizarTransposicion = () => {
        document.querySelectorAll("[data-chord]").forEach(elemento => {
          elemento.textContent = transponerAcorde(elemento.dataset.chord, semitonos);
        });
        const tono = cantoActual.tono ? transponerAcorde(cantoActual.tono, semitonos) : `original ${semitonos >= 0 ? "+" : ""}${semitonos}`;
        $("#transposeLabel").textContent = `Tono: ${tono}`;
        $("#transposeDown").disabled = semitonos <= -11;
        $("#transposeUp").disabled = semitonos >= 11;
      };

      toggleChords.addEventListener("click", () => {
        acordesVisibles = !acordesVisibles;
        toggleChords.setAttribute("aria-pressed", String(acordesVisibles));
        toggleChords.innerHTML = acordesVisibles ? `<span aria-hidden="true">🎸</span> Ocultar acordes` : `<span aria-hidden="true">🎸</span> Ver acordes`;
        transposeControls.hidden = !acordesVisibles;
        lyrics.classList.toggle("with-chords", acordesVisibles);
        if(acordesVisibles){
          lyrics.innerHTML = renderizarLetraConAcordes(cantoActual.letraAcordes);
          actualizarTransposicion();
        }else{
          lyrics.textContent = cantoActual.letra;
        }
      });

      $("#transposeDown").addEventListener("click", () => {
        semitonos = Math.max(-11, semitonos - 1);
        actualizarTransposicion();
      });
      $("#transposeUp").addEventListener("click", () => {
        semitonos = Math.min(11, semitonos + 1);
        actualizarTransposicion();
      });
    }

    const toggleYoutube = $("#toggleYoutube");
    const youtubePlayer = $("#youtubePlayer");
    if(toggleYoutube && youtubePlayer){
      toggleYoutube.addEventListener("click", () => {
        const abrir = youtubePlayer.hidden;
        youtubePlayer.hidden = !abrir;
        toggleYoutube.setAttribute("aria-expanded", String(abrir));
        toggleYoutube.innerHTML = abrir ? `<span aria-hidden="true">▶</span> Ocultar video` : `<span aria-hidden="true">▶</span> Ver video`;
        const espacio = youtubePlayer.querySelector(".video-slot");
        espacio.innerHTML = abrir ? `<iframe src="https://www.youtube-nocookie.com/embed/${youtubePlayer.dataset.youtubeId}?rel=0" title="Video de ${esc(cantoActual?.titulo || "este canto")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : "";
        if(abrir) youtubePlayer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
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
