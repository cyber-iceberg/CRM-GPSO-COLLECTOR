'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  v5 · Rediseño "centro de mando":
//   · Menú lateral (Sidebar) + pantalla de CARGA.
//   · Métricas pequeñas arriba (rompen la simetría).
//   · Central de Leads EN EL CENTRO (la jefa), con mini-gráfica de la semana,
//     rodeada por Peritación/Subir (izq) y Recursos/Formación (der).
//   · Inversión VIP en "Próximamente / En construcción".
//   · Tarjetas con icono + contenido repartido · hover con borde iluminado.
//   · Fondo: la foto se ve entera (sin fundido negro).
//  NOTA: para el menú en TODAS las páginas, mueve <Sidebar/> a app/layout.jsx
//  (y quítalo de aquí). La gráfica usa stats.leadsSemana (array) si lo pasas.
// =====================================================================

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MenuDrawer from './components/MenuDrawer';
import BottomNav from './components/BottomNav';
import GuiaTour, { BotonGuia, useGuia } from './components/GuiaTour';
import { Target, Gem, Car, GraduationCap, FolderOpen, Gauge, ClipboardCheck, Bell, Lock } from 'lucide-react';

const URL_STOCK = 'https://gpsocollector.com/acceso';
const URL_FORMACION = 'https://academy.gpsocollector.com';
const URL_NEXOCAR = 'https://nexocar.app';
const HERO = '/hero-galaxy.webp';

