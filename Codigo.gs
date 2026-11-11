/**
 * Coloquio Final · Auxiliar en IA · ISFD y T «República Federal de Alemania», El Colorado
 * Martes 17 y martes 24 de noviembre de 2026
 *
 * Servidor de la inscripción: guarda todo en esta planilla y los logos en una
 * carpeta de Google Drive. La clave del ADM queda acá, no en la página.
 */
const CLAVE_ADM = "cacaca";
const CUPO = 32;            // 32 lugares de exposición (16 por martes): cada inscripción ocupa uno, sea individual o de 2 o 3
const HORAS = 12;           // corre desde que el profesor toca «Iniciar» en ADM
const DIAS = ["Martes 17 de noviembre", "Martes 24 de noviembre"];
const COLS = ["ID", "Fecha", "Modalidad", "Integrantes", "N.º proyecto", "Proyecto de la lista", "Nombre del proyecto",
  "Objetivos o descripción", "Herramientas", "ID logo", "Tipo logo", "Lugar", "Día", "Fecha sorteo", "Idea propia"];

/* ---------- utilidades ---------- */
function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Inscripciones");
  if (!sh) {
    sh = ss.insertSheet("Inscripciones");
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight("bold").setBackground("#1B4D3E").setFontColor("#F4F1E8");
  }
  return sh;
}
function carpeta_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty("CARPETA");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("Logos · Coloquio Final 2026");
  p.setProperty("CARPETA", f.getId());
  return f;
}
const prop_ = (k) => PropertiesService.getScriptProperties().getProperty(k);
const setProp_ = (k, v) => PropertiesService.getScriptProperties().setProperty(k, String(v));
function subirVersion_() { setProp_("VER", (Number(prop_("VER")) || 0) + 1); }
function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esAdmin_(b) { return String(b.clave || "").trim().toLowerCase() === CLAVE_ADM; }
function norm_(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-zñ ]/g, " ").replace(/\s+/g, " ").trim(); }
function clave_(s) { return norm_(s).split(" ").filter(Boolean).sort().join(" "); }
function conLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- lectura ---------- */
function filas_() {
  const v = hoja_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (!r[0]) continue;
    let integ = [];
    try { integ = JSON.parse(r[3]); } catch (e) { integ = String(r[3]).split(" · ").filter(Boolean); }
    out.push({
      fila: i + 1, id: String(r[0]), fecha: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      modalidad: String(r[2]), integrantes: integ, proyectoNum: Number(r[4]) || 0, proyectoBase: String(r[5]),
      nombreProyecto: String(r[6]), descripcion: String(r[7]), herramientas: String(r[8]),
      logoId: String(r[9]), logoTipo: String(r[10]), lugar: Number(r[11]) || 0, dia: String(r[12]),
      fechaSorteo: r[13] instanceof Date ? r[13].toISOString() : String(r[13] || ""), ideaPropia: String(r[14] || "")
    });
  }
  return out;
}
function estado_(desde) {
  const ver = Number(prop_("VER")) || 0;
  const base = { ok: true, ver: ver, ahora: Date.now(), apertura: Number(prop_("APERTURA")) || 0, cierre: Number(prop_("CIERRE")) || 0, cupo: CUPO, horas: HORAS, dias: DIAS };
  if (desde !== undefined && desde !== null && desde !== "" && Number(desde) === ver) { base.sinCambios = true; return base; }
  base.inscripciones = filas_().map((x) => { const y = Object.assign({}, x); delete y.fila; return y; });
  return base;
}

