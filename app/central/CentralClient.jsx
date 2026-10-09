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
import BottomNav from '../components/BottomNav';
import GuiaTour, { BotonGuia, useGuia } from '../components/GuiaTour';
import {
  Car, MapPin, Wallet, Lock, Unlock, Clock, Phone, Mail, User,
  Trophy, Timer, Users, TrendingUp, X, RotateCcw, XCircle,
  LogOut, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Circle, ArrowLeft, Trash2, Calendar, Gauge,
  Banknote, Landmark, Zap, Gem, Filter, Flame, Handshake
} from 'lucide-react';

const CALOR = {
  alto:  { label: 'CALIENTE', color: 'var(--red-soft)', dot: '#e8443b' },
  medio: { label: 'TEMPLADO', color: 'var(--gold)',     dot: '#E8A33D' },
  bajo:  { label: 'FRÍO',     color: '#6fa8dc',          dot: '#6fa8dc' },
};

// Estados del pipeline de gestión (lead reservado)
// seg:true = "en seguimiento" (NO ocupa slot, tope propio config.seguimiento_max)
const SEG_ESTADOS = ['caliente', 'negociando'];
const GEST = {
  sin_contactar: { label: 'Sin contactar', color: 'var(--red-soft)', bd: 'var(--red-bd)',          bg: 'var(--red-bg)',            seg: false },
  contactado:    { label: 'Contactado',    color: 'var(--gold)',     bd: 'rgba(232,163,61,.35)',   bg: 'rgba(232,163,61,.10)',     seg: false },
  caliente:      { label: 'Caliente',      color: '#ff7a3d',         bd: 'rgba(255,122,61,.45)',   bg: 'rgba(255,122,61,.12)',     seg: true  },
  negociando:    { label: 'En negociación',color: '#E8A33D',         bd: 'rgba(232,163,61,.5)',    bg: 'rgba(232,163,61,.12)',     seg: true  },
};
// botones del pipeline en orden (sin_contactar es el punto de partida implícito)
const PIPELINE = [
  { k: 'contactado', label: 'Contactado', icon: Phone },
  { k: 'caliente',   label: 'Caliente',   icon: Flame },
  { k: 'negociando', label: 'Negociación', icon: Handshake },
];

const LOGO = '/collector.jpg'; // sube tu logo a public/collector.jpg

function euros(n) { return n == null ? '—' : n.toLocaleString('es-ES') + ' €'; }

