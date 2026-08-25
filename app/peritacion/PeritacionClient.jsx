'use client';

// =====================================================================
//  app/peritacion/PeritacionClient.jsx · v5
//  Peritación Collector de 140 puntos, sobre AURA.
//  · Tips plegables (hacer/normal/alerta), penalización fija.
//  · Espesómetro (coche), 4 ruedas, elevador, fotos de estado.
//  · Local-first: guarda en el móvil a cada toque, sincroniza con retraso.
// =====================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import BottomNav from '../components/BottomNav';
import {
  ArrowLeft, Car, Plus, Camera, Flag, Clock, Gauge, MapPin, CheckCircle2,
  AlertTriangle, CloudOff, ChevronRight, Copy, Printer,
} from 'lucide-react';
import { BLOQUES, META, PIEZAS_PINTURA, REF_MICRAS, RUEDAS } from './lib/contenido';
import {
  calcular, costeTotal, notaBloque, leerNota, defectosDe, observacionesDe,
  evaluadosDe, detectarPatrones, COSTES,
} from './lib/motor';
import {
  leerLocal, escribirLocal, sincronizar, sincronizarPendientes,
  comprimirImagen, encolarFoto, subirPendientes, nuevoId,
} from './lib/almacen';
import { Item, FotosEstado, Espesometro, Ruedas, Elevador } from './componentes';
import { Informe } from './Informe';

const SEM = {
  VERDE:    { c: 'var(--green)',    bg: 'var(--green-bg)', bd: 'var(--green-bd)', t: 'Compra recomendable',
              d: 'La unidad aguanta el examen. No es comprar sin negociar: los costes que anotaste siguen siendo tuyos.' },
  AMARILLO: { c: 'var(--gold)', bg: 'rgba(232,163,61,.10)', bd: 'rgba(232,163,61,.35)', t: 'Compra posible con revisión o negociación',
              d: 'Hay cosas que arreglar, confirmar o descontar. Un sí con condiciones, y las condiciones se escriben antes de pagar.' },
  ROJO:     { c: 'var(--red-soft)', bg: 'var(--red-bg)', bd: 'var(--red-bd)', t: 'Compra no recomendable',
              d: 'El conjunto no se sostiene. Por nota o por bandera roja, la conclusión es la misma: no sigas por inercia.' },
};

const fichaVacia = () => ({ modelo: '', vin: '', km: '', precio: '', vendedor: '', ciudad: '', fecha: new Date().toISOString().slice(0, 10) });
const N = BLOQUES.length;

