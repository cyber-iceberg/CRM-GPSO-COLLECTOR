'use client';

// =====================================================================
//  GPSO COLLECTOR · Operativa (cliente) · v3  (rediseño)
//  app/recursos/operativa/OperativaClient.jsx
//  Pantalla fija (sin arrastrar):
//   · Inicio → Operativa + dos orbes descolocados: Contratos y Contactos.
//   · Abres uno → el otro desaparece y se despliegan sus orbes hijos,
//     con el panel a la derecha. Click en Operativa = volver.
//   · Contratos → 4 plantillas .docx descargables (en /public/).
//   · Contactos → bloques (transporte, peritación, gestoría, homologadores,
//     ITVs, otros) desde la BBDD; el ADMIN añade/edita/borra.
//  Perla compartida (NodoVisual) · galaxia + nebulosa según la rama.
// =====================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '../../../lib/supabase/client';
import MenuDrawer from '../../components/MenuDrawer';
import NodoVisual from '../../components/NodoVisual';
import EspanaMapa from './EspanaMapa';
import { MAPA } from './espana-geo';

const REGION_NOMBRE = Object.fromEntries(MAPA.regions.map(r => [r.id, r.name]));

// ---------------------------------------------------------------------
//  CONTRATOS · `archivo` = nombre EXACTO del .docx en /public/ (raíz)
// ---------------------------------------------------------------------
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
const docUrl = (archivo) => '/' + encodeURI(archivo);

// Bloques de contactos (coinciden con la columna `categoria` de la BBDD)
const CATEGORIAS = [
  { id: 'transporte',    t: 'Transporte',    s: 'camión y ruta' },
  { id: 'peritacion',    t: 'Peritación',    s: 'inspección en origen' },
  { id: 'matriculacion', t: 'Gestoría',      s: 'matriculación y trámites' },
  { id: 'homologacion',  t: 'Homologadores', s: 'homologación técnica' },
  { id: 'itv',           t: 'ITVs',          s: 'estaciones de confianza' },
  { id: 'otros',         t: 'Otros',         s: 'varios' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.t]));

// ---------------------------------------------------------------------
//  Posiciones por estado (px dentro de la zona izquierda; el panel va a la
//  derecha). Cambia estos números para recolocar los orbes.
// ---------------------------------------------------------------------
const LAYOUT = {
  home: [
    { id: 'op',        x: 600, y: 140, rol: 'raiz',   tono: 'oro',  t: 'Operativa', s: 'contratos y contactos', kind: 'op' },
    { id: 'contratos', x: 370, y: 440, rol: 'portal', tono: 'oro',  t: 'Contratos', s: '4 plantillas listas',    kind: 'rama', ring: true, abrir: true },
    { id: 'contactos', x: 860, y: 560, rol: 'portal', tono: 'azul', t: 'Contactos', s: 'tu red de confianza',    kind: 'rama', ring: true, abrir: true },
  ],
  contratos: [
    { id: 'op',  x: 470, y: 110, rol: 'raiz',       tono: 'oro', t: 'Operativa', s: 'volver', kind: 'op' },
    { id: 'hub', x: 300, y: 330, rol: 'portal hub', tono: 'oro', t: 'Contratos', s: '4 plantillas', kind: 'hub' },
    { id: 'c_reserva',        x: 165, y: 535, rol: 'caso', tono: 'oro', t: 'Reserva y Compra',         s: 'descargar', kind: 'contrato' },
    { id: 'c_compraventa',    x: 440, y: 548, rol: 'caso', tono: 'oro', t: 'Compraventa',              s: 'descargar', kind: 'contrato' },
    { id: 'c_intermediacion', x: 255, y: 725, rol: 'caso', tono: 'oro', t: 'Intermediación',           s: 'descargar', kind: 'contrato' },
    { id: 'c_matriculacion',  x: 510, y: 718, rol: 'caso', tono: 'oro', t: 'Gestión de matriculación', s: 'descargar', kind: 'contrato' },
  ],
  contactos: [
    { id: 'op',  x: 470, y: 110, rol: 'raiz',       tono: 'azul', t: 'Operativa', s: 'volver', kind: 'op' },
    { id: 'hub', x: 300, y: 330, rol: 'portal hub', tono: 'azul', t: 'Contactos', s: 'red de confianza', kind: 'hub' },
    { id: 'transporte',    x: 150, y: 520, rol: 'caso', tono: 'azul', kind: 'categoria' },
    { id: 'peritacion',    x: 410, y: 505, rol: 'caso', tono: 'azul', kind: 'categoria' },
    { id: 'matriculacion', x: 220, y: 680, rol: 'caso', tono: 'azul', kind: 'categoria' },
    { id: 'homologacion',  x: 480, y: 670, rol: 'caso', tono: 'azul', kind: 'categoria' },
    { id: 'itv',           x: 300, y: 835, rol: 'caso', tono: 'azul', kind: 'categoria' },
    { id: 'otros',         x: 560, y: 825, rol: 'caso', tono: 'azul', kind: 'categoria' },
  ],
};
const EDGES = {
  home:      [['op', 'contratos'], ['op', 'contactos']],
  contratos: [['op', 'hub'], ['hub', 'c_reserva'], ['hub', 'c_compraventa'], ['hub', 'c_intermediacion'], ['hub', 'c_matriculacion']],
  contactos: [['op', 'hub'], ['hub', 'transporte'], ['hub', 'peritacion'], ['hub', 'matriculacion'], ['hub', 'homologacion'], ['hub', 'itv'], ['hub', 'otros']],
};

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
const FORM_VACIO = { nombre: '', rol: '', telefono: '', email: '', nota: '', activo: true, region: '' };