/* ---------- entrada ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.accion === "logo") return salida_(logo_(p.id));
    return salida_(estado_(p.desde));
  } catch (err) { return salida_({ ok: false, error: String(err) }); }
}

function doPost(e) {
  let b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) {}
  try {
    switch (b.accion) {
      case "estado": return salida_(estado_(b.desde));
      case "logo": return salida_(logo_(b.id));
      case "inscribir": return salida_(inscribir_(b));
      case "login": return salida_({ ok: esAdmin_(b) });
      case "bolillero": return salida_(conLock_(() => bolillero_(b)));
    }
    if (!esAdmin_(b)) return salida_({ ok: false, error: "clave" });
    switch (b.accion) {
      case "abrir": return salida_(conLock_(() => { const a = Date.now(); setProp_("APERTURA", a); setProp_("CIERRE", a + HORAS * 3600000); subirVersion_(); return estado_(); }));
      case "extender": return salida_(conLock_(() => {
        const h = Math.max(-24, Math.min(48, Number(b.horas) || 1));
        const base = Math.max(Number(prop_("CIERRE")) || Date.now(), Date.now());
        if (!Number(prop_("APERTURA"))) setProp_("APERTURA", Date.now());
        setProp_("CIERRE", base + h * 3600000); subirVersion_(); return estado_();
      }));
      case "cerrar": return salida_(conLock_(() => { setProp_("CIERRE", Date.now()); subirVersion_(); return estado_(); }));
      case "borrarUno": return salida_(conLock_(() => borrarUno_(b.id)));
      case "borrarTodo": return salida_(conLock_(borrarTodo_));
      case "sortear": return salida_(conLock_(() => sortear_(b.id)));
      case "sortearTodos": return salida_(conLock_(sortearTodos_));
      case "quitarLugar": return salida_(conLock_(() => ponerLugar_(b.id, 0)));
      case "reiniciarSorteo": return salida_(conLock_(reiniciarSorteo_));
    }
    return salida_({ ok: false, error: "accion" });
  } catch (err) {
    return salida_({ ok: false, error: String(err) });
  }
}

/* ---------- inscripción ---------- */
function inscribir_(b) {
  return conLock_(() => {
    const admin = esAdmin_(b);
    const ahora = Date.now(), ap = Number(prop_("APERTURA")) || 0, ci = Number(prop_("CIERRE")) || 0;
    if (!admin) {
      if (!ap) return { ok: false, error: "noabierto" };
      if (ahora > ci) return { ok: false, error: "cerrado" };
    }
    const modalidad = b.modalidad === "Grupo" ? "Grupo" : "Individual";
    const integ = (Array.isArray(b.integrantes) ? b.integrantes : []).map((s) => String(s || "").replace(/\s+/g, " ").trim()).filter(Boolean);
    if (modalidad === "Individual" && integ.length !== 1) return { ok: false, error: "integrantes" };
    if (modalidad === "Grupo" && (integ.length < 2 || integ.length > 3)) return { ok: false, error: "integrantes" };
    if (integ.some((s) => s.length < 5 || s.split(" ").length < 2)) return { ok: false, error: "nombres" };
    const num = Math.max(0, Math.min(30, Number(b.proyectoNum) || 0));
    const nombreProyecto = String(b.nombreProyecto || "").trim().slice(0, 120);
    const descripcion = String(b.descripcion || "").trim().slice(0, 2000);
    const herramientas = String(b.herramientas || "").trim().slice(0, 500);
    const ideaPropia = String(b.ideaPropia || "").trim().slice(0, 500);
    if (nombreProyecto.length < 3 || descripcion.length < 15 || herramientas.length < 3) return { ok: false, error: "datos" };
    if (!num && ideaPropia.length < 5) return { ok: false, error: "propio" };
    const m = String(b.logo || "").match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!m) return { ok: false, error: "logo" };

    const lista = filas_();
    if (lista.length >= CUPO) return { ok: false, error: "lleno" };
    if (num) {
      const t = lista.find((x) => x.proyectoNum === num);
      if (t) return { ok: false, error: "tomado", quien: t.integrantes.join(", ") };
    }
    const ya = new Set(); lista.forEach((x) => x.integrantes.forEach((n) => ya.add(clave_(n))));
    const rep = integ.find((n) => ya.has(clave_(n)));
    if (rep) return { ok: false, error: "persona", quien: rep };
    if (new Set(integ.map(clave_)).size !== integ.length) return { ok: false, error: "repetidos" };

    const id = "CF-" + Utilities.getUuid().replace(/-/g, "").slice(0, 5).toUpperCase();
    const ext = (m[1].split("/")[1] || "png").replace("jpeg", "jpg").replace("svg+xml", "svg");
    const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], id + "_" + nombreProyecto.replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g, "").slice(0, 40) + "." + ext);
    const file = carpeta_().createFile(blob);
    hoja_().appendRow([id, new Date(), modalidad, JSON.stringify(integ), num || "", String(b.proyectoBase || (num ? "" : "Proyecto propio")).slice(0, 120),
      nombreProyecto, descripcion, herramientas, file.getId(), m[1], "", "", "", ideaPropia]);
    subirVersion_();
    return { ok: true, id: id, usados: lista.length + 1 };
  });
}

