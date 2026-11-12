'use client';

// =====================================================================
//  GPSO COLLECTOR · Unidades para importar · GARAJE  (selector de coche)
//  app/recursos/unidades/UnidadesClient.jsx
//
//  Pantalla tipo "elige tu coche" de videojuego:
//   · 5 garajes (uno por tramo de capital + la ZONA ROJA de descarte).
//   · En cada garaje pasas de coche en coche (flechas, teclado o swipe):
//     el coche entra derrapando a la plataforma, con sus barras de stats.
//   · "Analizar unidad" abre el simulador (venta, precio, compra máxima).
//
//  IMÁGENES (van en /public/ o en /public/unidades/, se buscan en los dos). Si falta alguna NO se rompe nada:
//   · garaje-t0.webp … garaje-t3.webp, garaje-descarte.webp  → fondo
//     (si no existe, se dibuja un garaje con CSS)
//   · <slug>.webp → coche recortado con fondo transparente, vista 3/4
//     (si no existe, sale la silueta "foto pendiente")
//   El slug sale del nombre corto: "León FR" → leon-fr.webp
//  Los datos viven en ./unidades-data.js
// =====================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import MenuDrawer from '../../components/MenuDrawer';
import { TRAMOS, DESCARTE, REVISION } from './unidades-data';

const mil = (n) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const eur = (n) => mil(n) + ' €';
const rango = (r) => mil(r[0]) + '–' + mil(r[1]) + ' €';
const medio = (r) => (r[0] + r[1]) / 2;
const num = (v) => { const x = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(x) ? x : 0; };
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dos = (n) => String(n).padStart(2, '0');

// ---- garajes: los 4 tramos + la zona roja ----
const ACENTO = { t0: '#58d6c9', t1: '#e8c26a', t2: '#6fa8ff', t3: '#c58bff', descarte: '#ff5a4d' };
const GARAJES = [
  ...TRAMOS.map((t, i) => ({ ...t, num: dos(i + 1), nombre: ['Garaje de inicio', 'Garaje principal', 'Garaje premium', 'Garaje élite'][i] })),
  { id: 'descarte', num: '05', t: 'Zona roja', corto: 'Descarte', nombre: 'Lo que no comprar', s: 'parecen chollo y no lo son',
    lead: DESCARTE.lead, coches: DESCARTE.coches, rojo: true },
];

// ---- dónde cae el aro LED de la plataforma en cada foto (en % del lienzo 16:9) ----
const HALO = {
  t0: { cy: 74.4, w: 59, h: 12.8 }, t1: { cy: 73.3, w: 66, h: 15.3 }, t2: { cy: 73.3, w: 72.6, h: 9.5 },
  t3: { cy: 74.4, w: 74.6, h: 11.3 }, descarte: { cy: 73.5, w: 76.5, h: 12 },
};
const CON_TUBOS = { t0: true, t1: true, descarte: true }; // garajes a los que se añaden neones de techo

// ---- barras de stats (salen de los datos de la guía) ----
const DEM = { Amplia: [92, 'Amplia · público general'], Selectiva: [62, 'Selectiva · comprador premium'], Nicho: [36, 'Nicho · aficionado'] };
const DURO = /excepcional|exigente|descuento|estricto|ajustado|flota|barata|selectivo|no localizado|sobrevalorar/i;
const exigencia = (c) => c.top ? [34, 'Accesible · empieza aquí'] : DURO.test(c.f) ? [90, 'Alta · solo compra muy buena'] : [62, 'Media · comparar bien'];
const VIAB = { 'Selectivo': 45, 'Muy selectivo': 30, 'Solo subasta': 30, 'Solo flota': 22, 'No retail': 14, 'No prioridad': 8 };

// ---- imagen genérica por carrocería (coche bajo lona) mientras no exista la foto propia ----
//      /unidades/tipo-urbano.webp · tipo-compacto.webp · tipo-suv.webp · tipo-coupe.webp · tipo-furgo.webp
const TIPOS = {
  urbano: ['peugeot-108', 'fiat-500', 'vw-up', 'hyundai-i10', 'kia-picanto', 'toyota-aygo', 'seat-mii', 'twingo-iii', 'citroen-c1', 'opel-karl', 'smart-forfour'],
  suv: ['arona-fr', 'puma-st-line', 'seat-ateca', 'formentor', 'formentor-vz', 'glc-220-d', 'q5-sportback', 'bmw-x4', 'macan-2-0', 'glc-x254', 'macan-s'],
  coupe: ['bmw-430i', 'm240i-f22', 'm240i-g42', 'm440i', 'm2-competition', '718-cayman'],
  furgo: ['dacia-dokker', 'ford-b-max'],
};
const tipoDe = (s) => Object.keys(TIPOS).find(t => TIPOS[t].includes(s)) || 'compacto';