// limpia el texto de presupuesto del super form:
// "15.000 eur-Hasta 20.000 eur" -> "15.000 € – 20.000 €"
// "Hasta 25.000 eur" -> "Hasta 25.000 €" ; "25.000€" -> "25.000 €"
function limpiaPresupuesto(txt) {
  if (!txt) return null;
  let s = String(txt);
  // eur / EUR / euros -> €
  s = s.replace(/\s*eur(os)?\b/gi, ' €');
  // separadores tipo "X-Hasta Y" o "X - Y" -> "X – Y"
  s = s.replace(/\s*-\s*hasta\s*/gi, ' – ');
  s = s.replace(/\s*-\s*/g, ' – ');
  // quitar la palabra "Hasta" si quedó suelta al inicio de la segunda parte
  s = s.replace(/–\s*hasta\s*/gi, '– ');
  // espacios y € duplicados
  s = s.replace(/\s*€\s*/g, ' € ').replace(/\s+/g, ' ').replace(/€\s*€/g, '€').trim();
  return s;
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

// ---- Clasificadores para los filtros del catálogo ----
// Leen el JSONB `detalles` (texto libre de los dos formularios) de forma tolerante.
function _det(l) { return l && l.detalles && typeof l.detalles === 'object' ? l.detalles : {}; }
function _junta(l, ...frag) {
  let s = '';
  for (const [k, v] of Object.entries(_det(l))) {
    const kk = k.toLowerCase();
    if (frag.some((f) => kk.includes(f))) s += ' ' + String(v).toLowerCase();
  }
  return s;
}
// mayor número (3-6 dígitos) que aparezca en el texto de presupuesto/precio
function numMax(txt) {
  if (!txt) return null;
  const nums = String(txt).replace(/[.\s]/g, '').match(/\d{3,6}/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));
}
function presuMax(l) {
  let best = null;
  for (const [k, v] of Object.entries(_det(l))) {
    if (/presupuesto|budget|precio/i.test(k)) {
      const n = numMax(v);
      if (n != null) best = Math.max(best == null ? 0 : best, n);
    }
  }
  if (best == null && l.presupuesto) best = Number(l.presupuesto);
  return best;
}
function esContado(l) {
  const s = _junta(l, 'pago', 'financ', 'contado', 'dinero');
  return /contado|efectivo|al contado|sin financ/.test(s);
}
function esFinanciado(l) {
  const s = _junta(l, 'pago', 'financ', 'contado', 'dinero');
  return /financ/.test(s) && !/sin financ|no financ/.test(s) && !/contado|efectivo/.test(s);
}
function esUrgente(l) {
  const s = _junta(l, 'plazo', 'urg', 'cuando', 'cuándo', 'tiempo', 'prisa', 'momento');
  return /lo antes|antes posible|cuanto antes|cuánto antes|inmediat|urg|\bya\b|de 1-3|1-3 mes|menos de 1|al momento/.test(s);
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
  const [ganados, setGanados] = useState([]);
  const [verGanados, setVerGanados] = useState(false);
  const [abiertos, setAbiertos] = useState({});
  const toggleAbierto = (id) => setAbiertos(prev => ({ ...prev, [id]: !prev[id] }));
  const [filtro, setFiltro] = useState('todos');
  const guia = useGuia('central-v1');

  const activo = perfil && perfil.activo;
  const esAdmin = perfil && perfil.rol === 'admin';
  const frescos = misLeads.filter((l) => !SEG_ESTADOS.includes(l.gestion));
  const seguim  = misLeads.filter((l) =>  SEG_ESTADOS.includes(l.gestion));
  const slotsLibres = config.slots_max - frescos.length;
  const seguimMax = config.seguimiento_max || 15;
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

  useEffect(() => {
    const t = setInterval(() => {
      // solo refresca si la pestaña está visible (ahorra carga en la base de datos)
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        cargarDatos();
      }
    }, 180000);
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
  async function avanzar(id, gestion) {
    const { data, error } = await supabase.rpc('avanzar_lead', { p_lead_id: id, p_gestion: gestion });
    if (error || !data?.ok) {
      const m = data?.error === 'seguimiento_lleno'
        ? `En seguimiento lleno (${data.max}). Cierra o descarta alguno antes de mover más a seguimiento.`
        : 'No se pudo actualizar el estado. Reintenta.';
      aviso('warn', m); return;
    }
    const txt = {
      contactado: 'Marcado como contactado.',
      caliente:   '🔥 Lead caliente — ya no ocupa slot, puedes coger otro.',
      negociando: 'En negociación — ya no ocupa slot, puedes coger otro.',
    }[gestion] || 'Estado actualizado.';
    aviso('ok', txt); await cargarDatos();
  }
  async function ganado(id) {
    const { data, error } = await supabase.rpc('marcar_ganado', { p_lead_id: id });
    if (error || !data?.ok) { aviso('warn', 'No se pudo cerrar la venta. Vuelve a intentarlo.'); return; }
    aviso('ok', '¡Venta cerrada! Suma a tu reputación.'); await cargarDatos(); await cargarGanados();
  }
  async function deshacerGanado(id) {
    if (!window.confirm('¿Deshacer este ganado? El lead volverá a "Mis clientes".')) return;
    const { data, error } = await supabase.rpc('deshacer_ganado', { p_lead_id: id });
    if (error || !data?.ok) { aviso('warn', 'No se pudo deshacer. Vuelve a intentarlo.'); return; }
    aviso('ok', 'Ganado deshecho: el lead vuelve a tus clientes.'); await cargarDatos(); await cargarGanados();
  }
  async function cargarGanados() {
    const { data } = await supabase.from('v_mis_ganados').select('*').eq('alumno_id', user.id).order('cerrado_en', { ascending: false });
    setGanados(data || []);
  }
  async function confirmarDescarte(motivoId) {
    const lead = descartando; setDescartando(null);
    const { data, error } = await supabase.rpc('descartar_lead', { p_lead_id: lead.id, p_motivo: motivoId });
    if (error || !data?.ok) {
      aviso('warn', 'No se pudo soltar el lead (' + (data?.error || 'error de conexión') + '). Vuelve a intentarlo o avisa al admin.');
      await cargarDatos();
      return;
    }
    aviso(data.destino === 'bolsa' ? 'ok' : 'warn', data.destino === 'bolsa' ? 'Liberado: vuelve a la bolsa.' : 'Cerrado: no vuelve al catálogo.');
    await cargarDatos();
  }
  async function salir() { await supabase.auth.signOut(); router.push('/login'); router.refresh(); }

  async function borrarLead(lead) {
    const nombre = lead.nombre || lead.vehiculo || 'este lead';
    if (!window.confirm(`¿Borrar ${nombre} definitivamente?\n\nEsta acción NO se puede deshacer.`)) return;
    const { data, error } = await supabase.rpc('admin_borrar_lead', { p_lead_id: lead.id });
    if (error) { aviso('warn', 'Error de conexión.'); return; }
    if (!data?.ok) { aviso('warn', data?.error === 'no_admin' ? 'Solo un admin puede borrar.' : 'No se pudo borrar.'); return; }
    aviso('ok', 'Lead borrado.'); await cargarDatos();
  }

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

  // ---- Filtros del catálogo (cliente) ----
  const FILTROS = [
    { k: 'todos',     lab: 'Todos',         icon: Filter,   test: null },
    { k: 'contado',   lab: 'Al contado',    icon: Banknote, test: esContado },
    { k: 'financiado',lab: 'Financiado',    icon: Landmark, test: esFinanciado },
    { k: 'premium30', lab: '+30.000 €',     icon: Gem,      test: (l) => (presuMax(l) || 0) >= 30000 },
    { k: 'urgente',   lab: 'Lo quieren ya', icon: Zap,      test: esUrgente },
  ];
  const conteo = Object.fromEntries(FILTROS.map(f => [f.k, f.test ? catalogo.filter(f.test).length : catalogo.length]));
  const testActivo = (FILTROS.find(f => f.k === filtro) || FILTROS[0]).test;
  const catalogoFiltrado = testActivo ? catalogo.filter(testActivo) : catalogo;

  // ---- Pasos del tutorial interactivo (Central) ----
  const pasosGuia = [
    { seccion: 'Central', titulo: '¡Bienvenido a tu Central!',
      texto: 'Aquí llegan en tiempo real personas que quieren comprar o importar un coche. Te enseño en 30 segundos dónde está cada cosa y cómo sacarle partido. Usa <b>Siguiente</b> o las flechas del teclado.' },
    { sel: '[data-tour="stats"]', seccion: 'Tu estado', titulo: 'Slots, seguimiento y reputación',
      texto: '<b>Slots</b>: cuántos clientes <i>nuevos</i> puedes tener a la vez. <b>Seguim.</b>: los que ya estás trabajando — <b>no ocupan slot</b>. <b>Cerrados</b> y <b>Reputación</b>: tus ventas y tu % de cierre.' },
    { sel: '[data-tour="escasez"]', seccion: 'En vivo', titulo: 'Leads disponibles ahora',
      texto: 'Esto se actualiza solo. <b>El primero que reserva un lead se lo lleva</b>, así que entra cada día: los buenos vuelan en minutos.', antes: () => setVista('catalogo') },
    { sel: '[data-tour="filtros"]', seccion: 'Catálogo', titulo: 'Filtra lo que buscas',
      texto: 'Clasifica el catálogo al instante: <b>al contado</b>, <b>financiado</b>, <b>+30.000 €</b> o los que lo quieren <b>ya</b>. Cada filtro te dice cuántos hay.' },
    { sel: '[data-tour="lead"]', seccion: 'Catálogo', titulo: 'Cada tarjeta es un cliente',
      texto: 'Ves coche, presupuesto, zona y lo que pidió. Las tarjetas <b style="color:var(--gold)">doradas (Premium)</b> traen mucha más información: son las más fáciles de cerrar. El contacto está oculto hasta que reservas.' },
    { sel: '[data-tour="reservar"]', seccion: 'Catálogo', titulo: 'Reservar un cliente',
      texto: 'Al reservar, el lead es <b style="color:var(--gold)">tuyo</b>: se desbloquean su teléfono y email y ocupa un slot. Después hay un pequeño <b>cooldown</b> para que a todos les toque. Úsalo con cabeza.' },
    { sel: '[data-tour="tabs"]', seccion: 'Mis clientes', titulo: 'Gestiona a los tuyos',
      texto: 'Muévelos por el pipeline: <b>Contactado → Caliente → En negociación</b>. En cuanto marcas <b style="color:#ff7a3d">Caliente</b> o <b>En negociación</b>, el lead pasa a <b>Seguimiento</b> y <b>deja de ocupar slot</b>: sigues hablando con él y puedes coger más. Marca <b>Ganado</b> solo cuando cierres de verdad.', antes: () => setVista('mis') },
    { sel: '[data-tour="ganados"]', seccion: 'Mis clientes', titulo: 'Tus ventas ganadas',
      texto: 'Aquí se guardan tus cierres. Si te equivocaste, puedes <b>deshacer un ganado</b> y vuelve a Mis clientes.' },
    { seccion: 'Listo', titulo: 'Ya lo tienes',
      texto: 'Eso es todo. Recuerda: <b>entra cada día</b>, reserva con cabeza y trabaja bien cada cliente. Puedes volver a ver este tutorial cuando quieras con el botón <b style="color:var(--gold)">¿Cómo funciona?</b>', antes: () => setVista('catalogo') },
  ];

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '26px 22px 50px' }}>

        {/* HEADER */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '10px 12px' }} title="Volver al inicio"><ArrowLeft size={16} /></button>
            <div className="brand-tile"><img src={LOGO} alt="GPSO Collector" /></div>
            <div>
              <div className="marca" style={{ fontSize: 23 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
              <div style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 3 }}>Central de Leads</div>
            </div>
          </div>
          <div data-tour="stats" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stat icon={<Circle size={12} />} val={`${frescos.length} / ${config.slots_max}`} lab="Slots" hot={slotsLibres <= 0} />
            <Stat icon={<Flame size={13} />} val={`${seguim.length} / ${seguimMax}`} lab="Seguim." />
            <Stat icon={<Trophy size={13} />} val={perfil?.leads_ganados || 0} lab="Cerrados" />
            <Stat icon={<TrendingUp size={13} />} val={reputacion == null ? '—' : `${reputacion}%`} lab="Reputación" />
            <MenuDrawer perfil={perfil} email={user.email} />
          </div>
        </div>

        {/* ESCASEZ */}
        <div data-tour="escasez" className="glass" style={S.scarcity}>
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
          <div className="seg" data-tour="tabs">
            <button className={`seg-btn ${vista === 'catalogo' ? 'active' : ''}`} onClick={() => setVista('catalogo')}>Catálogo <span className="mini">{totalCat}</span></button>
            <button className={`seg-btn ${vista === 'mis' ? 'active' : ''}`} onClick={() => setVista('mis')}>Mis clientes <span className="mini">{misLeads.length}</span></button>
          </div>
          <BotonGuia onClick={guia.abrir} />
          {esAdmin && <span style={S.adminTag}><Sparkles size={12} /> Admin</span>}
        </div>

        {/* FILTROS (solo catálogo) */}
        {vista === 'catalogo' && (
          <div data-tour="filtros" style={S.filtros}>
            {FILTROS.map(({ k, lab, icon: Ic }) => {
              const on = filtro === k;
              return (
                <button
                  key={k}
                  onClick={() => setFiltro(k)}
                  style={{ ...S.fChip, ...(on ? S.fChipOn : {}) }}
                >
                  <Ic size={13} style={{ color: on ? 'var(--gold)' : 'var(--gray-mid)' }} />
                  {lab}
                  <span style={{ ...S.fChipN, ...(on ? S.fChipNOn : {}) }}>{conteo[k]}</span>
                </button>
              );
            })}
          </div>
        )}

        {flash && (
          <div className={`aviso-flotante ${flash.t === 'ok' ? 'ok' : 'error'}`}>
            {flash.t === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {flash.m}
          </div>
        )}

        {/* GRID */}
        <div style={S.grid}>
          {vista === 'catalogo' && catalogoFiltrado.map((l) => {
            const c = CALOR[l.calor] || CALOR.medio;
            const off = slotsLibres <= 0 || enCooldown || ocupadoId === l.id;
            const det = l.detalles && typeof l.detalles === 'object' ? l.detalles : {};
            const buscaDet = (...frag) => {
              for (const [k, v] of Object.entries(det)) {
                const kk = k.toLowerCase();
                if (frag.some((f) => kk.includes(f))) return String(v);
              }
              return null;
            };
            const esPremium = det.__premium === true;
            const motor = buscaDet('motorización', 'motorizacion', 'versión', 'version');
            const anio = buscaDet('año desde', 'anio desde', 'ano desde') || buscaDet('año', 'anio');
            const kmMax = buscaDet('km máximos', 'km maximos', 'kilómetros máximos', 'kilometros maximos');
            const plazo = buscaDet('plazo', 'urgencia', 'cuando', 'tiempo');
            const pago = buscaDet('forma de pago', 'pago', 'financ', 'contado', 'dinero');
            const presuTxt = limpiaPresupuesto(buscaDet('presupuesto', 'budget')) || (l.presupuesto ? euros(l.presupuesto) : 'Consultar');
            return (
              <div key={l.id} data-tour="lead" className={`lead-card ${esPremium ? 'premium' : ''}`}>
                <div style={S.cardTop}>
                  <span style={{ ...S.calor, color: c.color }}><Circle size={7} fill={c.dot} color={c.dot} /> {c.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    {esPremium && <span style={S.premiumTag}><Sparkles size={10} /> PREMIUM</span>}
                    <span style={S.time}><Clock size={11} /> {desde(l.created_at)}</span>
                    {esAdmin && <button onClick={(e) => { e.stopPropagation(); borrarLead(l); }} title="Borrar lead" style={S.trashBtn}><Trash2 size={13} /></button>}
                  </span>
                </div>
                <div className="display" style={S.veh}><Car size={18} color={esPremium ? 'var(--gold)' : 'var(--red-soft)'} /> {l.vehiculo}{motor ? <span style={S.motor}> · {motor}</span> : null}</div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <span style={S.meta}><Wallet size={13} color="var(--gray-mid)" /> {presuTxt}</span>
                  <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {l.ciudad || 'España'}</span>
                </div>
                {(anio || kmMax) && (
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    {anio && <span style={S.meta}><Calendar size={13} color="var(--gray-mid)" /> {anio}</span>}
                    {kmMax && <span style={S.meta}><Gauge size={13} color="var(--gray-mid)" /> hasta {kmMax}</span>}
                  </div>
                )}
                {(plazo || pago) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {plazo && <span style={S.chipMini}><Clock size={11} /> {plazo}</span>}
                    {pago && <span style={S.chipMini}><Wallet size={11} /> {pago}</span>}
                  </div>
                )}
                <div className="card-foot">
                  <div style={S.locked}><Lock size={12} /> Contacto oculto hasta reservar</div>
                  <button data-tour="reservar" className={`btn-de ${off ? 'off' : ''}`} disabled={off} onClick={() => reservar(l.id)} style={{ fontSize: 13.5 }}>
                    <Lock size={14} /> {ocupadoId === l.id ? 'RESERVANDO…' : 'RESERVAR CLIENTE'}
                  </button>
                </div>
              </div>
            );
          })}
          {vista === 'catalogo' && catalogoFiltrado.length === 0 && (
            <div style={S.empty}>
              <Car size={34} color="var(--gray-dark)" />
              <p>{catalogo.length === 0
                ? 'No hay leads disponibles ahora mismo.'
                : 'Ningún lead en este filtro. Prueba otro o pulsa «Todos».'}</p>
            </div>
          )}

          {vista === 'mis' && misLeads.map((l) => {
            const sinContactar = l.gestion === 'sin_contactar';
            const g = GEST[l.gestion] || GEST.sin_contactar;
            const enSeg = SEG_ESTADOS.includes(l.gestion);
            const c = CALOR[l.calor] || CALOR.medio;
            const detM = l.detalles && typeof l.detalles === 'object' ? l.detalles : {};
            const buscaDetM = (...frag) => {
              for (const [k, v] of Object.entries(detM)) {
                if (frag.some((f) => k.toLowerCase().includes(f))) return String(v);
              }
              return null;
            };
            const presuM = limpiaPresupuesto(buscaDetM('presupuesto', 'budget')) || (l.presupuesto ? euros(l.presupuesto) : 'Consultar');
            const motorM = buscaDetM('motorización', 'motorizacion', 'versión', 'version');
            const abierto = !!abiertos[l.id];
            return (
              <div key={l.id} className="lead-card">
                <div style={S.rowB}>
                  <span style={S.owned}><Unlock size={11} /> DESBLOQUEADO</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...S.estadoTag, color: g.color, borderColor: g.bd, background: g.bg }}>
                      {g.label}{sinContactar ? ` · ${config.expiracion_sin_contactar_horas}h` : ''}
                    </span>
                    {enSeg && <span style={S.segTag}><Flame size={10} /> no ocupa slot</span>}
                    {esAdmin && <button onClick={(e) => { e.stopPropagation(); borrarLead(l); }} title="Borrar lead" style={S.trashBtn}><Trash2 size={13} /></button>}
                  </span>
                </div>

                {/* CABECERA CLICABLE (compacta) */}
                <div onClick={() => toggleAbierto(l.id)} style={{ cursor: 'pointer' }}>
                  <div className="display" style={S.veh}><Car size={18} color="var(--red-soft)" /> {l.vehiculo}{motorM ? <span style={S.motor}> · {motorM}</span> : null}</div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 2 }}>
                    <span style={S.meta}><Wallet size={13} color="var(--gray-mid)" /> {presuM}</span>
                    <span style={S.meta}><MapPin size={13} color="var(--gray-mid)" /> {l.ciudad || 'España'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ ...S.crow, fontWeight: 700 }}><User size={14} color="var(--red-soft)" /> {l.nombre || 'Cliente'}</span>
                    <span style={S.desplegar}>{abierto ? 'ocultar ▲' : 'ver ficha ▼'}</span>
                  </div>
                </div>

                {/* CUERPO DESPLEGABLE */}
                {abierto && (<>
                <div className="contacto" style={{ marginTop: 12 }}>
                  <div style={S.crow}><Phone size={14} color="var(--red-soft)" /> {l.telefono || '—'}</div>
                  <div style={S.crow}><Mail size={14} color="var(--red-soft)" /> {l.email || '—'}</div>
                  {l.nota && <div style={S.nota}>{l.nota}</div>}
                </div>
                {l.detalles && Object.keys(l.detalles).length > 0 && (() => {
                  const BASURA = ['object','tags','contact','country','location','workflow','contactid','contact id','customdata','custom data','triggerdata','trigger data','contacttype','contact type','date created','datecreated','contactsource','contact source','attributionsource','attribution source','full name','fullname','first name','last name','id','user','timezone','dnd','source','__premium','premium','landing','captacion','captación','vsl','registro','politica','política','privacidad','consent'];
                  const ORDEN = ['Marca','Modelo','Motorización','Versión','Combustible','Transmisión','Tracción','Carrocería','Año desde','Año hasta','Km mínimos','Km máximos','Precio mínimo','Presupuesto','Color exterior','Tapicería','Forma de pago','Financiación','Plazo','Urgencia','Extras','Información adicional','Comunidad','Provincia','Ciudad','IVA deducible','Motivo'];
                  const limpio = Object.entries(l.detalles).filter(([k, v]) => {
                    const kk = String(k).toLowerCase();
                    const vv = String(v).toLowerCase();
                    if (vv.includes('[object object]') || vv.trim() === '') return false;
                    return !BASURA.some((b) => kk.includes(b));
                  });
                  if (limpio.length === 0) return null;
                  limpio.sort((a, b) => {
                    const ia = ORDEN.indexOf(a[0]); const ib = ORDEN.indexOf(b[0]);
                    const va = ia === -1 ? 999 : ia; const vb = ib === -1 ? 999 : ib;
                    return va - vb;
                  });
                  return (
                    <div style={S.detalles}>
                      <div style={S.detTit}><Sparkles size={12} /> Lo que pidió</div>
                      {limpio.map(([k, v]) => (
                        <div key={k} style={S.detRow}>
                          <span style={S.detK}>{k}</span>
                          <span style={S.detV}>{/presupuesto|precio/i.test(k) ? (limpiaPresupuesto(String(v)) || String(v)) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={S.pipeRow}>
                    {PIPELINE.map(({ k, label, icon: Ic }) => {
                      const on = l.gestion === k;
                      return (
                        <button key={k} onClick={() => avanzar(l.id, k)}
                          style={{ ...S.pipeBtn, ...(on ? { color: GEST[k].color, borderColor: GEST[k].bd, background: GEST[k].bg } : {}) }}
                          title={GEST[k].seg ? 'En seguimiento · no ocupa slot' : 'Ocupa slot'}>
                          <Ic size={13} /> {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="est win" onClick={() => ganado(l.id)}><Trophy size={13} /> Ganado</button>
                    <button className="est lose" onClick={() => setDescartando(l)}><XCircle size={13} /> Descartar</button>
                  </div>
                </div>
                </>)}
              </div>
            );
          })}
          {vista === 'mis' && misLeads.length === 0 && (
            <div style={S.empty}><Lock size={34} color="var(--gray-dark)" /><p>Aún no has reservado ningún cliente.<br /><span style={{ color: 'var(--gray-mid)' }}>Reserva uno en el catálogo.</span></p></div>
          )}

          {vista === 'mis' && (
            <div style={{ gridColumn: '1/-1' }}>
              <button data-tour="ganados" onClick={() => { const nuevo = !verGanados; setVerGanados(nuevo); if (nuevo && ganados.length === 0) cargarGanados(); }} style={S.ganadosToggle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={15} color="var(--green)" /> Mis ganados <span style={S.ganadosCount}>{ganados.length}</span>
                </span>
                <span style={{ color: 'var(--gray-mid)', fontSize: 12 }}>{verGanados ? 'ocultar ▲' : 'ver ▼'}</span>
              </button>
              {verGanados && (
                ganados.length === 0
                  ? <div style={{ ...S.empty, padding: '24px 0' }}><Trophy size={28} color="var(--gray-dark)" /><p style={{ fontSize: 13 }}>Todavía no tienes ventas ganadas.</p></div>
                  : <div style={S.ganadosGrid}>
                      {ganados.map(gl => {
                        const detG = gl.detalles && typeof gl.detalles === 'object' ? gl.detalles : {};
                        const presuG = limpiaPresupuesto(Object.entries(detG).find(([k]) => /presupuesto|budget/i.test(k))?.[1]) || (gl.presupuesto ? euros(gl.presupuesto) : '—');
                        return (
                          <div key={gl.id} style={S.ganadoCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ ...S.owned, color: 'var(--green)', background: 'var(--green-bg)', borderColor: 'var(--green-bd)' }}><Trophy size={11} /> GANADO</span>
                              <span style={S.time}>{gl.cerrado_en ? new Date(gl.cerrado_en).toLocaleDateString('es-ES') : ''}</span>
                            </div>
                            <div className="display" style={{ ...S.veh, fontSize: 16 }}><Car size={16} color="var(--green)" /> {gl.vehiculo}</div>
                            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                              <span style={S.meta}><Wallet size={12} color="var(--gray-mid)" /> {presuG}</span>
                              <span style={S.meta}><MapPin size={12} color="var(--gray-mid)" /> {gl.ciudad || 'España'}</span>
                            </div>
                            <button className="btn-ghost" onClick={() => deshacerGanado(gl.id)} style={{ fontSize: 12, padding: '9px', borderColor: 'var(--card-bd)' }}>
                              <RotateCcw size={12} style={{ verticalAlign: -2, marginRight: 5 }} /> Deshacer ganado
                            </button>
                          </div>
                        );
                      })}
                    </div>
              )}
            </div>
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
            {descartando.gestion && descartando.gestion !== 'sin_contactar' && (
              <div style={{ fontSize: 12, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 10, padding: '9px 12px', marginBottom: 14, lineHeight: 1.4 }}>
                Ya contactaste a este cliente, así que se <b>cerrará</b> (no vuelve a la bolsa para no llamarle de nuevo).
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {motivos.map((m) => {
                const contactado = descartando.gestion !== 'sin_contactar';
                const cierra = contactado || m.destino === 'cerrado';
                return (
                  <button key={m.id} className="motivo" onClick={() => confirmarDescarte(m.id)}>
                    <span>{m.label}</span>
                    <span className={`dest ${cierra ? 'cerrado' : 'bolsa'}`}>{cierra ? <><XCircle size={11} /> Cierra</> : <><RotateCcw size={11} /> Bolsa</>}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <GuiaTour run={guia.run} steps={pasosGuia} onClose={guia.cerrar} />
      <BottomNav perfil={perfil} activa="central" />
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
  filtros: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 18px' },
  fChip: { display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)', background: 'var(--card-glass)', border: '1px solid var(--card-bd)', borderRadius: 30, padding: '8px 14px', cursor: 'pointer', transition: 'all .15s ease' },
  fChipOn: { color: 'var(--text)', borderColor: 'rgba(232,163,61,.55)', background: 'rgba(232,163,61,.10)', boxShadow: '0 0 0 1px rgba(232,163,61,.18)' },
  fChipN: { fontSize: 11, fontWeight: 800, color: 'var(--gray-mid)', background: 'rgba(128,128,128,.14)', borderRadius: 20, padding: '1px 8px', minWidth: 20, textAlign: 'center' },
  fChipNOn: { color: '#231802', background: 'linear-gradient(100deg,var(--gold),#f2c982)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 18, marginTop: 6 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  calor: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: .5 },
  time: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-mid)' },
  veh: { fontSize: 19, display: 'flex', alignItems: 'center', gap: 9 },
  motor: { fontSize: 14, color: 'var(--gray-mid)', fontWeight: 500 },
  premiumTag: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: .8, color: '#231802', background: 'linear-gradient(100deg,var(--gold),#f2c982)', borderRadius: 20, padding: '3px 9px' },
  ganadosToggle: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-glass)', border: '1px solid var(--card-bd)', borderRadius: 12, padding: '13px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 8 },
  ganadosCount: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-bd)', borderRadius: 20, padding: '1px 9px', fontSize: 12, fontWeight: 800 },
  ganadosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12, marginTop: 12 },
  ganadoCard: { display: 'flex', flexDirection: 'column', gap: 9, background: 'linear-gradient(160deg, rgba(70,196,131,.06), var(--card-glass))', border: '1px solid var(--green-bd)', borderRadius: 14, padding: 14 },
  desplegar: { fontSize: 11.5, color: 'var(--gray-mid)', fontWeight: 600, whiteSpace: 'nowrap' },
  meta: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-soft)', fontWeight: 500 },
  locked: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--gray-mid)', background: 'rgba(128,128,128,.06)', border: '1px dashed var(--card-bd)', borderRadius: 9, padding: '8px 11px' },
  rowB: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  owned: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: .5, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '3px 10px' },
  estadoTag: { fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', border: '1px solid rgba(232,163,61,.35)', borderRadius: 20, padding: '3px 9px' },
  segTag: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#ff7a3d', background: 'rgba(255,122,61,.12)', border: '1px solid rgba(255,122,61,.4)', borderRadius: 20, padding: '3px 8px' },
  pipeRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 },
  pipeBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '9px 6px', borderRadius: 10, border: '1px solid var(--card-bd)', background: 'var(--card)', color: 'var(--text-soft)', cursor: 'pointer', transition: 'all .15s ease' },
  crow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 500 },
  chipMini: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--text-soft)', background: 'rgba(128,128,128,.08)', border: '1px solid var(--card-bd)', borderRadius: 20, padding: '4px 10px' },
  trashBtn: { display: 'inline-grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid var(--red-bd)', background: 'var(--red-bg)', color: 'var(--red-soft)', cursor: 'pointer', padding: 0 },
  detalles: { background: 'rgba(232,163,61,.06)', border: '1px solid rgba(232,163,61,.22)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  detTit: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 2 },
  detRow: { display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid rgba(232,163,61,.12)', paddingTop: 9 },
  detK: { fontSize: 11, color: 'var(--gray-mid)', fontWeight: 600 },
  detV: { fontSize: 14, color: 'var(--text)', fontWeight: 600, lineHeight: 1.35 },
  nota: { fontSize: 12, color: 'var(--text-soft)', borderTop: '1px solid var(--card-bd)', paddingTop: 9, marginTop: 2, lineHeight: 1.5 },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--gray-mid)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, lineHeight: 1.6 },
  rules: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, marginTop: 30, paddingTop: 18, borderTop: '1px solid var(--card-bd)' },
};
