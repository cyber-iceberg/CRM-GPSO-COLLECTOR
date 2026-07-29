'use client';

// =====================================================================
//  GPSO COLLECTOR · Central de Leads (cliente)  ·  app/CentralClient.jsx
//  Catalogo real + Mis clientes, conectado a Supabase.
//  Reserva atomica via rpc('reservar_lead'), gestion via rpc.
//  Usa variables CSS del design system -> respeta tema claro/oscuro.
// =====================================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import {
  Car, MapPin, Wallet, Lock, Unlock, Clock, Phone, Mail, User,
  Trophy, Timer, Users, TrendingUp, X, RotateCcw, XCircle,
  LogOut, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Circle
} from 'lucide-react';

const CALOR = {
  alto:  { label: 'CALIENTE', color: 'var(--red-soft)', dot: '#C61A1A' },
  medio: { label: 'TEMPLADO', color: 'var(--amber)',    dot: '#c9a23c' },
  bajo:  { label: 'FRIO',     color: '#7fa6d4',          dot: '#7fa6d4' },
};

function euros(n) {
  if (n == null) return '—';
  return n.toLocaleString('es-ES') + ' €';
}
function desde(iso) {
  if (!iso) return '';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
function restante(hasta) {
  const s = Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

export default function CentralClient({ user, perfil, catalogoInicial, misLeadsInicial, config, motivos }) {
  const router = useRouter();
  const supabase = createClient();

  const [catalogo, setCatalogo] = useState(catalogoInicial);
  const [misLeads, setMisLeads] = useState(misLeadsInicial);
  const [vista, setVista] = useState('catalogo');
  const [flash, setFlash] = useState(null);
  const [descartando, setDescartando] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);
  const [cooldownHasta, setCooldownHasta] = useState(0);
  const [ahora, setAhora] = useState(Date.now());
  const [refrescando, setRefrescando] = useState(false);

  const activo = perfil && perfil.activo;
  const esAdmin = perfil && perfil.rol === 'admin';
  const slotsLibres = config.slots_max - misLeads.length;
  const enCooldown = cooldownHasta > ahora;

  // reloj para countdowns
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // flash auto-oculta
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3200);
    return () => clearTimeout(t);
  }, [flash]);

  const cargarDatos = useCallback(async () => {
    setRefrescando(true);
    const [cat, mis] = await Promise.all([
      supabase.from('v_catalogo').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').eq('alumno_id', user.id).eq('estado', 'reservado').order('reservado_en', { ascending: false }),
    ]);
    if (cat.data) setCatalogo(cat.data);
    if (mis.data) setMisLeads(mis.data);
    setRefrescando(false);
  }, [supabase, user.id]);

  // refresco automatico cada 30s del catalogo
  useEffect(() => {
    const t = setInterval(cargarDatos, 30000);
    return () => clearInterval(t);
  }, [cargarDatos]);

  function aviso(t, m) { setFlash({ t, m }); }

  async function reservar(id) {
    if (slotsLibres <= 0) { aviso('warn', `Slots llenos (${config.slots_max}). Cierra un cliente para liberar uno.`); return; }
    if (enCooldown) { aviso('warn', 'En cooldown. Espera para coger otro — así todos tienen turno.'); return; }
    setOcupadoId(id);
    const { data, error } = await supabase.rpc('reservar_lead', { p_lead_id: id });
    setOcupadoId(null);
    if (error) { aviso('warn', 'Error de conexión. Reintenta.'); return; }
    if (!data?.ok) {
      const m = {
        slots_llenos: `Slots llenos (${config.slots_max}).`,
        cooldown: 'Aún en cooldown.',
        ya_reservado: 'Otro alumno lo ha cogido primero.',
        no_activo: 'Tu cuenta aún no está activada.',
        no_auth: 'Sesión caducada, vuelve a entrar.',
      }[data?.error] || 'No se pudo reservar.';
      if (data?.error === 'cooldown' && data.segundos_restantes) {
        setCooldownHasta(Date.now() + data.segundos_restantes * 1000);
      }
      aviso('warn', m);
      await cargarDatos();
      return;
    }
    setCooldownHasta(Date.now() + config.cooldown_horas * 3600 * 1000);
    aviso('ok', '¡Reservado! Datos desbloqueados en Mis clientes.');
    await cargarDatos();
    setVista('mis');
  }

  async function contactado(id) {
    const { data } = await supabase.rpc('marcar_contactado', { p_lead_id: id });
    if (data?.ok) { aviso('ok', 'Marcado como contactado.'); await cargarDatos(); }
  }
  async function ganado(id) {
    const { data } = await supabase.rpc('marcar_ganado', { p_lead_id: id });
    if (data?.ok) { aviso('ok', '¡Venta cerrada! Suma a tu reputación.'); await cargarDatos(); }
  }
  async function confirmarDescarte(motivoId) {
    const lead = descartando;
    setDescartando(null);
    const { data } = await supabase.rpc('descartar_lead', { p_lead_id: lead.id, p_motivo: motivoId });
    if (data?.ok) {
      aviso(data.destino === 'bolsa' ? 'ok' : 'warn',
        data.destino === 'bolsa' ? 'Liberado: vuelve a la bolsa.' : 'Cerrado: no vuelve al catálogo.');
      await cargarDatos();
    }
  }
  async function salir() {
    await supabase.auth.signOut();
    router.push('/login'); router.refresh();
  }

  // reputacion
  const totalCerrados = (perfil?.leads_ganados || 0) + (perfil?.leads_perdidos || 0) + (perfil?.leads_expirados || 0);
  const reputacion = totalCerrados > 0 ? Math.round((perfil.leads_ganados / totalCerrados) * 100) : null;

  // ---- Cuenta pendiente de activacion ----
  if (!activo) {
    return (
      <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="caja" style={{ maxWidth: 420, textAlign: 'center', padding: 30 }}>
          <div style={S.logo}>GP</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '14px 0 6px' }}>Cuenta pendiente</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
            Tu cuenta está creada pero un administrador debe activarla antes de que puedas coger leads.
          </p>
          <button className="btn-ghost" onClick={salir}><LogOut size={15} style={{ marginRight: 6, verticalAlign: -2 }} />Salir</button>
        </div>
      </div>
    );
  }

  const totalCat = catalogo.length;

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '22px 20px 44px' }}>

        {/* HEADER */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={S.logo}>GP</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
                GPSO <span style={{ color: 'var(--red)' }}>COLLECTOR</span>
              </div>
              <div className="texto-alemania" style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, marginTop: 3 }}>
                CENTRAL DE LEADS
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Stat icon={<Circle size={12} />} val={`${misLeads.length} / ${config.slots_max}`} lab="Slots" hot={slotsLibres <= 0} />
            <Stat icon={<Trophy size={13} />} val={perfil?.leads_ganados || 0} lab="Cerrados" />
            <Stat icon={<TrendingUp size={13} />} val={reputacion == null ? '—' : `${reputacion}%`} lab="Reputación" />
            <button className="btn-ghost" onClick={salir} style={{ padding: '9px 11px' }} title="Salir"><LogOut size={16} /></button>
          </div>
        </div>
        <div className="de-line" style={{ marginBottom: 6 }} />

        {/* ESCASEZ */}
        <div style={S.scarcity}>
          <Users size={14} color="var(--red)" />
          <span><b style={{ color: 'var(--text)' }}>{totalCat} leads</b> disponibles ahora · el primero que reserva se lo lleva</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {enCooldown && <span style={S.cooldownPill}><Timer size={12} /> {restante(cooldownHasta)}</span>}
            <button onClick={cargarDatos} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} title="Refrescar">
              <RefreshCw size={13} style={{ verticalAlign: -2, animation: refrescando ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, margin: '18px 0 14px' }}>
          <Tab activo={vista === 'catalogo'} onClick={() => setVista('catalogo')}>Catálogo <Badge>{totalCat}</Badge></Tab>
          <Tab activo={vista === 'mis'} onClick={() => setVista('mis')}>Mis clientes <Badge>{misLeads.length}</Badge></Tab>
          {esAdmin && <span style={S.adminTag}><Sparkles size={12} /> Admin</span>}
        </div>

        {flash && (
          <div className={`aviso ${flash.t === 'ok' ? 'ok' : 'error'}`} style={{ marginBottom: 8 }}>
            {flash.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {flash.m}
          </div>
        )}

        {/* GRID */}
        <div style={S.grid}>
          {vista === 'catalogo' && catalogo.map((l) => {
            const c = CALOR[l.calor] || CALOR.medio;
            const off = slotsLibres <= 0 || enCooldown || ocupadoId === l.id;
            return (
              <div key={l.id} className="lead-card" style={S.card}>
                <div style={S.cardTop}>
                  <span style={{ ...S.calor, color: c.color }}><Circle size={7} fill={c.dot} color={c.dot} /> {c.label}</span>
                  <span style={S.time}><Clock size={11} /> {desde(l.created_at)}</span>
                </div>
                <div style={S.veh}><Car size={18} color="var(--red)" /> {l.vehiculo}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={S.meta}><Wallet size={13} color="var(--gray-mid)" /> {euros(l.presupuesto)}</span>
                  <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {l.ciudad}</span>
                </div>
                <div style={S.locked}><Lock size={12} /> Contacto oculto hasta reservar</div>
                <button className={`btn-de ${off ? 'off' : ''}`} disabled={off} onClick={() => reservar(l.id)} style={{ marginTop: 2, fontSize: 13.5 }}>
                  <Lock size={14} /> {ocupadoId === l.id ? 'RESERVANDO…' : 'RESERVAR CLIENTE'}
                </button>
              </div>
            );
          })}

          {vista === 'catalogo' && catalogo.length === 0 && (
            <div style={S.empty}><Car size={32} color="var(--gray-dark)" /><p>No hay leads disponibles ahora mismo.</p></div>
          )}

          {vista === 'mis' && misLeads.map((l) => {
            const c = CALOR[l.calor] || CALOR.medio;
            const sinContactar = l.gestion === 'sin_contactar';
            return (
              <div key={l.id} className="lead-card" style={{ ...S.card, borderColor: 'var(--red-bd)' }}>
                <div style={S.rowB}>
                  <span style={S.owned}><Unlock size={11} /> DESBLOQUEADO</span>
                  {sinContactar
                    ? <span style={S.estadoTag}>Sin contactar · {config.expiracion_sin_contactar_horas}h</span>
                    : <span style={{ ...S.estadoTag, color: 'var(--green)', borderColor: 'var(--green-bd)' }}>En gestión</span>}
                </div>
                <div style={S.veh}><Car size={18} color="var(--red)" /> {l.vehiculo}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={S.meta}><Wallet size={13} color="var(--gray-mid)" /> {euros(l.presupuesto)}</span>
                  <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {l.ciudad}</span>
                </div>
                <div style={S.contact}>
                  <div style={S.crow}><User size={14} color="var(--red)" /> {l.nombre}</div>
                  <div style={S.crow}><Phone size={14} color="var(--red)" /> {l.telefono}</div>
                  <div style={S.crow}><Mail size={14} color="var(--red)" /> {l.email}</div>
                  {l.nota && <div style={S.nota}>{l.nota}</div>}
                </div>
                {sinContactar ? (
                  <button className="btn-ghost" onClick={() => contactado(l.id)} style={{ borderColor: 'var(--red)', color: 'var(--text)' }}>
                    <Phone size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Marcar como contactado
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => ganado(l.id)} style={{ ...S.est, ...S.win }}><Trophy size={13} /> Ganado</button>
                    <button onClick={() => setDescartando(l)} style={{ ...S.est, ...S.lose }}><XCircle size={13} /> Descartar</button>
                  </div>
                )}
              </div>
            );
          })}

          {vista === 'mis' && misLeads.length === 0 && (
            <div style={S.empty}><Lock size={32} color="var(--gray-dark)" /><p>Aún no has reservado ningún cliente.<br /><span style={{ color: 'var(--gray-mid)' }}>Reserva uno en el catálogo.</span></p></div>
          )}
        </div>

        {/* CONFIG */}
        <div style={S.config}>
          Reglas: <span style={S.pill}>Slots {config.slots_max}</span>
          <span style={S.pill}>Cooldown {config.cooldown_horas}h</span>
          <span style={S.pill}>Expira sin contactar {config.expiracion_sin_contactar_horas}h</span>
        </div>
      </div>

      {/* MODAL MOTIVOS */}
      {descartando && (
        <div style={S.overlay} onClick={() => setDescartando(null)}>
          <div className="caja" style={{ maxWidth: 420, width: '100%', borderColor: 'var(--red-bd)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontWeight: 700 }}>
              ¿Por qué sueltas este lead?
              <button onClick={() => setDescartando(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--gray-mid)', margin: '5px 0 16px' }}>{descartando.vehiculo} · {descartando.nombre}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {motivos.map((m) => (
                <button key={m.id} onClick={() => confirmarDescarte(m.id)} style={S.motivo}>
                  <span>{m.label}</span>
                  <span style={{ ...S.dest, ...(m.destino === 'bolsa' ? S.destBolsa : S.destCerrado) }}>
                    {m.destino === 'bolsa' ? <><RotateCcw size={11} /> Bolsa</> : <><XCircle size={11} /> Cierra</>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}
        .lead-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .lead-card:hover{transform:translateY(-3px);border-color:var(--red-bd)!important;box-shadow:var(--caja-shadow-hover)}`}</style>
    </div>
  );
}

function Stat({ icon, val, lab, hot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: `1px solid ${hot ? 'var(--red-bd)' : 'var(--border)'}`, borderRadius: 11, padding: '7px 12px' }}>
      <span style={{ color: 'var(--red)', display: 'grid', placeItems: 'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 9.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 2 }}>{lab}</div>
      </div>
    </div>
  );
}
function Tab({ activo, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 13.5, fontWeight: 700, cursor: 'pointer', borderRadius: 9, padding: '9px 15px',
      display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
      color: activo ? '#fff' : 'var(--gray-mid)',
      background: activo ? 'var(--red)' : 'transparent',
      border: activo ? '1px solid var(--red)' : '1px solid var(--border)',
    }}>{children}</button>
  );
}
function Badge({ children }) {
  return <span style={{ background: 'rgba(0,0,0,.22)', borderRadius: 20, padding: '1px 8px', fontSize: 11.5 }}>{children}</span>;
}

const S = {
  logo: { width: 44, height: 44, borderRadius: 10, background: 'var(--de-line)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, color: '#000', boxShadow: '0 4px 16px rgba(221,0,0,.3), inset 0 1px 0 rgba(255,255,255,.3)', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingBottom: 14 },
  scarcity: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--text-soft)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginTop: 14, flexWrap: 'wrap' },
  cooldownPill: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--red-bg)', color: 'var(--red-soft)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 700 },
  adminTag: { display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', color: 'var(--amber)', border: '1px solid rgba(201,162,60,.35)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 16, marginTop: 6 },
  card: { background: 'var(--caja-grad)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: 'var(--caja-shadow)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  calor: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: .5 },
  time: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-mid)' },
  veh: { fontSize: 17.5, fontWeight: 700, letterSpacing: -.3, display: 'flex', alignItems: 'center', gap: 9 },
  meta: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-soft)', fontWeight: 500 },
  locked: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--gray-mid)', background: 'rgba(128,128,128,.06)', border: '1px dashed var(--border)', borderRadius: 8, padding: '7px 10px' },
  rowB: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  owned: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: .5, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '3px 10px' },
  estadoTag: { fontSize: 10.5, fontWeight: 600, color: 'var(--amber)', border: '1px solid rgba(201,162,60,.35)', borderRadius: 20, padding: '3px 9px' },
  contact: { display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 10, padding: 13 },
  crow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 500 },
  nota: { fontSize: 12, color: 'var(--text-soft)', borderTop: '1px solid var(--border)', paddingTop: 9, marginTop: 2, lineHeight: 1.5 },
  est: { flex: 1, fontSize: 12.5, fontWeight: 700, borderRadius: 8, padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  win: { color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-bd)' },
  lose: { color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)' },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '56px 20px', color: 'var(--gray-mid)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, lineHeight: 1.6 },
  config: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--gray-mid)', marginTop: 26, paddingTop: 16, borderTop: '1px solid var(--border)' },
  pill: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', color: 'var(--text-soft)', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 50 },
  motivo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 13px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'left', fontFamily: 'inherit' },
  dest: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap' },
  destBolsa: { color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-bd)' },
  destCerrado: { color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)' },
};
