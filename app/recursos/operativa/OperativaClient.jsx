'use client';

// =====================================================================
//  GPSO COLLECTOR · Operativa (cliente) · v2
//  app/recursos/operativa/OperativaClient.jsx
//  Constelación hermana de Fiscalidad:
//   · CONTRATOS  → 4 plantillas .docx descargables (hardcoded, van en public/contratos/)
//   · CONTACTOS  → bloques (transporte, peritación, matriculación, homologadores,
//                  ITVs, otros). Vienen de la BBDD (tabla contactos_operativa).
//                  El ADMIN añade / edita / borra desde el propio panel.
//  Mismo lenguaje visual que FiscalidadClient (orbes, trazos, panel lateral).
// =====================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '../../../lib/supabase/client';
import MenuDrawer from '../../components/MenuDrawer';
import NodoVisual from '../../components/NodoVisual';

// ---- helpers de contenido ----
const lead = (t) => `<p class="n-lead">${t}</p>`;
const punto = (label, t) => `<div class="n-punto"><span class="n-tag">${label}</span><span class="n-txt">${t}</span></div>`;
const hook = (t) => `<div class="n-hook">${t}</div>`;

// ---------------------------------------------------------------------
//  CONTRATOS · plantillas .docx (van en /public/contratos/<archivo>)
// ---------------------------------------------------------------------
// IMPORTANTE: `archivo` = nombre EXACTO del .docx en /public/ (raíz)
// (tal cual lo subiste a GitHub, con mayúsculas, guiones bajos y espacios).
// Si algún día los mueves a /public/contratos/, cambia la url de abajo a '/contratos/'.
const CONTRATOS = [
  { id: 'c_reserva',        t: 'Reserva y Compra',         archivo: 'Plantilla_Contrato_Reserva_Compra_Generica.docx',
    desc: 'Reserva, validación y compraventa de la unidad importada. El contrato completo de principio a fin.' },
  { id: 'c_compraventa',    t: 'Compraventa',              archivo: 'Plantilla_Contrato_Compraventa_Generica.docx',
    desc: 'Plantilla única de compraventa, tanto si el coche ya está en stock como si está pendiente de importar.' },
  { id: 'c_intermediacion', t: 'Intermediación',           archivo: 'Plantilla_Contrato_Intermediacion_Generica.docx',
    desc: 'El cliente compra directamente al vendedor; tú cobras honorarios de intermediación. El coche nunca es tuyo.' },
  { id: 'c_matriculacion',  t: 'Gestión de matriculación', archivo: 'Plantilla Contrato Gestion Matriculacion Espana - Generica Alumnos.docx',
    desc: 'Solo el trámite técnico y documental en España, para coches que el cliente ya tiene fuera.' },
];

// ---------------------------------------------------------------------
//  BLOQUES de contactos (deben coincidir con la columna `categoria` de la BBDD)
// ---------------------------------------------------------------------
const CATEGORIAS = [
  { id: 'transporte',   t: 'Transporte',    s: 'camión y ruta' },
  { id: 'peritacion',   t: 'Peritación',    s: 'inspección en origen' },
  { id: 'matriculacion',t: 'Gestoría',      s: 'matriculación y trámites' },
  { id: 'homologacion', t: 'Homologadores', s: 'homologación técnica' },
  { id: 'itv',          t: 'ITVs',          s: 'estaciones de confianza' },
  { id: 'otros',        t: 'Otros',         s: 'varios' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.t]));

// ---------------------------------------------------------------------
//  Construcción del grafo (nodos + aristas)
// ---------------------------------------------------------------------
const NODES = (() => {
  const N = {
    raiz: { x: 170, y: 600, t: 'Operativa', s: 'toca para abrir', origen: true,
      body:
        lead('Todo lo que necesitas a mano para ejecutar una operación.') +
        punto('Contratos', 'plantillas listas para descargar y rellenar en Word') +
        punto('Contactos', 'la red de confianza por bloques: transporte, gestoría, ITV…') +
        hook('No es teoría: son los documentos y las personas que usas en cada compra real.') },
    contratos: { x: 560, y: 330, t: 'Contratos', s: 'plantillas .docx', revealBy: ['raiz'],
      body:
        lead('Cuatro contratos cubren todas las formas de operar.') +
        punto('Descarga', 'el .docx, lo abres en Word y rellenas los huecos') +
        punto('Elige', 'según cómo entra el coche y quién compra') +
        hook('Si dudas cuál usar, mira la constelación de Fiscalidad: cada vía tiene su contrato.') },
    contactos: { x: 560, y: 940, t: 'Contactos', s: 'red de confianza', revealBy: ['raiz'],
      body:
        lead('Tu agenda de confianza, ordenada por bloques.') +
        punto('Abre un bloque', 'transporte, peritación, gestoría, homologadores, ITVs…') +
        punto('Toca un dato', 'y se copia al portapapeles') },
  };
  CONTRATOS.forEach((c, i) => {
    N[c.id] = {
      x: 940, y: 190 + i * 120, t: c.t, s: 'descargar · .docx', esCaso: true, revealBy: ['contratos'],
      tipo: 'contrato', url: '/' + encodeURI(c.archivo), archivo: c.archivo, desc: c.desc,
    };
  });
  CATEGORIAS.forEach((c, i) => {
    N['cat_' + c.id] = {
      x: 940, y: 700 + i * 120, t: c.t, s: c.s, revealBy: ['contactos'],
      tipo: 'categoria', catId: c.id,
    };
  });
  return N;
})();