export default function PeritacionClient({ user, perfil, listaInicial }) {
  const router = useRouter();
  const supabase = createClient();

  const [vista, setVista] = useState('lista');
  const [lista, setLista] = useState(listaInicial || []);
  const [pid, setPid] = useState(null);
  const [paso, setPaso] = useState(0);

  const [ficha, setFicha] = useState(fichaVacia());
  const [resp, setResp] = useState({});
  const [medic, setMedic] = useState({ micras: {}, ruedas: {}, elevador: '' });
  const [costes, setCostes] = useState({});
  const [cierre, setCierre] = useState({ recomendacion: '', notas: '' });
  const [fotos, setFotos] = useState({});      // { 'bloque:slot': [{id,url,subiendo}] }

  const [flash, setFlash] = useState(null);
  const [online, setOnline] = useState(true);
  const [sinSubir, setSinSubir] = useState(0);
  const [cargando, setCargando] = useState(false);
  const syncRef = useRef(null);

  const aviso = (t, m) => setFlash({ t, m });
  useEffect(() => { if (!flash) return; const x = setTimeout(() => setFlash(null), 3200); return () => clearTimeout(x); }, [flash]);

  /* red */
  useEffect(() => {
    const on = () => { setOnline(true); reintentar(); };
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []); // eslint-disable-line
  async function reintentar() {
    await sincronizarPendientes(supabase);
    if (pid) { const n = await subirPendientes(supabase, pid); if (n) setSinSubir((s) => Math.max(0, s - n)); }
  }

  /* guardado continuo */
  useEffect(() => {
    if (vista !== 'editor' || !pid) return;
    const datos = { ficha, respuestas: resp, medic, costes, cierre };
    escribirLocal(pid, datos);
    clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => sincronizar(supabase, pid, datos), 2500);
    return () => clearTimeout(syncRef.current);
  }, [ficha, resp, medic, costes, cierre, pid, vista]); // eslint-disable-line

  useEffect(() => { if (vista === 'editor') window.scrollTo(0, 0); }, [paso, vista]);

  const res = useMemo(() => calcular(BLOQUES, resp, cierre), [resp, cierre]);
  const patrones = useMemo(() => detectarPatrones(BLOQUES, resp, cierre, medic), [resp, cierre, medic]);
  const ct = costeTotal(costes);
  const bloque = paso >= 1 && paso <= N ? BLOQUES[paso - 1] : null;

  /* ------------------------------------------------------- acciones */
  async function nueva() {
    setCargando(true);
    const { data, error } = await supabase.rpc('abrir_peritacion', { p_ficha: fichaVacia() });
    setCargando(false);
    if (error || !data?.ok) {
      const m = { no_activo: 'Tu cuenta aún no está activada.', sin_guia_activa: 'No hay guía activa. Avisa a un tutor.', no_auth: 'Sesión caducada.' }[data?.error] || 'No se pudo abrir.';
      aviso('warn', m); return;
    }
    setPid(data.id); setFicha(fichaVacia()); setResp({}); setMedic({ micras: {}, ruedas: {}, elevador: '' });
    setCostes({}); setCierre({ recomendacion: '', notas: '' }); setFotos({}); setPaso(0); setVista('editor');
  }

  async function abrir(id) {
    setCargando(true);
    const { data } = await supabase.from('peritaciones').select('*').eq('id', id).single();
    const local = leerLocal(id);
    setCargando(false);
    if (!data && !local) { aviso('warn', 'No se pudo abrir.'); return; }
    const usarLocal = local && (!data || new Date(data.actualizada_en).getTime() < (local._local || 0));
    const src = usarLocal ? local : {
      ficha: { modelo: data.modelo || '', vin: data.vin || '', km: data.km ?? '', precio: data.precio_pedido ?? '',
               vendedor: data.vendedor || '', ciudad: data.ciudad || '', fecha: data.fecha_inspeccion || fichaVacia().fecha },
      respuestas: data.respuestas || {}, medic: data.medic || { micras: {}, ruedas: {}, elevador: '' },
      costes: data.costes || {}, cierre: data.cierre || {},
    };
    setPid(id); setFicha(src.ficha || fichaVacia()); setResp(src.respuestas || {});
    setMedic(src.medic || { micras: {}, ruedas: {}, elevador: '' });
    setCostes(src.costes || {}); setCierre(src.cierre || { recomendacion: '', notas: '' }); setFotos({});
    setPaso(data?.estado === 'finalizada' ? N + 3 : 0); setVista('editor');
    if (usarLocal) aviso('ok', 'Recuperado lo guardado en el móvil.');
  }

  async function finalizar() {
    const r = calcular(BLOQUES, resp, cierre);
    await sincronizar(supabase, pid, { ficha, respuestas: resp, medic, costes, cierre });
    const { data, error } = await supabase.rpc('finalizar_peritacion', {
      p_id: pid,
      p_resultado: { total: r.total, notas: r.notas, semaforo: r.semaforo, completitud: r.completitud,
                     banderas: r.banderas, patrones: detectarPatrones(BLOQUES, resp, cierre, medic) },
    });
    if (error || !data?.ok) { aviso('warn', 'Guardado en el móvil; no se pudo cerrar en el servidor. Reintenta con red.'); return; }
    aviso('ok', 'Peritación cerrada.'); refrescarLista();
  }

  async function refrescarLista() {
    const { data } = await supabase.from('v_mis_peritaciones').select('*').eq('alumno_id', user.id).order('actualizada_en', { ascending: false }).limit(40);
    if (data) setLista(data);
  }
  function salir() {
    clearTimeout(syncRef.current);
    sincronizar(supabase, pid, { ficha, respuestas: resp, medic, costes, cierre }).then(refrescarLista);
    setVista('lista'); setPid(null);
  }

  const setItem = useCallback((bid, i, cambio) => {
    setResp((prev) => {
      const b = prev[bid] || { items: {} };
      const items = { ...b.items };
      const nuevo = { ...(items['it_' + i] || {}), ...cambio };
      if (cambio.estado === null) delete items['it_' + i]; else items['it_' + i] = nuevo;
      return { ...prev, [bid]: { ...b, items } };
    });
  }, []);
  const setObs = useCallback((bid, v) => setResp((p) => ({ ...p, [bid]: { ...(p[bid] || { items: {} }), obs: v } })), []);

  /* fotos: se comprimen y encolan; suben cuando hay red */
  async function ponerFoto(clave, file) {
    if (!file) return;
    const [bid, slot] = clave.split(':');
    const id = nuevoId();
    try {
      const blob = await comprimirImagen(file);
      const url = URL.createObjectURL(blob);
      setFotos((p) => ({ ...p, [clave]: [...(p[clave] || []), { id, url, subiendo: true }] }));
      await encolarFoto({ id, peritacion_id: pid, alumno_id: user.id, bloque_id: bid, item_idx: slot, blob });
      setSinSubir((s) => s + 1);
      const n = await subirPendientes(supabase, pid);
      if (n) { setSinSubir((s) => Math.max(0, s - n)); setFotos((p) => ({ ...p, [clave]: (p[clave] || []).map((f) => ({ ...f, subiendo: false })) })); }
    } catch { aviso('warn', 'No se pudo procesar la foto.'); }
  }

  /* ============================================================ LISTA */
  if (vista === 'lista') {
    return (
      <div className="gpso-bg" style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '26px 20px 50px' }}>
          <div className="pt-lista-head">
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '10px 12px' }}><ArrowLeft size={16} /></button>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>Peritación</div>
              <div className="pt-sub">{META.titulo} · {META.puntos_comprobacion} puntos</div>
            </div>
            {!online && <span className="pt-offline"><CloudOff size={13} /> Sin conexión</span>}
          </div>

          {flash && <Flash flash={flash} />}

          <button className="btn-de" onClick={nueva} disabled={cargando} style={{ width: '100%', padding: 16, fontSize: 15, marginBottom: 22 }}>
            <Plus size={17} /> {cargando ? 'ABRIENDO…' : 'NUEVA PERITACIÓN'}
          </button>

          {lista.length === 0 ? (
            <div className="pt-vacio"><Car size={34} color="var(--gray-dark)" />
              <p>Todavía no has peritado ninguna unidad.<br /><span style={{ color: 'var(--gray-mid)' }}>Abre una antes de ir a ver el coche.</span></p></div>
          ) : (
            <div className="pt-grid">
              {lista.map((p) => {
                const s = p.semaforo ? SEM[p.semaforo] : null;
                return (
                  <div key={p.id} className="lead-card" onClick={() => abrir(p.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      {p.estado === 'borrador'
                        ? <span className="pt-tag" style={{ color: 'var(--gold)', borderColor: 'rgba(232,163,61,.35)' }}>EN CURSO</span>
                        : <span className="pt-tag" style={{ color: s?.c, borderColor: s?.bd, background: s?.bg }}>{p.semaforo}</span>}
                      <span className="pt-time"><Clock size={11} /> {new Date(p.actualizada_en).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="display" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Car size={17} color="var(--red-soft)" /> {p.modelo || 'Unidad sin nombre'}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {p.km != null && <span className="pt-meta"><Gauge size={13} color="var(--gray-mid)" /> {Number(p.km).toLocaleString('es-ES')} km</span>}
                      {p.ciudad && <span className="pt-meta"><MapPin size={13} color="var(--gray-mid)" /> {p.ciudad}</span>}
                    </div>
                    <div className="card-foot">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="pt-meta">{p.estado === 'finalizada'
                          ? <><b className="display" style={{ fontSize: 18 }}>{p.puntuacion}</b><span style={{ color: 'var(--gray-mid)' }}>/100</span></>
                          : <span style={{ color: 'var(--gray-mid)', fontSize: 13 }}>{p.completitud || 0}% revisado</span>}</span>
                        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          {p.n_banderas > 0 && <span className="pt-bandera-mini"><Flag size={10} /> {p.n_banderas}</span>}
                          {p.revisada && <span className="pt-tag" style={{ color: 'var(--green)', borderColor: 'var(--green-bd)' }}>REVISADA</span>}
                          <ChevronRight size={16} color="var(--gray-mid)" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <BottomNav perfil={perfil} activa="peritacion" />
      </div>
    );
  }


  function informeTexto() {
    const L = [];
    L.push(`PERITACIÓN COLLECTOR · ${META.puntos_comprobacion} PUNTOS`);
    L.push(`${ficha.modelo || '—'}  ·  VIN ${ficha.vin || '—'}  ·  ${ficha.km || '—'} km`);
    L.push(`${ficha.vendedor || '—'} (${ficha.ciudad || '—'})  ·  ${ficha.fecha || '—'}`);
    L.push('');
    L.push(`RESULTADO: ${res.semaforo}  ${res.total}/100  ·  ${res.completitud}% revisado`);
    if (!res.concluyente) L.push('AVISO: no concluyente (menos del 70% revisado).');
    if (res.banderas.length) { L.push(''); L.push(`BANDERAS ROJAS (${res.banderas.length}):`); res.banderas.forEach((f) => L.push(`  · ${f.texto} [${f.bloque}]`)); }
    if (patrones.length) { L.push(''); L.push('QUÉ HA PASADO:'); patrones.forEach((p) => L.push(`  · ${p.titulo}: ${p.texto}`)); }
    L.push(''); L.push('ANOTADO:');
    BLOQUES.forEach((b) => {
      const items = resp[b.id]?.items || {};
      const ps = b.items.map((it, i) => ({ it, ...(items['it_' + i] || {}) })).filter((x) => x.estado === 'def' || x.estado === 'obs' || x.nota);
      if (!ps.length && !resp[b.id]?.obs) return;
      L.push(`  ${b.nombre}:`);
      ps.forEach((p) => L.push(`    ${p.estado === 'def' ? '[DEFECTO −' + p.it.pen + ']' : p.estado === 'obs' ? '[observar]' : ''} ${p.it.t}${p.nota ? ' — ' + p.nota : ''}${p.campo ? ' (' + p.campo + ')' : ''}`));
      if (resp[b.id]?.obs) L.push(`    · ${resp[b.id].obs}`);
    });
    const mic = medic?.micras || {};
    if (Object.values(mic).some((v) => parseFloat(v) > 0)) { L.push(''); L.push('MICRAS:'); PIEZAS_PINTURA.forEach((p) => { if (mic[p.id]) L.push(`    ${p.label}: ${mic[p.id]} µm`); }); }
    if (ct > 0) { L.push(''); L.push(`COSTES: ${ct.toLocaleString('es-ES')} €`); if (ficha.precio) L.push(`ENTRADA REAL: ${((parseFloat(ficha.precio)||0)+ct).toLocaleString('es-ES')} €`); }
    if (cierre.notas) { L.push(''); L.push('NOTAS: ' + cierre.notas); }
    return L.join('\\n');
  }
  function copiarTexto() {
    navigator.clipboard?.writeText(informeTexto()).then(() => aviso('ok', 'Informe copiado.')).catch(() => aviso('warn', 'No se pudo copiar.'));
  }

  /* =========================================================== EDITOR */
  return (
    <div className="gpso-bg pt-app">
      <header className="pt-hdr">
        <div className="pt-hdr-top">
          <button className="pt-icon" onClick={salir}><ArrowLeft size={16} /></button>
          <span className="pt-titulo">{ficha.modelo || 'Peritación'}</span>
          {!online && <span className="pt-offline"><CloudOff size={12} /></span>}
          {sinSubir > 0 && <span className="pt-pend"><Camera size={11} /> {sinSubir}</span>}
        </div>
        <div className={'pt-rail' + (res.banderas.length ? ' pt-rail-rojo' : '')}>
          {BLOQUES.map((b, i) => {
            const rev = evaluadosDe(b, resp) / b.items.length;   // % revisado del bloque
            const salud = res.notas[b.id] / b.max;                // 0..1 de nota
            const c = rev === 0 ? 'transparent' : salud >= .8 ? 'var(--green)' : salud >= .5 ? 'var(--gold)' : 'var(--red-soft)';
            return (
              <button key={b.id} className={'pt-seg' + (paso === i + 1 ? ' on' : '')} style={{ flexGrow: b.max }}
                onClick={() => setPaso(i + 1)} title={`${b.nombre} · ${res.notas[b.id]}/${b.max}`}>
                <span className="pt-seg-fill" style={{ width: (rev * 100) + '%', background: c }} />
              </button>
            );
          })}
        </div>
        <div className="pt-hdr-bot">
          <span className="pt-pts"><b>{res.total}</b>/100</span>
          {res.banderas.length > 0 && <span className="pt-pill-rojo">{res.banderas.length} roja{res.banderas.length > 1 ? 's' : ''}</span>}
          <span className="pt-cob">{res.completitud}% revisado</span>
        </div>
      </header>

      {flash && <Flash flash={flash} />}

      <main className="pt-main">
        {paso === 0 && (
          <>
            <p className="pt-eyebrow">Antes de empezar</p>
            <h1 className="display pt-h1">La unidad</h1>
            <p className="pt-lead">Rellena lo que sepas; el resto se completa delante del coche. Todo se guarda en el móvil aunque te quedes sin cobertura.</p>
            <div className="glass pt-card">
              <Campo l="Marca y modelo" v={ficha.modelo} on={(v) => setFicha({ ...ficha, modelo: v })} ph="BMW 330d Touring" />
              <Campo l="VIN" v={ficha.vin} on={(v) => setFicha({ ...ficha, vin: v.toUpperCase() })} ph="WBA…" />
              <div className="pt-fila">
                <Campo l="Kilómetros" v={ficha.km} on={(v) => setFicha({ ...ficha, km: v })} num />
                <Campo l="Precio pedido (€)" v={ficha.precio} on={(v) => setFicha({ ...ficha, precio: v })} num />
              </div>
              <div className="pt-fila">
                <Campo l="Vendedor" v={ficha.vendedor} on={(v) => setFicha({ ...ficha, vendedor: v })} />
                <Campo l="Ciudad" v={ficha.ciudad} on={(v) => setFicha({ ...ficha, ciudad: v })} ph="Múnich" />
              </div>
              <Campo l="Fecha" v={ficha.fecha} on={(v) => setFicha({ ...ficha, fecha: v })} tipo="date" />
            </div>
            <div className="glass pt-card">
              <p className="pt-k">Peritación de {META.puntos_comprobacion} puntos</p>
              <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>
                11 bloques, de la documentación a la prueba en marcha. Cada punto lleva su guía de qué mirar y qué te debe preocupar. La nota se mueve sola: tú solo marcas lo que ves.
              </p>
            </div>
          </>
        )}

        {bloque && (
          <>
            <p className="pt-eyebrow">Bloque {paso} de {N} · vale {bloque.max} puntos</p>
            <h1 className="display pt-h1">{bloque.nombre}</h1>
            <p className="pt-intro">{bloque.intro}</p>

            <div className="glass pt-marcador">
              <div className="pt-nota display"><b>{res.notas[bloque.id]}</b><span>/{bloque.max}</span></div>
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>{leerNota(bloque, res.notas[bloque.id])}</p>
                <p className="pt-cob" style={{ margin: '3px 0 0' }}>{evaluadosDe(bloque, resp)} de {bloque.items.length} puntos revisados</p>
              </div>
            </div>

            {/* componentes especiales según el bloque */}
            {bloque.elevador && <Elevador valor={medic.elevador} onChange={(v) => setMedic({ ...medic, elevador: v })} />}

            <ol className="pt-items">
              {bloque.items.map((it, i) => (
                <Item key={i} b={bloque} i={i} it={(resp[bloque.id]?.items || {})['it_' + i]}
                  onEstado={(e) => setItem(bloque.id, i, { estado: e })}
                  onNota={(c) => setItem(bloque.id, i, c)}
                  onFoto={(f) => ponerFoto(`${bloque.id}:def${i}`, f)}
                  fotos={fotos[`${bloque.id}:def${i}`]} />
              ))}
            </ol>

            {bloque.espesometro && (
              <div className="glass pt-card">
                <p className="pt-mini-t">Espesómetro · micras por pieza</p>
                <Espesometro piezas={PIEZAS_PINTURA} valores={medic.micras} refTexto={REF_MICRAS}
                  onChange={(id, v) => setMedic({ ...medic, micras: { ...medic.micras, [id]: v } })} />
              </div>
            )}
            {bloque.ruedas && (
              <div className="glass pt-card">
                <Ruedas ruedas={RUEDAS} valores={medic.ruedas}
                  onChange={(id, v) => setMedic({ ...medic, ruedas: { ...medic.ruedas, [id]: v } })} />
              </div>
            )}

            {bloque.fotos?.length > 0 && (
              <div className="glass pt-card">
                <FotosEstado defs={bloque.fotos} fotos={fotos} onFoto={(slot, f) => ponerFoto(`${bloque.id}:${slot}`, f)} />
              </div>
            )}

            <div className="glass pt-card">
              <label className="etiqueta">Observaciones del bloque</label>
              <textarea className="campo" rows={3} placeholder="Lo que no entra en la lista pero no quieres olvidar"
                value={resp[bloque.id]?.obs || ''} onChange={(e) => setObs(bloque.id, e.target.value)} />
            </div>
          </>
        )}

        {paso === N + 1 && (
          <>
            <p className="pt-eyebrow">No puntúa</p>
            <h1 className="display pt-h1">Costes visibles</h1>
            <p className="pt-lead">Casi todo defecto tiene un precio. Aquí no se resta nota: se calcula lo que cuesta dejar la unidad fina.</p>
            <div className="glass pt-card">
              {COSTES.map((c) => (
                <div className="pt-coste" key={c}>
                  <label>{c}</label>
                  <div className="pt-euro">
                    <input className="campo" type="number" inputMode="numeric" placeholder="0" value={costes[c] || ''} onChange={(e) => setCostes({ ...costes, [c]: e.target.value })} />
                    <span>€</span>
                  </div>
                </div>
              ))}
              <div className="pt-coste pt-coste-total"><label>Total estimado</label><div className="pt-euro"><b className="display">{ct.toLocaleString('es-ES')}</b><span>€</span></div></div>
            </div>
            {ficha.precio && (
              <div className="glass pt-card">
                <p className="pt-k">Lo que te cuesta de verdad</p>
                <p className="display" style={{ fontSize: 30, margin: '4px 0 8px' }}>{((parseFloat(ficha.precio) || 0) + ct).toLocaleString('es-ES')} €</p>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>Precio pedido más puesta a punto. Si el negocio no encaja con esta cifra, no encaja con la unidad. Es tu suelo de negociación.</p>
              </div>
            )}
          </>
        )}

        {paso === N + 2 && (
          <>
            <p className="pt-eyebrow">Último paso</p>
            <h1 className="display pt-h1">Tu recomendación</h1>
            <p className="pt-lead">Has visto el coche. Di qué recomendarías. Una recomendación negativa cuenta como bandera roja: tu criterio pesa igual que un fallo mecánico.</p>
            <div className="glass pt-card">
              {[['positiva', 'Positiva', 'La unidad me convence tal y como está.', 'var(--green)'],
                ['reservas', 'Con reservas', 'Puede salir, pero hay cosas que confirmar o negociar.', 'var(--gold)'],
                ['negativa', 'Negativa', 'No la recomendaría. Cuenta como bandera roja.', 'var(--red-soft)']].map(([v, t, d, c]) => (
                <button key={v} className="pt-opcion" onClick={() => setCierre({ ...cierre, recomendacion: v })}
                  style={cierre.recomendacion === v ? { borderColor: c, background: 'color-mix(in srgb,' + c + ' 10%,transparent)' } : undefined}>
                  <b style={cierre.recomendacion === v ? { color: c } : undefined}>{t}</b><span>{d}</span>
                </button>
              ))}
            </div>
            {res.completitud < 70 && (
              <div className="glass pt-card" style={{ borderColor: 'rgba(232,163,61,.4)' }}>
                <p className="pt-k" style={{ color: 'var(--gold)' }}>Peritación incompleta</p>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>Llevas {res.completitud}% revisado. Por debajo del 70% el resultado sale como no concluyente.</p>
              </div>
            )}
          </>
        )}

        {paso === N + 3 && (
          <Informe {...{ res, patrones, resp, medic, ficha, costes, ct, cierre, fotos, setPaso, aviso, copiarTexto }} />
        )}
      </main>

      <footer className="pt-foot">
        <button className="btn-ghost" onClick={() => setPaso(Math.max(0, paso - 1))} disabled={paso === 0} style={{ padding: '13px 16px' }}>Anterior</button>
        <span className="pt-paso">{paso === 0 ? 'Unidad' : paso <= N ? `Bloque ${paso}/${N}` : paso === N + 1 ? 'Costes' : paso === N + 2 ? 'Cierre' : 'Resultado'}</span>
        {paso < N + 3
          ? <button className="btn-de" onClick={() => { if (paso === N + 2) finalizar(); setPaso(paso + 1); }} style={{ padding: '13px 18px', fontSize: 13.5 }}>{paso === N + 2 ? 'CERRAR Y VER' : 'SIGUIENTE'}</button>
          : <button className="btn-de" onClick={salir} style={{ padding: '13px 18px', fontSize: 13.5 }}>TERMINAR</button>}
      </footer>
    </div>
  );
}

/* ------------------------------------------------------- auxiliares */
function Flash({ flash }) {
  return <div className={`aviso-flotante ${flash.t === 'ok' ? 'ok' : 'error'}`}>{flash.t === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {flash.m}</div>;
}
function Campo({ l, v, on, ph, num, tipo }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="etiqueta">{l}</label>
      <input className="campo" type={tipo || (num ? 'number' : 'text')} inputMode={num ? 'numeric' : undefined} placeholder={ph || ''} value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
