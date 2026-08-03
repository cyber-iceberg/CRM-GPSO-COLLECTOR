'use client';

// =====================================================================
//  GPSO COLLECTOR · Showroom VIP (cliente)  ·  app/vip/ShowroomVip.jsx
//  Coche protagonista a pantalla completa + dossier al hacer scroll.
//  Conectado a Supabase: comprometer_inversion / cancelar_compromiso.
// =====================================================================

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import {
  ChevronLeft, ChevronRight, ChevronDown, Calendar, Gauge, Settings2,
  MapPin, TrendingUp, Wallet, ArrowLeft, Lock, X, Check
} from 'lucide-react';

const eur = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-ES') + ' €');

export default function ShowroomVip({ user, perfil, esVip, esAdmin, operacionesIniciales, misCompromisos }) {
  const router = useRouter();
  const supabase = createClient();

  const [ops] = useState(operacionesIniciales || []);
  const [comps, setComps] = useState(misCompromisos || []);
  const [i, setI] = useState(0);
  const [aporta, setAporta] = useState(0);
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [flash, setFlash] = useState(null);
  const dossierRef = useRef(null);

  const acceso = esVip || esAdmin;
  const o = ops[i];

  // reset aportación al mínimo cuando cambia de coche
  const minActual = o?.entrada_minima || 1000;
  useMemo(() => { if (o) setAporta(Math.min(o.inversion_total - o.recaudado, minActual * 2)); }, [i]); // eslint-disable-line

  const miCompromiso = useMemo(
    () => comps.find((c) => o && c.operacion_id === o.id) || null,
    [comps, o]
  );

  // ---- SIN ACCESO ----
  if (!acceso) {
    return (
      <div data-theme="dark" style={S.lockWrap}>
        <div style={S.lockCard}>
          <div style={S.lockIcon}><Lock size={26} /></div>
          <h1 className="display" style={{ fontSize: 24, marginBottom: 8 }}>Zona de inversores VIP</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            El acceso a las operaciones de coinversión es exclusivo para inversores invitados. Si crees que deberías tener acceso, contacta con el equipo Collector.
          </p>
          <button className="btn-ghost" onClick={() => router.push('/')}>
            <ArrowLeft size={15} style={{ verticalAlign: -2, marginRight: 6 }} /> Volver a la Central
          </button>
        </div>
      </div>
    );
  }

  // ---- SIN OPERACIONES ----
  if (ops.length === 0) {
    return (
      <div data-theme="dark" style={S.lockWrap}>
        <div style={S.lockCard}>
          <div style={S.lockIcon}><TrendingUp size={26} /></div>
          <h1 className="display" style={{ fontSize: 24, marginBottom: 8 }}>Sin operaciones abiertas</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Ahora mismo no hay ninguna oportunidad de inversión abierta. Te avisaremos cuando el equipo suba la próxima unidad.
          </p>
          <button className="btn-ghost" onClick={() => router.push('/')}>
            <ArrowLeft size={15} style={{ verticalAlign: -2, marginRight: 6 }} /> Volver a la Central
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((o.recaudado / o.inversion_total) * 100));
  const disponible = o.inversion_total - o.recaudado;
  const fotos = Array.isArray(o.fotos) ? o.fotos : [];
  const fotoPrincipal = fotos[0] || null;
  const escenarios = Array.isArray(o.escenarios) ? o.escenarios : [];
  const desglose = o.desglose && typeof o.desglose === 'object' ? o.desglose : {};
  const mkt = o.mercado && typeof o.mercado === 'object' ? o.mercado : null;

  function aviso(t, m) { setFlash({ t, m }); setTimeout(() => setFlash(null), 3500); }
  function mover(d) { setI((p) => (p + d + ops.length) % ops.length); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function bajar() { dossierRef.current?.scrollIntoView({ behavior: 'smooth' }); }

  async function comprometer() {
    if (aporta < minActual) { aviso('warn', `El mínimo de entrada es ${eur(minActual)}.`); return; }
    if (aporta > disponible) { aviso('warn', `Solo quedan ${eur(disponible)} disponibles.`); return; }
    setCargando(true);
    const { data, error } = await supabase.rpc('comprometer_inversion', { p_operacion: o.id, p_importe: aporta });
    setCargando(false);
    if (error) { aviso('warn', 'Error de conexión. Reintenta.'); return; }
    if (!data?.ok) {
      const m = {
        no_vip: 'Tu cuenta no tiene acceso VIP.', no_abierta: 'Esta operación ya no admite compromisos.',
        bajo_minimo: `El mínimo es ${eur(data.minimo)}.`, supera_objetivo: `Solo quedan ${eur(data.disponible)}.`,
      }[data?.error] || 'No se pudo registrar el compromiso.';
      aviso('warn', m); return;
    }
    setComps((prev) => {
      const otros = prev.filter((c) => c.operacion_id !== o.id);
      return [...otros, { operacion_id: o.id, inversor_id: user.id, importe: (miCompromiso?.importe || 0) + aporta, estado: 'comprometido' }];
    });
    o.recaudado = data.recaudado;
    setModal(false);
    aviso('ok', data.financiada ? '¡Operación financiada al 100%! Te avisaremos del cobro.' : '¡Plaza reservada! Se cobrará al llegar al 100%.');
  }

  async function cancelar() {
    setCargando(true);
    const { data } = await supabase.rpc('cancelar_compromiso', { p_operacion: o.id });
    setCargando(false);
    if (data?.ok) {
      setComps((prev) => prev.filter((c) => c.operacion_id !== o.id));
      o.recaudado = Math.max(0, o.recaudado - (miCompromiso?.importe || 0));
      aviso('ok', 'Compromiso cancelado.');
    }
  }

  return (
    <div className="gpso-bg" data-theme="dark" style={{ background: '#050505', color: '#f4f4f4' }}>
      {flash && (
        <div style={{ ...S.flash, ...(flash.t === 'ok' ? S.flashOk : S.flashWarn) }}>{flash.m}</div>
      )}

      {/* ===== SHOWROOM ===== */}
      <div style={S.stage}>
        <div style={S.stageGlow} />
        <div style={S.vign} />

        {/* topbar */}
        <div style={S.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '9px 12px' }} title="Volver a la Central">
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1 }}>Inversión <span className="texto-alemania">VIP</span></div>
              <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'var(--gray-mid)', fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>Coinversión · Alta gama</div>
            </div>
          </div>
          <div style={S.vipBadge}>◆ {perfil?.tier_inversor === 'elite' ? 'Inversor Élite' : perfil?.tier_inversor === 'vip' ? 'Inversor VIP' : 'Inversor'}</div>
        </div>

        <div style={S.counter}><b style={{ color: '#fff', fontFamily: 'Bricolage Grotesque' }}>{i + 1}</b> / {ops.length}</div>

        {/* nombre gigante detrás */}
        <div style={S.bigname}>{(o.marca || o.titulo || '').toUpperCase()}</div>

        {/* coche */}
        <div style={S.piso} />
        <div style={S.coche}>
          {fotoPrincipal
            ? <img src={fotoPrincipal} alt={o.titulo} style={{ width: '100%', display: 'block' }} />
            : <div style={S.noFoto}>Sin imagen · sube la foto de la unidad</div>}
        </div>

        {/* info arriba izq */}
        <div className="glass" style={S.pInfo}>
          <div style={S.tag}>{o.estado === 'financiada' ? '✓ Financiada' : '◆ Abierta'}</div>
          <h1 className="display" style={{ fontSize: 27, lineHeight: 1.02, marginBottom: 5 }}>{o.titulo}</h1>
          <div style={S.meta}>
            {o.anio && <span><Calendar size={13} /> {o.anio}</span>}
            {o.km != null && <span><Gauge size={13} /> {o.km.toLocaleString('es-ES')} km</span>}
            {o.motor && <span><Settings2 size={13} /> {o.motor}</span>}
          </div>
        </div>

        {/* barra recaudación abajo */}
        <div className="glass" style={S.pFund}>
          <div style={S.fundRow}>
            <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 30 }}>
              {eur(o.recaudado)}<span style={{ fontFamily: 'Inter Tight', fontWeight: 600, fontSize: 14, color: 'var(--gray-mid)', marginLeft: 8 }}>de {eur(o.inversion_total)}</span>
            </span>
            <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>quedan {eur(disponible)}</span>
          </div>
          <div style={S.bar}><div style={{ ...S.barFill, width: pct + '%' }} /></div>
          <div style={S.fundSub}><span>{pct}% financiado</span><span>Entrada desde {eur(minActual)}</span></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {miCompromiso ? (
              <>
                <div style={S.yaComp}><Check size={15} /> Ya has comprometido {eur(miCompromiso.importe)}</div>
                {o.estado === 'abierta' && <button className="btn-ghost" onClick={cancelar} disabled={cargando}>Cancelar</button>}
              </>
            ) : (
              <>
                <button className="btn-de" style={{ flex: 1 }} disabled={o.estado !== 'abierta'} onClick={() => setModal(true)}>
                  {o.estado === 'abierta' ? 'COMPROMETER INVERSIÓN →' : 'OPERACIÓN CERRADA'}
                </button>
                <button className="btn-ghost" onClick={bajar}>Ver análisis <ChevronDown size={14} style={{ verticalAlign: -2 }} /></button>
              </>
            )}
          </div>
        </div>

        {/* navegación */}
        {ops.length > 1 && <>
          <button style={{ ...S.nav, left: 24 }} onClick={() => mover(-1)}><ChevronLeft size={22} /></button>
          <button style={{ ...S.nav, right: 24 }} onClick={() => mover(1)}><ChevronRight size={22} /></button>
        </>}
      </div>

      {/* ===== DOSSIER ===== */}
      <div ref={dossierRef} style={S.dossier}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>Análisis de la operación</div>
            <h2 className="display" style={{ fontSize: 38, marginTop: 8 }}>{o.titulo}</h2>
          </div>
          {o.descripcion && <p style={{ textAlign: 'center', color: 'var(--gray-mid)', fontSize: 14, marginBottom: 44, maxWidth: 640, marginInline: 'auto', lineHeight: 1.6 }}>{o.descripcion}</p>}

          {/* desglose */}
          {Object.keys(desglose).length > 0 && (
            <div style={S.card}>
              <div style={S.sec}>Desglose de la inversión</div>
              <div style={S.desglose}>
                {Object.entries(desglose).map(([k, v]) => (
                  <div key={k} style={S.dd}><div style={S.ddL}>{k}</div><div style={S.ddV}>{eur(v)}</div></div>
                ))}
                <div style={{ ...S.dd, ...S.ddTot }}><div style={S.ddL}>Inversión total</div><div style={{ ...S.ddV, color: 'var(--gold)' }}>{eur(o.inversion_total)}</div></div>
              </div>
            </div>
          )}

          {/* escenarios */}
          {escenarios.length > 0 && (
            <div style={S.card}>
              <div style={S.sec}>Escenarios de rentabilidad · rotación estimada</div>
              <div style={S.escGrid}>
                {escenarios.map((e, k) => (
                  <div key={k} style={{ ...S.eb, ...(k === 1 ? S.ebReal : {}) }}>
                    <div style={{ ...S.ebN, ...(k === 1 ? { color: 'var(--gold)' } : {}) }}>{e.nombre}</div>
                    <div style={{ ...S.ebRoi, ...(k === 1 ? { color: 'var(--gold)' } : {}) }}>+{e.roi_pct}%</div>
                    <div style={S.ebDet}>Rotación <b style={{ color: '#fff' }}>{e.dias} días</b><br />Beneficio <b style={{ color: '#fff' }}>{eur(o.inversion_total * e.roi_pct / 100)}</b></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* mercado España */}
          {mkt && mkt.min != null && (
            <div style={S.card}>
              <div style={S.sec}>Mercado en España · comparables reales</div>
              <MercadoBar mkt={mkt} compra={desglose.Compra || desglose.compra} />
            </div>
          )}

          {/* simulador */}
          {escenarios.length > 0 && (
            <div style={S.card}>
              <div style={S.sec}>Simula tu inversión</div>
              <div style={S.simRow}>
                <label style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 600 }}>Tu aportación</label>
                <input type="range" className="slider-gpso" min={minActual} max={Math.min(o.inversion_total, minActual * 12)} step={minActual >= 5000 ? 1000 : 500}
                  value={aporta} onChange={(e) => setAporta(+e.target.value)}
                  style={{ flex: 1, minWidth: 200, '--p': (() => { const mn = minActual, mx = Math.min(o.inversion_total, minActual * 12); return (mx > mn ? ((aporta - mn) / (mx - mn)) * 100 : 0) + '%'; })() }} />
                <div style={S.simInput}>{eur(aporta)}</div>
              </div>
              <div style={S.simOut}>
                {escenarios.map((e, k) => (
                  <div key={k} style={{ ...S.so, ...(k === 1 ? { borderColor: 'rgba(232,163,61,.4)' } : {}) }}>
                    <div style={S.soL}>{e.nombre}</div>
                    <div style={S.soV}>+{eur(aporta * e.roi_pct / 100)}</div>
                    <div style={S.soP}><b style={{ color: 'var(--gold)' }}>+{e.roi_pct}%</b> sobre tu inversión</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {!miCompromiso && o.estado === 'abierta' && (
            <button className="btn-de" onClick={() => setModal(true)} style={{ maxWidth: 460, margin: '10px auto 0', display: 'block', width: '100%', fontSize: 15, padding: 16 }}>
              COMPROMETER PLAZA · ENTRADA DESDE {eur(minActual)}
            </button>
          )}
        </div>
      </div>

      {/* ===== MODAL COMPROMISO ===== */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="glass" style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="display" style={{ fontSize: 19 }}>Comprometer inversión</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-mid)', marginBottom: 18 }}>{o.titulo}</p>

            <label className="etiqueta">Importe a comprometer</label>
            <input className="campo" type="text" inputMode="numeric" value={aporta ? aporta.toLocaleString('es-ES') : ''}
              onChange={(e) => setAporta(parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0)} placeholder={`Mínimo ${eur(minActual)}`} style={{ fontSize: 18, fontWeight: 700 }} />
            <p style={{ fontSize: 11.5, color: 'var(--gray-mid)', margin: '8px 0 16px', lineHeight: 1.5 }}>
              Reservas plaza ahora. El cobro se realiza cuando la operación alcanza el 100% de financiación. Quedan {eur(disponible)} disponibles.
            </p>

            {escenarios[1] && (
              <div style={S.simuEnModal}>
                Beneficio estimado (realista): <b style={{ color: 'var(--green)' }}>+{eur(aporta * escenarios[1].roi_pct / 100)}</b> · <b style={{ color: 'var(--gold)' }}>+{escenarios[1].roi_pct}%</b> en ~{escenarios[1].dias} días
              </div>
            )}

            <button className="btn-de" onClick={comprometer} disabled={cargando} style={{ width: '100%', marginTop: 16 }}>
              {cargando ? 'Un momento…' : 'CONFIRMAR COMPROMISO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Barra de mercado España ----
function MercadoBar({ mkt, compra }) {
  const span = (mkt.max - mkt.min) || 1;
  const posN = mkt.nuestro != null ? ((mkt.nuestro - mkt.min) / span) * 100 : null;
  const posMed = ((mkt.med - mkt.min) / span) * 100;
  const comps = Array.isArray(mkt.comps) ? mkt.comps : [];
  // clamp para que la etiqueta "venta prevista" no se salga por los bordes
  const clampL = Math.max(9, Math.min(91, posN != null ? posN : 50));
  return (
    <>
      <div style={{ position: 'relative', height: 14, borderRadius: 20, background: 'linear-gradient(90deg,#2a6b3f,#7a6b1e 55%,#7a2020)', margin: '48px 6px 70px' }}>
        {/* Min - anclado a la izquierda */}
        <div style={{ position: 'absolute', top: -30, left: 0, fontSize: 12.5, color: '#f4f4f4', fontWeight: 700, whiteSpace: 'nowrap' }}>{eur(mkt.min)}<span style={{ display: 'block', color: '#8a8a92', fontSize: 9.5, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>Mín</span></div>
        {/* Medio - centrado */}
        <div style={{ position: 'absolute', top: -30, left: posMed + '%', transform: 'translateX(-50%)', fontSize: 12.5, color: '#f4f4f4', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center' }}>{eur(mkt.med)}<span style={{ display: 'block', color: '#8a8a92', fontSize: 9.5, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>Medio</span></div>
        {/* Max - anclado a la derecha */}
        <div style={{ position: 'absolute', top: -30, right: 0, fontSize: 12.5, color: '#f4f4f4', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>{eur(mkt.max)}<span style={{ display: 'block', color: '#8a8a92', fontSize: 9.5, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>Máx</span></div>
        {posN != null && (
          <>
            <div style={{ position: 'absolute', top: '50%', left: posN + '%', transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: '#fff', border: '3px solid var(--gold)', boxShadow: '0 0 0 5px rgba(232,163,61,.25),0 4px 14px rgba(0,0,0,.6)', zIndex: 3 }} />
            <div style={{ position: 'absolute', bottom: -52, left: clampL + '%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', background: 'rgba(232,163,61,.1)', border: '1px solid rgba(232,163,61,.35)', borderRadius: 10, padding: '6px 12px' }}>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 16, color: 'var(--gold)' }}>{eur(mkt.nuestro)}</div>
              <div style={{ fontSize: 9.5, color: '#8a8a92', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 }}>Venta prevista</div>
            </div>
          </>
        )}
      </div>
      {comps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 26 }}>
          {comps.map((c, k) => (
            <div key={k} style={S.comp}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.modelo || c[0]}</div>
              <div style={{ color: 'var(--gray-mid)', fontSize: 12, margin: '5px 0 8px' }}>{c.detalle || c[1]}</div>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 19 }}>{eur(c.precio || c[2])}</div>
              <div style={{ fontSize: 10.5, color: 'var(--gray-mid)', marginTop: 3 }}>{c.fuente || c[3]}</div>
            </div>
          ))}
        </div>
      )}
      {compra && mkt.med && (
        <div style={S.mktConcl}>
          Compramos en Alemania por <b style={{ color: '#fff' }}>{eur(compra)}</b>. En España el precio medio es <b style={{ color: 'var(--green)' }}>{eur(mkt.med)}</b>. Vendiendo por debajo de mercado, la salida es rápida y el margen queda protegido.
        </div>
      )}
    </>
  );
}

const S = {
  lockWrap: { display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20, background: '#050505' },
  lockCard: { maxWidth: 440, textAlign: 'center', padding: 36, background: 'var(--card-glass)', border: '1px solid var(--card-bd)', borderRadius: 18, backdropFilter: 'blur(14px)' },
  lockIcon: { width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red-soft)' },

  stage: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: 'radial-gradient(58% 55% at 50% 42%, rgba(150,22,22,.30), transparent 62%), #050505' },
  stageGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(90% 60% at 50% 122%,rgba(0,0,0,.7),transparent 60%)' },
  vign: { position: 'absolute', inset: 0, boxShadow: 'inset 0 0 240px 60px rgba(0,0,0,.85)', pointerEvents: 'none', zIndex: 2 },

  topbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 26px' },
  vipBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(95deg,#3a2a08,#0e0e0e)', border: '1px solid rgba(232,163,61,.4)', color: 'var(--gold)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: '7px 14px', borderRadius: 20, textTransform: 'uppercase' },
  counter: { position: 'absolute', top: 92, right: 26, zIndex: 25, color: 'var(--gray-mid)', fontSize: 12, fontWeight: 600, background: 'var(--card-glass)', border: '1px solid var(--card-bd)', borderRadius: 20, padding: '6px 13px', backdropFilter: 'blur(10px)' },

  bigname: { position: 'absolute', top: '14%', left: 0, right: 0, textAlign: 'center', zIndex: 3, pointerEvents: 'none', fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(40px,8vw,120px)', lineHeight: .9, color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,.10)', letterSpacing: -2 },
  piso: { position: 'absolute', top: '62%', left: '50%', transform: 'translateX(-50%)', zIndex: 4, width: 'min(58vw,720px)', height: 66, background: 'radial-gradient(50% 50% at 50% 50%,rgba(0,0,0,.75),transparent 70%)', filter: 'blur(6px)' },
  coche: { position: 'absolute', top: '47%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, width: 'min(72vw,940px)', filter: 'drop-shadow(0 60px 55px rgba(0,0,0,.75))' },
  noFoto: { aspectRatio: '16/7', display: 'grid', placeItems: 'center', color: 'var(--gray-mid)', border: '1px dashed var(--card-bd)', borderRadius: 16, fontSize: 13 },

  pInfo: { position: 'absolute', top: 104, left: 26, zIndex: 15, padding: '18px 22px', maxWidth: 360 },
  tag: { display: 'inline-flex', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', background: 'rgba(232,163,61,.1)', border: '1px solid rgba(232,163,61,.4)', borderRadius: 20, padding: '4px 11px', textTransform: 'uppercase', marginBottom: 10 },
  meta: { display: 'flex', gap: 13, marginTop: 12, color: 'var(--text-soft)', fontSize: 12.5, flexWrap: 'wrap' },

  pFund: { position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 15, padding: '22px 28px', width: 'min(680px,90vw)' },
  fundRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 },
  bar: { height: 13, borderRadius: 20, background: 'rgba(255,255,255,.09)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 20, background: 'linear-gradient(90deg,var(--red),var(--gold))', boxShadow: '0 0 20px rgba(232,163,61,.5)' },
  fundSub: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-mid)', marginTop: 9 },
  yaComp: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 11, padding: '13px 15px', fontSize: 13.5, fontWeight: 600 },

  nav: { position: 'absolute', top: '47%', transform: 'translateY(-50%)', zIndex: 25, width: 50, height: 50, borderRadius: '50%', background: 'rgba(20,20,20,.6)', backdropFilter: 'blur(10px)', border: '1px solid var(--card-bd)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' },

  dossier: { background: 'linear-gradient(180deg,#050505,#0c0a0a)', padding: '70px 24px 90px' },
  card: { background: 'var(--card-glass)', border: '1px solid var(--card-bd)', borderRadius: 18, padding: 26, marginBottom: 22, backdropFilter: 'blur(14px)' },
  sec: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gray-mid)', fontWeight: 700, marginBottom: 18 },
  desglose: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 },
  dd: { background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-bd)', borderRadius: 13, padding: 16 },
  ddL: { fontSize: 11, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 },
  ddV: { fontSize: 20, fontWeight: 800, marginTop: 5, fontFamily: 'Bricolage Grotesque' },
  ddTot: { background: 'linear-gradient(100deg,rgba(198,26,26,.12),rgba(232,163,61,.08))', borderColor: 'rgba(232,163,61,.3)' },
  escGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 },
  eb: { background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-bd)', borderRadius: 16, padding: '22px 18px', textAlign: 'center' },
  ebReal: { background: 'linear-gradient(180deg,rgba(232,163,61,.1),transparent)', borderColor: 'rgba(232,163,61,.4)', transform: 'scale(1.04)' },
  ebN: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-mid)', fontWeight: 700 },
  ebRoi: { fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 38, margin: '8px 0 2px' },
  ebDet: { fontSize: 12, color: 'var(--text-soft)', marginTop: 8, lineHeight: 1.7 },
  simRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  simInput: { background: '#111', border: '1px solid var(--card-bd)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'Bricolage Grotesque', width: 170, textAlign: 'center' },
  simOut: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, textAlign: 'center' },
  so: { background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-bd)', borderRadius: 14, padding: 18 },
  soL: { fontSize: 11, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600 },
  soV: { fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 26, marginTop: 6, color: 'var(--green)' },
  soP: { fontSize: 11.5, color: 'var(--gray-mid)', marginTop: 5, lineHeight: 1.4 },
  comp: { background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-bd)', borderRadius: 13, padding: '15px 16px' },
  mktConcl: { marginTop: 22, background: 'linear-gradient(100deg,rgba(70,196,131,.08),transparent)', border: '1px solid rgba(70,196,131,.25)', borderRadius: 13, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.6 },

  modal: { maxWidth: 440, width: '100%', padding: 24, borderColor: 'rgba(232,163,61,.3)' },
  simuEnModal: { background: 'rgba(232,163,61,.06)', border: '1px solid rgba(232,163,61,.25)', borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.5 },

  flash: { position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, backdropFilter: 'blur(10px)', maxWidth: '90vw' },
  flashOk: { background: 'rgba(70,196,131,.15)', border: '1px solid var(--green-bd)', color: 'var(--green)' },
  flashWarn: { background: 'rgba(198,26,26,.15)', border: '1px solid var(--red-bd)', color: 'var(--red-soft)' },
};