function logo_(id) {
  const f = filas_().find((x) => x.id === String(id || ""));
  if (!f || !f.logoId) return { ok: false, error: "nologo" };
  const file = DriveApp.getFileById(f.logoId);
  return { ok: true, id: f.id, data: "data:" + file.getMimeType() + ";base64," + Utilities.base64Encode(file.getBlob().getBytes()) };
}

/* ---------- administración ---------- */
function borrarUno_(id) {
  const f = filas_().find((x) => x.id === String(id || ""));
  if (!f) return { ok: false, error: "noexiste" };
  if (f.logoId) { try { DriveApp.getFileById(f.logoId).setTrashed(true); } catch (e) {} }
  hoja_().deleteRow(f.fila);
  subirVersion_();
  return estado_();
}
function borrarTodo_() {
  const sh = hoja_(), lista = filas_();
  lista.forEach((f) => { if (f.logoId) { try { DriveApp.getFileById(f.logoId).setTrashed(true); } catch (e) {} } });
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  const p = PropertiesService.getScriptProperties();
  p.deleteProperty("APERTURA"); p.deleteProperty("CIERRE");
  subirVersion_();
  const r = estado_(); r.borrados = lista.length; return r;
}
function diaDe_(lugar) { return lugar ? DIAS[lugar <= 16 ? 0 : 1] : ""; }
function ponerLugar_(id, lugar) {
  const f = filas_().find((x) => x.id === String(id || ""));
  if (!f) return { ok: false, error: "noexiste" };
  hoja_().getRange(f.fila, 12, 1, 3).setValues([[lugar || "", diaDe_(lugar), lugar ? new Date() : ""]]);
  subirVersion_();
  const r = estado_(); r.id = f.id; r.lugar = lugar; return r;
}
function libres_(lista) {
  const usados = new Set(lista.map((x) => x.lugar).filter(Boolean));
  const l = []; for (let i = 1; i <= CUPO; i++) if (!usados.has(i)) l.push(i);
  return l;
}
function sortear_(id) {
  const lista = filas_();
  let f = id ? lista.find((x) => x.id === String(id)) : null;
  if (!f) {
    const sin = lista.filter((x) => !x.lugar);
    if (!sin.length) return { ok: false, error: "todos" };
    f = sin[Math.floor(Math.random() * sin.length)];
  }
  if (f.lugar) return { ok: false, error: "yatiene" };
  const l = libres_(lista);
  if (!l.length) return { ok: false, error: "sinlugar" };
  return ponerLugar_(f.id, l[Math.floor(Math.random() * l.length)]);
}
function sortearTodos_() {
  const sh = hoja_(), lista = filas_(), l = libres_(lista);
  const sin = lista.filter((x) => !x.lugar);
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  const hoy = new Date();
  sin.forEach((f, k) => { if (k < l.length) sh.getRange(f.fila, 12, 1, 3).setValues([[l[k], diaDe_(l[k]), hoy]]); });
  subirVersion_();
  const r = estado_(); r.asignados = Math.min(sin.length, l.length); return r;
}
function reiniciarSorteo_() {
  const sh = hoja_(), n = sh.getLastRow() - 1;
  if (n > 0) sh.getRange(2, 12, n, 3).clearContent();
  subirVersion_();
  return estado_();
}

/* ---------- bolillero: cada alumno sortea su propio lugar con su código ---------- */
function bolillero_(b) {
  const lista = filas_();
  const f = lista.find((x) => x.id === String(b.id || "").trim().toUpperCase());
  if (!f) return { ok: false, error: "noexiste" };
  if (f.lugar) return { ok: true, ya: true, id: f.id, lugar: f.lugar, dia: diaDe_(f.lugar), nombreProyecto: f.nombreProyecto, integrantes: f.integrantes };
  if (!esAdmin_(b)) {
    const ap = Number(prop_("APERTURA")) || 0, ci = Number(prop_("CIERRE")) || 0;
    if (!ap) return { ok: false, error: "noabierto" };
    if (Date.now() > ci) return { ok: false, error: "cerrado" };
  }
  const l = libres_(lista);
  if (!l.length) return { ok: false, error: "sinlugar" };
  const lugar = l[Math.floor(Math.random() * l.length)];
  const r = ponerLugar_(f.id, lugar);
  r.dia = diaDe_(lugar); r.nombreProyecto = f.nombreProyecto; r.integrantes = f.integrantes;
  return r;
}