export default function UnidadesClient({ email, perfil }) {
  const [g, setG] = useState(1);            // garaje activo (arranca en el de más salida)
  const [i, setI] = useState(0);            // coche activo
  const [dir, setDir] = useState(1);        // sentido de la animación de entrada
  const [persiana, setPersiana] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'sim' | 'regla'
  const [sim, setSim] = useState({ venta: '', precio: '', costes: '', objetivo: '' });
  const [fondos, setFondos] = useState({});   // id → URL de la imagen del garaje que ha cargado
  const [sinFoto, setSinFoto] = useState({}); // slug → 1 si falta la foto propia · 2 si tampoco hay la genérica
  const [listo, setListo] = useState(false);  // pantalla de carga: se levanta cuando hay estilos + fondo
  const [fuera, setFuera] = useState(false);
  const tiraRef = useRef(null);
  const touch = useRef(null);

  const gar = GARAJES[g];
  const lista = gar.coches;
  const c = lista[i] || lista[0];
  const sl = slug(c.n);
  const acento = ACENTO[gar.id];
  // dónde buscar la foto del coche, por orden: su foto (en /unidades/ o en la raíz de public),
  // luego el coche bajo lona de su carrocería, y si no hay nada, la silueta
  const rutas = [`/unidades/${sl}.webp`, `/${sl}.webp`, `/unidades/tipo-${tipoDe(sl)}.webp`, `/tipo-${tipoDe(sl)}.webp`];
  const nFoto = sinFoto[sl] || 0;
  const foto = rutas[nFoto];
  const falla = (src) => setSinFoto(s => (rutas[s[sl] || 0] === src ? { ...s, [sl]: (s[sl] || 0) + 1 } : s));

  useEffect(() => {
    document.body.classList.add('ocultar-theme-toggle');
    return () => document.body.classList.remove('ocultar-theme-toggle');
  }, []);

  // ¿existe la imagen de fondo de cada garaje?
  useEffect(() => {
    // se busca en /public/unidades/ y, si no está, en la raíz de /public/
    const t0 = Date.now();
    GARAJES.forEach(x => {
      const fin = () => { if (x.id === GARAJES[1].id) setTimeout(() => setListo(true), Math.max(0, 900 - (Date.now() - t0))); };
      const prueba = (urls) => { if (!urls.length) return fin(); const im = new Image();
        im.onload = () => { setFondos(f => ({ ...f, [x.id]: urls[0] })); fin(); }; im.onerror = () => prueba(urls.slice(1)); im.src = urls[0]; };
      prueba([`/unidades/garaje-${x.id}.webp`, `/garaje-${x.id}.webp`]);
    });
    const seguro = setTimeout(() => setListo(true), 5000); // por si la red va muy lenta
    return () => clearTimeout(seguro);
  }, []);
  useEffect(() => { if (listo) { const t = setTimeout(() => setFuera(true), 900); return () => clearTimeout(t); } }, [listo]);
  // precarga de los coches vecinos
  useEffect(() => {
    [1, -1].forEach(d => { const v = lista[(i + d + lista.length) % lista.length]; if (v) { const im = new Image(); im.src = `/unidades/${slug(v.n)}.webp`; } });
  }, [g, i, lista]);

  const prepararSim = useCallback((coche, garaje) => {
    if (garaje.rojo) return;
    setSim({ venta: '', precio: '', costes: String(Math.round((medio(coche.inv) - medio(coche.co)) / 50) * 50), objetivo: String(garaje.objetivo) });
  }, []);

  const ir = useCallback((n, d) => {
    const L = GARAJES[g].coches.length; const k = (n + L) % L;
    setDir(d); setI(k); prepararSim(GARAJES[g].coches[k], GARAJES[g]);
  }, [g, prepararSim]);
  const mover = useCallback((d) => ir(i + d, d), [i, ir]);

  const cambiarGaraje = useCallback((n) => {
    const k = (n + GARAJES.length) % GARAJES.length; if (k === g || persiana) return;
    setPersiana(true); setPanel(null);
    setTimeout(() => { setG(k); setI(0); setDir(1); prepararSim(GARAJES[k].coches[0], GARAJES[k]); }, 620);
    setTimeout(() => setPersiana(false), 1050);
  }, [g, persiana, prepararSim]);

  useEffect(() => { prepararSim(GARAJES[1].coches[0], GARAJES[1]); }, [prepararSim]);

  // teclado: ← → coches · ↑ ↓ garajes · Enter analizar · Esc cerrar
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') { setPanel(null); if (e.target && e.target.blur) e.target.blur(); return; }
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') mover(1);
      else if (e.key === 'ArrowLeft') mover(-1);
      else if (e.key === 'ArrowDown') cambiarGaraje(g + 1);
      else if (e.key === 'ArrowUp') cambiarGaraje(g - 1);
      else if (e.key === 'Enter') setPanel(p => p ? p : (GARAJES[g].rojo ? 'regla' : 'sim'));
      else if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [mover, cambiarGaraje, g]);

  // la miniatura activa siempre a la vista
  useEffect(() => {
    const t = tiraRef.current, el = t && t.querySelector('.on');
    if (el) t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [g, i]);

  // ---------------- stats ----------------
  let stats;
  if (gar.rojo) {
    stats = [
      { k: 'Viabilidad', v: VIAB[c.dec] || 20, x: c.dec },
      { k: 'Venta en España', v: c.vES / 100, x: eur(c.vES) + ' de referencia' },
      { k: 'Compra máxima', v: c.cMax / 100, x: eur(c.cMax) + ' simulada' },
    ];
  } else {
    const d = DEM[c.dem] || [50, c.dem], ex = exigencia(c);
    stats = [
      { k: 'Demanda', v: d[0], x: d[1] },
      { k: 'Capital necesario', v: Math.min(100, c.inv[1] / 500), x: 'hasta ' + eur(c.inv[1]) },
      { k: 'Exigencia de compra', v: ex[0], x: ex[1] },
    ];
  }

  // ---------------- simulador ----------------
  const venta = num(sim.venta), precio = num(sim.precio), costes = num(sim.costes), objetivo = num(sim.objetivo);
  const compraMax = venta ? venta - costes - objetivo : 0;
  const resultado = venta && precio ? venta - precio - costes : null;
  let veredicto = null;
  if (resultado != null) {
    if (resultado < 0) veredicto = { c: 'bad', t: 'Descartar', x: `Pierdes ${eur(-resultado)} antes de impuestos. No hay operación.` };
    else if (resultado < objetivo) veredicto = { c: 'mid', t: 'Ajustado', x: `Quedan ${eur(resultado)} antes de impuestos, por debajo de tu objetivo de ${eur(objetivo)}. Negocia o busca otra unidad.` };
    else veredicto = { c: 'ok', t: 'Pasa el primer filtro', x: `Quedan ${eur(resultado)} antes de impuestos. Siguiente paso: peritar, comprobar VIN/COC y cerrar la fiscalidad.` };
  }
  const campo = (k, label, ph) => (
    <label className="sm-l">{label}
      <input inputMode="numeric" value={sim[k]} placeholder={ph} onChange={e => setSim(s => ({ ...s, [k]: e.target.value }))} />
    </label>
  );
  const ej = DESCARTE.ejemplo;

  return (
    <div className={'gj' + (gar.rojo ? ' rojo' : '') + (panel ? ' conPanel' : '')} style={{ '--ac': acento }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null || e.target.closest('.gj-panel') || e.target.closest('.gj-tira') || e.target.closest('.gj-tabs')) return;
        const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 48) mover(dx < 0 ? 1 : -1); }}>

      {/* ---------- ambiente (la foto del garaje desenfocada; se ve sobre todo en móvil) ---------- */}
      <div className="gj-bg" key={'bg' + gar.id} style={fondos[gar.id] ? { backgroundImage: `url(${fondos[gar.id]})` } : undefined} />

      {/* ---------- cabecera ---------- */}
      <header className="gj-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 42, height: 42 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 17 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">El garaje potencial · elige qué importar</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/guia-unidades-gpso.pdf" download className="volver dl">↓ Descargar la guía</a>
          <a href="/recursos" className="volver">Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      {/* ---------- garajes ---------- */}
      <nav className="gj-tabs" aria-label="Garajes">
        {GARAJES.map((x, k) => (
          <button key={x.id} className={'gt' + (k === g ? ' on' : '') + (x.rojo ? ' r' : '')} style={{ '--tc': ACENTO[x.id] }} onClick={() => cambiarGaraje(k)}>
            <i>{x.num}</i><b>{x.rojo ? 'Zona roja' : x.corto}</b>
          </button>
        ))}
      </nav>

      {/* ---------- rótulo del coche ---------- */}
      <div className="gj-rotulo" key={'r' + g + '-' + i}>
        <div className="gr-n"><em>{dos(i + 1)}</em><span>/ {dos(lista.length)}</span><u>{gar.nombre}</u></div>
        <h1 className={c.n.length > 10 ? 'largo' : ''}>{c.n}</h1>
        <div className="gr-m">{c.m}</div>
        <div className="gr-d">{c.d}</div>
        <div className="gr-b">
          {c.top && <span className="bd top">Empieza aquí</span>}
          {gar.rojo ? <span className="bd no">{c.dec}</span> : <span className="bd">Demanda {c.dem.toLowerCase()}</span>}
        </div>
      </div>

      {/* ---------- escenario: lienzo 16:9 (garaje + coche clavado a la plataforma) ---------- */}
      <div className="gj-esc-w">
        <div className="gj-esc" key={'e' + gar.id}>
          {fondos[gar.id]
            ? <>
                <div className="gj-foto" style={{ backgroundImage: `url(${fondos[gar.id]})` }} />
                {/* la misma foto en modo "screen": hace parpadear los neones del techo y respirar el LED de la plataforma */}
                <div className="gj-neon" style={{ backgroundImage: `url(${fondos[gar.id]})` }} />
                <div className="gj-led" style={{ backgroundImage: `url(${fondos[gar.id]})`, '--cy': HALO[gar.id].cy + '%' }} />
                {CON_TUBOS[gar.id] && <div className="tubos" aria-hidden="true"><span /><span /><span /><span /></div>}
                <div className="halo" aria-hidden="true" style={{ top: HALO[gar.id].cy + '%', width: HALO[gar.id].w + '%', aspectRatio: `${HALO[gar.id].w * 16} / ${HALO[gar.id].h * 9}` }}><b /><i /><i /></div>
              </>
            : <div className="gj-css" aria-hidden="true">
                <div className="pared"><span /><span /><span /><span /><span /><span /></div>
                <div className="suelo" />
                <div className="foco" />
                <div className="plat"><i /><b /></div>
              </div>}
          <div className={'car ' + (dir > 0 ? 'der' : 'izq')} key={g + '-' + i}>
            {nFoto >= rutas.length
              ? <div className="silueta"><svg viewBox="0 0 640 220" aria-hidden="true"><path d="M30 165c0-22 12-34 40-38l66-10c26-36 62-58 128-60h112c52 2 92 22 124 58l72 14c26 5 38 18 38 40v14c0 8-5 13-13 13h-46a52 52 0 0 0-104 0H232a52 52 0 0 0-104 0H44c-9 0-14-5-14-14z" /><circle cx="180" cy="176" r="38" /><circle cx="499" cy="176" r="38" /></svg><span>foto pendiente · {sl}.webp</span></div>
              : <>
                  <img className="car-img" src={foto} alt={c.m} draggable="false" onError={() => falla(foto)}
                  ref={(el) => { if (el && el.complete && el.naturalWidth === 0) falla(foto); }} />
                  <img className="car-ref" src={foto} alt="" aria-hidden="true" draggable="false" />
                  {nFoto >= 2 && <div className="lona">Por desvelar</div>}
                </>}
            {gar.rojo && <div className="sello">No comprar<small>al precio de anuncio</small></div>}
          </div>
        </div>
        <div className="gj-vin" />
        <button className="fl iz" onClick={() => mover(-1)} aria-label="Coche anterior">‹</button>
        <button className="fl de" onClick={() => mover(1)} aria-label="Coche siguiente">›</button>
      </div>

      {/* ---------- ficha: stats + objetivos ---------- */}
      <div className="gj-ficha" key={'f' + g + '-' + i}>
        {stats.map((s, k) => (
          <div className="st" key={s.k}>
            <div className="st-h"><b>{s.k}</b><span>{s.x}</span></div>
            <div className="st-b"><i style={{ width: Math.max(4, Math.min(100, s.v)) + '%', animationDelay: (k * 90) + 'ms' }} /></div>
          </div>
        ))}
        {!gar.rojo && (
          <div className="obj">
            <div><i>Compra objetivo en origen</i><b>{rango(c.co)}</b></div>
            <div><i>Inversión total estimada</i><b>{rango(c.inv)}</b></div>
          </div>
        )}
        <div className="nota"><i>{gar.rojo ? 'Por qué no' : 'Filtro de compra'}</i>{c.f}</div>
        <button className="cta" onClick={() => setPanel(gar.rojo ? 'regla' : 'sim')}>
          {gar.rojo ? 'Ver la regla de descarte' : 'Analizar esta unidad'} <span>›</span>
        </button>
      </div>

      {/* ---------- tira de coches ---------- */}
      <div className="gj-tira" ref={tiraRef}>
        {lista.map((x, k) => (
          <button key={k} className={'mi' + (k === i ? ' on' : '') + (x.top ? ' top' : '')} onClick={() => ir(k, k >= i ? 1 : -1)}>
            <em>{dos(k + 1)}</em>{x.n}
          </button>
        ))}
      </div>
      <div className="gj-pie">Guía {REVISION} · objetivos de compra, no ofertas · ← → coche · ↑ ↓ garaje</div>

      {/* ---------- pantalla de carga: puerta cerrada hasta que hay estilos y fondo ---------- */}
      {!fuera && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
          background: 'linear-gradient(90deg, rgba(0,0,0,.55), transparent 12%, transparent 88%, rgba(0,0,0,.55)), repeating-linear-gradient(to bottom, #2b313c 0 3px, #1b2029 3px 22px, #0c0f15 22px 25px, #232832 25px 44px)',
          borderBottom: '18px solid #0a0c11', boxShadow: '0 10px 0 #e8c26a, 0 30px 60px rgba(0,0,0,.8)',
          transform: listo ? 'translateY(-103%)' : 'none', transition: 'transform .8s cubic-bezier(.6,0,.2,1)', pointerEvents: listo ? 'none' : 'auto' }}>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes gjCarga{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}' }} />
          <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 'clamp(26px,5vw,64px)', fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 4, color: '#e8c26a',
            textShadow: '0 0 40px #e8c26a', background: 'rgba(8,10,16,.8)', padding: '14px 34px', border: '2px solid #e8c26a' }}>El garaje</div>
          <div style={{ width: 'min(300px,60vw)', height: 4, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', background: '#e8c26a', boxShadow: '0 0 14px #e8c26a', animation: 'gjCarga 1.1s ease-in-out infinite' }} />
          </div>
          <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#aab1bf', fontWeight: 700 }}>Abriendo persiana…</div>
        </div>
      )}

      {/* ---------- persiana al cambiar de garaje ---------- */}
      <div className={'gj-persiana' + (persiana ? ' baja' : '')} aria-hidden="true"><span>{gar.rojo ? 'Zona roja' : 'Garaje ' + gar.num}</span></div>

      {/* ---------- panel: simulador / regla de descarte ---------- */}
      <div className={'gj-velo' + (panel ? ' on' : '')} onClick={() => setPanel(null)} />
      <aside className={'gj-panel' + (panel ? ' open' : '')} aria-live="polite">
        <button className="px" onClick={() => setPanel(null)} aria-label="Cerrar">×</button>
        {panel === 'sim' && !gar.rojo && (
          <>
            <div className="ph"><span>Análisis · {gar.corto}</span><h2>{c.m}</h2><p>{c.d}</p></div>
            <div className="pb">
              <div className="aviso"><i>Por dónde empezar en este garaje</i>{gar.empezar}</div>
              <div className="sub">Simulador · ¿pasa el filtro esta unidad?</div>
              <div className="sm-grid">
                {campo('venta', 'Venta conservadora en España', 'Ej. ' + mil(Math.round((c.inv[1] + gar.objetivo) / 100) * 100))}
                {campo('precio', 'Precio que has encontrado', 'Ej. ' + mil(c.co[1]))}
                {campo('costes', 'Costes de importación', '')}
                {campo('objetivo', 'Beneficio objetivo', '')}
              </div>
              {venta > 0 && (
                <div className="sm-max">
                  <i>Compra máxima para tu objetivo</i><b>{compraMax > 0 ? eur(compraMax) : 'No sale'}</b>
                  <span>{compraMax > c.co[1] ? 'Por encima del objetivo de la guía: hay recorrido.' : compraMax >= c.co[0] ? 'Dentro del objetivo de compra de la guía.' : 'Por debajo del objetivo de la guía: con esa venta es difícil encontrar unidad.'}</span>
                </div>
              )}
              {veredicto && (
                <div className={'sm-res ' + veredicto.c}><b>{veredicto.t}</b><span>{veredicto.x}</span>
                  {precio > c.co[1] && <span>El precio encontrado supera el objetivo de compra de la guía ({eur(c.co[1])} máx.).</span>}
                </div>
              )}
              {!venta && <p className="pn">Busca al menos 3 comparables en España (mismo motor, año y km) y pon el precio más conservador.</p>}
              <p className="pn">Compra máxima = venta conservadora − costes − beneficio objetivo. Falta restar fiscalidad (IVA o REBU, IEDMT) y reserva: el resultado no es beneficio neto.</p>
              <p className="pn">{gar.provision}</p>
            </div>
          </>
        )}
        {panel === 'regla' && (
          <>
            <div className="ph"><span>Zona roja · regla de descarte</span><h2>La diferencia entre dos anuncios no es margen</h2></div>
            <div className="pb">
              <p className="pl">{DESCARTE.lead}</p>
              <div className="sub">Ejemplo · {ej.m}</div>
              <div className="cuenta">
                <div><span>Precio anunciado en Alemania</span><b>{eur(ej.precio)}</b></div>
                <div><span>Costes y reserva</span><b>{eur(ej.costes)}</b></div>
                <div className="tot"><span>Total antes de vender</span><b>{eur(ej.precio + ej.costes)}</b></div>
                <div><span>Precio anunciado en España</span><b>{eur(ej.venta)}</b></div>
                <div className="neg"><span>Resultado antes de impuestos</span><b>−{eur(ej.precio + ej.costes - ej.venta)}</b></div>
              </div>
              <p className="pn">Ni siquiera hay beneficio antes del IVA, las comisiones, la garantía y el coste financiero. Esto es lo que hay que aprender a descartar.</p>
              <div className="sub">Brecha bruta entre anuncios</div>
              {DESCARTE.brechas.map((b, k) => (
                <div key={k} className="brecha"><b>{b.m}</b><em>+{eur(b.es - b.de)}</em><span>España {eur(b.es)} · {b.pais} {eur(b.de)}</span><i>{b.lectura}</i></div>
              ))}
              <p className="pn">{DESCARTE.nota}</p>
              <p className="pn">Anuncios observados el {REVISION}: no son unidades emparejadas ni precios de cierre.</p>
            </div>
          </>
        )}
      </aside>

      <style jsx global>{`
        .gj{position:fixed;inset:0;overflow:hidden;background:#05070c;color:#eef0f4;font-family:var(--font-space-grotesk),system-ui,sans-serif;user-select:none}
        .gj *{box-sizing:border-box}
        .gj button{font-family:inherit}

        /* ===== fondo ===== */
        .gj-bg{position:absolute;inset:-40px;background:#05070c center/cover no-repeat;filter:blur(26px) brightness(.38);animation:gjIn .7s ease both}
        @keyframes gjIn{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
        .gj-foto{position:absolute;inset:0;background-size:100% 100%}
        .gj-vin{position:absolute;inset:0;background:
          linear-gradient(to right, rgba(4,6,10,.72) 0%, rgba(4,6,10,.2) 30%, rgba(4,6,10,0) 44%, rgba(4,6,10,0) 60%, rgba(4,6,10,.45) 82%, rgba(4,6,10,.7) 100%),
          linear-gradient(to bottom, rgba(4,6,10,.8) 0%, rgba(4,6,10,.1) 22%, rgba(4,6,10,0) 60%, rgba(4,6,10,.88) 100%);pointer-events:none}
        /* --- luz viva sobre la foto --- */
        .gj-neon,.gj-led{position:absolute;inset:0;background-size:100% 100%;mix-blend-mode:screen;pointer-events:none}
        .gj-neon{filter:brightness(1.5) saturate(1.7) blur(1.5px);-webkit-mask:linear-gradient(to bottom,#000 0,#000 40%,transparent 60%);mask:linear-gradient(to bottom,#000 0,#000 40%,transparent 60%);
          animation:neonTecho 7s linear infinite}
        @keyframes neonTecho{0%,100%{opacity:.5}6%{opacity:.5}7%{opacity:.05}8%{opacity:.6}9.5%{opacity:.1}11%{opacity:.7}40%{opacity:.35}62%{opacity:.75}63%{opacity:.2}64%{opacity:.7}85%{opacity:.4}}
        .gj-led{filter:brightness(1.8) saturate(1.9) blur(3px);-webkit-mask:radial-gradient(ellipse 48% 15% at 50% var(--cy),#000 45%,transparent 100%);mask:radial-gradient(ellipse 48% 15% at 50% var(--cy),#000 45%,transparent 100%);
          animation:ledPulso 2.4s ease-in-out infinite alternate}
        @keyframes ledPulso{from{opacity:.05}to{opacity:.95}}
        .halo{position:absolute;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        .halo i{position:absolute;inset:0;border-radius:50%;border:2px solid var(--ac);box-shadow:0 0 24px var(--ac),inset 0 0 24px var(--ac);opacity:0;animation:onda 3.6s ease-out infinite}
        .halo i:last-child{animation-delay:1.8s}
        @keyframes onda{0%{transform:scale(.9);opacity:0}14%{opacity:.75}100%{transform:scale(1.26);opacity:0}}
        /* columna de luz que sube de la plataforma, detrás del coche */
        .halo b{position:absolute;left:12%;right:12%;bottom:50%;height:330%;border-radius:50% 50% 0 0 / 30% 30% 0 0;filter:blur(22px);opacity:.5;
          background:linear-gradient(to top, color-mix(in srgb, var(--ac) 55%, transparent), color-mix(in srgb, var(--ac) 12%, transparent) 55%, transparent);
          animation:respira 4.2s ease-in-out infinite alternate}
        @keyframes respira{from{opacity:.22;transform:scaleX(.92)}to{opacity:.6;transform:scaleX(1.04)}}
        /* neones añadidos en el techo (en perspectiva hacia el centro) */
        .tubos span{position:absolute;height:.55%;border-radius:6px;background:color-mix(in srgb, var(--ac) 60%, #fff);box-shadow:0 0 8px var(--ac),0 0 22px var(--ac),0 0 70px var(--ac),0 0 140px var(--ac);animation:neon 5s ease-in-out infinite}
        .tubos span:nth-child(1){left:3%;top:5%;width:27%;transform:rotate(11deg);transform-origin:left}
        .tubos span:nth-child(2){right:3%;top:5%;width:27%;transform:rotate(-11deg);transform-origin:right;animation-delay:-1.7s}
        .tubos span:nth-child(3){left:14%;top:1.5%;width:19%;transform:rotate(7deg);transform-origin:left;opacity:.7;animation-delay:-3.1s}
        .tubos span:nth-child(4){right:14%;top:1.5%;width:19%;transform:rotate(-7deg);transform-origin:right;opacity:.7;animation-delay:-.6s}
        .gj-css{position:absolute;inset:0;background:linear-gradient(#0b0f18 0%,#0d121c 56%,#04060a 56%)}
        .gj-css .pared{position:absolute;left:0;right:0;top:0;height:56%;display:flex;justify-content:space-around;padding:0 6%;
          background:repeating-linear-gradient(90deg, rgba(255,255,255,.022) 0 2px, transparent 2px 120px), linear-gradient(#070a11,#111827)}
        .gj-css .pared span{width:5px;height:74%;align-self:flex-end;margin-bottom:5%;border-radius:4px;background:var(--ac);opacity:.85;
          box-shadow:0 0 18px var(--ac),0 0 60px var(--ac),0 0 140px var(--ac);animation:neon 5s ease-in-out infinite}
        .gj-css .pared span:nth-child(odd){height:58%;animation-delay:-2.2s}
        .gj-css .pared span:nth-child(3),.gj-css .pared span:nth-child(4){opacity:.25;box-shadow:0 0 30px var(--ac)}
        @keyframes neon{0%,100%{filter:brightness(1)}47%{filter:brightness(1)}50%{filter:brightness(.55)}53%{filter:brightness(1.15)}}
        .gj-css .suelo{position:absolute;left:-40%;right:-40%;top:56%;bottom:-10%;transform-origin:top center;transform:perspective(520px) rotateX(64deg);
          background:
            linear-gradient(to bottom, color-mix(in srgb, var(--ac) 26%, transparent), transparent 46%),
            repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, transparent 1px 90px),
            repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 90px), #06080d}
        .gj-css .foco{position:absolute;left:50%;top:-6%;width:70%;height:82%;transform:translateX(-50%);
          background:radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,255,255,.13), transparent 70%);clip-path:polygon(38% 0,62% 0,100% 100%,0 100%)}

        /* ===== cabecera ===== */
        .gj-top{position:absolute;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:14px 26px}
        .gj .brand-wrap{display:flex;align-items:center;gap:12px}
        .gj .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .gj .top-right{display:flex;align-items:center;gap:12px}
        .gj .volver{font-size:11.5px;color:#e7e9ee;text-decoration:none;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;
          border:1px solid rgba(255,255,255,.22);border-radius:6px;padding:8px 14px;background:rgba(8,10,16,.6);backdrop-filter:blur(8px);transition:border-color .2s}
        .gj .volver:hover{border-color:var(--ac)}
        .gj .volver.dl{background:var(--ac);border-color:var(--ac);color:#05070c}

        /* ===== pestañas de garaje ===== */
        .gj-tabs{position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:20;display:flex;gap:6px;max-width:calc(100vw - 24px)}
        .gt{display:flex;align-items:baseline;gap:8px;padding:9px 18px 9px 14px;border:1px solid rgba(255,255,255,.14);background:rgba(8,10,16,.62);backdrop-filter:blur(8px);
          color:#9aa2b2;cursor:pointer;transform:skewX(-14deg);transition:all .2s;white-space:nowrap}
        .gt > *{display:inline-block;transform:skewX(14deg)}
        .gt i{font-style:normal;font-size:10px;letter-spacing:1px;color:var(--tc);font-weight:700}
        .gt b{font-size:13px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700}
        .gt:hover{color:#fff;border-color:var(--tc)}
        .gt.on{background:var(--tc);border-color:var(--tc);color:#05070c;box-shadow:0 0 28px color-mix(in srgb, var(--tc) 55%, transparent)}
        .gt.on i{color:#05070c}

        /* ===== rótulo ===== */
        .gj-rotulo{position:absolute;left:44px;top:150px;z-index:12;max-width:44vw;animation:rotIn .45s cubic-bezier(.2,.8,.2,1) both}
        @keyframes rotIn{from{opacity:0;transform:translateX(-34px)}to{opacity:1;transform:none}}
        .gr-n{display:flex;align-items:baseline;gap:8px;font-weight:700;letter-spacing:1px}
        .gr-n em{font-style:italic;font-size:34px;color:var(--ac);line-height:1}
        .gr-n span{font-size:14px;color:#7c8494}
        .gr-n u{text-decoration:none;margin-left:10px;font-size:10.5px;letter-spacing:2.6px;text-transform:uppercase;color:#aab1bf;border-left:2px solid var(--ac);padding-left:10px}
        .gj-rotulo h1{margin:6px 0 4px;font-size:clamp(40px,6.2vw,92px);line-height:.92;font-weight:800;font-style:italic;text-transform:uppercase;letter-spacing:-1.5px;
          color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.7)}
        .gj-rotulo h1.largo{font-size:clamp(34px,4.4vw,64px)}
        .gr-m{font-size:16px;font-weight:600;color:#e7e9ee;letter-spacing:.3px}
        .gr-d{font-size:13px;color:#9aa2b2;margin-top:3px}
        .gr-b{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
        .bd{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;padding:5px 10px;border:1px solid rgba(255,255,255,.24);color:#cfd4de;background:rgba(8,10,16,.55)}
        .bd.top{background:var(--ac);border-color:var(--ac);color:#05070c}
        .bd.no{border-color:var(--ac);color:var(--ac)}

        /* ===== escenario ===== */
        .gj-esc-w{position:absolute;inset:0;z-index:5;overflow:hidden;pointer-events:none}
        /* lienzo 16:9 que cubre la pantalla: todo lo de dentro va en % de la foto, así el coche cae siempre en la plataforma */
        .gj-esc{position:absolute;left:50%;top:50%;width:max(100vw,177.78vh);height:max(100vh,56.25vw);transform:translate(-50%,-50%);animation:escIn .7s ease both}
        @keyframes escIn{from{opacity:0}to{opacity:1}}
        .plat{position:absolute;left:50%;top:74%;width:64%;aspect-ratio:5/1;transform:translate(-50%,-50%)}
        .plat i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(ellipse at center, color-mix(in srgb, var(--ac) 30%, transparent) 0%, rgba(0,0,0,.5) 55%, transparent 72%)}
        .plat{overflow:visible}
        .plat b{border-width:5px !important;position:absolute;left:4%;width:92%;top:50%;aspect-ratio:1;margin-top:-46%;border-radius:50%;border:2px solid var(--ac);opacity:.75;box-shadow:0 0 26px var(--ac), inset 0 0 40px color-mix(in srgb, var(--ac) 40%, transparent);
          -webkit-mask:conic-gradient(from 0deg,#000 0 12%,transparent 12% 25%,#000 25% 37%,transparent 37% 50%,#000 50% 62%,transparent 62% 75%,#000 75% 87%,transparent 87%);
          mask:conic-gradient(from 0deg,#000 0 12%,transparent 12% 25%,#000 25% 37%,transparent 37% 50%,#000 50% 62%,transparent 62% 75%,#000 75% 87%,transparent 87%);animation:giro 16s linear infinite}
        @keyframes giro{from{transform:scaleY(.19) rotate(0)}to{transform:scaleY(.19) rotate(360deg)}}
        .car{position:absolute;left:50%;bottom:25%;width:40%;transform:translateX(-50%)}
        .car.der{animation:entraD .62s cubic-bezier(.12,.85,.22,1) both}
        .car.izq{animation:entraI .62s cubic-bezier(.12,.85,.22,1) both}
        @keyframes entraD{0%{opacity:0;transform:translateX(18%) skewX(-10deg);filter:blur(14px) brightness(2)}60%{opacity:1;filter:blur(0) brightness(1.15)}100%{opacity:1;transform:translateX(-50%);filter:none}}
        @keyframes entraI{0%{opacity:0;transform:translateX(-118%) skewX(10deg);filter:blur(14px) brightness(2)}60%{opacity:1;filter:blur(0) brightness(1.15)}100%{opacity:1;transform:translateX(-50%);filter:none}}
        .car-img,.car-ref{max-height:calc(max(100vh,56.25vw) * .36)}
        .car-img{display:block;width:100%;height:auto;object-fit:contain;object-position:bottom;filter:drop-shadow(0 18px 14px rgba(0,0,0,.8))}
        .car-ref{position:absolute;left:0;top:97%;width:100%;object-fit:contain;object-position:top;transform:scaleY(-1);opacity:.22;filter:blur(2px);
          -webkit-mask:linear-gradient(to top,#000,transparent 55%);mask:linear-gradient(to top,#000,transparent 55%)}
        .silueta{position:relative;text-align:center;padding-bottom:6px}
        .silueta svg{width:86%;fill:#0a0d14;stroke:var(--ac);stroke-width:2;filter:drop-shadow(0 0 18px color-mix(in srgb, var(--ac) 60%, transparent))}
        .silueta span{display:block;margin-top:4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c8494}
        .lona{position:absolute;left:50%;bottom:-4%;transform:translateX(-50%);font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:var(--ac);background:rgba(8,10,16,.7);border:1px solid var(--ac);padding:5px 12px;white-space:nowrap}
        .sello{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%) rotate(-9deg);border:4px solid var(--ac);color:var(--ac);padding:8px 22px;font-size:clamp(22px,3.4vw,46px);
          font-weight:800;font-style:italic;text-transform:uppercase;letter-spacing:2px;background:rgba(10,4,4,.55);text-align:center;line-height:1;animation:sello .35s .45s cubic-bezier(.2,1.6,.4,1) both}
        .sello small{display:block;font-size:11px;letter-spacing:2.5px;margin-top:6px;font-style:normal}
        @keyframes sello{from{opacity:0;transform:translate(-50%,-50%) rotate(-9deg) scale(2.2)}to{opacity:1;transform:translate(-50%,-50%) rotate(-9deg) scale(1)}}
        .fl{position:absolute;top:56%;width:58px;height:92px;border:1px solid rgba(255,255,255,.2);background:rgba(8,10,16,.55);backdrop-filter:blur(6px);color:#fff;font-size:44px;line-height:1;
          cursor:pointer;pointer-events:auto;transform:skewX(-12deg);transition:all .18s;padding:0 0 8px}
        .fl:hover{background:var(--ac);border-color:var(--ac);color:#05070c;box-shadow:0 0 30px color-mix(in srgb, var(--ac) 60%, transparent)}
        .fl.iz{left:26px}.fl.de{right:26px}

        /* ===== ficha ===== */
        .gj-ficha{position:absolute;right:44px;top:150px;z-index:12;width:330px;padding:18px;background:linear-gradient(160deg,rgba(10,13,20,.82),rgba(10,13,20,.6));
          border:1px solid rgba(255,255,255,.12);border-left:3px solid var(--ac);backdrop-filter:blur(10px);animation:fichaIn .45s cubic-bezier(.2,.8,.2,1) both}
        @keyframes fichaIn{from{opacity:0;transform:translateX(34px)}to{opacity:1;transform:none}}
        .st{margin-bottom:13px}
        .st-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px}
        .st-h b{font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:#cfd4de}
        .st-h span{font-size:11px;color:#8b93a3;text-align:right}
        .st-b{height:9px;background:rgba(255,255,255,.08);transform:skewX(-20deg);overflow:hidden}
        .st-b i{display:block;height:100%;background:linear-gradient(90deg, color-mix(in srgb, var(--ac) 55%, #000), var(--ac));box-shadow:0 0 14px var(--ac);
          transform-origin:left;animation:barra .7s cubic-bezier(.2,.8,.2,1) both}
        @keyframes barra{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .obj{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 10px}
        .obj div{background:rgba(255,255,255,.05);padding:10px}
        .obj i,.nota i{display:block;font-style:normal;font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:#8b93a3;margin-bottom:5px;line-height:1.25}
        .obj b{font-size:14.5px;font-variant-numeric:tabular-nums;color:#fff}
        .nota{font-size:14px;font-weight:600;color:#fff;padding:10px;background:rgba(255,255,255,.05);margin-top:8px}
        .cta{display:flex;justify-content:space-between;align-items:center;width:100%;margin-top:12px;padding:14px 16px;border:none;background:var(--ac);color:#05070c;
          font-size:13px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;cursor:pointer;transition:filter .2s,transform .15s;box-shadow:0 0 30px color-mix(in srgb, var(--ac) 40%, transparent)}
        .cta span{font-size:22px;line-height:.6}
        .cta:hover{filter:brightness(1.12);transform:translateX(3px)}

        /* ===== tira ===== */
        .gj-tira{position:absolute;left:0;right:0;bottom:34px;z-index:14;display:flex;gap:6px;padding:8px 44px;overflow-x:auto;scrollbar-width:none;justify-content:safe center}
        .gj-tira::-webkit-scrollbar{display:none}
        .mi{flex:none;display:flex;align-items:baseline;gap:7px;padding:9px 14px;border:1px solid rgba(255,255,255,.13);background:rgba(8,10,16,.66);backdrop-filter:blur(6px);color:#9aa2b2;
          font-size:12px;font-weight:600;letter-spacing:.4px;cursor:pointer;white-space:nowrap;transition:all .18s;border-bottom:2px solid transparent}
        .mi em{font-style:normal;font-size:9.5px;color:#5d6575;font-weight:700}
        .mi.top{border-bottom-color:var(--ac)}
        .mi:hover{color:#fff;border-color:rgba(255,255,255,.4)}
        .mi.on{background:#fff;color:#05070c;border-color:#fff}
        .mi.on em{color:#05070c}
        .gj-pie{position:absolute;left:0;right:0;bottom:11px;z-index:14;text-align:center;font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:#5d6575}

        /* ===== persiana ===== */
        /* puerta metálica de garaje: baja, cambia el garaje por detrás y vuelve a subir */
        .gj-persiana{position:absolute;inset:0;z-index:40;transform:translateY(-102%);transition:transform .55s cubic-bezier(.55,0,.25,1);
          display:flex;align-items:center;justify-content:center;pointer-events:none;
          background:
            linear-gradient(90deg, rgba(0,0,0,.55), transparent 12%, transparent 88%, rgba(0,0,0,.55)),
            repeating-linear-gradient(to bottom, #2b313c 0 3px, #1b2029 3px 22px, #0c0f15 22px 25px, #232832 25px 44px);
          border-bottom:18px solid #0a0c11;box-shadow:0 10px 0 var(--ac), 0 30px 60px rgba(0,0,0,.8)}
        .gj-persiana.baja{transform:none}
        .gj-persiana span{font-size:clamp(30px,6vw,84px);font-weight:800;font-style:italic;text-transform:uppercase;letter-spacing:4px;color:var(--ac);
          text-shadow:0 0 40px var(--ac);background:rgba(8,10,16,.78);padding:14px 34px;border:2px solid var(--ac)}

        /* ===== panel ===== */
        .gj-velo{position:absolute;inset:0;z-index:48;background:rgba(3,4,8,.55);opacity:0;pointer-events:none;transition:opacity .3s}
        .gj-velo.on{opacity:1;pointer-events:auto}
        .gj-panel{position:absolute;top:0;right:0;bottom:0;width:min(460px,100vw);z-index:50;background:#0a0d14;border-left:3px solid var(--ac);transform:translateX(104%);
          transition:transform .4s cubic-bezier(.2,.9,.25,1);display:flex;flex-direction:column;user-select:text}
        .gj-panel.open{transform:none}
        .px{position:absolute;top:14px;right:14px;width:36px;height:36px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font-size:22px;cursor:pointer;line-height:1}
        .px:hover{background:var(--ac);color:#05070c;border-color:var(--ac)}
        .ph{padding:26px 60px 18px 26px;border-bottom:1px solid rgba(255,255,255,.1)}
        .ph span{font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:var(--ac);font-weight:700}
        .ph h2{margin:8px 0 0;font-size:25px;line-height:1.08;font-weight:800;font-style:italic;text-transform:uppercase;color:#fff}
        .ph p{margin:6px 0 0;font-size:12.5px;color:#9aa2b2}
        .pb{padding:20px 26px 40px;overflow-y:auto;flex:1}
        .pl{font-size:14.5px;line-height:1.5;color:#e7e9ee;margin:0 0 6px}
        .pn{margin:12px 0 0;font-size:12px;line-height:1.5;color:#8b93a3}
        .sub{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#aab1bf;font-weight:700;margin:22px 0 12px;padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.1)}
        .aviso{border-left:3px solid var(--ac);background:rgba(255,255,255,.05);padding:12px 14px;font-size:13px;line-height:1.45;color:#e7e9ee}
        .aviso i{display:block;font-style:normal;font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;color:var(--ac);font-weight:700;margin-bottom:5px}
        .sm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sm-l{display:block;font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;color:#8b93a3;line-height:1.3}
        .sm-l input{display:block;width:100%;margin-top:6px;background:#05070c;border:1px solid rgba(255,255,255,.16);padding:11px;color:#fff;font-family:inherit;font-size:16px;font-variant-numeric:tabular-nums;border-radius:0}
        .sm-l input:focus{outline:none;border-color:var(--ac)}
        .sm-l input::placeholder{color:#465063}
        .sm-max{margin-top:12px;padding:13px 14px;background:rgba(255,255,255,.05)}
        .sm-max i{display:block;font-style:normal;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:#8b93a3;margin-bottom:5px}
        .sm-max b{font-size:26px;font-weight:800;font-style:italic;color:#fff;font-variant-numeric:tabular-nums}
        .sm-max span{display:block;margin-top:4px;font-size:12px;color:#9aa2b2}
        .sm-res{margin-top:10px;padding:13px 14px;border-left:4px solid}
        .sm-res b{display:block;font-size:16px;font-weight:800;font-style:italic;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
        .sm-res span{display:block;font-size:12.5px;line-height:1.45;color:#dfe2e8;margin-top:3px}
        .sm-res.ok{border-color:#4fd18b;background:rgba(79,209,139,.1)} .sm-res.ok b{color:#6fe0a2}
        .sm-res.mid{border-color:#e8c26a;background:rgba(232,194,106,.1)} .sm-res.mid b{color:#e8c26a}
        .sm-res.bad{border-color:#ff5a4d;background:rgba(255,90,77,.1)} .sm-res.bad b{color:#ff7a6f}
        .cuenta div{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;font-size:13px;color:#cfd4de;border-bottom:1px solid rgba(255,255,255,.08)}
        .cuenta b{font-variant-numeric:tabular-nums;color:#fff}
        .cuenta .tot{background:rgba(255,255,255,.05)}
        .cuenta .neg{background:rgba(255,90,77,.14);border-bottom:none} .cuenta .neg b{color:#ff7a6f}
        .brecha{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}
        .brecha b{font-size:13.5px;color:#fff}
        .brecha em{font-style:normal;font-size:13.5px;color:var(--ac);font-variant-numeric:tabular-nums;text-align:right}
        .brecha span{font-size:12px;color:#8b93a3;font-variant-numeric:tabular-nums}
        .brecha i{font-style:normal;font-size:11.5px;color:#6b7383;text-align:right}

        @media (prefers-reduced-motion:reduce){.gj *{animation-duration:.01s !important}}

        /* ===== pantallas bajas ===== */
        @media (max-height:760px) and (min-width:761px){
          .gj-rotulo,.gj-ficha{top:124px}
          .gj-rotulo h1{font-size:clamp(36px,5vw,64px)}
          .st{margin-bottom:9px}.obj{margin:10px 0 6px}
        }
        @media (max-width:1180px) and (min-width:761px){
          .gj-ficha{width:290px;right:22px}.gj-rotulo{left:22px}
        }

        /* ===== móvil ===== */
        @media (max-width:760px){
          .gj{overflow-y:auto;overflow-x:hidden}
          .gj-bg{position:fixed}
          .gj-top{position:relative;padding:10px 12px}
          .gj .sublabel,.gj .marca{display:none}
          .gj .volver{padding:7px 9px;font-size:10px;letter-spacing:.6px}.gj .top-right{gap:6px}
          .gj-tabs{position:relative;top:auto;left:auto;transform:none;overflow-x:auto;scrollbar-width:none;padding:2px 16px 6px;max-width:none}
          .gt{padding:8px 13px 8px 10px;flex:none}.gt b{font-size:11.5px}
          .gj-rotulo{position:relative;left:auto;top:auto;max-width:none;padding:10px 16px 0}
          .gj-rotulo h1{font-size:44px}
          .gr-m{font-size:14px}.gr-n em{font-size:26px}
          .gj-esc-w{position:relative;inset:auto;aspect-ratio:16/9;margin-top:8px}
          .gj-esc{left:0;top:0;width:100%;height:100%;transform:none}
          .gj-vin{background:linear-gradient(to bottom, rgba(4,6,10,.55), transparent 22%, transparent 80%, rgba(4,6,10,.7))}
          .car{width:50%}
          .car-img,.car-ref{max-height:calc(56.25vw * .5)}
          .fl{width:36px;height:58px;font-size:30px;top:36%}.fl.iz{left:6px}.fl.de{right:6px}
          .gj-tira{position:relative;bottom:auto;padding:10px 16px;justify-content:flex-start}
          .gj-ficha{position:relative;right:auto;top:auto;width:auto;margin:4px 12px 0}
          .gj-pie{position:relative;bottom:auto;padding:14px 16px 26px;letter-spacing:1px}
          .gj-persiana,.gj-velo,.gj-panel{position:fixed}
          .gj-panel{border-left:none;border-top:3px solid var(--ac);top:54px}
        }
      `}</style>
    </div>
  );
}
