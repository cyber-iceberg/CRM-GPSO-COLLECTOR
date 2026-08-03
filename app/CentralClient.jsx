'use client';

// =====================================================================
//  GPSO COLLECTOR · Central de Leads (cliente)  ·  app/CentralClient.jsx
//  v2 — AURA. Cristal esmerilado, logo real, look cinematografico.
//  Logica intacta: rpc('reservar_lead') atomica + gestion por rpc.
// =====================================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import MenuDrawer from '../components/MenuDrawer';
import {
  Car, MapPin, Wallet, Lock, Unlock, Clock, Phone, Mail, User,
  Trophy, Timer, Users, TrendingUp, X, RotateCcw, XCircle,
  LogOut, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Circle
} from 'lucide-react';

const CALOR = {
  alto:  { label: 'CALIENTE', color: 'var(--red-soft)', dot: '#e8443b' },
  medio: { label: 'TEMPLADO', color: 'var(--gold)',     dot: '#E8A33D' },
  bajo:  { label: 'FRÍO',     color: '#6fa8dc',          dot: '#6fa8dc' },
};

const LOGO = '/collector.jpg'; // sube tu logo a public/collector.jpg

function euros(n) { return n == null ? '—' : n.toLocaleString('es-ES') + ' €'; }
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

  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 3200); return () => clearTimeout(t); }, [flash]);

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

  useEffect(() => { const t = setInterval(cargarDatos, 30000); return () => clearInterval(t); }, [cargarDatos]);

  function aviso(t, m) { setFlash({ t, m }); }

  async function reservar(id) {
    if (slotsLibres <= 0) { aviso('warn', `Slots llenos (${config.slots_max}). Cierra un cliente para liberar uno.`); return; }
    if (enCooldown) { aviso('warn', 'En cooldown. Espera para coger otro — así todos tienen turno.'); return; }
    setOcupadoId(id);
    const { data, error } = await supabase.rpc('reservar_lead', { p_lead_id: id });
    setOcupadoId(null);
    if (error) { aviso('warn', 'Error de conexión. Reintenta.'); return; }
    if (!data?.ok) {
      const m = { slots_llenos: `Slots llenos (${config.slots_max}).`, cooldown: 'Aún en cooldown.',
        ya_reservado: 'Otro alumno lo ha cogido primero.', no_activo: 'Tu cuenta aún no está activada.',
        no_auth: 'Sesión caducada, vuelve a entrar.' }[data?.error] || 'No se pudo reservar.';
      if (data?.error === 'cooldown' && data.segundos_restantes) setCooldownHasta(Date.now() + data.segundos_restantes * 1000);
      aviso('warn', m); await cargarDatos(); return;
    }
    setCooldownHasta(Date.now() + config.cooldown_horas * 3600 * 1000);
    aviso('ok', '¡Reservado! Datos desbloqueados en Mis clientes.');
    await cargarDatos(); setVista('mis');
  }
  async function contactado(id) { const { data } = await supabase.rpc('marcar_contactado', { p_lead_id: id }); if (data?.ok) { aviso('ok', 'Marcado como contactado.'); await cargarDatos(); } }
  async function ganado(id) { const { data } = await supabase.rpc('marcar_ganado', { p_lead_id: id }); if (data?.ok) { aviso('ok', '¡Venta cerrada! Suma a tu reputación.'); await cargarDatos(); } }
  async function confirmarDescarte(motivoId) {
    const lead = descartando; setDescartando(null);
    const { data } = await supabase.rpc('descartar_lead', { p_lead_id: lead.id, p_motivo: motivoId });
    if (data?.ok) { aviso(data.destino === 'bolsa' ? 'ok' : 'warn', data.destino === 'bolsa' ? 'Liberado: vuelve a la bolsa.' : 'Cerrado: no vuelve al catálogo.'); await cargarDatos(); }
  }
  async function salir() { await supabase.auth.signOut(); router.push('/login'); router.refresh(); }

  const totalCerrados = (perfil?.leads_ganados || 0) + (perfil?.leads_perdidos || 0) + (perfil?.leads_expirados || 0);
  const reputacion = totalCerrados > 0 ? Math.round((perfil.leads_ganados / totalCerrados) * 100) : null;

  // ---- Cuenta pendiente ----
  if (!activo) {
    return (
      <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
        <div className="glass" style={{ maxWidth: 420, textAlign: 'center', padding: 34 }}>
          <div className="hero-logo" style={{ width: 96, height: 96 }}><img src={LOGO} alt="Collector" /></div>
          <h1 className="display" style={{ fontSize: 24, margin: '16px 0 6px' }}>Cuenta pendiente</h1>
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
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '26px 22px 50px' }}>

        {/* HEADER */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="brand-tile"><img src={LOGO} alt="GPSO Collector" /></div>
            <div>
              <div className="marca" style={{ fontSize: 23 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
              <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 3 }}>Central de Leads</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stat icon={<Circle size={12} />} val={`${misLeads.length} / ${config.slots_max}`} lab="Slots" hot={slotsLibres <= 0} />
            <Stat icon={<Trophy size={13} />} val={perfil?.leads_ganados || 0} lab="Cerrados" />
            <Stat icon={<TrendingUp size={13} />} val={reputacion == null ? '—' : `${reputacion}%`} lab="Reputación" />
            <MenuDrawer perfil={perfil} email={user.email} />
          </div>
        </div>

        {/* ESCASEZ */}
        <div className="glass" style={S.scarcity}>
          <Users size={15} color="var(--red-soft)" />
          <span style={{ color: 'var(--text-soft)' }}><b style={{ color: 'var(--text)', fontWeight: 700 }}>{totalCat} leads</b> disponibles ahora · el primero que reserva se lo lleva</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {enCooldown && <span style={S.cooldownPill}><Timer size={12} /> {restante(cooldownHasta)}</span>}
            <button onClick={cargarDatos} className="btn-ghost" style={{ padding: '7px 10px' }} title="Refrescar">
              <RefreshCw size={14} style={{ verticalAlign: -2, animation: refrescando ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 10, margin: '20px 0 16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="seg">
            <button className={`seg-btn ${vista === 'catalogo' ? 'active' : ''}`} onClick={() => setVista('catalogo')}>Catálogo <span className="mini">{totalCat}</span></button>
            <button className={`seg-btn ${vista === 'mis' ? 'active' : ''}`} onClick={() => setVista('mis')}>Mis clientes <span className="mini">{misLeads.length}</span></button>
          </div>
          {esAdmin && <span style={S.adminTag}><Sparkles size={12} /> Admin</span>}
        </div>

        {flash && (
          <div className={`aviso ${flash.t === 'ok' ? 'ok' : 'error'}`} style={{ marginBottom: 10 }}>
            {flash.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {flash.m}
          </div>
        )}

        {/* GRID */}
        <div style={S.grid}>
          {vista === 'catalogo' && catalogo.map((l) => {
            const c = CALOR[l.calor] || CALOR.medio;
            const off = slotsLibres <= 0 || enCooldown || ocupadoId === l.id;
            return (
              <div key={l.id} className="lead-card">
                <div style={S.cardTop}>
                  <span style={{ ...S.calor, color: c.color }}><Circle size={7} fill={c.dot} color={c.dot} /> {c.label}</span>
                  <span style={S.time}><Clock size={11} /> {desde(l.created_at)}</span>
                </div>
                <div className="display" style={S.veh}><Car size={18} color="var(--red-soft)" /> {l.vehiculo}</div>
                <div style={{ display: 'flex', gap: 18 }}>
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
            <div style={S.empty}><Car size={34} color="var(--gray-dark)" /><p>No hay leads disponibles ahora mismo.</p></div>
          )}

          {vista === 'mis' && misLeads.map((l) => {
            const sinContactar = l.gestion === 'sin_contactar';
            const c = CALOR[l.calor] || CALOR.medio;
            return (
              <div key={l.id} className="lead-card">
                <div style={S.rowB}>
                  <span style={S.owned}><Unlock size={11} /> DESBLOQUEADO</span>
                  {sinContactar
                    ? <span style={S.estadoTag}>Sin contactar · {config.expiracion_sin_contactar_horas}h</span>
                    : <span style={{ ...S.estadoTag, color: 'var(--green)', borderColor: 'var(--green-bd)' }}>En gestión</span>}
                </div>
                <div className="display" style={S.veh}><Car size={18} color="var(--red-soft)" /> {l.vehiculo}</div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <span style={S.meta}><Wallet size={13} color="var(--gray-mid)" /> {euros(l.presupuesto)}</span>
                  <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {l.ciudad}</span>
                </div>
                <div className="contacto">
                  <div style={S.crow}><User size={14} color="var(--red-soft)" /> {l.nombre}</div>
                  <div style={S.crow}><Phone size={14} color="var(--red-soft)" /> {l.telefono}</div>
                  <div style={S.crow}><Mail size={14} color="var(--red-soft)" /> {l.email}</div>
                  {l.nota && <div style={S.nota}>{l.nota}</div>}
                </div>
                {sinContactar ? (
                  <button className="btn-ghost" onClick={() => contactado(l.id)} style={{ borderColor: 'var(--red-bd)', color: 'var(--text)' }}>
                    <Phone size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Marcar como contactado
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="est win" onClick={() => ganado(l.id)}><Trophy size={13} /> Ganado</button>
                    <button className="est lose" onClick={() => setDescartando(l)}><XCircle size={13} /> Descartar</button>
                  </div>
                )}
              </div>
            );
          })}
          {vista === 'mis' && misLeads.length === 0 && (
            <div style={S.empty}><Lock size={34} color="var(--gray-dark)" /><p>Aún no has reservado ningún cliente.<br /><span style={{ color: 'var(--gray-mid)' }}>Reserva uno en el catálogo.</span></p></div>
          )}
        </div>

        {/* REGLAS */}
        <div style={S.rules}>
          <span style={{ color: 'var(--gray-mid)' }}>Reglas:</span>
          <span className="rule-pill">Slots {config.slots_max}</span>
          <span className="rule-pill">Cooldown {config.cooldown_horas}h</span>
          <span className="rule-pill">Expira sin contactar {config.expiracion_sin_contactar_horas}h</span>
        </div>
      </div>

      {/* MODAL */}
      {descartando && (
        <div className="overlay" onClick={() => setDescartando(null)}>
          <div className="glass" style={{ maxWidth: 420, width: '100%', padding: 22, borderColor: 'var(--red-bd)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="display" style={{ fontSize: 17 }}>¿Por qué sueltas este lead?</span>
              <button onClick={() => setDescartando(null)} style={{ background: 'none', border: 'none', color: 'var(--gray-mid)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--gray-mid)', margin: '6px 0 16px' }}>{descartando.vehiculo} · {descartando.nombre}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {motivos.map((m) => (
                <button key={m.id} className="motivo" onClick={() => confirmarDescarte(m.id)}>
                  <span>{m.label}</span>
                  <span className={`dest ${m.destino}`}>{m.destino === 'bolsa' ? <><RotateCcw size={11} /> Bolsa</> : <><XCircle size={11} /> Cierra</>}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, val, lab, hot }) {
  return (
    <div className={`stat-pill ${hot ? 'hot' : ''}`}>
      <span style={{ color: 'var(--red-soft)', display: 'grid', placeItems: 'center' }}>{icon}</span>
      <div>
        <div className="display" style={{ fontSize: 15, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 9.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, marginTop: 2 }}>{lab}</div>
      </div>
    </div>
  );
}

const S = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  scarcity: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '12px 16px', flexWrap: 'wrap' },
  cooldownPill: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--red-bg)', color: 'var(--red-soft)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '4px 11px', fontSize: 11.5, fontWeight: 700 },
  adminTag: { display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', color: 'var(--gold)', border: '1px solid rgba(232,163,61,.35)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 18, marginTop: 6 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  calor: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: .5 },
  time: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-mid)' },
  veh: { fontSize: 19, display: 'flex', alignItems: 'center', gap: 9 },
  meta: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-soft)', fontWeight: 500 },
  locked: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--gray-mid)', background: 'rgba(128,128,128,.06)', border: '1px dashed var(--card-bd)', borderRadius: 9, padding: '8px 11px' },
  rowB: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  owned: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: .5, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '3px 10px' },
  estadoTag: { fontSize: 10.5, fontWeight: 600, color: 'var(--gold)', border: '1px solid rgba(232,163,61,.35)', borderRadius: 20, padding: '3px 9px' },
  crow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 500 },
  nota: { fontSize: 12, color: 'var(--text-soft)', borderTop: '1px solid var(--card-bd)', paddingTop: 9, marginTop: 2, lineHeight: 1.5 },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--gray-mid)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, lineHeight: 1.6 },
  rules: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, marginTop: 30, paddingTop: 18, borderTop: '1px solid var(--card-bd)' },
};

