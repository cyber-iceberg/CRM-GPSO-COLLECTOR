// =====================================================================
//  app/peritacion/lib/almacen.js
//  Local primero, nube después.
//
//  Una peritación son 45 minutos en la calle, en Alemania, con la red
//  que haya. Nada puede depender de que Supabase conteste:
//    · El estado se escribe en localStorage en cada toque (síncrono).
//    · La sincronización con Supabase va con retraso y reintentos.
//    · Las fotos se comprimen y se encolan en IndexedDB; suben cuando
//      vuelve la red.
//  Si el móvil se queda sin batería, al volver a entrar está todo.
// =====================================================================

const K = (id) => `peritacion:${id}`;
const K_INDICE = 'peritacion:indice';
const BUCKET = 'peritaciones';

/* ==================================================== estado (localStorage) */
export function leerLocal(id) {
  try { const s = localStorage.getItem(K(id)); return s ? JSON.parse(s) : null; }
  catch { return null; }
}

export function escribirLocal(id, datos) {
  try {
    localStorage.setItem(K(id), JSON.stringify({ ...datos, _local: Date.now() }));
    const idx = listarLocales().filter((x) => x.id !== id);
    idx.unshift({ id, modelo: datos.ficha?.modelo || '', ts: Date.now(), pendiente: true });
    localStorage.setItem(K_INDICE, JSON.stringify(idx.slice(0, 30)));
    return true;
  } catch (e) {
    // cuota llena: casi siempre son fotos pendientes acumuladas
    console.warn('[peritacion] no se pudo guardar en local', e);
    return false;
  }
}

export function listarLocales() {
  try { return JSON.parse(localStorage.getItem(K_INDICE) || '[]'); } catch { return []; }
}

export function marcarSincronizada(id) {
  const idx = listarLocales().map((x) => (x.id === id ? { ...x, pendiente: false } : x));
  try { localStorage.setItem(K_INDICE, JSON.stringify(idx)); } catch {}
}

export function borrarLocal(id) {
  try {
    localStorage.removeItem(K(id));
    localStorage.setItem(K_INDICE, JSON.stringify(listarLocales().filter((x) => x.id !== id)));
  } catch {}
}

/* ============================================================ sincronización */
export async function sincronizar(supabase, id, { ficha, respuestas, costes, cierre }) {
  const { data, error } = await supabase.rpc('guardar_peritacion', {
    p_id: id,
    p_ficha: ficha,
    p_respuestas: respuestas,
    p_costes: costes,
    p_cierre: cierre,
  });
  if (error) return { ok: false, error: 'red' };
  if (!data?.ok) return { ok: false, error: data?.error || 'desconocido' };
  marcarSincronizada(id);
  return { ok: true };
}

/* Sube todo lo que quedó pendiente. Llamar al recuperar conexión. */
export async function sincronizarPendientes(supabase) {
  const pendientes = listarLocales().filter((x) => x.pendiente);
  const hechas = [];
  for (const p of pendientes) {
    const d = leerLocal(p.id);
    if (!d) continue;
    const r = await sincronizar(supabase, p.id, d);
    if (r.ok) hechas.push(p.id);
  }
  return hechas;
}

/* ==================================================== fotos: compresión */
/* 4G alemana + 35 fotos de 4 MB no es plan. A 1600px y WebP quedan en
   ~150-250 KB sin perder detalle útil para ver un repintado.          */
export async function comprimirImagen(file, maxLado = 1600, calidad = 0.82) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((res) =>
    canvas.toBlob(res, 'image/webp', calidad) || res(null));
  return blob || file;   // si el navegador no sabe WebP, va el original
}

/* ==================================================== fotos: cola offline */
const DB_NAME = 'peritacion-fotos';
const DB_STORE = 'cola';

function abrirDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE))
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function conStore(modo, fn) {
  const db = await abrirDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, modo);
    const out = fn(tx.objectStore(DB_STORE));
    tx.oncomplete = () => res(out?.result ?? out);
    tx.onerror = () => rej(tx.error);
  });
}

export async function encolarFoto(registro) {
  await conStore('readwrite', (s) => s.put(registro));
}
export async function fotosEnCola(peritacionId) {
  const todas = await conStore('readonly', (s) => s.getAll());
  const arr = Array.isArray(todas) ? todas : [];
  return peritacionId ? arr.filter((f) => f.peritacion_id === peritacionId) : arr;
}
export async function quitarDeCola(id) {
  await conStore('readwrite', (s) => s.delete(id));
}

/* ==================================================== fotos: subida */
export async function subirFoto(supabase, { id, peritacion_id, alumno_id, bloque_id, item_idx, blob, nota }) {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${alumno_id}/${peritacion_id}/${bloque_id}/${id}.${ext}`;

  const up = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type, upsert: true,
  });
  if (up.error) return { ok: false, error: 'storage' };

  const ins = await supabase.from('peritacion_fotos').insert({
    id, peritacion_id, alumno_id, bloque_id,
    item_idx: item_idx ?? null, path, nota: nota || null,
  });
  if (ins.error) return { ok: false, error: 'bd' };

  return { ok: true, path };
}

/* Vacía la cola. Devuelve cuántas subieron. */
export async function subirPendientes(supabase, peritacionId) {
  const cola = await fotosEnCola(peritacionId);
  let n = 0;
  for (const f of cola) {
    const r = await subirFoto(supabase, f);
    if (r.ok) { await quitarDeCola(f.id); n++; }
    else if (r.error === 'storage') break;   // sin red: no seguimos machacando
  }
  return n;
}

/* URL temporal para ver una foto ya subida (bucket privado) */
export async function urlFirmada(supabase, path, segundos = 3600) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

export const nuevoId = () =>
  (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }));
