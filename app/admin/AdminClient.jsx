'use client';

// =====================================================================
//  GPSO COLLECTOR · Panel Admin (cliente)  ·  app/admin/AdminClient.jsx
//  Sidebar + 4 secciones: Alumnos · VIP · Leads · Ajustes.
// =====================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import {
  Users, Gem, Target, Settings, ArrowLeft, Check, X, Plus, Trash2, RotateCcw,
  ShieldCheck, Star, Menu, TrendingUp, Trophy, XCircle, Package, Lock, Eye
} from 'lucide-react';

const eur = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-ES') + ' €');

export default function AdminClient({ email, perfil, alumnos: alumnosIni, operaciones: opsIni, leads: leadsIni, config: configIni, motivos }) {
  const router = useRouter();
  const supabase = createClient();
  const [sec, setSec] = useState('resumen');
  const [sidebar, setSidebar] = useState(false);
  const [flash, setFlash] = useState(null);

  const [alumnos, setAlumnos] = useState(alumnosIni);
  const [ops, setOps] = useState(opsIni);
  const [leads, setLeads] = useState(leadsIni);
  const [config, setConfig] = useState(configIni);
  const [stats, setStats] = useState(null);
  const [espia, setEspia] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('admin_stats_leads');
      if (data?.ok) setStats(data);
      const { data: e } = await supabase.rpc('admin_espia_alumnos');
      if (e?.ok) setEspia(e.alumnos || []);
    })();
  }, []);

  function aviso(t, m) { setFlash({ t, m }); setTimeout(() => setFlash(null), 3200); }

  const secciones = [
    { id: 'resumen', label: 'Resumen', icon: <TrendingUp size={17} /> },
    { id: 'alumnos', label: 'Alumnos', icon: <Users size={17} />, badge: alumnos.filter(a => !a.activo).length || null },
    { id: 'vip', label: 'Inversión VIP', icon: <Gem size={17} /> },
    { id: 'leads', label: 'Leads', icon: <Target size={17} /> },
    { id: 'ajustes', label: 'Ajustes', icon: <Settings size={17} /> },
  ];

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh', display: 'flex' }}>
      {flash && <div style={{ ...S.flash, ...(flash.t === 'ok' ? S.flashOk : S.flashWarn) }}>{flash.m}</div>}

      {/* SIDEBAR */}
      <aside className={`admin-side ${sidebar ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
          <div className="brand-tile" style={{ width: 40, height: 40 }}><img src="/collector.jpg" alt="" /></div>
          <div>
            <div className="display" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={15} /> Admin</div>
            <div style={{ fontSize: 10, color: 'var(--gray-mid)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>GPSO Collector</div>
          </div>
        </div>

        {secciones.map(s => (
          <button key={s.id} className={`admin-navitem ${sec === s.id ? 'active' : ''}`} onClick={() => { setSec(s.id); setSidebar(false); }}>
            <span style={{ display: 'grid', placeItems: 'center' }}>{s.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
            {s.badge && <span className="admin-badge">{s.badge}</span>}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={() => router.push('/')} style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: 8 }}>
          <ArrowLeft size={15} /> Volver a la plataforma
        </button>
      </aside>

      {/* CONTENIDO */}
      <main style={S.main}>
        <div className="admin-topbar-mob">
          <button className="icobtn" onClick={() => setSidebar(true)}><Menu size={20} /></button>
          <span className="display" style={{ fontSize: 16, flex: 1 }}>Panel Admin</span>
          <button className="btn-ghost" onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 12px' }}>
            <ArrowLeft size={14} /> Salir
          </button>
        </div>

        {sec === 'resumen' && <SeccionResumen stats={stats} alumnos={alumnos} espia={espia} />}
        {sec === 'alumnos' && <SeccionAlumnos {...{ supabase, alumnos, setAlumnos, aviso }} />}
        {sec === 'vip' && <SeccionVip {...{ supabase, ops, setOps, aviso }} />}
        {sec === 'leads' && <SeccionLeads {...{ supabase, leads, setLeads, aviso }} />}
        {sec === 'ajustes' && <SeccionAjustes {...{ supabase, config, setConfig, aviso }} />}
      </main>

      {sidebar && <div className="scrim on" onClick={() => setSidebar(false)} style={{ zIndex: 40 }} />}
    </div>
  );
}

// ---------------- RESUMEN (stats) ----------------
function SeccionResumen({ stats, alumnos, espia }) {
  const activos = alumnos.filter(a => a.activo).length;
  const pendientes = alumnos.filter(a => !a.activo).length;
  const cards = [
    { lab: 'Leads disponibles', val: stats?.disponibles, icon: <Package size={18} />, col: 'var(--text)' },
    { lab: 'Cogidos (reservados)', val: stats?.reservados, icon: <Lock size={18} />, col: 'var(--gold)' },
    { lab: 'Ganados', val: stats?.ganados, icon: <Trophy size={18} />, col: 'var(--green)' },
    { lab: 'Rechazados', val: stats?.rechazados, icon: <XCircle size={18} />, col: 'var(--red-soft)' },
  ];
  return (
    <div>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Resumen</h2>
      <p style={{ fontSize: 13, color: 'var(--gray-mid)', marginBottom: 22 }}>Estado global de la Central de Leads.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 26 }}>
        {cards.map(c => (
          <div key={c.lab} className="glass" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.col, marginBottom: 8 }}>{c.icon}</div>
            <div className="display" style={{ fontSize: 30, color: c.col }}>{c.val != null ? c.val : '—'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginTop: 2 }}>{c.lab}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        <div className="glass" style={{ padding: '18px 20px' }}>
          <div className="display" style={{ fontSize: 26 }}>{activos}</div>
          <div style={{ fontSize: 11.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginTop: 2 }}>Alumnos activos</div>
        </div>
        <div className="glass" style={{ padding: '18px 20px' }}>
          <div className="display" style={{ fontSize: 26, color: pendientes > 0 ? 'var(--gold)' : 'var(--text)' }}>{pendientes}</div>
          <div style={{ fontSize: 11.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginTop: 2 }}>Pendientes de aprobar</div>
        </div>
        <div className="glass" style={{ padding: '18px 20px' }}>
          <div className="display" style={{ fontSize: 26 }}>{stats?.total != null ? stats.total : '—'}</div>
          <div style={{ fontSize: 11.5, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 600, marginTop: 2 }}>Leads totales</div>
        </div>
      </div>

      {/* ZONA ESPÍA · rendimiento por alumno */}
      <div style={{ marginTop: 30 }}>
        <h3 className="display" style={{ fontSize: 17, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Eye size={17} color="var(--gold)" /> Zona espía · quién trabaja
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--gray-mid)', marginBottom: 16 }}>Rendimiento por alumno. Ordenado por ganados.</p>

        {!espia ? (
          <div style={{ fontSize: 13, color: 'var(--gray-mid)' }}>Cargando…</div>
        ) : espia.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--gray-mid)' }}>Todavía no hay actividad de alumnos.</div>
        ) : (
          <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            {/* cabecera */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--card-bd)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--gray-mid)' }}>
              <span>Alumno</span>
              <span style={{ textAlign: 'center', minWidth: 60 }}>Cogidos</span>
              <span style={{ textAlign: 'center', minWidth: 60 }}>Ganados</span>
              <span style={{ textAlign: 'center', minWidth: 60 }}>Rechaz.</span>
            </div>
            {espia.map((a, i) => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, padding: '13px 16px', borderBottom: i < espia.length - 1 ? '1px solid var(--card-bd)' : 'none', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13.5 }}>
                  {i === 0 && a.ganados > 0 && <Trophy size={14} color="var(--gold)" />}
                  {a.nombre}
                </span>
                <span style={{ textAlign: 'center', minWidth: 60, fontWeight: 700, color: a.reservados > 0 ? 'var(--gold)' : 'var(--gray-mid)' }}>{a.reservados}</span>
                <span style={{ textAlign: 'center', minWidth: 60, fontWeight: 700, color: a.ganados > 0 ? 'var(--green)' : 'var(--gray-mid)' }}>{a.ganados}</span>
                <span style={{ textAlign: 'center', minWidth: 60, fontWeight: 700, color: 'var(--gray-mid)' }}>{a.rechazados}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- ALUMNOS ----------------
function SeccionAlumnos({ supabase, alumnos, setAlumnos, aviso }) {
  const [q, setQ] = useState('');
  const pendientes = alumnos.filter(a => !a.activo);
  const activos = alumnos.filter(a => a.activo);
  const filtra = (arr) => q ? arr.filter(a => (a.email + ' ' + (a.nombre || '')).toLowerCase().includes(q.toLowerCase())) : arr;

  async function aprobar(a) {
    const { data } = await supabase.rpc('admin_aprobar_alumno', { p_id: a.id });
    if (data?.ok) { setAlumnos(prev => prev.map(x => x.id === a.id ? { ...x, activo: true, en_lista_blanca: true } : x)); aviso('ok', `${a.nombre || a.email} aprobado.`); }
    else aviso('warn', 'No se pudo aprobar.');
  }
  async function rechazar(a) {
    const { data } = await supabase.rpc('admin_rechazar_alumno', { p_id: a.id });
    if (data?.ok) { setAlumnos(prev => prev.map(x => x.id === a.id ? { ...x, activo: false } : x)); aviso('ok', 'Alumno desactivado.'); }
  }
  async function toggleVip(a) {
    const nuevo = !a.vip;
    const { data } = await supabase.rpc('admin_set_vip', { p_id: a.id, p_vip: nuevo, p_tier: 'vip' });
    if (data?.ok) { setAlumnos(prev => prev.map(x => x.id === a.id ? { ...x, vip: nuevo } : x)); aviso('ok', nuevo ? 'Acceso VIP concedido.' : 'Acceso VIP retirado.'); }
  }

  return (
    <div>
      <Head titulo="Alumnos" sub={`${pendientes.length} pendientes · ${activos.length} activos`} />
      <input className="campo" placeholder="Buscar por nombre o email…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 360, marginBottom: 22 }} />

      {pendientes.length > 0 && (
        <>
          <div style={S.secLabel}>Pendientes de aprobar</div>
          <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
            {filtra(pendientes).map(a => (
              <div key={a.id} className="glass" style={S.alumRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.nombre || '—'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--gray-mid)' }}>{a.email}</div>
                </div>
                {a.en_lista_blanca && <span style={S.tagOk}>en lista</span>}
                <button className="btn-de" onClick={() => aprobar(a)} style={{ padding: '9px 14px', fontSize: 13 }}><Check size={14} /> Aprobar</button>
                <button className="btn-ghost" onClick={() => rechazar(a)} style={{ padding: '9px 12px' }}><X size={14} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={S.secLabel}>Alumnos activos</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {filtra(activos).map(a => (
          <div key={a.id} className="glass" style={S.alumRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.nombre || '—'}
                {a.rol === 'admin' && <span style={S.tagAdmin}>admin</span>}
                {a.vip && <span style={S.tagVip}>VIP</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--gray-mid)' }}>{a.email}</div>
            </div>
            <button className="btn-ghost" onClick={() => toggleVip(a)} style={{ padding: '8px 12px', fontSize: 12.5, borderColor: a.vip ? 'rgba(232,163,61,.4)' : 'var(--border)', color: a.vip ? 'var(--gold)' : 'var(--text-soft)' }}>
              <Star size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{a.vip ? 'Quitar VIP' : 'Dar VIP'}
            </button>
            {a.rol !== 'admin' && <button className="btn-ghost" onClick={() => rechazar(a)} style={{ padding: '8px 12px', fontSize: 12.5 }}>Desactivar</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- VIP ----------------
function SeccionVip({ supabase, ops, setOps, aviso }) {
  const vacia = { titulo: '', marca: '', modelo: '', anio: '', km: '', motor: '', descripcion: '', foto: '', inversion_total: '', entrada_minima: '', dias_estimados: '', compra: '', importacion: '', gastos: '', margen: '', roi_cons: 9, roi_real: 14, roi_opt: 19, dias_cons: 60, dias_real: 45, dias_opt: 35, mkt_min: '', mkt_med: '', mkt_max: '', mkt_nuestro: '' };
  const [f, setF] = useState(vacia);
  const [form, setForm] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function crear() {
    if (!f.titulo || !f.inversion_total) { aviso('warn', 'Título e inversión total son obligatorios.'); return; }
    const num = (x) => x === '' || x == null ? null : Number(String(x).replace(/[^\d.]/g, ''));
    const payload = {
      titulo: f.titulo, marca: f.marca || null, modelo: f.modelo || null,
      anio: num(f.anio), km: num(f.km), motor: f.motor || null, descripcion: f.descripcion || null,
      fotos: f.foto ? [f.foto] : [],
      inversion_total: num(f.inversion_total), entrada_minima: num(f.entrada_minima) || 1000,
      dias_estimados: num(f.dias_estimados), estado: 'abierta', fecha_apertura: new Date().toISOString(),
      desglose: { Compra: num(f.compra), Importación: num(f.importacion), Gastos: num(f.gastos), 'Margen objetivo': num(f.margen) },
      escenarios: [
        { nombre: 'Conservador', roi_pct: num(f.roi_cons), dias: num(f.dias_cons) },
        { nombre: 'Realista', roi_pct: num(f.roi_real), dias: num(f.dias_real) },
        { nombre: 'Optimista', roi_pct: num(f.roi_opt), dias: num(f.dias_opt) },
      ],
      mercado: (f.mkt_min || f.mkt_med) ? { min: num(f.mkt_min), med: num(f.mkt_med), max: num(f.mkt_max), nuestro: num(f.mkt_nuestro), comps: [] } : {},
    };
    const { data, error } = await supabase.from('operaciones_vip').insert(payload).select('*').single();
    if (error) { aviso('warn', 'Error: ' + error.message); return; }
    setOps(prev => [data, ...prev]); setF(vacia); setForm(false); aviso('ok', 'Operación creada y abierta.');
  }
  async function cambiarEstado(op, estado) {
    const { error } = await supabase.from('operaciones_vip').update({ estado }).eq('id', op.id);
    if (!error) { setOps(prev => prev.map(x => x.id === op.id ? { ...x, estado } : x)); aviso('ok', 'Estado actualizado.'); }
  }

  return (
    <div>
      <Head titulo="Inversión VIP" sub={`${ops.length} operaciones`} accion={<button className="btn-de" onClick={() => setForm(!form)} style={{ padding: '10px 16px', fontSize: 13 }}><Plus size={15} /> Nueva operación</button>} />

      {form && (
        <div className="glass" style={{ padding: 22, marginBottom: 24 }}>
          <div style={S.secLabel}>Datos del vehículo</div>
          <div style={S.grid2}>
            <Campo l="Título *" v={f.titulo} on={set('titulo')} ph="Porsche 911 GT3" />
            <Campo l="Marca" v={f.marca} on={set('marca')} ph="Porsche" />
            <Campo l="Modelo" v={f.modelo} on={set('modelo')} ph="911 GT3" />
            <Campo l="Año" v={f.anio} on={set('anio')} ph="2022" />
            <Campo l="Km" v={f.km} on={set('km')} ph="18000" />
            <Campo l="Motor" v={f.motor} on={set('motor')} ph="4.0 · 502 cv" />
          </div>
          <Campo l="URL de la foto (PNG recortado o foto)" v={f.foto} on={set('foto')} ph="https://…" full />
          <Campo l="Descripción" v={f.descripcion} on={set('descripcion')} ph="Unidad seleccionada…" full />

          <div style={S.secLabel}>Economía</div>
          <div style={S.grid2}>
            <Campo l="Inversión total * (€)" v={f.inversion_total} on={set('inversion_total')} ph="180000" />
            <Campo l="Entrada mínima (€)" v={f.entrada_minima} on={set('entrada_minima')} ph="5000" />
            <Campo l="Compra (€)" v={f.compra} on={set('compra')} ph="150000" />
            <Campo l="Importación (€)" v={f.importacion} on={set('importacion')} ph="18000" />
            <Campo l="Gastos (€)" v={f.gastos} on={set('gastos')} ph="6000" />
            <Campo l="Margen objetivo (€)" v={f.margen} on={set('margen')} ph="24000" />
          </div>

          <div style={S.secLabel}>Escenarios (ROI % / días)</div>
          <div style={S.grid3}>
            <Campo l="Conservador ROI%" v={f.roi_cons} on={set('roi_cons')} />
            <Campo l="Realista ROI%" v={f.roi_real} on={set('roi_real')} />
            <Campo l="Optimista ROI%" v={f.roi_opt} on={set('roi_opt')} />
            <Campo l="Días cons." v={f.dias_cons} on={set('dias_cons')} />
            <Campo l="Días real." v={f.dias_real} on={set('dias_real')} />
            <Campo l="Días opt." v={f.dias_opt} on={set('dias_opt')} />
          </div>

          <div style={S.secLabel}>Mercado España (opcional)</div>
          <div style={S.grid2}>
            <Campo l="Mínimo (€)" v={f.mkt_min} on={set('mkt_min')} ph="198000" />
            <Campo l="Medio (€)" v={f.mkt_med} on={set('mkt_med')} ph="215000" />
            <Campo l="Máximo (€)" v={f.mkt_max} on={set('mkt_max')} ph="238000" />
            <Campo l="Nuestra venta prevista (€)" v={f.mkt_nuestro} on={set('mkt_nuestro')} ph="204000" />
          </div>

          <button className="btn-de" onClick={crear} style={{ marginTop: 16 }}>Crear operación</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {ops.map(op => (
          <div key={op.id} className="glass" style={S.alumRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{op.titulo}</div>
              <div style={{ fontSize: 12.5, color: 'var(--gray-mid)' }}>{eur(op.recaudado)} / {eur(op.inversion_total)} · {op.estado}</div>
            </div>
            <select className="campo" value={op.estado} onChange={e => cambiarEstado(op, e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: 12.5 }}>
              <option value="borrador">Borrador</option>
              <option value="abierta">Abierta</option>
              <option value="financiada">Financiada</option>
              <option value="en_proceso">En proceso</option>
              <option value="vendida">Vendida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- LEADS ----------------
function SeccionLeads({ supabase, leads, setLeads, aviso }) {
  const vacio = { nombre: '', telefono: '', email: '', vehiculo: '', presupuesto: '', ciudad: '', calor: 'medio', nota: '' };
  const [f, setF] = useState(vacio);
  const [form, setForm] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function crear() {
    if (!f.nombre && !f.telefono) { aviso('warn', 'Pon al menos nombre o teléfono.'); return; }
    const payload = { ...f, presupuesto: f.presupuesto ? parseInt(f.presupuesto.replace(/[^\d]/g, ''), 10) : null, vehiculo: f.vehiculo || 'Consulta de importación' };
    const { data, error } = await supabase.from('leads').insert(payload).select('*').single();
    if (error) { aviso('warn', 'Error: ' + error.message); return; }
    setLeads(prev => [data, ...prev]); setF(vacio); setForm(false); aviso('ok', 'Lead creado.');
  }

  const badge = (e) => ({ disponible: S.tagOk, reservado: S.tagVip, cerrado: S.tagMuted }[e] || S.tagMuted);

  async function borrar(l) {
    const nombre = l.nombre || l.vehiculo || 'este lead';
    if (!window.confirm(`¿Borrar ${nombre} definitivamente?\n\nEsta acción NO se puede deshacer.`)) return;
    const { data, error } = await supabase.rpc('admin_borrar_lead', { p_lead_id: l.id });
    if (error) { aviso('warn', 'Error de conexión.'); return; }
    if (!data?.ok) { aviso('warn', data?.error === 'no_admin' ? 'Solo un admin puede borrar.' : 'No se pudo borrar.'); return; }
    setLeads(prev => prev.filter(x => x.id !== l.id)); aviso('ok', 'Lead borrado.');
  }

  async function liberar(l) {
    if (!window.confirm(`¿Liberar ${l.nombre || l.vehiculo}? Volverá a la bolsa para cualquier alumno.`)) return;
    const { data, error } = await supabase.rpc('admin_liberar_lead', { p_lead_id: l.id });
    if (error) { aviso('warn', 'Error de conexión.'); return; }
    if (!data?.ok) { aviso('warn', 'No se pudo liberar: ' + (data?.error || '')); return; }
    setLeads(prev => prev.map(x => x.id === l.id ? { ...x, estado: 'disponible', alumno_id: null } : x));
    aviso('ok', 'Lead liberado, ya está en la bolsa.');
  }

  return (
    <div>
      <Head titulo="Leads" sub={`${leads.length} en total`} accion={<button className="btn-de" onClick={() => setForm(!form)} style={{ padding: '10px 16px', fontSize: 13 }}><Plus size={15} /> Nuevo lead</button>} />

      {form && (
        <div className="glass" style={{ padding: 22, marginBottom: 24 }}>
          <div style={S.grid2}>
            <Campo l="Nombre" v={f.nombre} on={set('nombre')} />
            <Campo l="Teléfono" v={f.telefono} on={set('telefono')} />
            <Campo l="Email" v={f.email} on={set('email')} />
            <Campo l="Vehículo" v={f.vehiculo} on={set('vehiculo')} ph="Audi RS6…" />
            <Campo l="Presupuesto (€)" v={f.presupuesto} on={set('presupuesto')} />
            <Campo l="Ciudad" v={f.ciudad} on={set('ciudad')} />
          </div>
          <label className="etiqueta">Temperatura</label>
          <select className="campo" value={f.calor} onChange={set('calor')} style={{ maxWidth: 200, marginBottom: 12 }}>
            <option value="alto">Caliente</option><option value="medio">Templado</option><option value="bajo">Frío</option>
          </select>
          <Campo l="Nota" v={f.nota} on={set('nota')} full />
          <button className="btn-de" onClick={crear} style={{ marginTop: 8 }}>Crear lead</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {leads.map(l => (
          <div key={l.id} className="glass" style={S.alumRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.vehiculo} <span style={{ color: 'var(--gray-mid)', fontWeight: 500 }}>· {l.ciudad || '—'}</span></div>
              <div style={{ fontSize: 12, color: 'var(--gray-mid)' }}>{l.nombre || 'Sin nombre'} · {eur(l.presupuesto)}</div>
            </div>
            <span style={badge(l.estado)}>{l.estado}</span>
            {l.estado === 'reservado' && (
              <button onClick={() => liberar(l)} title="Liberar (vuelve a la bolsa)" style={{ display: 'inline-grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(232,163,61,.4)', background: 'rgba(232,163,61,.1)', color: 'var(--gold)', cursor: 'pointer', padding: 0, flexShrink: 0 }}><RotateCcw size={15} /></button>
            )}
            <button onClick={() => borrar(l)} title="Borrar definitivamente" style={{ display: 'inline-grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--red-bd)', background: 'var(--red-bg)', color: 'var(--red-soft)', cursor: 'pointer', padding: 0, flexShrink: 0 }}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- AJUSTES ----------------
function SeccionAjustes({ supabase, config, setConfig, aviso }) {
  const [f, setF] = useState({
    slots_max: config.slots_max ?? 3,
    cooldown_horas: config.cooldown_horas ?? 4,
    expiracion_sin_contactar_horas: config.expiracion_sin_contactar_horas ?? 24,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function guardar() {
    const payload = { slots_max: +f.slots_max, cooldown_horas: +f.cooldown_horas, expiracion_sin_contactar_horas: +f.expiracion_sin_contactar_horas };
    const { error } = await supabase.from('config').update(payload).eq('id', config.id);
    if (error) { aviso('warn', 'Error: ' + error.message); return; }
    setConfig({ ...config, ...payload }); aviso('ok', 'Ajustes guardados.');
  }

  return (
    <div>
      <Head titulo="Ajustes" sub="Reglas de la Central de Leads" />
      <div className="glass" style={{ padding: 24, maxWidth: 460 }}>
        <Campo l="Slots máximos por alumno" v={f.slots_max} on={set('slots_max')} />
        <Campo l="Cooldown entre reservas (horas)" v={f.cooldown_horas} on={set('cooldown_horas')} />
        <Campo l="Expiración de leads sin contactar (horas)" v={f.expiracion_sin_contactar_horas} on={set('expiracion_sin_contactar_horas')} />
        <button className="btn-de" onClick={guardar} style={{ marginTop: 8 }}>Guardar ajustes</button>
      </div>
    </div>
  );
}

// ---------------- helpers UI ----------------
function Head({ titulo, sub, accion }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 className="display" style={{ fontSize: 28 }}>{titulo}</h1>
        {sub && <div style={{ color: 'var(--gray-mid)', fontSize: 13.5, marginTop: 4 }}>{sub}</div>}
      </div>
      {accion}
    </div>
  );
}
function Campo({ l, v, on, ph, full }) {
  return (
    <div style={{ marginBottom: 12, ...(full ? { gridColumn: '1/-1' } : {}) }}>
      <label className="etiqueta">{l}</label>
      <input className="campo" value={v} onChange={on} placeholder={ph || ''} />
    </div>
  );
}

const S = {
  main: { flex: 1, padding: '30px 30px 60px', maxWidth: 1000, margin: '0 auto', width: '100%' },
  topbarMob: { display: 'none', alignItems: 'center', gap: 12, marginBottom: 20 },
  secLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gray-mid)', fontWeight: 700, margin: '18px 0 12px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  alumRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', flexWrap: 'wrap' },
  tagOk: { fontSize: 10.5, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 20, padding: '3px 9px' },
  tagVip: { fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', background: 'rgba(232,163,61,.1)', border: '1px solid rgba(232,163,61,.4)', borderRadius: 20, padding: '3px 9px' },
  tagAdmin: { fontSize: 10.5, fontWeight: 700, color: 'var(--red-soft)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 20, padding: '3px 9px' },
  tagMuted: { fontSize: 10.5, fontWeight: 700, color: 'var(--gray-mid)', background: 'rgba(128,128,128,.1)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px' },
  flash: { position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, backdropFilter: 'blur(10px)' },
  flashOk: { background: 'rgba(70,196,131,.15)', border: '1px solid var(--green-bd)', color: 'var(--green)' },
  flashWarn: { background: 'rgba(198,26,26,.15)', border: '1px solid var(--red-bd)', color: 'var(--red-soft)' },
};