function saludoPorHora(h) {
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

const Flecha = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const Ext = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10" /></svg>);

export default function HomeClient({ email, perfil, stats = {} }) {
  const router = useRouter();
  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;
  const nombre = (perfil?.nombre || email || '').split('@')[0].split(' ')[0];
  const eur = (n) => (n || 0).toLocaleString('es-ES') + ' €';
  const guia = useGuia('hub-v1');

  const [saludo, setSaludo] = useState('Bienvenido de nuevo');
  const [listo, setListo] = useState(false);
  const sceneRef = useRef(null);

  useEffect(() => { try { setSaludo(saludoPorHora(new Date().getHours())); } catch {} }, []);

  // carga: esperar a la imagen antes de mostrar
  useEffect(() => {
    let hecho = false;
    const fin = () => { if (!hecho) { hecho = true; setListo(true); } };
    try { const img = new window.Image(); img.onload = fin; img.onerror = fin; img.src = HERO; if (img.complete) fin(); } catch { fin(); }
    const t = setTimeout(fin, 3500);
    return () => clearTimeout(t);
  }, []);

  // parallax sutil del fondo
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const img = scene.querySelector('.hc-img');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    const onMove = (e) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; };
    const loop = () => { cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05; if (img) img.style.transform = `scale(1.05) translate(${cx * -9}px,${cy * -6}px)`; raf = requestAnimationFrame(loop); };
    loop(); window.addEventListener('mousemove', onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, []);

  // ---- mini-gráfica de leads de la semana ----
  const semana = useMemo(() => {
    const s = Array.isArray(stats.leadsSemana) && stats.leadsSemana.length ? stats.leadsSemana : [20, 28, 17, 33, 38, 26, 45, 36, 50, 42, 55, 48];
    const max = Math.max(...s, 1);
    const paso = 320 / s.length;
    return { bars: s.map((v, i) => ({ x: (i * paso + 3).toFixed(1), h: Math.max(4, (v / max) * 52).toFixed(1), last: i === s.length - 1 })), bw: Math.max(6, paso - 10).toFixed(1) };
  }, [stats.leadsSemana]);

  const pasosHub = [
    { seccion: 'Tu panel', titulo: `Hola, ${nombre}. Este es tu panel.`, texto: 'Desde aquí entras a todo. Te enseño para qué sirve cada herramienta.' },
    { sel: '[data-tour="t-central"]', seccion: 'Herramienta', titulo: 'Central de Leads', texto: 'El corazón de todo: llegan clientes en tiempo real, los reservas, contactas y cierras.' },
    { sel: '[data-tour="t-peritacion"]', seccion: 'Herramienta', titulo: 'Peritación', texto: 'Inspecciona la unidad paso a paso con informe final. Para no comprar a ciegas.' },
    { sel: '[data-tour="t-recursos"]', seccion: 'Herramienta', titulo: 'Recursos', texto: 'Plantillas, contratos y contactos de confianza para ejecutar cada paso.' },
    { sel: '[data-tour="t-stats"]', seccion: 'Resumen', titulo: 'Tus métricas en directo', texto: 'Leads disponibles, clientes activos y tu inversión en marcha, de un vistazo.' },
    { seccion: 'Listo', titulo: 'Ya conoces tu panel', texto: 'Empieza por la Central de Leads. Vuelve a ver esto con ¿Cómo funciona?' },
  ];

  return (
    <>
      <Sidebar />

      <div className="hub-scene" ref={sceneRef}>
        <link rel="preload" as="image" href={HERO} fetchPriority="high" />

        {/* carga · estilos EN LÍNEA para cubrir desde el primer pintado (sin FOUC) */}
        <div aria-hidden={listo} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#070910', display: 'grid', placeItems: 'center', opacity: listo ? 0 : 1, pointerEvents: listo ? 'none' : 'auto', transition: 'opacity .5s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 68, height: 68, borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(201,161,77,.4)' }}>
              <img src="/collector.jpg" alt="GPSO" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <svg width="34" height="34" viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(201,161,77,.18)" strokeWidth="5" />
              <circle cx="25" cy="25" r="20" fill="none" stroke="#e3c987" strokeWidth="5" strokeLinecap="round" strokeDasharray="80 150">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 13, color: '#9aa3b2' }}>Preparando tu central…</div>
          </div>
        </div>

        {/* fondo */}
        <div className="hc-sky" aria-hidden="true" />
        <div className="hc-img" style={{ backgroundImage: `url('${HERO}')` }} aria-hidden="true" />
        <div className="hc-tint" aria-hidden="true" />

        {/* contenido */}
        <div className="hc-wrap">
          <div className="hc-top">
            <div className="hc-top-right">
              <button className="hc-iconbtn" title="Notificaciones"><span className="hc-bn" /><Bell size={19} /></button>
              <MenuDrawer perfil={perfil} email={email} />
            </div>
          </div>

          <div className="hc-greet">
            <div className="hc-kick">{saludo}</div>
            <h1 className="hc-title">Hola, {nombre}.</h1>
            <div className="hc-sub">tu central te espera.</div>
            <div style={{ marginTop: 14 }}><BotonGuia onClick={guia.abrir} texto="¿Cómo funciona la plataforma?" /></div>
          </div>

          {/* métricas (pequeñas) */}
          <div className="hc-metrics" data-tour="t-stats">
            <div className="hc-mt key">
              <div className="hc-lab"><span className="hc-dotlive" />Leads disponibles</div>
              <div className="hc-num">{stats.leadsDisp ?? 0}</div>
              <div className="hc-hint">{stats.leadsAccion != null ? <><b>{stats.leadsAccion}</b> requieren acción</> : 'ahora mismo'}</div>
            </div>
            <div className="hc-mt"><div className="hc-lab">Clientes activos</div><div className="hc-num">{stats.misClientes ?? 0}</div><div className="hc-hint">en gestión</div></div>
            {(esVip || esAdmin)
              ? <div className="hc-mt"><div className="hc-lab">Operaciones VIP</div><div className="hc-num">{stats.opsVip ?? 0}</div><div className="hc-hint">en marcha</div></div>
              : (stats.peritaciones != null && <div className="hc-mt"><div className="hc-lab">Unidades peritadas</div><div className="hc-num">{stats.peritaciones}</div><div className="hc-hint">en total</div></div>)}
            {(esVip || esAdmin)
              ? <div className="hc-mt"><div className="hc-lab">Inversión activa</div><div className="hc-num g">{eur(stats.inversionActiva)}</div><div className="hc-hint">coinversión</div></div>
              : <div className="hc-mt"><div className="hc-lab">Clientes cerrados</div><div className="hc-num">{stats.misClientes ?? 0}</div><div className="hc-hint">en tu historial</div></div>}
          </div>

          {/* ===== BENTO: Central en el centro ===== */}
          <div className="hc-bento">

            {/* izquierda */}
            <div className="hc-card hc-perito" data-tour="t-peritacion" onClick={() => router.push('/peritacion')}>
              <div className="hc-ctop"><div className="hc-ic blue"><ClipboardCheck size={22} /></div><span className="hc-tag">Inspección guiada</span></div>
              <div className="hc-body"><div className="hc-ct">Peritación</div><div className="hc-cd">Revisa la unidad paso a paso.</div>
                <span className="hc-go">Iniciar inspección <Flecha /></span></div>
            </div>

            {/* CENTRO · la jefa */}
            <div className="hc-card hc-central" data-tour="t-central" onClick={() => router.push('/central')}>
              <div className="hc-ctop top">
                <div className="hc-ic red big"><Target size={26} /></div>
                <div className="hc-big"><div className="n">{stats.leadsDisp ?? 0}</div><div className="l">leads esperando</div></div>
              </div>
              <div className="hc-body">
                <div className="hc-ct">Central de Leads</div>
                <div className="hc-cd">Reserva y gestiona tus clientes de importación en tiempo real. El corazón de tu operativa.</div>
                <div className="hc-mini">
                  <div className="hc-mini-h">Leads esta semana{stats.leadsTendencia != null && <> · <b>{stats.leadsTendencia > 0 ? '+' : ''}{stats.leadsTendencia}%</b></>}</div>
                  <svg className="hc-spark" viewBox="0 0 320 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="hcBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a6274" /><stop offset="1" stopColor="#2c3344" /></linearGradient>
                      <linearGradient id="hcLast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0a99f" /><stop offset="1" stopColor="#C61A1A" /></linearGradient>
                    </defs>
                    {semana.bars.map((b, i) => <rect key={i} x={b.x} y={(58 - b.h).toFixed(1)} width={semana.bw} height={b.h} rx="3" fill={b.last ? 'url(#hcLast)' : 'url(#hcBar)'} />)}
                  </svg>
                </div>
                {stats.leadsAccion != null && <span className="hc-live"><span className="hc-dotlive" /><b>{stats.leadsAccion}</b>&nbsp;sin contactar ahora mismo</span>}
                <span className="hc-go big">Gestionar leads <Flecha /></span>
              </div>
            </div>

            {/* derecha */}
            <div className="hc-card hc-recursos" data-tour="t-recursos" onClick={() => router.push('/recursos')}>
              <div className="hc-ctop"><div className="hc-ic cosmo"><FolderOpen size={22} /></div><span className="hc-tag">El universo del importador</span></div>
              <div className="hc-body"><div className="hc-ct">Recursos</div><div className="hc-cd">Plantillas, contratos y contactos.</div>
                <span className="hc-go">Explorar recursos <Flecha /></span></div>
            </div>

            <div className="hc-card hc-stock" onClick={() => window.open(URL_STOCK, '_blank', 'noopener,noreferrer')}>
              <div className="hc-ctop"><div className="hc-ic blue"><Car size={22} /></div><span className="hc-tag">Cesión de venta</span></div>
              <div className="hc-body"><div className="hc-ct">Subir unidades</div><div className="hc-cd">Lo gestionamos en venta.</div>
                <span className="hc-go">Subir mi coche <Ext /></span></div>
            </div>

            <div className="hc-card hc-formacion" onClick={() => window.open(URL_FORMACION, '_blank', 'noopener,noreferrer')}>
              <div className="hc-ctop"><div className="hc-ic gold"><GraduationCap size={22} /></div><span className="hc-tag">Academia</span></div>
              <div className="hc-body"><div className="hc-ct">Formación</div><div className="hc-cd">Módulos, vídeos y masterclases.</div>
                <span className="hc-go">Ir a la academia <Ext /></span></div>
            </div>

            {/* abajo */}
            <div className="hc-card hc-vip soon" title="Próximamente">
              <div className="hc-vg">
                <div className="hc-ic gold"><Gem size={24} /></div>
                <div className="hc-body"><span className="hc-soonbadge">Próximamente</span><div className="hc-ct" style={{ marginTop: 8 }}>Inversión VIP</div><div className="hc-cd">Coinversión en coches de alta gama seleccionados por Collector.</div></div>
              </div>
              <span className="hc-btn dis"><Lock size={14} /> En construcción</span>
            </div>

            <div className="hc-card hc-nexocar" onClick={() => window.open(URL_NEXOCAR, '_blank', 'noopener,noreferrer')}>
              <div className="hc-ctop"><div className="hc-ic red"><Gauge size={22} /></div><span className="hc-tag">Herramienta</span></div>
              <div className="hc-body"><div className="hc-ct">NEXOCAR</div><div className="hc-cd">Calcula importaciones y la rentabilidad real de cada coche.</div>
                <span className="hc-go">Analizar vehículo <Ext /></span></div>
            </div>
          </div>
        </div>

        <GuiaTour run={guia.run} steps={pasosHub} onClose={guia.cerrar} />
        <BottomNav perfil={perfil} activa="inicio" />

        <style jsx global>{`
          .hub-scene{position:relative;min-height:100vh;margin-left:76px;overflow-x:hidden;background:#070910;color:#eef1f6;
            font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
          @media (max-width:860px){ .hub-scene{margin-left:0} }

          .hub-scene .hc-sky{position:fixed;inset:0;z-index:0;background:#070910}
          .hub-scene .hc-img{position:fixed;inset:0;z-index:0;background-position:center 54%;background-size:cover;background-repeat:no-repeat;transform:scale(1.05);will-change:transform;animation:hcImgIn .7s ease both}
          @keyframes hcImgIn{from{opacity:0}to{opacity:1}}
          .hub-scene .hc-tint{position:fixed;inset:0;z-index:1;pointer-events:none;background:
            linear-gradient(118deg, rgba(7,9,16,.6) 0%, rgba(7,9,16,.22) 28%, rgba(7,9,16,0) 54%),
            radial-gradient(135% 95% at 50% 36%, transparent 52%, rgba(7,9,16,.42) 100%),
            linear-gradient(180deg, rgba(7,9,16,.1) 0%, rgba(7,9,16,.08) 52%, rgba(7,9,16,.26) 86%, rgba(7,9,16,.4) 100%)}

          .hub-scene .hc-wrap{position:relative;z-index:3;max-width:1320px;margin:0 auto;padding:0 34px 56px}
          .hub-scene .hc-top{display:flex;padding:20px 0 2px}
          .hub-scene .hc-top-right{margin-left:auto;display:flex;align-items:center;gap:10px}
          .hub-scene .hc-iconbtn{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(16,19,28,.5);backdrop-filter:blur(8px);display:grid;place-items:center;color:#d6dbe4;position:relative;cursor:pointer}
          .hub-scene .hc-iconbtn:hover{border-color:rgba(255,255,255,.25)}
          .hub-scene .hc-bn{position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;background:#e85a4f;box-shadow:0 0 0 2px #0c0f17}

          .hub-scene .hc-greet{padding:14px 0 18px}
          .hub-scene .hc-kick{font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#aab2c2;font-weight:600;margin-bottom:12px}
          .hub-scene .hc-title{font-size:clamp(38px,4vw,52px);font-weight:800;letter-spacing:-1.7px;line-height:1;margin:0;color:#fff}
          .hub-scene .hc-sub{font-family:'Cormorant',Georgia,serif;font-style:italic;font-weight:600;font-size:clamp(20px,2.2vw,26px);color:#e85a4f;margin-top:6px}

          /* métricas pequeñas */
          .hub-scene .hc-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:4px auto 20px;max-width:820px}
          .hub-scene .hc-mt{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 15px;background:rgba(13,16,24,.58);backdrop-filter:blur(14px)}
          .hub-scene .hc-mt.key{border-color:rgba(232,68,59,.4);background:linear-gradient(120deg,rgba(198,26,26,.18),rgba(13,16,24,.58) 60%)}
          .hub-scene .hc-lab{font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#9aa3b2;font-weight:600;display:flex;align-items:center;gap:7px}
          .hub-scene .hc-num{font-size:24px;font-weight:800;letter-spacing:-.6px;margin-top:5px;color:#eef1f6}
          .hub-scene .hc-num.g{color:#e3c987}
          .hub-scene .hc-hint{font-size:11px;color:#9aa3b2;margin-top:4px}
          .hub-scene .hc-hint b{color:#e85a4f}
          .hub-scene .hc-dotlive{width:8px;height:8px;border-radius:50%;background:#e85a4f;box-shadow:0 0 0 0 rgba(232,90,79,.7);animation:hcPl 1.8s infinite}
          @keyframes hcPl{0%{box-shadow:0 0 0 0 rgba(232,90,79,.6)}70%{box-shadow:0 0 0 7px rgba(232,90,79,0)}100%{box-shadow:0 0 0 0 rgba(232,90,79,0)}}

          /* bento: Central en el centro */
          .hub-scene .hc-bento{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:192px;gap:16px;
            grid-template-areas:
              "p p p c c c c c c r r r"
              "s s s c c c c c c f f f"
              "v v v v v v n n n n n n"}
          .hub-scene .hc-perito{grid-area:p}.hub-scene .hc-central{grid-area:c}.hub-scene .hc-recursos{grid-area:r}
          .hub-scene .hc-stock{grid-area:s}.hub-scene .hc-formacion{grid-area:f}.hub-scene .hc-vip{grid-area:v}.hub-scene .hc-nexocar{grid-area:n}

          .hub-scene .hc-card{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.1);cursor:pointer;
            background:linear-gradient(180deg,rgba(16,19,28,.72),rgba(10,12,19,.82));backdrop-filter:blur(16px);
            display:flex;flex-direction:column;justify-content:space-between;padding:22px;
            transition:transform .22s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s}
          .hub-scene .hc-card::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;pointer-events:none;opacity:0;transition:opacity .25s;
            background:linear-gradient(140deg,rgba(232,163,61,.7),rgba(232,163,61,0) 45%);
            -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
          .hub-scene .hc-card:hover{transform:translateY(-4px);border-color:rgba(232,163,61,.35);box-shadow:0 24px 60px rgba(0,0,0,.5)}
          .hub-scene .hc-card:hover::before{opacity:1}

          .hub-scene .hc-ctop{display:flex;align-items:center;justify-content:space-between;gap:12px}
          .hub-scene .hc-ic{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:none;border:1px solid rgba(255,255,255,.12)}
          .hub-scene .hc-ic.red{background:rgba(198,26,26,.16);color:#f09a90}
          .hub-scene .hc-ic.blue{background:rgba(70,130,180,.16);color:#a8c6e8}
          .hub-scene .hc-ic.gold{background:rgba(201,161,77,.16);color:#ead9b4}
          .hub-scene .hc-ic.cosmo{background:rgba(150,110,210,.16);color:#cbb3f0}
          .hub-scene .hc-tag{font-size:10.5px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#99a2b2;text-align:right;max-width:150px}
          .hub-scene .hc-body{margin-top:14px}
          .hub-scene .hc-ct{font-size:21px;font-weight:700;letter-spacing:-.4px;color:#fff;margin-bottom:6px}
          .hub-scene .hc-cd{font-size:13.5px;line-height:1.5;color:#c0c7d3}
          .hub-scene .hc-go{margin-top:14px;display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:#f1ead9}
          .hub-scene .hc-go svg{color:#e3c987;transition:transform .2s}
          .hub-scene .hc-card:hover .hc-go svg{transform:translateX(3px)}

          /* Central (jefa) · contenido arriba, no centrado */
          .hub-scene .hc-central{padding:26px 32px;justify-content:flex-start}
          .hub-scene .hc-central .hc-body{margin-top:18px}
          .hub-scene .hc-central .hc-ctop{align-items:flex-start}
          .hub-scene .hc-central .hc-ic.big{width:54px;height:54px}
          .hub-scene .hc-central .hc-ct{font-size:32px;letter-spacing:-.8px;margin-bottom:8px}
          .hub-scene .hc-central .hc-cd{font-size:15px;max-width:44ch}
          .hub-scene .hc-central .hc-go.big{font-size:15px;margin-top:18px}
          .hub-scene .hc-big{text-align:right}
          .hub-scene .hc-big .n{font-size:46px;font-weight:800;letter-spacing:-2px;color:#fff;line-height:1}
          .hub-scene .hc-big .l{font-size:12px;color:#aab2c2;margin-top:2px}
          .hub-scene .hc-live{margin-top:12px;display:inline-flex;align-items:center;gap:8px;font-size:14px;color:#f3c9c4}
          .hub-scene .hc-live b{color:#fff;font-weight:800;font-size:16px}
          .hub-scene .hc-mini{margin-top:16px}
          .hub-scene .hc-mini-h{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#99a2b2;margin-bottom:8px}
          .hub-scene .hc-mini-h b{color:#7fd09a}
          .hub-scene .hc-spark{width:100%;max-width:360px;height:56px;display:block}

          /* VIP próximamente */
          .hub-scene .hc-vip{flex-direction:row;align-items:center;justify-content:space-between;gap:20px;
            background:linear-gradient(110deg,rgba(60,45,16,.58),rgba(12,12,16,.8) 62%);border:1px dashed rgba(201,161,77,.28);opacity:.86;cursor:default}
          .hub-scene .hc-vip::before{display:none}
          .hub-scene .hc-vip:hover{transform:none;box-shadow:none}
          .hub-scene .hc-vg{display:flex;align-items:center;gap:16px}
          .hub-scene .hc-vip .hc-body{margin:0}
          .hub-scene .hc-vip .hc-ct{font-size:20px;margin-bottom:3px}
          .hub-scene .hc-soonbadge{font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#1a140a;background:linear-gradient(135deg,#e7cf92,#c9a14d);padding:5px 11px;border-radius:20px}
          .hub-scene .hc-btn{padding:12px 20px;border:1px solid rgba(201,161,77,.5);border-radius:12px;background:rgba(201,161,77,.12);font-weight:600;font-size:14px;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;color:#f1ead9}
          .hub-scene .hc-btn.dis{opacity:.6;cursor:default;border-style:dashed}

          @media (max-width:1100px){
            .hub-scene .hc-metrics{grid-template-columns:1fr 1fr;max-width:none}
          }
          @media (max-width:860px){
            .hub-scene .hc-wrap{padding:0 18px 90px}
            .hub-scene .hc-img{background-position:center 50%}
            .hub-scene .hc-bento{grid-auto-rows:auto;grid-template-columns:1fr;
              grid-template-areas:"c" "p" "r" "s" "f" "v" "n"}
            .hub-scene .hc-central{min-height:360px}
            .hub-scene .hc-card{min-height:170px}
            .hub-scene .hc-vip{flex-direction:column;align-items:flex-start;gap:14px}
          }
          @media (max-width:560px){
            .hub-scene .hc-metrics{grid-template-columns:1fr 1fr;gap:10px}
            .hub-scene .hc-title{font-size:34px}
          }
        `}</style>
      </div>
    </>
  );
}
