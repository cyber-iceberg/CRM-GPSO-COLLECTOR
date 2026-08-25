'use client';

// =====================================================================
//  app/peritacion/PeritacionClient.jsx
//  GPSO COLLECTOR · Peritación guiada · sobre el sistema AURA
//
//  Diseñado para usarse de pie, en un parking alemán, con una mano y
//  posiblemente con guantes: objetivos táctiles grandes, una columna,
//  guardado en cada toque y nada que dependa de tener cobertura.
// =====================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import BottomNav from '../components/BottomNav';
import {
  ArrowLeft, Car, Camera, Plus, X, Check, AlertTriangle, XCircle, CheckCircle2,
  Clock, Gauge, MapPin, Wallet, FileText, Copy, Printer, RefreshCw, CloudOff,
  ChevronRight, Trash2, Info, Trophy, Circle, Flag, Calendar, User,
} from 'lucide-react';
import {
  SEV_LABEL, COSTES, calcular, costeTotal, notaBloque, leerNota, defectosDe,
  observacionesDe, evaluadosDe, detectarPatrones, informeTexto,
} from './lib/motor';
import {
  leerLocal, escribirLocal, borrarLocal, sincronizar, sincronizarPendientes,
  comprimirImagen, encolarFoto, subirPendientes, nuevoId,
} from './lib/almacen';

const SEM = {
  VERDE:    { color: 'var(--green)',    bg: 'var(--green-bg)', bd: 'var(--green-bd)', t: 'Compra recomendable',
              d: 'La unidad aguanta el examen. Eso no significa comprar sin negociar: los costes que hayas anotado siguen siendo tuyos.' },
  AMARILLO: { color: 'var(--gold)',     bg: 'rgba(232,163,61,.10)', bd: 'rgba(232,163,61,.35)', t: 'Compra posible con revisión o negociación',
              d: 'Hay cosas que arreglar, confirmar o descontar. No es un no: es un sí con condiciones, y las condiciones se escriben antes de pagar.' },
  ROJO:     { color: 'var(--red-soft)', bg: 'var(--red-bg)', bd: 'var(--red-bd)', t: 'Compra no recomendable',
              d: 'El conjunto no se sostiene. Puede ser por nota o por bandera roja, pero la conclusión es la misma: no sigas por inercia.' },
};

const fichaVacia = () => ({
  modelo: '', vin: '', km: '', precio: '', vendedor: '', ciudad: '',
  fecha: new Date().toISOString().slice(0, 10),
});

