'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  v4 · Rediseño producto:
//   · Menú lateral (Sidebar) global que se expande al hover.
//   · Pantalla de CARGA mientras entra la imagen (no más texto antes que foto).
//   · Tipografía Inter · cursiva roja solo como detalle del saludo.
//   · Panel de MÉTRICAS con cifras grandes.
//   · Jerarquía: Central de Leads protagonista (a todo lo ancho) · Peritación,
//     Recursos y VIP destacadas · Subir/Formación/NEXOCAR en 2º nivel.
//   · CTAs propios + hover con borde iluminado.
//   · Fondo: la foto se ve entera, sin fundido negro abajo.
//  NOTA: el <Sidebar/> va aquí para que funcione la Home. Para tenerlo en
//  TODAS las páginas, muévelo a app/layout.jsx (y quítalo de aquí).
// =====================================================================

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MenuDrawer from './components/MenuDrawer';
import BottomNav from './components/BottomNav';
import GuiaTour, { BotonGuia, useGuia } from './components/GuiaTour';
import { Target, Gem, UploadCloud, GraduationCap, FolderOpen, Gauge, ClipboardCheck, Bell } from 'lucide-react';

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

export default function HomeClient({ email, perfil, stats = {} }) {
  const router = useRouter();
  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;
  const nombre = (perfil?.nombre || email || '').split('@')[0].split(' ')[0];
  const eur = (n) => (n || 0).toLocaleString('es-ES') + ' €';
  const guia = useGuia('hub-v1');

  const [saludo, setSaludo] = useState('Bienvenido de nuevo');
  const [listo, setListo] = useState(false);     // imagen cargada → fuera la pantalla de carga
  const sceneRef = useRef(null);

  useEffect(() => { try { setSaludo(saludoPorHora(new Date().getHours())); } catch {} }, []);

  // ---- carga: esperamos a la imagen-héroe antes de mostrar el panel ----
  useEffect(() => {
    let hecho = false;
    const fin = () => { if (!hecho) { hecho = true; setListo(true); } };
    try {
      const img = new window.Image();
      img.onload = fin; img.onerror = fin; img.src = HERO;
      if (img.complete) fin();
    } catch { fin(); }
    const t = setTimeout(fin, 3500); // red de seguridad
    return () => clearTimeout(t);
  }, []);

  // ---- parallax sutil del fondo con el ratón ----
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const img = scene.querySelector('.hc-img');
    const far = scene.querySelector('.hc-far');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    const onMove = (e) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; };
    const loop = () => {
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      if (img) img.style.transform = `scale(1.05) translate(${cx * -9}px,${cy * -6}px)`;
      if (far) far.style.transform = `translate(${cx * 7}px,${cy * 7}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('mousemove', onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, []);

  const stars = useMemo(() => Array.from({ length: 120 }, () => ({
    x: (Math.random() * 100).toFixed(2), y: (Math.random() * 100).toFixed(2),
    r: (Math.random() * 1.4 + 0.3).toFixed(2), o: (Math.random() * 0.5 + 0.15).toFixed(2),
  })), []);

  const pasosHub = [
    { seccion: 'Tu panel', titulo: `Hola, ${nombre}. Este es tu panel.`,
      texto: 'Desde aquí entras a todo. Te enseño para qué sirve cada herramienta.' },
    { sel: '[data-tour="t-central"]', seccion: 'Herramienta', titulo: 'Central de Leads',
      texto: 'El corazón de todo: llegan clientes en tiempo real, los reservas, contactas y cierras.' },
    { sel: '[data-tour="t-peritacion"]', seccion: 'Herramienta', titulo: 'Peritación',
      texto: 'Inspecciona la unidad paso a paso con informe final. Para no comprar a ciegas.' },
    { sel: '[data-tour="t-recursos"]', seccion: 'Herramienta', titulo: 'Recursos',
      texto: 'Plantillas, contratos y contactos de confianza para ejecutar cada paso.' },
    { sel: '[data-tour="t-stats"]', seccion: 'Resumen', titulo: 'Tus métricas en directo',
      texto: 'Leads disponibles, clientes activos y tu inversión en marcha, de un vistazo.' },
    { seccion: 'Listo', titulo: 'Ya conoces tu panel',
      texto: 'Empieza por la Central de Leads. Vuelve a ver esto con ¿Cómo funciona?' },
  ];

  const Flecha = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
  const Ext = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10" /></svg>);

  return (
    <>
      <Sidebar />

      <div className="hub-scene" ref={sceneRef}>
        <link rel="preload" as="image" href={HERO} fetchPriority="high" />

        {/* ===== pantalla de carga ===== */}
        <div className={'hc-load' + (listo ? ' done' : '')} aria-hidden={listo}>
          <div className="hc-load-in">
            <div className="hc-load-logo"><img src="/collector.jpg" alt="GPSO" /></div>
            <div className="hc-spin" />
            <div className="hc-load-tx">Preparando tu central…</div>
          </div>
        </div>

        {/* ===== fondo ===== */}
        <div className="hc-sky" aria-hidden="true" />
        <div className="hc-layer hc-far" aria-hidden="true">
          {stars.map((s, i) => <i key={i} style={{ left: s.x + '%', top: s.y + '%', width: s.r + 'px', height: s.r + 'px', opacity: s.o }} />)}
        </div>
        <div className="hc-img" style={{ backgroundImage: `url('${HERO}')` }} aria-hidden="true" />
        <div className="hc-tint" aria-hidden="true" />

        {/* ===== contenido ===== */}
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
              : <div className="hc-mt"><div className="hc-lab">Tu progreso</div><div className="hc-num">{(stats.misClientes ?? 0)}</div><div className="hc-hint">clientes cerrados</div></div>}
          </div>

          {/* ===== BENTO: Central protagonista ===== */}
          <div className={'hc-bento' + (!(esVip || esAdmin) ? ' novip' : '')}>

            {/* HERO · Central de Leads */}
            <div className="hc-card hc-hero" data-tour="t-central" onClick={() => router.push('/central')}>
              <div className="hc-hero-l">
                <span className="hc-tag"><span className="hc-d d-red" />Leads en directo</span>
                <h2 className="hc-ct">Central de Leads</h2>
                <p className="hc-cd">Reserva y gestiona tus clientes de importación en tiempo real. El corazón de tu operativa.</p>
                <span className="hc-go big">Gestionar leads <Flecha /></span>
              </div>
              <div className="hc-hero-r">
                <div className="hc-big"><span className="hc-dotlive" />{stats.leadsDisp ?? 0}</div>
                <div className="hc-big-lab">leads esperando ahora</div>
              </div>
            </div>

            {/* destacadas */}
            <div className="hc-card hc-perito" data-tour="t-peritacion" onClick={() => router.push('/peritacion')}>
              <span className="hc-tag"><span className="hc-d d-blue" />Inspección guiada</span>
              <h2 className="hc-ct">Peritación</h2>
              <p className="hc-cd">Revisa la unidad paso a paso y sabe si hay algo de lo que preocuparse.</p>
              <span className="hc-go">Iniciar inspección <Flecha /></span>
            </div>

            <div className="hc-card hc-recursos" data-tour="t-recursos" onClick={() => router.push('/recursos')}>
              <span className="hc-tag"><span className="hc-d d-cosmo" />El universo del importador</span>
              <h2 className="hc-ct">Recursos</h2>
              <p className="hc-cd">Plantillas, contratos y contactos de confianza —transporte, gestorías, ITV.</p>
              <span className="hc-go">Explorar recursos <Flecha /></span>
            </div>

            {(esVip || esAdmin) && (
              <div className="hc-card hc-vip" onClick={() => router.push('/vip')}>
                <div className="hc-vip-tx">
                  <span className="hc-tag"><span className="hc-d d-gold" />Exclusivo · VIP</span>
                  <h2 className="hc-ct">Inversión VIP</h2>
                  <p className="hc-cd">Coinversión en coches de alta gama seleccionados por Collector.</p>
                </div>
                <span className="hc-go vip">Ver inversiones <Flecha /></span>
              </div>
            )}

            {/* segundo nivel */}
            <div className="hc-card lvl2 hc-stock" onClick={() => window.open(URL_STOCK, '_blank', 'noopener,noreferrer')}>
              <span className="hc-tag"><span className="hc-d d-blue" />Cesión de venta</span>
              <h2 className="hc-ct">Subir unidades</h2>
              <span className="hc-go">Subir mi coche <Ext /></span>
            </div>
            <div className="hc-card lvl2 hc-formacion" onClick={() => window.open(URL_FORMACION, '_blank', 'noopener,noreferrer')}>
              <span className="hc-tag"><span className="hc-d d-gold" />Academia</span>
              <h2 className="hc-ct">Formación</h2>
              <span className="hc-go">Ir a la academia <Ext /></span>
            </div>
            <div className="hc-card lvl2 hc-nexocar" onClick={() => window.open(URL_NEXOCAR, '_blank', 'noopener,noreferrer')}>
              <span className="hc-tag"><span className="hc-d d-red" />Herramienta</span>
              <h2 className="hc-ct">NEXOCAR</h2>
              <span className="hc-go">Analizar vehículo <Ext /></span>
            </div>
          </div>
        </div>

        <GuiaTour run={guia.run} steps={pasosHub} onClose={guia.cerrar} />
        <BottomNav perfil={perfil} activa="inicio" />

        <style jsx global>{`
          .hub-scene{position:relative;min-height:100vh;margin-left:76px;overflow-x:hidden;background:#070910;color:#eef1f6;
            font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
          @media (max-width:860px){ .hub-scene{margin-left:0} }

          /* ===== pantalla de carga ===== */
          .hub-scene .hc-load{position:fixed;inset:0;z-index:200;background:#070910;display:grid;place-items:center;
            transition:opacity .5s ease;opacity:1}
          .hub-scene .hc-load.done{opacity:0;pointer-events:none}
          .hub-scene .hc-load-in{display:flex;flex-direction:column;align-items:center;gap:18px}
          .hub-scene .hc-load-logo{width:68px;height:68px;border-radius:18px;overflow:hidden;border:1px solid rgba(201,161,77,.4)}
          .hub-scene .hc-load-logo img{width:100%;height:100%;object-fit:cover}
          .hub-scene .hc-spin{width:30px;height:30px;border-radius:50%;border:2.5px solid rgba(201,161,77,.2);border-top-color:#e3c987;animation:hcSpin .8s linear infinite}
          @keyframes hcSpin{to{transform:rotate(360deg)}}
          .hub-scene .hc-load-tx{font-size:13px;color:#9aa3b2;letter-spacing:.3px}

          /* ===== fondo: la foto se ve entera (sin fundido negro) ===== */
          .hub-scene .hc-sky{position:fixed;inset:0;z-index:0;background:#070910}
          .hub-scene .hc-img{position:fixed;inset:0;z-index:0;background-position:center 54%;background-size:cover;background-repeat:no-repeat;
            transform:scale(1.05);will-change:transform;animation:hcImgIn .7s ease both}
          @keyframes hcImgIn{from{opacity:0}to{opacity:1}}
          .hub-scene .hc-tint{position:fixed;inset:0;z-index:1;pointer-events:none;background:
            linear-gradient(118deg, rgba(7,9,16,.62) 0%, rgba(7,9,16,.24) 28%, rgba(7,9,16,0) 54%),
            radial-gradient(135% 95% at 50% 36%, transparent 52%, rgba(7,9,16,.42) 100%),
            linear-gradient(180deg, rgba(7,9,16,.1) 0%, rgba(7,9,16,.08) 52%, rgba(7,9,16,.26) 86%, rgba(7,9,16,.4) 100%)}
          .hub-scene .hc-layer{position:fixed;inset:-80px;z-index:1;pointer-events:none;will-change:transform;
            -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 30%,transparent 58%);mask-image:linear-gradient(to bottom,#000 0%,#000 30%,transparent 58%)}
          .hub-scene .hc-layer i{position:absolute;background:#cfd6e4;border-radius:50%}

          .hub-scene .hc-wrap{position:relative;z-index:3;max-width:1300px;margin:0 auto;padding:0 34px 56px}

          /* top */
          .hub-scene .hc-top{display:flex;padding:20px 0 2px}
          .hub-scene .hc-top-right{margin-left:auto;display:flex;align-items:center;gap:10px}
          .hub-scene .hc-iconbtn{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(16,19,28,.5);
            backdrop-filter:blur(8px);display:grid;place-items:center;color:#d6dbe4;position:relative;cursor:pointer}
          .hub-scene .hc-iconbtn:hover{border-color:rgba(255,255,255,.25)}
          .hub-scene .hc-bn{position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;background:#e85a4f;box-shadow:0 0 0 2px #0c0f17}

          /* saludo */
          .hub-scene .hc-greet{padding:14px 0 22px}
          .hub-scene .hc-kick{font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#aab2c2;font-weight:600;margin-bottom:12px}
          .hub-scene .hc-title{font-size:clamp(38px,4.2vw,54px);font-weight:800;letter-spacing:-1.7px;line-height:1;margin:0;color:#fff}
          .hub-scene .hc-sub{font-family:'Cormorant',Georgia,serif;font-style:italic;font-weight:600;font-size:clamp(20px,2.2vw,26px);color:#e85a4f;margin-top:6px}

          /* métricas */
          .hub-scene .hc-metrics{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:14px;margin:4px 0 24px}
          .hub-scene .hc-mt{border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:18px 20px;background:rgba(13,16,24,.62);backdrop-filter:blur(14px)}
          .hub-scene .hc-mt.key{border-color:rgba(232,68,59,.4);background:linear-gradient(120deg,rgba(198,26,26,.18),rgba(13,16,24,.62) 60%)}
          .hub-scene .hc-lab{font-size:11.5px;letter-spacing:.6px;text-transform:uppercase;color:#9aa3b2;font-weight:600;display:flex;align-items:center;gap:8px}
          .hub-scene .hc-num{font-size:34px;font-weight:800;letter-spacing:-1px;margin-top:8px;line-height:1;color:#eef1f6}
          .hub-scene .hc-mt.key .hc-num{color:#fff}
          .hub-scene .hc-num.g{color:#e3c987}
          .hub-scene .hc-hint{font-size:12px;color:#9aa3b2;margin-top:6px}
          .hub-scene .hc-hint b{color:#e85a4f}
          .hub-scene .hc-dotlive{width:8px;height:8px;border-radius:50%;background:#e85a4f;box-shadow:0 0 0 0 rgba(232,90,79,.7);animation:hcPl 1.8s infinite}
          @keyframes hcPl{0%{box-shadow:0 0 0 0 rgba(232,90,79,.6)}70%{box-shadow:0 0 0 7px rgba(232,90,79,0)}100%{box-shadow:0 0 0 0 rgba(232,90,79,0)}}

          /* bento */
          .hub-scene .hc-bento{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:172px;gap:16px;
            grid-template-areas:
              "h h h h h h h h h h h h"
              "h h h h h h h h h h h h"
              "p p p p r r r r v v v v"
              "s s s s f f f f n n n n"}
          .hub-scene .hc-bento.novip{grid-template-areas:
              "h h h h h h h h h h h h"
              "h h h h h h h h h h h h"
              "p p p p p p r r r r r r"
              "s s s s f f f f n n n n"}
          .hub-scene .hc-hero{grid-area:h}.hub-scene .hc-perito{grid-area:p}.hub-scene .hc-recursos{grid-area:r}
          .hub-scene .hc-vip{grid-area:v}.hub-scene .hc-stock{grid-area:s}.hub-scene .hc-formacion{grid-area:f}.hub-scene .hc-nexocar{grid-area:n}

          .hub-scene .hc-card{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.1);cursor:pointer;
            background:linear-gradient(180deg,rgba(15,18,27,.72),rgba(9,11,18,.82));backdrop-filter:blur(16px);
            display:flex;flex-direction:column;justify-content:flex-end;padding:24px;
            transition:transform .22s cubic-bezier(.2,.7,.3,1),border-color .25s,box-shadow .25s}
          .hub-scene .hc-card::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;pointer-events:none;opacity:0;transition:opacity .25s;
            background:linear-gradient(140deg,rgba(232,163,61,.7),rgba(232,163,61,0) 45%);
            -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
          .hub-scene .hc-card:hover{transform:translateY(-4px);border-color:rgba(232,163,61,.35);box-shadow:0 24px 60px rgba(0,0,0,.5)}
          .hub-scene .hc-card:hover::before{opacity:1}

          .hub-scene .hc-tag{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#aab2c2;margin-bottom:auto}
          .hub-scene .hc-d{width:7px;height:7px;border-radius:50%;flex:none}
          .hub-scene .d-red{background:#e85a4f;box-shadow:0 0 8px rgba(232,90,79,.8)}
          .hub-scene .d-blue{background:#7fa6d8;box-shadow:0 0 8px rgba(127,166,216,.8)}
          .hub-scene .d-gold{background:#E8A33D;box-shadow:0 0 8px rgba(232,163,61,.8)}
          .hub-scene .d-cosmo{background:#b08ce8;box-shadow:0 0 8px rgba(176,140,232,.8)}
          .hub-scene .hc-ct{font-size:22px;font-weight:700;letter-spacing:-.5px;color:#fff;margin:14px 0 7px}
          .hub-scene .hc-cd{font-size:14px;line-height:1.5;color:#c4cbd6;max-width:42ch;margin:0}
          .hub-scene .hc-go{margin-top:16px;display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#f1ead9}
          .hub-scene .hc-go svg{transition:transform .2s}
          .hub-scene .hc-card:hover .hc-go svg{transform:translateX(3px)}
          .hub-scene .hc-go svg{color:#e3c987}

          /* HERO Central */
          .hub-scene .hc-hero{flex-direction:row;align-items:stretch;gap:24px;padding:28px 30px}
          .hub-scene .hc-hero-l{display:flex;flex-direction:column;justify-content:flex-end;flex:1;min-width:0}
          .hub-scene .hc-hero .hc-ct{font-size:34px;letter-spacing:-1px;margin-top:16px}
          .hub-scene .hc-hero .hc-cd{font-size:15px;max-width:48ch}
          .hub-scene .hc-go.big{font-size:15px;margin-top:18px}
          .hub-scene .hc-hero-r{flex:none;width:260px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;
            border-left:1px solid rgba(255,255,255,.08);padding-left:24px}
          .hub-scene .hc-big{font-size:68px;font-weight:800;letter-spacing:-3px;line-height:1;color:#fff;display:flex;align-items:center;gap:12px}
          .hub-scene .hc-big-lab{font-size:13px;color:#aab2c2;margin-top:6px;text-align:right}

          /* VIP elegante */
          .hub-scene .hc-vip{flex-direction:row;align-items:center;justify-content:space-between;gap:20px;
            background:linear-gradient(110deg,rgba(60,45,16,.62),rgba(12,12,16,.8) 62%);border-color:rgba(201,161,77,.3)}
          .hub-scene .hc-vip .hc-ct{margin:6px 0 4px;font-size:21px}
          .hub-scene .hc-vip .hc-cd{margin:0}
          .hub-scene .hc-go.vip{margin-top:0;padding:12px 20px;border:1px solid rgba(201,161,77,.5);border-radius:12px;background:rgba(201,161,77,.12);white-space:nowrap}

          .hub-scene .lvl2{background:linear-gradient(180deg,rgba(13,15,23,.64),rgba(9,11,17,.78))}
          .hub-scene .lvl2 .hc-ct{font-size:20px}

          /* ===== responsive ===== */
          @media (max-width:1100px){
            .hub-scene .hc-metrics{grid-template-columns:1fr 1fr}
            .hub-scene .hc-hero-r{width:200px}
            .hub-scene .hc-big{font-size:54px}
          }
          @media (max-width:860px){
            .hub-scene .hc-wrap{padding:0 18px 90px}
            .hub-scene .hc-img{background-position:center 50%}
            .hub-scene .hc-bento{grid-auto-rows:auto;grid-template-columns:1fr;
              grid-template-areas:"h" "p" "r" "v" "s" "f" "n"}
            .hub-scene .hc-bento.novip{grid-template-areas:"h" "p" "r" "s" "f" "n"}
            .hub-scene .hc-hero{flex-direction:column}
            .hub-scene .hc-hero-r{width:100%;align-items:flex-start;border-left:none;border-top:1px solid rgba(255,255,255,.08);padding-left:0;padding-top:16px;margin-top:16px}
            .hub-scene .hc-big-lab{text-align:left}
            .hub-scene .hc-card{min-height:150px}
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