export default function OperativaClient({ email, perfil, contactosIniciales = [] }) {
  const esAdmin = perfil && perfil.rol === 'admin';
  const supabase = useMemo(() => createClient(), []);

  const [rama, setRama] = useState(null);     // null | 'contratos' | 'contactos'
  const [sel, setSel] = useState(null);       // id del hijo seleccionado (contrato o categoría)
  const [regionSel, setRegionSel] = useState(null); // comunidad seleccionada en el mapa ITV
  const [contactos, setContactos] = useState(contactosIniciales || []);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editId, setEditId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiado, setCopiado] = useState(null);
  const [cosmos, setCosmos] = useState(null);

  useEffect(() => {
    document.body.classList.add('ocultar-theme-toggle');
    return () => document.body.classList.remove('ocultar-theme-toggle');
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try { const { data } = await supabase.auth.getUser(); if (vivo && data?.user) setUserId(data.user.id); } catch {}
      cargarContactos();
    })();
    const dots = [];
    for (let i = 0; i < 150; i++) dots.push({
      x: (Math.random() * 100).toFixed(2), y: (Math.random() * 100).toFixed(2),
      r: (Math.random() * 1.5 + 0.3).toFixed(2), o: (Math.random() * 0.5 + 0.1).toFixed(2),
      tw: (Math.random() * 5 + 2.5).toFixed(1), d: (i % 5),
    });
    setCosmos(dots);
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // al cambiar de hijo seleccionado, resetea el formulario de admin (y la comunidad si salimos de ITV)
  useEffect(() => { setForm(FORM_VACIO); setEditId(null); setMostrarForm(false); setMsg(null); if (sel !== 'itv') setRegionSel(null); }, [sel, rama]);

  async function cargarContactos() {
    try {
      const { data, error } = await supabase.from('contactos_operativa').select('*')
        .order('categoria', { ascending: true }).order('orden', { ascending: true }).order('created_at', { ascending: true });
      if (!error && data) setContactos(data);
    } catch {}
  }
  async function guardar(catId) {
    if (!form.nombre.trim()) { setMsg('Pon al menos un nombre.'); return; }
    if (catId === 'itv' && !form.region) { setMsg('Elige la comunidad.'); return; }
    setGuardando(true); setMsg(null);
    const payload = {
      categoria: catId, nombre: form.nombre.trim(), rol: form.rol.trim() || null,
      telefono: form.telefono.trim() || null, email: form.email.trim() || null,
      nota: form.nota.trim() || null, activo: !!form.activo,
      region: catId === 'itv' ? (form.region || null) : null,
    };
    let error;
    if (editId) { ({ error } = await supabase.from('contactos_operativa').update(payload).eq('id', editId)); }
    else {
      const orden = contactos.filter(c => c.categoria === catId).length + 1;
      ({ error } = await supabase.from('contactos_operativa').insert({ ...payload, orden, creado_por: userId || null }));
    }
    setGuardando(false);
    if (error) { setMsg('Error al guardar: ' + error.message); return; }
    setForm(FORM_VACIO); setEditId(null); setMostrarForm(false); cargarContactos();
  }
  function editar(c) {
    setEditId(c.id);
    setForm({ nombre: c.nombre || '', rol: c.rol || '', telefono: c.telefono || '', email: c.email || '', nota: c.nota || '', activo: c.activo !== false, region: c.region || '' });
    setMostrarForm(true);
  }
  async function borrar(c) {
    if (typeof window !== 'undefined' && !window.confirm(`¿Borrar "${c.nombre}"? No se puede deshacer.`)) return;
    const { error } = await supabase.from('contactos_operativa').delete().eq('id', c.id);
    if (error) { setMsg('Error al borrar: ' + error.message); return; }
    cargarContactos();
  }
  function copiar(txt, id) { try { navigator.clipboard?.writeText(txt); } catch {} setCopiado(id); setTimeout(() => setCopiado(null), 1500); }

  const cuenta = (cid) => contactos.filter(c => c.categoria === cid && c.activo !== false).length;

  // ---- navegación de orbes ----
  const nodos = LAYOUT[rama || 'home'];
  const edges = EDGES[rama || 'home'];
  const nodoPos = Object.fromEntries(nodos.map(n => [n.id, n]));

  function clickNodo(n) {
    if (n.kind === 'op') { setRama(null); setSel(null); return; }
    if (n.kind === 'hub') { setRama(null); setSel(null); return; }
    if (n.kind === 'rama') { setRama(n.id); setSel(null); return; }
    if (n.kind === 'contrato' || n.kind === 'categoria') { setSel(n.id); return; }
  }
  const volverHome = () => { setRama(null); setSel(null); };

  const panelAbierto = !!rama;
  const contrato = sel && CONTRATOS.find(c => c.id === sel);
  const catSel = rama === 'contactos' && sel ? sel : null;
  const esMapaITV = catSel === 'itv';
  const listaCat = catSel ? contactos.filter(c => c.categoria === catSel) : [];
  // ITV por comunidad
  const cuentaRegion = (rid) => contactos.filter(c => c.categoria === 'itv' && c.region === rid && c.activo !== false).length;
  const listaReg = esMapaITV && regionSel ? contactos.filter(c => c.categoria === 'itv' && c.region === regionSel) : [];
  // ITV sin comunidad válida (p.ej. guardadas antes de tener región) -> para poder asignarlas
  const itvHuerfanas = esMapaITV ? contactos.filter(c => c.categoria === 'itv' && !REGION_NOMBRE[c.region]) : [];

  // etiqueta/sub de cada nodo (las categorías muestran recuento)
  const metaNodo = (n) => {
    if (n.kind === 'categoria') { const c = cuenta(n.id); return c ? `${c} contacto${c > 1 ? 's' : ''}` : 'vacío'; }
    return n.s;
  };
  const tituloNodo = (n) => n.t || CAT_LABEL[n.id] || n.id;
  const subNodo = (n) => (n.kind === 'categoria' ? (CATEGORIAS.find(c => c.id === n.id)?.s) : null);

  // ---- bloques de panel reutilizables (contactos / ITV) ----
  const tarjetaContacto = (c) => (
    <div key={c.id} className={'ct-card' + (c.activo === false ? ' oculto' : '')}>
      <div className="ct-top">
        <div className="ct-ident"><b>{c.nombre}{c.activo === false && <span className="ct-badge">oculto</span>}</b>{c.rol && <i>{c.rol}</i>}</div>
        {esAdmin && (<div className="ct-admin"><button onClick={() => editar(c)} title="Editar">✎</button><button onClick={() => borrar(c)} title="Borrar" className="del">🗑</button></div>)}
      </div>
      {c.telefono && (<button className="ct-row" onClick={() => copiar(c.telefono, 'tel' + c.id)}><span className="ct-k">Teléfono</span><span className="ct-v">{c.telefono}</span><span className="ct-copy">{copiado === 'tel' + c.id ? '✓' : <IcoCopia />}</span></button>)}
      {c.email && (<button className="ct-row" onClick={() => copiar(c.email, 'em' + c.id)}><span className="ct-k">Email</span><span className="ct-v">{c.email}</span><span className="ct-copy">{copiado === 'em' + c.id ? '✓' : <IcoCopia />}</span></button>)}
      {c.nota && <div className="ct-nota">{c.nota}</div>}
    </div>
  );
  const abrirForm = (regionPreset = '') => { setForm({ ...FORM_VACIO, region: regionPreset }); setEditId(null); setMostrarForm(true); };
  const REGIONES_ORD = MAPA.regions.slice().sort((a, b) => a.name.localeCompare(b.name));
  const formAdmin = (titulo, cat, rolPH = 'Ej. Alemania → Levante', conRegion = false) => (
    <div className="cf-form">
      <div className="cf-title">{editId ? 'Editar contacto' : 'Nuevo contacto'} · {titulo}</div>
      {conRegion && (
        <label className="cf-l">Comunidad *
          <select className="cf-sel" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}>
            <option value="">— elige comunidad —</option>
            {REGIONES_ORD.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
      )}
      <label className="cf-l">Nombre *<input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Empresa o persona" /></label>
      <label className="cf-l">Rol / nota corta<input value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} placeholder={rolPH} /></label>
      <div className="cf-grid">
        <label className="cf-l">Teléfono<input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 6…" /></label>
        <label className="cf-l">Email<input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@…" /></label>
      </div>
      <label className="cf-l">Nota<input value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Opcional" /></label>
      <label className="cf-check"><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />Visible para los alumnos</label>
      {msg && <div className="cf-msg">{msg}</div>}
      <div className="cf-acc">
        <button className="cf-cancel" onClick={() => { setMostrarForm(false); setEditId(null); setForm(FORM_VACIO); setMsg(null); }}>Cancelar</button>
        <button className="cf-save" disabled={guardando} onClick={() => guardar(cat)}>{guardando ? 'Guardando…' : (editId ? 'Guardar cambios' : 'Añadir')}</button>
      </div>
    </div>
  );

  return (
    <div className={'op-scene r-' + (rama || 'home') + (panelAbierto ? ' conPanel' : '') + (esMapaITV ? ' itv' : '')}
      onMouseDown={(e) => { if (rama && !e.target.closest('.nodo') && !e.target.closest('.panel') && !e.target.closest('.op-top') && !e.target.closest('.mapa-wrap')) volverHome(); }}>

      {/* galaxia de fondo (imagen) + brillo por rama */}
      <div className="cielo" aria-hidden="true" />

      {/* estrellas */}
      <svg className="cosmos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {cosmos && cosmos.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r / 12} style={{ opacity: d.o, animation: `nbrillo ${d.tw}s ease-in-out ${d.d}s infinite alternate` }} />
        ))}
      </svg>

      {/* cabecera */}
      <header className="op-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">Operativa · contratos y contactos</div>
          </div>
        </div>
        <div className="top-right">
          {rama && <button className="volver" onClick={volverHome}>← Volver</button>}
          <a href="/recursos" className="volver">← Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      {/* zona central: mapa de ITV o constelación de orbes */}
      {esMapaITV ? (
        <div className="stage mapa">
          <EspanaMapa conCount={cuentaRegion} sel={regionSel} onSelect={(id) => setRegionSel(prev => prev === id ? null : id)} />
        </div>
      ) : (
        <div className="stage" key={rama || 'home'}>
          <svg className="wires" viewBox="0 0 1100 920" preserveAspectRatio="none" aria-hidden="true">
            {edges.map(([a, b], i) => {
              const A = nodoPos[a], B = nodoPos[b]; if (!A || !B) return null;
              const my = (A.y + B.y) / 2;
              const az = (A.tono === 'azul' && B.tono === 'azul') || B.tono === 'azul';
              return <path key={i} d={`M ${A.x} ${A.y} C ${A.x} ${my}, ${B.x} ${my}, ${B.x} ${B.y}`} fill="none"
                stroke={az ? 'rgba(150,180,222,.30)' : 'rgba(201,161,77,.32)'} strokeWidth="1" />;
            })}
          </svg>

          {nodos.map(n => (
            <button key={n.id} className={'nodo ' + n.rol + (sel === n.id ? ' activo' : '')}
              style={{ left: (n.x / 1100 * 100) + '%', top: (n.y / 920 * 100) + '%' }}
              onClick={() => clickNodo(n)}>
              <NodoVisual tono={n.tono} cerrado={!!n.ring} />
              <span className="etq">
                <span className="t">{tituloNodo(n)}</span>
                <span className={'s' + (n.kind === 'contrato' ? ' dl' : '') + (n.kind === 'categoria' && metaNodo(n) === 'vacío' ? ' pend' : '')}>{metaNodo(n)}</span>
                {subNodo(n) && <span className="s2">{subNodo(n)}</span>}
                {n.abrir && <span className="abrir">Abrir →</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* panel */}
      <aside className={'panel' + (panelAbierto ? ' open' : '')} aria-live="polite">
        {rama === 'contratos' && (
          <>
            <div className="phead">
              <div className="chips"><span className="chip gold">Contratos</span><span className="chip">.docx</span></div>
              <h2>{contrato ? contrato.t : 'Contratos'}</h2>
            </div>
            <div className="pbody">
              {contrato ? (
                <>
                  <p className="n-lead">{contrato.desc}</p>
                  <a className="dl-btn" href={docUrl(contrato.archivo)} download><IcoDescarga /> Descargar plantilla</a>
                  <div className="dl-file">{contrato.archivo}</div>
                  <button className="link-volver" onClick={() => setSel(null)}>← Todos los contratos</button>
                </>
              ) : (
                <>
                  <p className="n-lead">Cuatro plantillas cubren todas las formas de operar. Descárgalas, ábrelas en Word y rellénalas.</p>
                  {CONTRATOS.map(c => (
                    <div key={c.id} className="ct-card">
                      <div className="ct-top"><div className="ct-ident"><b>{c.t}</b></div></div>
                      <div className="ct-nota">{c.desc}</div>
                      <a className="dl-btn sm" href={docUrl(c.archivo)} download><IcoDescarga /> Descargar</a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {rama === 'contactos' && (
          <>
            <div className="phead">
              <div className="chips">
                <span className="chip gold">{esMapaITV ? 'ITV' : 'Contactos'}</span>
                {esMapaITV ? (regionSel && <span className="chip">{REGION_NOMBRE[regionSel]}</span>) : (catSel && <span className="chip">{CAT_LABEL[catSel]}</span>)}
                {esAdmin && <span className="chip">admin</span>}
              </div>
              <h2>{esMapaITV ? (regionSel ? REGION_NOMBRE[regionSel] : 'ITV por comunidad') : (catSel ? CAT_LABEL[catSel] : 'Contactos')}</h2>
            </div>
            <div className="pbody">
              {/* ---- elegir bloque ---- */}
              {!catSel && (
                <>
                  <p className="n-lead">Tu agenda de confianza por bloques. Toca un orbe para abrir su bloque.</p>
                  <div className="blq-grid">
                    {CATEGORIAS.map(c => (
                      <button key={c.id} className="blq" onClick={() => setSel(c.id)}>
                        <b>{c.t}</b><i>{cuenta(c.id) ? `${cuenta(c.id)} contacto${cuenta(c.id) > 1 ? 's' : ''}` : 'vacío'}</i>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ---- ITV: mapa de España (el mapa va en el centro; aquí la comunidad) ---- */}
              {esMapaITV && (
                <>
                  {regionSel ? (
                    <>
                      {listaReg.length === 0 && (
                        <p className="n-lead" style={{ color: '#8b93a6' }}>
                          {esAdmin ? `Aún no hay ITV guardadas en ${REGION_NOMBRE[regionSel]}. Añade la primera abajo.` : `Aún no hay ITV guardadas en ${REGION_NOMBRE[regionSel]}.`}
                        </p>
                      )}
                      {listaReg.map(tarjetaContacto)}
                      {esAdmin && !mostrarForm && (<button className="cf-add" onClick={() => abrirForm(regionSel)}>+ Añadir ITV a {REGION_NOMBRE[regionSel]}</button>)}
                    </>
                  ) : (
                    <>
                      <p className="n-lead">Toca tu comunidad en el mapa para ver sus ITV de confianza.</p>
                      {itvHuerfanas.length > 0 && (
                        <>
                          <div className="blk-sub">Sin comunidad asignada</div>
                          {itvHuerfanas.map(tarjetaContacto)}
                          {esAdmin && <p className="ct-nota" style={{ marginTop: 10 }}>Edita cada una (✎) y asígnale su comunidad para que salga en el mapa.</p>}
                        </>
                      )}
                    </>
                  )}
                  {esAdmin && mostrarForm && formAdmin('ITV', 'itv', 'Ej. sin cita previa', true)}
                  <button className="link-volver" onClick={() => setSel(null)}>← Todos los bloques</button>
                </>
              )}

              {/* ---- otras categorías: lista normal ---- */}
              {catSel && !esMapaITV && (
                <>
                  {listaCat.length === 0 && (
                    <p className="n-lead" style={{ color: '#8b93a6' }}>
                      {esAdmin ? 'Aún no hay contactos en este bloque. Añade el primero abajo.' : 'Aún no hay contactos en este bloque.'}
                    </p>
                  )}
                  {listaCat.map(tarjetaContacto)}
                  {esAdmin && !mostrarForm && (<button className="cf-add" onClick={() => abrirForm()}>+ Añadir contacto a {CAT_LABEL[catSel]}</button>)}
                  {esAdmin && mostrarForm && formAdmin(CAT_LABEL[catSel], catSel)}
                  <button className="link-volver" onClick={() => setSel(null)}>← Todos los bloques</button>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      <style jsx global>{`
        .op-scene .nodo.portal .nv-orbe{width:84px;height:84px}
        .op-scene .nodo.portal.hub .nv-orbe{width:60px;height:60px}
      `}</style>

      <style jsx>{`
        .op-scene{position:fixed;inset:0;overflow:hidden;color:#ece7dd;font-family:var(--font-space-grotesk),sans-serif;
          background:#060810}

        /* GALAXIA de fondo (misma imagen que el mapa / Fiscalidad) */
        .cielo{position:absolute;inset:-30px;z-index:0;background-color:#0a0d14;
          background-image:radial-gradient(1200px 800px at 50% 40%, rgba(60,48,24,.25) 0%, transparent 58%), url(/cosmos.jpg);
          background-size:cover;background-position:center;opacity:.5}
        .cielo::after{content:'';position:absolute;inset:0;transition:background .6s;
          background:radial-gradient(ellipse at 50% 46%, rgba(6,8,16,.18) 25%, rgba(6,8,16,.74) 100%)}
        .op-scene.r-contratos .cielo::after{background:
          radial-gradient(58% 60% at 30% 52%, rgba(201,161,77,.16), transparent 62%),
          radial-gradient(ellipse at 50% 46%, rgba(6,8,16,.18) 25%, rgba(6,8,16,.78) 100%)}
        .op-scene.r-contactos .cielo::after{background:
          radial-gradient(58% 60% at 30% 52%, rgba(90,122,168,.18), transparent 62%),
          radial-gradient(ellipse at 50% 46%, rgba(6,8,16,.18) 25%, rgba(6,8,16,.78) 100%)}
        /* al abrir ITV: leve zoom del fondo (sensación de "lanzarse" a España) */
        .op-scene.itv .cielo{animation:cieloZoom 1.2s cubic-bezier(.16,.82,.24,1) both}
        @keyframes cieloZoom{from{transform:scale(1.28)}to{transform:scale(1)}}
        @media (prefers-reduced-motion:reduce){.op-scene.itv .cielo{animation:none}}

        .cosmos{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
        .cosmos circle{fill:#9aa3b5}
        @keyframes nbrillo{from{fill-opacity:.3}to{fill-opacity:1}}

        .op-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;
          padding:16px 28px 12px;background:linear-gradient(to bottom,rgba(10,12,16,.92) 55%,rgba(10,12,16,0))}
        .brand-wrap{display:flex;align-items:center;gap:12px}
        .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .top-right{display:flex;align-items:center;gap:14px}
        .volver{font-size:12px;color:#c9c3b4;text-decoration:none;text-transform:uppercase;letter-spacing:1.2px;border:1px solid rgba(201,161,77,.35);
          border-radius:20px;padding:7px 14px;background:rgba(18,21,28,.5);cursor:pointer;font-family:inherit;transition:all .25s}
        .volver:hover{color:#f0e2b6;border-color:rgba(201,161,77,.7);background:rgba(18,21,28,.75)}

        .stage{position:absolute;inset:0;z-index:2;animation:fadein .5s ease both}
        @keyframes fadein{from{opacity:0}to{opacity:1}}
        .stage.mapa{display:flex;align-items:center;justify-content:center;padding:96px 24px 30px;padding-right:466px}
        .wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible}

        .nodo{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:11px;
          background:none;border:none;padding:8px;cursor:pointer;color:#ece7dd;font-family:inherit;z-index:3;
          animation:brota .5s cubic-bezier(.2,.9,.3,1.4) both}
        @keyframes brota{from{opacity:0;transform:translate(-50%,-50%) scale(.4)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        .nodo.hub{cursor:pointer}
        .etq{text-align:center;max-width:210px;display:flex;flex-direction:column;align-items:center;gap:2px}
        .etq .t{font-family:var(--font-cormorant),Georgia,serif;font-weight:600;font-size:16px;letter-spacing:.2px;color:#efe6d4;text-shadow:0 2px 12px #060810}
        .nodo.raiz .etq .t{font-size:18px}
        .nodo.portal .etq .t{font-size:24px}
        .etq .s{font-size:11px;color:#8b93a6}
        .etq .s.dl{color:rgba(227,201,135,.72)}
        .etq .s.pend{color:#565d70}
        .etq .s2{font-size:9.5px;letter-spacing:1.3px;text-transform:uppercase;color:#6f7686}
        .etq .abrir{margin-top:5px;font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(227,201,135,.78)}

        .panel{position:fixed;top:0;right:0;bottom:0;width:440px;z-index:50;background:#0c0e16;border-left:1px solid #1b2130;
          transform:translateX(102%);transition:transform .42s cubic-bezier(.22,.9,.3,1);display:flex;flex-direction:column}
        .panel.open{transform:translateX(0)}
        .phead{padding:26px 28px 18px;border-bottom:1px solid #1b2130}
        .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .chip{font-size:10.5px;letter-spacing:.6px;color:#8b93a6;border:1px solid #1b2130;border-radius:20px;padding:3px 10px;text-transform:uppercase}
        .chip.gold{color:#c9a14d;border-color:rgba(201,161,77,.5)}
        .panel h2{font-family:var(--font-cormorant),Georgia,serif;font-weight:600;font-size:29px;color:#efe6d4;line-height:1.05;margin:0}
        .pbody{padding:22px 28px 40px;overflow-y:auto;flex:1}

        .n-lead{font-size:14.5px;line-height:1.5;color:#ecdcae;margin:0 0 18px}

        .dl-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin-top:4px;padding:14px 16px;border-radius:11px;
          border:1px solid rgba(201,161,77,.5);background:linear-gradient(135deg,rgba(201,161,77,.22),rgba(201,161,77,.08));color:#f0e2b6;
          font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:border-color .2s,background .2s,transform .15s}
        .dl-btn:hover{border-color:#e3c987;background:linear-gradient(135deg,rgba(201,161,77,.34),rgba(201,161,77,.14));transform:translateY(-1px)}
        .dl-btn.sm{margin-top:10px;padding:10px 14px;font-size:13px}
        .dl-file{margin-top:9px;text-align:center;font-size:11px;color:#6a7180;font-family:ui-monospace,monospace;word-break:break-all}
        .link-volver{margin-top:20px;background:none;border:none;color:#8b93a6;font-family:inherit;font-size:12.5px;cursor:pointer;padding:4px 0}
        .link-volver:hover{color:#c9a14d}

        .blq-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .blq{text-align:left;border:1px solid #1b2130;border-radius:12px;padding:14px;background:rgba(15,18,27,.6);cursor:pointer;font-family:inherit;transition:border-color .2s,background .2s}
        .blq:hover{border-color:rgba(127,166,216,.6);background:rgba(20,28,42,.7)}
        .blq b{display:block;font-size:14.5px;color:#efe6d4}
        .blq i{display:block;font-style:normal;font-size:11.5px;color:#8b93a6;margin-top:3px}

        .ct-card{border:1px solid #1b2130;border-radius:12px;padding:14px;margin-bottom:12px;background:rgba(15,18,27,.6)}
        .ct-card.oculto{opacity:.55}
        .ct-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px}
        .ct-ident b{display:flex;align-items:center;gap:8px;font-size:15px;color:#efe6d4;font-weight:600}
        .ct-ident i{display:block;font-style:normal;font-size:12px;color:#8b93a6;margin-top:2px}
        .ct-badge{font-size:8.5px;letter-spacing:.5px;text-transform:uppercase;color:#0a0c10;background:#8b93a6;border-radius:4px;padding:1px 6px;font-weight:700}
        .ct-admin{display:flex;gap:6px;flex:none}
        .ct-admin button{width:28px;height:28px;border-radius:8px;border:1px solid #1b2130;background:#12151c;color:#c9c3b4;cursor:pointer;font-size:13px;transition:border-color .2s,color .2s}
        .ct-admin button:hover{border-color:#c9a14d;color:#f0e2b6}
        .ct-admin button.del:hover{border-color:#e0876a;color:#e0876a}
        .ct-row{display:flex;align-items:center;gap:10px;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #1b2130;border-radius:9px;background:#0d1017;color:#e9e6df;font-family:inherit;cursor:pointer;transition:border-color .2s}
        .ct-row:hover{border-color:#c9a14d}
        .ct-k{flex:none;min-width:62px;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#8b93a6;text-align:left}
        .ct-v{flex:1;text-align:left;font-size:13.5px;color:#ecdcae;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ct-copy{flex:none;color:#c9a14d;display:flex;align-items:center}
        .ct-nota{margin-top:8px;font-size:12px;line-height:1.45;color:#8b93a6}

        .cf-add{width:100%;margin-top:6px;padding:12px;border-radius:10px;border:1px dashed rgba(201,161,77,.5);background:transparent;color:#c9a14d;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s}
        .cf-add:hover{background:rgba(201,161,77,.08);border-color:#c9a14d}
        .cf-form{margin-top:10px;border:1px solid rgba(201,161,77,.3);border-radius:12px;padding:16px;background:rgba(201,161,77,.04)}
        .cf-title{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#c9a14d;font-weight:700;margin-bottom:12px}
        .cf-l{display:block;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:#8b93a6;margin-bottom:10px}
        .cf-l input{display:block;width:100%;margin-top:5px;background:#0d1017;border:1px solid #1b2130;border-radius:8px;padding:9px 11px;color:#ecdcae;font-family:inherit;font-size:14px}
        .cf-l input:focus{outline:none;border-color:#c9a14d}
        .cf-sel{display:block;width:100%;margin-top:5px;background:#0d1017;border:1px solid #1b2130;border-radius:8px;padding:9px 11px;color:#ecdcae;font-family:inherit;font-size:14px}
        .cf-sel:focus{outline:none;border-color:#c9a14d}
        .blk-sub{font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:#8b93a6;font-weight:700;margin:16px 0 10px;padding-bottom:7px;border-bottom:1px solid #1b2130}
        .cf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .cf-check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#c9c3b4;margin:2px 0 4px;cursor:pointer}
        .cf-check input{width:16px;height:16px;accent-color:#c9a14d}
        .cf-msg{margin:8px 0;font-size:12px;color:#e0876a}
        .cf-acc{display:flex;gap:8px;margin-top:12px}
        .cf-cancel{flex:none;padding:10px 14px;border-radius:9px;border:1px solid #1b2130;background:transparent;color:#8b93a6;font-family:inherit;font-size:13px;cursor:pointer}
        .cf-cancel:hover{border-color:#c9c3b4;color:#c9c3b4}
        .cf-save{flex:1;padding:10px 14px;border-radius:9px;border:none;background:linear-gradient(135deg,#e3c987,#c9a14d);color:#1a140a;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .cf-save:disabled{opacity:.6;cursor:default}

        @media (max-width:1040px){
          .stage:not(.mapa){transform:scale(.8);transform-origin:top left}
          .stage.mapa{padding-right:420px}
        }
        @media (max-width:760px){
          .panel{top:auto;left:0;right:0;width:auto;max-height:70vh;border-left:none;border-top:1px solid #1b2130;border-radius:16px 16px 0 0;transform:translateY(105%)}
          .panel.open{transform:translateY(0)}
          .stage:not(.mapa){transform:scale(.62);transform-origin:top center;left:0;right:0}
          .stage.mapa{padding:84px 14px 30vh;align-items:flex-start}
        }
      `}</style>
    </div>
  );
}