const EDGES = (() => {
  const E = [['raiz', 'contratos'], ['raiz', 'contactos']];
  CONTRATOS.forEach(c => E.push(['contratos', c.id]));
  CATEGORIAS.forEach(c => E.push(['contactos', 'cat_' + c.id]));
  return E;
})();

function radio(n) {
  if (n.origen) return 24;
  if (n.esCaso) return 20;
  return 16;
}
function edgePath([a, b]) {
  const na = NODES[a], nb = NODES[b];
  const left = na.x <= nb.x;
  const ra = radio(na) + 2, rb = radio(nb) + 2;
  const p1 = [na.x + (left ? ra : -ra), na.y];
  const p2 = [nb.x + (left ? -rb : rb), nb.y];
  const mx = (p1[0] + p2[0]) / 2;
  return `M ${p1[0]} ${p1[1]} C ${mx} ${p1[1]}, ${mx} ${p2[1]}, ${p2[0]} ${p2[1]}`;
}
const esVisible = (id, exp) => {
  const n = NODES[id];
  if (n.origen) return true;
  return (n.revealBy || []).some(p => exp.has(p));
};

// iconos inline
const IcoDescarga = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" />
  </svg>
);
const IcoCopia = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const FORM_VACIO = { nombre: '', rol: '', telefono: '', email: '', nota: '', activo: true };