export default function PeritacionClient({ user, perfil, guia, listaInicial }) {
  const router = useRouter();
  const supabase = createClient();

  const BLOQUES = guia?.contenido || [];
  const N = BLOQUES.length;

  const [vista, setVista] = useState('lista');       // lista | editor
  const [lista, setLista] = useState(listaInicial);
  const [pid, setPid] = useState(null);
  const [paso, setPaso] = useState(0);               // 0 ficha · 1..N bloques · N+1 costes · N+2 cierre · N+3 resultado

  const [ficha, setFicha] = useState(fichaVacia());
  const [resp, setResp] = useState({});
  const [costes, setCostes] = useState({});
  const [cierre, setCierre] = useState({ recomendacion: '', notas: '' });
  const [fotos, setFotos] = useState({});            // { 'bloque:idx': [{id, url, subiendo}] }

  const [flash, setFlash] = useState(null);
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const [online, setOnline] = useState(true);
  const [sinSubir, setSinSubir] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const syncRef = useRef(null);

  const aviso = (t, m) => setFlash({ t, m });
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 3200); return () => clearTimeout(t); }, [flash]);

  /* ------------------------------------------------------------- red */
  useEffect(() => {
    const on = () => { setOnline(true); reintentar(); };
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  async function reintentar() {
    const hechas = await sincronizarPendientes(supabase);
    if (pid) { const n = await subirPendientes(supabase, pid); if (n) setSinSubir((s) => Math.max(0, s - n)); }
    if (hechas.length) aviso('ok', 'Sincronizado lo que quedaba pendiente.');
  }

  /* ------------------------------------------------- guardado continuo */
  useEffect(() => {
    if (vista !== 'editor' || !pid) return;
    const datos = { ficha, respuestas: resp, costes, cierre };
    escribirLocal(pid, datos);                                  // instantáneo
    clearTimeout(syncRef.current);
    syncRef.current = setTimeout(() => { sincronizar(supabase, pid, datos); }, 2500);
    return () => clearTimeout(syncRef.current);
  }, [ficha, resp, costes, cierre, pid, vista]); // eslint-disable-line

  useEffect(() => { if (vista === 'editor') window.scrollTo(0, 0); setGuiaAbierta(false); }, [paso, vista]);

  /* ------------------------------------------------------- resultados */
  const res = useMemo(() => calcular(BLOQUES, resp, cierre), [BLOQUES, resp, cierre]);
  const patrones = useMemo(() => detectarPatrones(BLOQUES, resp, cierre), [BLOQUES, resp, cierre]);
  const ct = costeTotal(costes);
  const bloque = paso >= 1 && paso <= N ? BLOQUES[paso - 1] : null;

  /* ---------------------------------------------------------- acciones */
  async function nueva() {
    setCargando(true);
    const { data, error } = await supabase.rpc('abrir_peritacion', { p_ficha: fichaVacia() });
    setCargando(false);
    if (error || !data?.ok) {
      const m = { no_activo: 'Tu cuenta aún no está activada.', sin_guia_activa: 'No hay guía activa. Avisa a un tutor.',
                  no_auth: 'Sesión caducada, vuelve a entrar.' }[data?.error] || 'No se pudo abrir la peritación.';
      aviso('warn', m); return;
    }
    setPid(data.id); setFicha(fichaVacia()); setResp({}); setCostes({});
    setCierre({ recomendacion: '', notas: '' }); setFotos({}); setPaso(0); setVista('editor');
  }

  async function abrir(id) {
    setCargando(true);
    const { data } = await supabase.from('peritaciones').select('*').eq('id', id).single();
    const local = leerLocal(id);
    setCargando(false);
    if (!data && !local) { aviso('warn', 'No se pudo abrir.'); return; }

    // gana lo más reciente: si el móvil guardó después del último sync, manda el móvil
    const usarLocal = local && (!data || new Date(data.actualizada_en).getTime() < (local._local || 0));
    const fuente = usarLocal ? local : {
      ficha: { modelo: data.modelo || '', vin: data.vin || '', km: data.km ?? '', precio: data.precio_pedido ?? '',
               vendedor: data.vendedor || '', ciudad: data.ciudad || '',
               fecha: data.fecha_inspeccion || new Date().toISOString().slice(0, 10) },
      respuestas: data.respuestas || {}, costes: data.costes || {}, cierre: data.cierre || {},
    };
    setPid(id);
    setFicha(fuente.ficha || fichaVacia());
    setResp(fuente.respuestas || {});
    setCostes(fuente.costes || {});
    setCierre(fuente.cierre || { recomendacion: '', notas: '' });
    setFotos({});
    setPaso(data?.estado === 'finalizada' ? N + 3 : 0);
    setVista('editor');
    if (usarLocal) aviso('ok', 'Recuperado lo que tenías guardado en el móvil.');
  }

  async function finalizar() {
    const r = calcular(BLOQUES, resp, cierre);
    await sincronizar(supabase, pid, { ficha, respuestas: resp, costes, cierre });
    const { data, error } = await supabase.rpc('finalizar_peritacion', {
      p_id: pid,
      p_resultado: { total: r.total, notas: r.notas, semaforo: r.semaforo,
                     completitud: r.completitud, banderas: r.banderas,
                     patrones: detectarPatrones(BLOQUES, resp, cierre) },
    });
    if (error || !data?.ok) { aviso('warn', 'Guardado en el móvil, pero no se pudo cerrar en el servidor. Reintenta con red.'); return; }
    aviso('ok', 'Peritación cerrada. Ya la puede revisar un tutor.');
    refrescarLista();
  }

  async function refrescarLista() {
    const { data } = await supabase.from('v_mis_peritaciones').select('*')
      .eq('alumno_id', user.id).order('actualizada_en', { ascending: false }).limit(40);
    if (data) setLista(data);
  }

  function salirDelEditor() {
    clearTimeout(syncRef.current);
    sincronizar(supabase, pid, { ficha, respuestas: resp, costes, cierre }).then(refrescarLista);
    setVista('lista'); setPid(null);
  }

  const setItem = useCallback((bid, i, cambio) => {
    setResp((prev) => {
      const b = prev[bid] || { items: {}, banderas: {}, obs: '' };
      const items = { ...b.items };
      const nuevo = { ...(items['it_' + i] || {}), ...cambio };
      if (nuevo.estado !== 'def') delete nuevo.severidad;
      if (nuevo.estado === null) delete items['it_' + i]; else items['it_' + i] = nuevo;
      return { ...prev, [bid]: { ...b, items } };
    });
  }, []);
  const setBandera = useCallback((bid, i, v) => {
    setResp((prev) => {
      const b = prev[bid] || { items: {}, banderas: {}, obs: '' };
      return { ...prev, [bid]: { ...b, banderas: { ...b.banderas, ['bf_' + i]: v } } };
    });
  }, []);
  const setObs = useCallback((bid, v) => {
    setResp((prev) => {
      const b = prev[bid] || { items: {}, banderas: {}, obs: '' };
      return { ...prev, [bid]: { ...b, obs: v } };
    });
  }, []);

  /* ------------------------------------------------------------ fotos */
  async function añadirFoto(bid, idx, file) {
    if (!file) return;
    const clave = `${bid}:${idx}`;
    const id = nuevoId();
    try {
      const blob = await comprimirImagen(file);
      const url = URL.createObjectURL(blob);
      setFotos((p) => ({ ...p, [clave]: [...(p[clave] || []), { id, url, subiendo: true }] }));

      const registro = { id, peritacion_id: pid, alumno_id: user.id, bloque_id: bid, item_idx: idx, blob };
      await encolarFoto(registro);
      setSinSubir((s) => s + 1);

      const n = await subirPendientes(supabase, pid);
      if (n > 0) {
        setSinSubir((s) => Math.max(0, s - n));
        setFotos((p) => ({ ...p, [clave]: (p[clave] || []).map((f) => ({ ...f, subiendo: false })) }));
      }
    } catch (e) {
      aviso('warn', 'No se pudo procesar la foto.');
    }
  }

  /* ============================================================== render */
  if (!guia) {
    return (
      <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="glass" style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
          <AlertTriangle size={30} color="var(--gold)" />
          <h1 className="display" style={{ fontSize: 21, margin: '14px 0 6px' }}>Sin guía activa</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6 }}>
            No hay ninguna versión de la guía marcada como activa en la base de datos. Avisa a un administrador.
          </p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------- LISTA */
  if (vista === 'lista') {
    return (
      <div className="gpso-bg" style={{ minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '26px 20px 50px' }}>
          <div style={S.head}>
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '10px 12px' }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>Peritación</div>
              <div style={S.sub}>{guia.titulo} · {guia.version}</div>
            </div>
            {!online && <span style={S.offline}><CloudOff size={13} /> Sin conexión</span>}
          </div>

          {flash && <Flash flash={flash} />}

          <button className="btn-de" onClick={nueva} disabled={cargando} style={{ width: '100%', padding: '16px', fontSize: 15, marginBottom: 22 }}>
            <Plus size={17} /> {cargando ? 'ABRIENDO…' : 'NUEVA PERITACIÓN'}
          </button>

          {lista.length === 0 ? (
            <div style={S.vacio}>
              <Car size={34} color="var(--gray-dark)" />
              <p>Todavía no has peritado ninguna unidad.<br />
                <span style={{ color: 'var(--gray-mid)' }}>Abre una antes de ir a ver el coche: se rellena sobre la marcha.</span></p>
            </div>
          ) : (
            <div style={S.grid}>
              {lista.map((p) => {
                const s = p.semaforo ? SEM[p.semaforo] : null;
                return (
                  <div key={p.id} className="lead-card" onClick={() => abrir(p.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      {p.estado === 'borrador'
                        ? <span style={{ ...S.tag, color: 'var(--gold)', borderColor: 'rgba(232,163,61,.35)' }}>EN CURSO</span>
                        : <span style={{ ...S.tag, color: s?.color, borderColor: s?.bd, background: s?.bg }}>{p.semaforo}</span>}
                      <span style={S.time}><Clock size={11} /> {new Date(p.actualizada_en).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="display" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Car size={17} color="var(--red-soft)" /> {p.modelo || 'Unidad sin nombre'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {p.km != null && <span style={S.meta}><Gauge size={13} color="var(--gray-mid)" /> {Number(p.km).toLocaleString('es-ES')} km</span>}
                      {p.ciudad && <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {p.ciudad}</span>}
                    </div>
                    <div className="card-foot">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={S.meta}>
                          {p.estado === 'finalizada'
                            ? <><b className="display" style={{ fontSize: 18 }}>{p.puntuacion}</b><span style={{ color: 'var(--gray-mid)' }}>/100</span></>
                            : <span style={{ color: 'var(--gray-mid)', fontSize: 13 }}>{p.completitud || 0}% revisado</span>}
                        </span>
                        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          {p.n_banderas > 0 && <span style={S.banderaMini}><Flag size={10} /> {p.n_banderas}</span>}
                          {p.revisada && <span style={{ ...S.tag, color: 'var(--green)', borderColor: 'var(--green-bd)' }}>REVISADA</span>}
                          <ChevronRight size={16} color="var(--gray-mid)" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.reglas}>
            <span style={{ color: 'var(--gray-mid)' }}>Cómo puntúa:</span>
            <span className="rule-pill">Verde 84–100</span>
            <span className="rule-pill">Amarillo 54–83</span>
            <span className="rule-pill">Rojo 0–53</span>
            <span className="rule-pill">Una bandera roja = rojo automático</span>
          </div>
        </div>
        <BottomNav perfil={perfil} activa="peritacion" />
      </div>
    );
  }

  /* -------------------------------------------------------- EDITOR */
  return (
    <div className="gpso-bg pt-app">
      {/* cabecera: raíl de 100 puntos segmentado por el peso real de cada bloque */}
      <header className="pt-hdr">
        <div className="pt-hdr-top">
          <button className="pt-icon" onClick={salirDelEditor} title="Guardar y salir"><ArrowLeft size={16} /></button>
          <span className="pt-titulo">{ficha.modelo || 'Peritación'}</span>
          {!online && <span style={S.offline}><CloudOff size={12} /></span>}
          {sinSubir > 0 && <span style={S.pendientes}><Camera size={11} /> {sinSubir}</span>}
        </div>

        <div className={'pt-rail' + (res.banderas.length ? ' pt-rail-rojo' : '')}>
          {BLOQUES.map((b, i) => {
            const tocado = evaluadosDe(b, resp) > 0;
            return (
              <button key={b.id} className={'pt-seg' + (paso === i + 1 ? ' on' : '')}
                style={{ flexGrow: b.max }} onClick={() => setPaso(i + 1)} title={`${b.nombre} · ${res.notas[b.id]}/${b.max}`}>
                <span className="pt-seg-fill" style={{ height: tocado ? (res.notas[b.id] / b.max) * 100 + '%' : '100%', opacity: tocado ? 1 : .2 }} />
              </button>
            );
          })}
        </div>

        <div className="pt-hdr-bot">
          <span className="pt-pts"><b>{res.total}</b>/100</span>
          {res.banderas.length > 0 && (
            <span className="pt-pill-rojo">{res.banderas.length} bandera{res.banderas.length > 1 ? 's' : ''} roja{res.banderas.length > 1 ? 's' : ''}</span>
          )}
          <span className="pt-cob">{res.completitud}% revisado</span>
        </div>
      </header>

      {flash && <Flash flash={flash} />}

      <main className="pt-main">
        {/* ---------------------------------------------------- ficha */}
        {paso === 0 && (
          <>
            <p className="pt-eyebrow">Antes de empezar</p>
            <h1 className="display pt-h1">La unidad</h1>
            <p className="pt-lead">Rellena lo que sepas ahora; el resto se completa delante del coche.
              Todo se guarda en el móvil a cada toque, aunque te quedes sin cobertura.</p>
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
          </>
        )}

        {/* --------------------------------------------------- bloques */}
        {bloque && (
          <>
            <p className="pt-eyebrow">Bloque {paso} de {N} · vale {bloque.max} puntos</p>
            <h1 className="display pt-h1">{bloque.nombre}</h1>

            <div className="glass pt-marcador">
              <div className="pt-nota display"><b>{res.notas[bloque.id]}</b><span>/{bloque.max}</span></div>
              <div>
                <p style={{ margin: 0, fontSize: 14 }}>{leerNota(bloque, res.notas[bloque.id])}</p>
                <p className="pt-cob" style={{ margin: '3px 0 0' }}>
                  {evaluadosDe(bloque, resp)} de {bloque.checklist.length} puntos revisados
                </p>
              </div>
            </div>

            <button className="pt-guia-btn" onClick={() => setGuiaAbierta(!guiaAbierta)}>
              <Info size={14} /> {guiaAbierta ? 'Ocultar la guía' : 'Cómo interpretar este bloque'}
            </button>
            {guiaAbierta && (
              <div className="glass pt-card pt-guia">
                <Lista t="Qué debes mirar" xs={bloque.guia.mirar} />
                <Lista t="Suele ser asumible" xs={bloque.guia.asumibles} c="var(--green)" />
                <Lista t="Obliga a revisar" xs={bloque.guia.revisar} c="var(--gold)" />
                <Lista t="Sube mucho el riesgo" xs={bloque.guia.riesgo} c="var(--red-soft)" />
                <Lista t="Claves prácticas" xs={bloque.guia.claves} />
                <div className="pt-baremo">
                  <span>Leve −{bloque.penalizacion.leve}</span>
                  <span>Medio −{bloque.penalizacion.medio}</span>
                  <span>Grave −{bloque.penalizacion.grave}</span>
                </div>
              </div>
            )}

            <ol className="pt-items">
              {bloque.checklist.map((t, i) => {
                const it = (resp[bloque.id]?.items || {})['it_' + i] || {};
                const clave = `${bloque.id}:${i}`;
                return (
                  <li key={i} className={'pt-item' + (it.estado ? ' e-' + it.estado : '')}>
                    <p className="pt-item-t">{t}</p>
                    <div className="pt-seg3">
                      {[['ok', 'Correcto', Check], ['obs', 'Observación', AlertTriangle], ['def', 'Defecto', XCircle]].map(([v, l, Ico]) => (
                        <button key={v} className={'pt-b3 b-' + v + (it.estado === v ? ' on' : '')}
                          onClick={() => setItem(bloque.id, i, { estado: it.estado === v ? null : v })}>
                          <Ico size={13} /> {l}
                        </button>
                      ))}
                    </div>

                    {it.estado === 'def' && (
                      <div className="pt-sev">
                        <p className="pt-sev-t">Gravedad</p>
                        <div className="pt-chips">
                          {['leve', 'medio', 'grave'].map((s) => (
                            <button key={s} className={'pt-chip s-' + s + (it.severidad === s ? ' on' : '')}
                              onClick={() => setItem(bloque.id, i, { severidad: s })}>
                              {SEV_LABEL[s]}<em>−{bloque.penalizacion[s]}</em>
                            </button>
                          ))}
                        </div>
                        {!it.severidad && <p className="pt-aviso-mini">Elige gravedad para que reste puntos.</p>}
                        <input className="campo" placeholder="Qué has visto exactamente"
                          value={it.nota || ''} onChange={(e) => setItem(bloque.id, i, { nota: e.target.value })} />
                        <Fotos clave={clave} fotos={fotos[clave]} onFile={(f) => añadirFoto(bloque.id, i, f)} />
                      </div>
                    )}

                    {it.estado === 'obs' && (
                      <input className="campo" style={{ marginTop: 9 }} placeholder="Qué quieres vigilar (no resta puntos)"
                        value={it.nota || ''} onChange={(e) => setItem(bloque.id, i, { nota: e.target.value })} />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="glass pt-card">
              <label className="etiqueta">Observaciones del bloque</label>
              <textarea className="campo" rows={3} placeholder="Lo que no entra en la lista pero no quieres olvidar"
                value={resp[bloque.id]?.obs || ''} onChange={(e) => setObs(bloque.id, e.target.value)} />
            </div>

            <div className="pt-flags">
              <p className="pt-flags-t"><Flag size={13} /> Banderas rojas de este bloque</p>
              <p className="pt-flags-d">Marca solo lo que hayas confirmado. Una sola casilla convierte toda la peritación en ROJO, aunque la nota sea de sobresaliente.</p>
              {bloque.banderas.map((f, i) => {
                const on = !!(resp[bloque.id]?.banderas || {})['bf_' + i];
                return (
                  <label key={i} className={'pt-flag' + (on ? ' on' : '')}>
                    <input type="checkbox" checked={on} onChange={(e) => setBandera(bloque.id, i, e.target.checked)} />
                    <span>{f}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {/* ---------------------------------------------------- costes */}
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
                    <input className="campo" type="number" inputMode="numeric" placeholder="0"
                      value={costes[c] || ''} onChange={(e) => setCostes({ ...costes, [c]: e.target.value })} />
                    <span>€</span>
                  </div>
                </div>
              ))}
              <div className="pt-coste pt-coste-total">
                <label>Total estimado</label>
                <div className="pt-euro"><b className="display">{ct.toLocaleString('es-ES')}</b><span>€</span></div>
              </div>
            </div>
            {ficha.precio && (
              <div className="glass pt-card">
                <p className="pt-k">Lo que te cuesta de verdad</p>
                <p className="display" style={{ fontSize: 30, margin: '4px 0 8px' }}>
                  {((parseFloat(ficha.precio) || 0) + ct).toLocaleString('es-ES')} €
                </p>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>
                  Precio pedido más puesta a punto. Si el negocio no encaja con esta cifra, no encaja con la unidad.
                  Es también tu suelo de negociación: lo que pides que baje.
                </p>
              </div>
            )}
          </>
        )}

        {/* ---------------------------------------------------- cierre */}
        {paso === N + 2 && (
          <>
            <p className="pt-eyebrow">Último paso</p>
            <h1 className="display pt-h1">Tu recomendación</h1>
            <p className="pt-lead">Has visto el coche. Antes de leer el resultado, di qué recomendarías.
              Una recomendación negativa cuenta como bandera roja: tu criterio pesa igual que un fallo mecánico.</p>
            <div className="glass pt-card">
              {[['positiva', 'Positiva', 'La unidad me convence tal y como está.', 'var(--green)'],
                ['reservas', 'Con reservas', 'Puede salir, pero hay cosas que confirmar o negociar.', 'var(--gold)'],
                ['negativa', 'Negativa', 'No la recomendaría. Cuenta como bandera roja.', 'var(--red-soft)']].map(([v, t, d, c]) => (
                <button key={v} className="pt-opcion" onClick={() => setCierre({ ...cierre, recomendacion: v })}
                  style={cierre.recomendacion === v ? { borderColor: c, background: 'color-mix(in srgb, ' + c + ' 10%, transparent)' } : undefined}>
                  <b style={cierre.recomendacion === v ? { color: c } : undefined}>{t}</b>
                  <span>{d}</span>
                </button>
              ))}
            </div>
            <div className="glass pt-card">
              <label className="etiqueta">Notas para el tutor</label>
              <textarea className="campo" rows={5} value={cierre.notas}
                placeholder="Qué te ha llamado la atención, cómo se ha comportado el vendedor, qué te falta por confirmar…"
                onChange={(e) => setCierre({ ...cierre, notas: e.target.value })} />
            </div>
            {res.completitud < 70 && (
              <div className="glass pt-card" style={{ borderColor: 'rgba(232,163,61,.4)' }}>
                <p className="pt-k" style={{ color: 'var(--gold)' }}>Peritación incompleta</p>
                <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>
                  Llevas {res.completitud}% de los puntos revisados. Por debajo del 70% el resultado sale marcado como
                  no concluyente: una nota alta con medio coche sin mirar no protege a nadie.
                </p>
              </div>
            )}
          </>
        )}

        {/* -------------------------------------------------- resultado */}
        {paso === N + 3 && (
          <Resultado {...{ BLOQUES, res, patrones, resp, ficha, costes, ct, cierre, setPaso,
            informe: () => informeTexto({ guia: BLOQUES, ficha, est: resp, cierre, costes, res, patrones }),
            aviso, finalizar, N }} />
        )}
      </main>

      {/* pie: sustituye al BottomNav mientras dura la peritación */}
      <footer className="pt-foot">
        <button className="btn-ghost" onClick={() => setPaso(Math.max(0, paso - 1))} disabled={paso === 0} style={{ padding: '13px 16px' }}>
          Anterior
        </button>
        <span className="pt-paso">
          {paso === 0 ? 'Unidad' : paso <= N ? `Bloque ${paso}/${N}` : paso === N + 1 ? 'Costes' : paso === N + 2 ? 'Cierre' : 'Resultado'}
        </span>
        {paso < N + 3
          ? <button className="btn-de" onClick={() => { if (paso === N + 2) finalizar(); setPaso(paso + 1); }} style={{ padding: '13px 18px', fontSize: 13.5 }}>
              {paso === N + 2 ? 'CERRAR Y VER RESULTADO' : 'SIGUIENTE'}
            </button>
          : <button className="btn-de" onClick={salirDelEditor} style={{ padding: '13px 18px', fontSize: 13.5 }}>TERMINAR</button>}
      </footer>
    </div>
  );
}

/* ============================================================ auxiliares */

function Flash({ flash }) {
  return (
    <div className={`aviso-flotante ${flash.t === 'ok' ? 'ok' : 'error'}`}>
      {flash.t === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {flash.m}
    </div>
  );
}

function Campo({ l, v, on, ph, num, tipo }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="etiqueta">{l}</label>
      <input className="campo" type={tipo || (num ? 'number' : 'text')}
        inputMode={num ? 'numeric' : undefined} placeholder={ph || ''}
        value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}

function Lista({ t, xs, c }) {
  if (!xs?.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <p className="pt-k" style={c ? { color: c } : undefined}>{t}</p>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {xs.map((x, i) => <li key={i} style={{ fontSize: 13.5, color: 'var(--text-soft)', marginBottom: 3 }}>{x}</li>)}
      </ul>
    </div>
  );
}

function Fotos({ clave, fotos, onFile }) {
  const ref = useRef(null);
  return (
    <div className="pt-fotos">
      {(fotos || []).map((f) => (
        <div key={f.id} className="pt-foto" style={{ opacity: f.subiendo ? .55 : 1 }}>
          <img src={f.url} alt="" />
        </div>
      ))}
      <button className="pt-foto-add" onClick={() => ref.current?.click()} title="Añadir foto">
        <Camera size={18} />
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function Resultado({ BLOQUES, res, patrones, resp, ficha, costes, ct, cierre, setPaso, informe, aviso, N }) {
  const s = SEM[res.semaforo];
  const ranking = BLOQUES.map((b) => ({ b, perdidos: b.max - res.notas[b.id], pct: res.notas[b.id] / b.max }))
    .filter((x) => x.perdidos > 0).sort((a, b) => b.perdidos - a.perdidos);
  const nDef = BLOQUES.reduce((a, b) => a + defectosDe(b, resp).length, 0);
  const nObs = BLOQUES.reduce((a, b) => a + observacionesDe(b, resp).length, 0);

  const copiar = () => {
    navigator.clipboard?.writeText(informe())
      .then(() => aviso('ok', 'Informe copiado.'))
      .catch(() => aviso('warn', 'No se pudo copiar.'));
  };

  return (
    <>
      <p className="pt-eyebrow">Resultado de la peritación</p>

      <div className="glass pt-veredicto" style={{ borderColor: s.bd, background: s.bg }}>
        <div className="pt-v-top">
          <span className="pt-luz" style={{ background: s.color }} />
          <span className="pt-sem" style={{ color: s.color }}>{res.semaforo}</span>
          <span className="display pt-v-pts">{res.total}/100</span>
        </div>
        <h2 className="display" style={{ fontSize: 23, margin: '0 0 8px', lineHeight: 1.15 }}>{s.t}</h2>
        <p style={{ color: 'var(--text-soft)', fontSize: 14, margin: 0 }}>{s.d}</p>
        {!res.concluyente && (
          <p className="pt-v-aviso">Solo has revisado el {res.completitud}% de los puntos. Este resultado no es concluyente:
            sirve como aviso, no como decisión.</p>
        )}
        {res.banderas.length > 0 && (
          <p className="pt-v-aviso">{res.banderas.length === 1 ? 'Hay una bandera roja' : `Hay ${res.banderas.length} banderas rojas`}.
            Manda sobre la nota: aunque la puntuación fuese alta, la unidad pasa a ROJO hasta demostrar lo contrario.</p>
        )}
      </div>

      <h3 className="pt-h3">Qué ha pasado en la inspección</h3>
      {patrones.length === 0 && (
        <div className="glass pt-card">
          <p style={{ margin: 0, color: 'var(--text-soft)', fontSize: 14 }}>
            No aparecen patrones preocupantes cruzando los bloques. Las señales que has anotado, si las hay, están sueltas
            y no se refuerzan entre sí.
          </p>
        </div>
      )}
      {patrones.map((p, i) => (
        <div key={i} className="glass pt-hallazgo"
          style={{ borderLeftColor: p.nivel === 'alto' ? 'var(--red-soft)' : 'var(--gold)' }}>
          <p className="pt-k">{p.titulo}</p>
          <p style={{ margin: '5px 0 0', color: 'var(--text-soft)', fontSize: 14 }}>{p.texto}</p>
        </div>
      ))}

      {res.banderas.length > 0 && (
        <>
          <h3 className="pt-h3">Banderas rojas</h3>
          <div className="glass pt-card" style={{ borderColor: 'var(--red-bd)' }}>
            {res.banderas.map((f, i) => (
              <div key={i} className="pt-bandera-l"><span>{f.texto}</span><em>{f.bloque}</em></div>
            ))}
          </div>
        </>
      )}

      <h3 className="pt-h3">Dónde has perdido puntos</h3>
      <div className="glass pt-card">
        {ranking.length === 0 && <p style={{ margin: 0, fontSize: 14 }}>No has restado puntos en ningún bloque.</p>}
        {ranking.map(({ b, perdidos, pct }) => (
          <div key={b.id} className="pt-barra" onClick={() => setPaso(BLOQUES.indexOf(b) + 1)}>
            <div className="pt-barra-l"><span>{b.nombre}</span><b>−{perdidos}</b></div>
            <div className="pt-barra-t">
              <span style={{ width: pct * 100 + '%', background: pct < .5 ? 'var(--red-soft)' : pct < .8 ? 'var(--gold)' : 'var(--green)' }} />
            </div>
          </div>
        ))}
        <p className="pt-cob" style={{ marginTop: 12 }}>{nDef} defectos y {nObs} observaciones sobre {res.completitud}% del checklist.</p>
      </div>

      <h3 className="pt-h3">Números</h3>
      <div className="glass pt-card">
        <div className="pt-kpi"><span>Precio pedido</span><b className="display">{ficha.precio ? parseFloat(ficha.precio).toLocaleString('es-ES') + ' €' : '—'}</b></div>
        <div className="pt-kpi"><span>Costes detectados</span><b className="display">{ct.toLocaleString('es-ES')} €</b></div>
        <div className="pt-kpi"><span>Coste real de entrada</span>
          <b className="display" style={{ fontSize: 24 }}>{((parseFloat(ficha.precio) || 0) + ct).toLocaleString('es-ES')} €</b></div>
        {ct > 0 && <p className="pt-cob" style={{ marginTop: 10 }}>Pide al menos {ct.toLocaleString('es-ES')} € de ajuste, o acepta que sale de tu margen.</p>}
      </div>

      <h3 className="pt-h3">Antes de decidir</h3>
      <div className="glass pt-card">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {res.banderas.length > 0 && <li className="pt-accion">Resolver o descartar cada bandera roja por escrito, con prueba, no con la palabra del vendedor.</li>}
          {res.completitud < 100 && <li className="pt-accion">Completar el {100 - res.completitud}% de puntos que has dejado sin revisar.</li>}
          {nObs > 0 && <li className="pt-accion">Confirmar las {nObs} observaciones que has dejado abiertas.</li>}
          <li className="pt-accion">Pedir el historial de daños y los sellos de mantenimiento antes de transferir dinero.</li>
          <li className="pt-accion">Fijar por escrito qué se corrige antes de la entrega y qué se descuenta del precio.</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
        <button className="btn-ghost" onClick={copiar} style={{ flex: 1, minWidth: 140 }}><Copy size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Copiar informe</button>
        <button className="btn-ghost" onClick={() => window.print()} style={{ flex: 1, minWidth: 140 }}><Printer size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Imprimir</button>
      </div>
    </>
  );
}

/* estilos puntuales en línea, al estilo del resto de la Central */
const S = {
  head: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' },
  sub: { fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 3 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 },
  tag: { fontSize: 10, fontWeight: 800, letterSpacing: .8, border: '1px solid var(--card-bd)', borderRadius: 20, padding: '3px 10px' },
  time: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-mid)' },
  meta: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-soft)', fontWeight: 500 },
  banderaMini: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '2px 8px' },
  offline: { display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--gold)', border: '1px solid rgba(232,163,61,.35)', borderRadius: 20, padding: '4px 10px' },
  pendientes: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--gold)' },
  vacio: { textAlign: 'center', padding: '50px 20px', color: 'var(--gray-mid)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, lineHeight: 1.6 },
  reglas: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, marginTop: 30, paddingTop: 18, borderTop: '1px solid var(--card-bd)' },
};