export default function OperativaClient({ email, perfil, contactosIniciales = [] }) {
  const esAdmin = perfil && perfil.rol === 'admin';
  const supabase = useMemo(() => createClient(), []);

  // --- datos / admin ---
  const [contactos, setContactos] = useState(contactosIniciales || []);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editId, setEditId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiado, setCopiado] = useState(null);

  // --- constelación ---
  const [expandidos, setExpandidos] = useState(() => new Set());
  const [cerrando, setCerrando] = useState(() => new Set());
  const [sel, setSel] = useState(null);
  const [lit, setLit] = useState(null);
  const [hov, setHov] = useState(null);
  const [cosmos, setCosmos] = useState(null);
  const viewRef = useRef(null);
  const cosmosRef = useRef(null);
  const haloRef = useRef(null);
  const cieloRef = useRef(null);
  const reduceRef = useRef(false);
  const panRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('ocultar-theme-toggle');
    return () => document.body.classList.remove('ocultar-theme-toggle');
  }, []);

  // id de usuario (para creado_por) + recarga fresca de contactos
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (vivo && data?.user) setUserId(data.user.id);
      } catch {}
      cargarContactos();
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // al cambiar de nodo seleccionado, resetea el formulario
  useEffect(() => { setForm(FORM_VACIO); setEditId(null); setMostrarForm(false); setMsg(null); }, [sel]);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = [];
    for (let i = 0; i < 160; i++) {
      dots.push({
        x: Math.random() * 1600, y: Math.random() * 1400,
        r: Math.random() * 1.6 + 0.5,
        d: (Math.random() * 28 + 14).toFixed(0),
        tw: (Math.random() * 5 + 2.5).toFixed(1),
        o: (Math.random() * 0.3 + 0.08).toFixed(2),
      });
    }
    const links = [];
    for (let i = 0; i < 80; i++) {
      const a = dots[Math.floor(Math.random() * dots.length)];
      const b = dots[Math.floor(Math.random() * dots.length)];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 40 && dist < 240) links.push({ a, b });
    }
    setCosmos({ dots, links });
    if (viewRef.current) viewRef.current.scrollTo({ left: 0, top: 430 });

    if (reduceRef.current) return;
    let mx = -600, my = -600, hx = -600, hy = -600, raf;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      hx += (mx - hx) * 0.09; hy += (my - hy) * 0.09;
      if (haloRef.current) haloRef.current.style.transform = `translate(${hx - 260}px, ${hy - 260}px)`;
      if (cosmosRef.current) {
        const dx = (mx / window.innerWidth - 0.5) * -26;
        const dy = (my / window.innerHeight - 0.5) * -18;
        cosmosRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      if (cieloRef.current) {
        const dx = (mx / window.innerWidth - 0.5) * -12;
        const dy = (my / window.innerHeight - 0.5) * -8;
        cieloRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // -------------------- BBDD --------------------
  async function cargarContactos() {
    try {
      const { data, error } = await supabase
        .from('contactos_operativa')
        .select('*')
        .order('categoria', { ascending: true })
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true });
      if (!error && data) setContactos(data);
    } catch {}
  }

  async function guardar(catId) {
    if (!form.nombre.trim()) { setMsg('Pon al menos un nombre.'); return; }
    setGuardando(true); setMsg(null);
    const payload = {
      categoria: catId,
      nombre: form.nombre.trim(),
      rol: form.rol.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      nota: form.nota.trim() || null,
      activo: !!form.activo,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from('contactos_operativa').update(payload).eq('id', editId));
    } else {
      const orden = contactos.filter(c => c.categoria === catId).length + 1;
      ({ error } = await supabase.from('contactos_operativa')
        .insert({ ...payload, orden, creado_por: userId || null }));
    }
    setGuardando(false);
    if (error) { setMsg('Error al guardar: ' + error.message); return; }
    setForm(FORM_VACIO); setEditId(null); setMostrarForm(false);
    cargarContactos();
  }

  function editar(c) {
    setEditId(c.id);
    setForm({ nombre: c.nombre || '', rol: c.rol || '', telefono: c.telefono || '', email: c.email || '', nota: c.nota || '', activo: c.activo !== false });
    setMostrarForm(true);
  }

  async function borrar(c) {
    if (typeof window !== 'undefined' && !window.confirm(`¿Borrar "${c.nombre}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from('contactos_operativa').delete().eq('id', c.id);
    if (error) { setMsg('Error al borrar: ' + error.message); return; }
    cargarContactos();
  }

  function copiar(txt, id) {
    try { navigator.clipboard?.writeText(txt); } catch {}
    setCopiado(id); setTimeout(() => setCopiado(null), 1500);
  }

  // -------------------- constelación --------------------
  const visible = (id) => esVisible(id, expandidos);
  const tieneOcultos = (id) =>
    Object.entries(NODES).some(([k, n]) => (n.revealBy || []).includes(id) && !visible(k));
  const vecinos = (id, dir) =>
    EDGES.filter(e => e[dir === 'down' ? 0 : 1] === id).map(e => e[dir === 'down' ? 1 : 0]);
  const iluminar = (id, exp) => {
    const s = new Set([id]);
    const walk = (cur, dir) => {
      for (const nx of vecinos(cur, dir)) {
        if (s.has(nx) || !esVisible(nx, exp)) continue;
        s.add(nx); walk(nx, dir);
      }
    };
    walk(id, 'down'); walk(id, 'up');
    return s;
  };

  const clickNodo = (id) => {
    if (cerrando.size) return;
    if (expandidos.has(id)) {
      const nx = new Set(expandidos); nx.delete(id);
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (const e of [...nx]) { if (!esVisible(e, nx)) { nx.delete(e); cambio = true; } }
      }
      const fuera = Object.keys(NODES).filter(k => visible(k) && !esVisible(k, nx));
      if (fuera.length) {
        setCerrando(new Set(fuera));
        setTimeout(() => { setExpandidos(nx); setCerrando(new Set()); }, 430);
      }
      setSel(id);
      setLit(iluminar(id, nx));
      return;
    }
    const nx = new Set(expandidos); nx.add(id);
    setExpandidos(nx);
    setSel(id);
    setLit(iluminar(id, nx));
    if (viewRef.current) {
      const anchoUtil = viewRef.current.clientWidth;
      const destino = Math.max(0, NODES[id].x + 360 - anchoUtil * 0.62);
      viewRef.current.scrollTo({ left: destino, behavior: 'smooth' });
    }
  };

  const cerrar = () => { setSel(null); setLit(null); };
  const n = sel ? NODES[sel] : null;
  const catId = n && n.tipo === 'categoria' ? n.catId : null;
  const listaCat = catId ? contactos.filter(c => c.categoria === catId) : [];

  const nodosVisibles = Object.entries(NODES).filter(([id]) => visible(id));
  const edgesVisibles = EDGES.map((e, i) => ({ e, i })).filter(({ e }) => visible(e[0]) && visible(e[1]));
  const cuenta = (cid) => contactos.filter(c => c.categoria === cid && c.activo !== false).length;

  // ---- pan ----
  const panDown = (e) => {
    if (e.target.closest('.nodo') || e.target.closest('.panel')) return;
    const p = e.touches ? e.touches[0] : e;
    const v = viewRef.current; if (!v) return;
    panRef.current = { x: p.clientX, y: p.clientY, sl: v.scrollLeft, st: v.scrollTop };
  };
  const panMove = (e) => {
    if (!panRef.current) return;
    const p = e.touches ? e.touches[0] : e;
    const v = viewRef.current; if (!v) return;
    v.scrollLeft = panRef.current.sl - (p.clientX - panRef.current.x);
    v.scrollTop = panRef.current.st - (p.clientY - panRef.current.y);
  };
  const panUp = () => { panRef.current = null; };

  return (
    <div className="fisc-bg">
      <div className="halo" ref={haloRef} aria-hidden="true" />
      <div className="cielo" ref={cieloRef} aria-hidden="true" />

      <header className="fisc-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">Operativa · Contratos y contactos</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/recursos" className="volver">← Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className={'viewport' + (n ? ' conPanel' : '')} ref={viewRef}
        onMouseDown={panDown} onMouseMove={panMove} onMouseUp={panUp} onMouseLeave={panUp}
        onTouchStart={panDown} onTouchMove={panMove} onTouchEnd={panUp}>
        <div className={'canvas' + (lit ? ' dim' : '')}>

          <svg className="cosmos" ref={cosmosRef} viewBox="0 0 1600 1400" aria-hidden="true">
            {cosmos && cosmos.links.map((l, i) => (
              <line key={'l' + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
            ))}
            {cosmos && cosmos.dots.map((d, i) => (
              <circle key={'d' + i} cx={d.x} cy={d.y} r={d.r}
                style={{ opacity: d.o, animationDuration: d.d + 's, ' + d.tw + 's', animationDelay: (i % 9) + 's, ' + (i % 5) + 's' }} />
            ))}
          </svg>

          <svg className="wires" viewBox="0 0 1600 1400">
            {edgesVisibles.map(({ e, i }) => {
              const on = lit && lit.has(e[0]) && lit.has(e[1]);
              const hovLink = hov && (e[0] === hov || e[1] === hov);
              const seva = cerrando.has(e[0]) || cerrando.has(e[1]);
              return (
                <g key={i} className={seva ? 'seva' : ''}>
                  {(on || hovLink) && (<path d={edgePath(e)} className="glow" pathLength="1" />)}
                  <path id={'w' + i} d={edgePath(e)} pathLength="1"
                    className={'wire' + (on ? ' on' : '') + (hovLink ? ' hov' : '')} />
                  {!reduceRef.current && (
                    <circle r="2.6" className={'spark' + (on || hovLink ? ' on' : '')}>
                      <animateMotion dur={(4 + (i % 4)) + 's'} repeatCount="indefinite">
                        <mpath href={'#w' + i} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {nodosVisibles.map(([id, nd]) => {
            const c = nd.tipo === 'categoria' ? cuenta(nd.catId) : null;
            const sub = nd.tipo === 'categoria' ? (c ? `${c} contacto${c > 1 ? 's' : ''}` : 'vacío') : nd.s;
            return (
              <button key={id}
                className={
                  'nodo' + (nd.esCaso ? ' caso' : '') + (nd.origen ? ' raiz' : '') +
                  (lit && lit.has(id) ? ' litnode' : '') + (sel === id ? ' activo' : '') +
                  (cerrando.has(id) ? ' seva' : '')
                }
                style={{ left: nd.x, top: nd.y }}
                onMouseEnter={() => setHov(id)} onMouseLeave={() => setHov(null)}
                onClick={() => clickNodo(id)}>
                <NodoVisual tono={nd.tipo === 'categoria' ? 'azul' : 'oro'} cerrado={tieneOcultos(id) && !expandidos.has(id)} />
                <span className="etq">
                  <span className="t">{nd.t}</span>
                  <span className="s">{sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className={'panel' + (n ? ' open' : '')} aria-live="polite">
        <button className="cerrar" onClick={cerrar} aria-label="Cerrar">✕</button>
        {n && (
          <>
            <div className="phead">
              <div className="chips">
                {n.tipo === 'contrato' && <><span className="chip gold">Contrato</span><span className="chip">.docx</span></>}
                {n.tipo === 'categoria' && <><span className="chip gold">Contactos</span>{esAdmin && <span className="chip">admin</span>}</>}
              </div>
              <h2>{n.t}</h2>
            </div>

            <div className="pbody">
              {/* ---------- CONTRATO ---------- */}
              {n.tipo === 'contrato' && (
                <>
                  <p className="n-lead">{n.desc}</p>
                  <a className="dl-btn" href={n.url} download><IcoDescarga /> Descargar plantilla</a>
                  <div className="dl-file">{n.archivo}</div>
                  <div className="n-hook" style={{ marginTop: 18 }}>
                    Se descarga en formato Word. Ábrelo, rellena los datos de la operación y guárdalo con el nombre del cliente.
                  </div>
                </>
              )}

              {/* ---------- CATEGORÍA DE CONTACTOS ---------- */}
              {n.tipo === 'categoria' && (
                <>
                  {listaCat.length === 0 && (
                    <p className="n-lead" style={{ color: '#8b93a3' }}>
                      {esAdmin ? 'Aún no hay contactos en este bloque. Añade el primero abajo.' : 'Aún no hay contactos en este bloque.'}
                    </p>
                  )}

                  {listaCat.map(c => (
                    <div key={c.id} className={'ct-card' + (c.activo === false ? ' oculto' : '')}>
                      <div className="ct-top">
                        <div className="ct-ident">
                          <b>{c.nombre}{c.activo === false && <span className="ct-badge">oculto</span>}</b>
                          {c.rol && <i>{c.rol}</i>}
                        </div>
                        {esAdmin && (
                          <div className="ct-admin">
                            <button onClick={() => editar(c)} title="Editar">✎</button>
                            <button onClick={() => borrar(c)} title="Borrar" className="del">🗑</button>
                          </div>
                        )}
                      </div>
                      {c.telefono && (
                        <button className="ct-row" onClick={() => copiar(c.telefono, 'tel' + c.id)}>
                          <span className="ct-k">Teléfono</span><span className="ct-v">{c.telefono}</span>
                          <span className="ct-copy">{copiado === 'tel' + c.id ? '✓' : <IcoCopia />}</span>
                        </button>
                      )}
                      {c.email && (
                        <button className="ct-row" onClick={() => copiar(c.email, 'em' + c.id)}>
                          <span className="ct-k">Email</span><span className="ct-v">{c.email}</span>
                          <span className="ct-copy">{copiado === 'em' + c.id ? '✓' : <IcoCopia />}</span>
                        </button>
                      )}
                      {c.nota && <div className="ct-nota">{c.nota}</div>}
                    </div>
                  ))}

                  {/* ---- gestión admin ---- */}
                  {esAdmin && !mostrarForm && (
                    <button className="cf-add" onClick={() => { setForm(FORM_VACIO); setEditId(null); setMostrarForm(true); }}>
                      + Añadir contacto a {CAT_LABEL[catId]}
                    </button>
                  )}

                  {esAdmin && mostrarForm && (
                    <div className="cf-form">
                      <div className="cf-title">{editId ? 'Editar contacto' : 'Nuevo contacto'} · {CAT_LABEL[catId]}</div>
                      <label className="cf-l">Nombre *
                        <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Empresa o persona" />
                      </label>
                      <label className="cf-l">Rol / zona
                        <input value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} placeholder="Ej. Alemania → Levante" />
                      </label>
                      <div className="cf-grid">
                        <label className="cf-l">Teléfono
                          <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 6…" />
                        </label>
                        <label className="cf-l">Email
                          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@…" />
                        </label>
                      </div>
                      <label className="cf-l">Nota
                        <input value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Opcional" />
                      </label>
                      <label className="cf-check">
                        <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                        Visible para los alumnos
                      </label>
                      {msg && <div className="cf-msg">{msg}</div>}
                      <div className="cf-acc">
                        <button className="cf-cancel" onClick={() => { setMostrarForm(false); setEditId(null); setForm(FORM_VACIO); setMsg(null); }}>Cancelar</button>
                        <button className="cf-save" disabled={guardando} onClick={() => guardar(catId)}>
                          {guardando ? 'Guardando…' : (editId ? 'Guardar cambios' : 'Añadir')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ---------- NODO NORMAL (raíz / ramas) ---------- */}
              {!n.tipo && <div dangerouslySetInnerHTML={{ __html: n.body }} />}
            </div>
          </>
        )}
      </aside>

      <style jsx global>{`
        .viewport::-webkit-scrollbar{display:none;width:0;height:0}
        .pbody .n-lead{font-size:15px;line-height:1.5;color:#ecdcae;font-weight:400;margin:0 0 18px}
        .pbody .n-punto{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-top:1px solid #1c212b}
        .pbody .n-punto:first-of-type{border-top:none;padding-top:2px}
        .pbody .n-tag{flex:none;min-width:74px;font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;color:#c9a14d;font-weight:600;padding-top:2px}
        .pbody .n-txt{font-size:13.5px;line-height:1.5;color:#d4d8e0}
        .pbody .n-hook{margin-top:18px;padding:13px 15px;border-radius:9px;background:rgba(201,161,77,.08);border:1px solid rgba(201,161,77,.32);font-size:13px;line-height:1.5;color:#ecdcae}

        /* descarga de contrato */
        .pbody .dl-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:4px;padding:14px 16px;border-radius:11px;border:1px solid rgba(201,161,77,.5);background:linear-gradient(135deg,rgba(201,161,77,.22),rgba(201,161,77,.08));color:#f0e2b6;font-family:var(--font-space-grotesk),sans-serif;font-size:14px;font-weight:600;letter-spacing:.3px;cursor:pointer;text-decoration:none;transition:border-color .2s,background .2s,transform .15s}
        .pbody .dl-btn:hover{border-color:#e3c987;background:linear-gradient(135deg,rgba(201,161,77,.34),rgba(201,161,77,.14));transform:translateY(-1px)}
        .pbody .dl-file{margin-top:9px;text-align:center;font-size:11px;letter-spacing:.5px;color:#6a7180;font-family:ui-monospace,monospace}

        /* tarjeta de contacto */
        .pbody .ct-card{border:1px solid #232833;border-radius:12px;padding:14px;margin-bottom:12px;background:rgba(13,16,23,.6)}
        .pbody .ct-card.oculto{opacity:.55}
        .pbody .ct-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px}
        .pbody .ct-ident b{display:flex;align-items:center;gap:8px;font-size:15px;color:#ecdcae;font-weight:600}
        .pbody .ct-ident i{display:block;font-style:normal;font-size:12px;color:#8b93a3;margin-top:2px}
        .pbody .ct-badge{font-size:8.5px;letter-spacing:.5px;text-transform:uppercase;color:#0a0c10;background:#8b93a3;border-radius:4px;padding:1px 6px;font-weight:700}
        .pbody .ct-admin{display:flex;gap:6px;flex:none}
        .pbody .ct-admin button{width:28px;height:28px;border-radius:8px;border:1px solid #232833;background:#12151c;color:#c9c3b4;cursor:pointer;font-size:13px;transition:border-color .2s,color .2s}
        .pbody .ct-admin button:hover{border-color:#c9a14d;color:#f0e2b6}
        .pbody .ct-admin button.del:hover{border-color:#e0876a;color:#e0876a}
        .pbody .ct-row{display:flex;align-items:center;gap:10px;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #232833;border-radius:9px;background:#0d1017;color:#e9e6df;font-family:var(--font-space-grotesk),sans-serif;cursor:pointer;transition:border-color .2s}
        .pbody .ct-row:hover{border-color:#c9a14d}
        .pbody .ct-k{flex:none;min-width:62px;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#8b93a3;text-align:left}
        .pbody .ct-v{flex:1;text-align:left;font-size:13.5px;color:#ecdcae;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pbody .ct-copy{flex:none;color:#c9a14d;display:flex;align-items:center}
        .pbody .ct-nota{margin-top:8px;font-size:12px;line-height:1.45;color:#8b93a3}

        /* formulario admin */
        .pbody .cf-add{width:100%;margin-top:6px;padding:12px;border-radius:10px;border:1px dashed rgba(201,161,77,.5);background:transparent;color:#c9a14d;font-family:var(--font-space-grotesk),sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s}
        .pbody .cf-add:hover{background:rgba(201,161,77,.08);border-color:#c9a14d}
        .pbody .cf-form{margin-top:10px;border:1px solid rgba(201,161,77,.3);border-radius:12px;padding:16px;background:rgba(201,161,77,.04)}
        .pbody .cf-title{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#c9a14d;font-weight:700;margin-bottom:12px}
        .pbody .cf-l{display:block;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:#8b93a3;margin-bottom:10px}
        .pbody .cf-l input{display:block;width:100%;margin-top:5px;background:#0d1017;border:1px solid #232833;border-radius:8px;padding:9px 11px;color:#ecdcae;font-family:var(--font-space-grotesk),sans-serif;font-size:14px}
        .pbody .cf-l input:focus{outline:none;border-color:#c9a14d}
        .pbody .cf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pbody .cf-check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#c9c3b4;margin:2px 0 4px;cursor:pointer}
        .pbody .cf-check input{width:16px;height:16px;accent-color:#c9a14d}
        .pbody .cf-msg{margin:8px 0;font-size:12px;color:#e0876a}
        .pbody .cf-acc{display:flex;gap:8px;margin-top:12px}
        .pbody .cf-cancel{flex:none;padding:10px 14px;border-radius:9px;border:1px solid #232833;background:transparent;color:#8b93a3;font-family:var(--font-space-grotesk),sans-serif;font-size:13px;cursor:pointer}
        .pbody .cf-cancel:hover{border-color:#c9c3b4;color:#c9c3b4}
        .pbody .cf-save{flex:1;padding:10px 14px;border-radius:9px;border:none;background:linear-gradient(135deg,#e3c987,#c9a14d);color:#1a140a;font-family:var(--font-space-grotesk),sans-serif;font-size:13px;font-weight:700;cursor:pointer}
        .pbody .cf-save:disabled{opacity:.6;cursor:default}
      `}</style>

      <style jsx>{`
        .fisc-bg{position:fixed;inset:0;background:#080a0f;color:#e9e6df;font-family:var(--font-space-grotesk),sans-serif;font-weight:300;overflow:hidden}
        .cielo{position:absolute;inset:-30px;z-index:0;background-color:#0a0d14;background-image:radial-gradient(1200px 700px at 60% 42%, rgba(60,48,24,.35) 0%, transparent 55%), url(/cosmos.jpg);background-size:cover;background-position:center;opacity:.3;will-change:transform}
        .cielo::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 45% 45%, rgba(10,12,16,.35) 25%, rgba(10,12,16,.82) 100%)}
        .halo{position:fixed;top:0;left:0;width:520px;height:520px;pointer-events:none;z-index:2;border-radius:50%;background:radial-gradient(circle, rgba(201,161,77,.14) 0%, rgba(201,161,77,.05) 38%, transparent 68%);mix-blend-mode:screen;will-change:transform}
        @media (prefers-reduced-motion: reduce){.halo{display:none}}

        .fisc-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:16px 28px 12px;background:linear-gradient(to bottom,rgba(10,12,16,.94) 55%,rgba(10,12,16,0))}
        .brand-wrap{display:flex;align-items:center;gap:12px}
        .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .top-right{display:flex;align-items:center;gap:16px}
        .volver{font-size:12px;color:#c9c3b4;text-decoration:none;text-transform:uppercase;letter-spacing:1.2px;border:1px solid rgba(201,161,77,.35);border-radius:20px;padding:7px 14px;background:rgba(18,21,28,.5);backdrop-filter:blur(6px);transition:all .25s}
        .volver:hover{color:#f0e2b6;border-color:rgba(201,161,77,.7);background:rgba(18,21,28,.75)}

        .viewport{position:absolute;inset:0;overflow:auto;z-index:2;scrollbar-width:none;-ms-overflow-style:none;cursor:grab;padding:90px 40px 40px;transition:right .38s cubic-bezier(.22,.9,.3,1)}
        .viewport.conPanel{right:440px}
        .canvas{position:relative;width:1600px;height:1400px}

        .cosmos{position:absolute;inset:-40px;z-index:1;width:calc(100% + 80px);height:calc(100% + 80px);will-change:transform}
        .cosmos line{stroke:rgba(139,147,163,.09);stroke-width:.6}
        .cosmos circle{fill:#8b93a3;animation:deriva linear infinite alternate, brillo ease-in-out infinite alternate}
        @keyframes deriva{from{transform:translate(0,0)}to{transform:translate(18px,-14px)}}
        @keyframes brillo{from{fill-opacity:.35}to{fill-opacity:1}}
        @media (prefers-reduced-motion: reduce){.cosmos circle{animation:none}}

        .wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
        .wires :global(.glow){fill:none;stroke:rgba(227,201,135,.22);stroke-width:7;stroke-linecap:round}
        .wires :global(.wire){fill:none;stroke:rgba(201,161,77,.32);stroke-width:1.2;stroke-dasharray:1;stroke-dashoffset:0;animation:traza .9s ease both;transition:stroke .35s,opacity .35s}
        @keyframes traza{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
        .wires :global(.wire.on){stroke:#e9d194;stroke-width:1.7}
        .wires :global(.wire.hov){stroke:#f0e2b6;stroke-width:2;filter:drop-shadow(0 0 4px rgba(240,210,130,.8))}
        .canvas.dim .wires :global(.wire:not(.on)){opacity:.16}
        .wires :global(.spark){fill:#c9a14d;opacity:.5;transition:opacity .35s}
        .wires :global(.spark.on){opacity:1;fill:#f0e2b6}
        .canvas.dim .wires :global(.spark:not(.on)){opacity:.05}
        .wires :global(g.seva){opacity:0;transition:opacity .4s ease}
        @media (prefers-reduced-motion: reduce){.wires :global(.wire){animation:none}}

        .nodo{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:11px;background:none;border:none;padding:8px;cursor:pointer;color:#e9e6df;font-family:var(--font-space-grotesk),sans-serif;animation:brota .55s cubic-bezier(.2,.9,.3,1.4) both;transition:opacity .35s;z-index:3}
        @keyframes brota{from{opacity:0;transform:translate(-50%,-50%) scale(.25)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        .nodo.seva{animation:sevaAnim .43s cubic-bezier(.6,-.3,.8,.6) both;pointer-events:none}
        @keyframes sevaAnim{from{opacity:1;transform:translate(-50%,-50%) scale(1)}to{opacity:0;transform:translate(-50%,-50%) scale(.2)}}
        @media (prefers-reduced-motion: reduce){.nodo{animation:none}.nodo.seva{animation:none;opacity:0}}
        .nodo:focus-visible{outline:2px solid #ecdcae;outline-offset:4px;border-radius:10px}

        .orbe{width:32px;height:32px;border-radius:50%;position:relative;background:radial-gradient(circle at 35% 30%, #f0e2b6 0%, #c9a14d 45%, #6b5526 100%);box-shadow:0 0 16px rgba(201,161,77,.5), 0 0 44px rgba(201,161,77,.16);transition:box-shadow .3s, transform .3s;flex:none}
        .orbe.cerrado::after{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px dashed rgba(201,161,77,.55);animation:girar 14s linear infinite}
        @keyframes girar{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.orbe.cerrado::after{animation:none}}
        .nodo:hover .orbe{box-shadow:0 0 24px rgba(201,161,77,.85), 0 0 70px rgba(201,161,77,.32);transform:scale(1.1)}
        .nodo.activo .orbe{box-shadow:0 0 28px rgba(240,226,182,.95), 0 0 80px rgba(201,161,77,.45)}
        .nodo.raiz .orbe{width:48px;height:48px;animation:latido 3.2s ease-in-out infinite}
        @keyframes latido{0%,100%{box-shadow:0 0 18px rgba(201,161,77,.55),0 0 50px rgba(201,161,77,.2)}50%{box-shadow:0 0 34px rgba(201,161,77,.95),0 0 95px rgba(201,161,77,.38)}}
        @media (prefers-reduced-motion: reduce){.nodo.raiz .orbe{animation:none}}
        .nodo.caso .orbe{width:38px;height:38px;background:radial-gradient(circle at 35% 30%, #fdf6e0 0%, #e3c987 40%, #8a6d2f 100%)}
        .orbe.contacto{background:radial-gradient(circle at 35% 30%, #d6e6ff 0%, #7fa6d8 45%, #2f4a6b 100%);box-shadow:0 0 16px rgba(127,166,216,.4), 0 0 44px rgba(127,166,216,.14)}
        .nodo:hover .orbe.contacto{box-shadow:0 0 24px rgba(157,180,214,.7), 0 0 60px rgba(127,166,216,.28)}

        .etq{text-align:center;max-width:210px}
        .etq .t{display:block;font-weight:600;font-size:15px;letter-spacing:1.1px;text-transform:uppercase;text-shadow:0 2px 12px rgba(10,12,16,.95)}
        .nodo.caso .etq .t{color:#ecdcae;font-size:16px}
        .nodo.raiz .etq .t{font-size:17px;color:#ecdcae}
        .etq .s{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#8b93a3;margin-top:4px;text-shadow:0 2px 8px rgba(10,12,16,.95)}
        .canvas.dim .nodo:not(.litnode){opacity:.18}

        .panel{position:fixed;top:0;right:0;bottom:0;width:440px;z-index:50;background:#12151c;border-left:1px solid #232833;transform:translateX(102%);transition:transform .38s cubic-bezier(.22,.9,.3,1);display:flex;flex-direction:column}
        .panel.open{transform:translateX(0)}
        .phead{padding:26px 28px 18px;border-bottom:1px solid #232833}
        .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .chip{font-size:10.5px;letter-spacing:.6px;color:#8b93a3;border:1px solid #232833;border-radius:20px;padding:3px 10px;text-transform:uppercase}
        .chip.gold{color:#c9a14d;border-color:rgba(201,161,77,.5)}
        .panel h2{font-family:var(--font-cormorant),serif;font-weight:600;font-size:30px;color:#ecdcae;line-height:1.05;margin:0}
        .pbody{padding:22px 28px 40px;overflow-y:auto;flex:1}
        .cerrar{position:absolute;top:20px;right:20px;background:none;border:1px solid #232833;border-radius:50%;width:32px;height:32px;color:#8b93a3;cursor:pointer;font-size:15px;transition:border-color .2s,color .2s;z-index:2}
        .cerrar:hover{border-color:#c9a14d;color:#c9a14d}

        @media (max-width:900px){
          .panel{top:auto;left:0;right:0;width:auto;max-height:76vh;border-left:none;border-top:1px solid #232833;border-radius:16px 16px 0 0;transform:translateY(105%)}
          .panel.open{transform:translateY(0)}
          .viewport{padding:84px 16px 30px}
          .viewport.conPanel{right:0}
        }
      `}</style>
    </div>
  );
}
