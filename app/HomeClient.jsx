'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  v3 · REDISEÑO "una sola noche":
//   · Fondo-héroe: coche+galaxia arriba (/hero-galaxy.webp) + carretera/
//     ciudad abajo (/hero-cosmos-bottom.webp), fundidos al cosmos central.
//   · Parallax con el ratón (giroscopio en móvil) + estrellas que titilan.
//   · Bento en glass con inclinación 3D y brillo que sigue al cursor.
//   · Barra de datos en directo + saludo según la hora.
//   · Mantiene rutas, MenuDrawer, BottomNav y el tutorial GuiaTour.
//  IMÁGENES: súbelas a public/ con estos nombres exactos.
// =====================================================================

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';
import MenuDrawer from './components/MenuDrawer';
import BottomNav from './components/BottomNav';
import GuiaTour, { BotonGuia, useGuia } from './components/GuiaTour';
import { Target, Gem, UploadCloud, ArrowRight, GraduationCap, FolderOpen, Gauge, ClipboardCheck } from 'lucide-react';

const URL_STOCK = 'https://gpsocollector.com/acceso';
const URL_FORMACION = 'https://academy.gpsocollector.com';
const URL_NEXOCAR = 'https://nexocar.app';

const HERO = '/hero-galaxy.webp';            // imagen-héroe única (el Porsche)

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
  const sceneRef = useRef(null);

  useEffect(() => { try { setSaludo(saludoPorHora(new Date().getHours())); } catch {} }, []);

  // estrellas (se generan una vez)
  const stars = useMemo(() => {
    const gen = (n, maxr) => Array.from({ length: n }, () => ({
      x: (Math.random() * 100).toFixed(2), y: (Math.random() * 100).toFixed(2),
      r: (Math.random() * maxr + 0.3).toFixed(2), d: (Math.random() * 4).toFixed(2),
    }));
    return { far: gen(150, 1.1), near: gen(64, 1.8) };
  }, []);

  // parallax (ratón / giroscopio) + inclinación 3D de las tarjetas
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const far = scene.querySelector('.hc-far');
    const near = scene.querySelector('.hc-near');
    const img = scene.querySelector('.hc-img');
    const imgB = scene.querySelector('.hc-imgB');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf;

    const onMove = (e) => { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; };
    const onTilt = (e) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 30));
      ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    const loop = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      if (far) far.style.transform = `translate(${cx * 8}px,${cy * 8}px)`;
      if (near) near.style.transform = `translate(${cx * 18}px,${cy * 18}px)`;
      if (img) img.style.transform = `scale(1.05) translate(${cx * -10}px,${cy * -7}px)`;
      if (imgB) imgB.style.transform = `translate(${cx * 8}px,${cy * 6}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('deviceorientation', onTilt);

    const cards = Array.from(scene.querySelectorAll('.hc-card'));
    const bound = [];
    cards.forEach((c) => {
      const move = (e) => {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.transform = `rotateY(${(px - 0.5) * 7}deg) rotateX(${(0.5 - py) * 7}deg) translateY(-3px)`;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
      };
      const leave = () => { c.style.transform = ''; };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerleave', leave);
      bound.push([c, move, leave]);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onTilt);
      bound.forEach(([c, m, l]) => { c.removeEventListener('pointermove', m); c.removeEventListener('pointerleave', l); });
    };
  }, [esVip, esAdmin]);

  // ---- tutorial del panel (igual que antes) ----
  const pasosHub = [
    { seccion: 'Tu panel', titulo: `Hola, ${nombre}. Este es tu panel.`,
      texto: 'Desde aquí entras a todo. Te enseño en 30 segundos para qué sirve cada herramienta. Usa <b>Siguiente</b> o las flechas.' },
    { sel: '[data-tour="t-central"]', seccion: 'Herramienta', titulo: 'Central de Leads',
      texto: 'El corazón de todo. Llegan en tiempo real personas que quieren comprar o importar un coche: las <b>reservas</b>, las <b>contactas</b> y <b>cierras</b> la venta.' },
    { sel: '[data-tour="t-peritacion"]', seccion: 'Herramienta', titulo: 'Peritación',
      texto: 'Inspecciona la unidad <b>paso a paso</b>: 140 puntos, espesómetro, ruedas e <b>informe final con semáforo</b>. Para no comprar a ciegas.' },
    ...((esVip || esAdmin) ? [{ sel: '[data-tour="t-vip"]', seccion: 'Herramienta', titulo: 'Inversión VIP',
      texto: 'Coinvierte con nosotros en coches de alta gama seleccionados por Collector. Exclusivo para miembros <b style="color:var(--gold)">VIP</b>.' }] : []),
    { sel: '[data-tour="t-stock"]', seccion: 'Herramienta', titulo: 'Subir unidades',
      texto: '¿Tienes un coche para vender? Súbelo y lo <b>gestionamos en venta</b> desde nuestro stock.' },
    { sel: '[data-tour="t-formacion"]', seccion: 'Herramienta', titulo: 'Formación',
      texto: 'Todos los <b>módulos, vídeos y masterclasses</b> de la academia.' },
    { sel: '[data-tour="t-recursos"]', seccion: 'Herramienta', titulo: 'Recursos',
      texto: 'Tu universo: <b>plantillas, contratos, contactos</b> (gestorías, transporte…) y datos clave para ejecutar cada paso.' },
    { sel: '[data-tour="t-nexocar"]', seccion: 'Herramienta', titulo: 'NEXOCAR',
      texto: 'Calcula una importación de principio a fin y mira la <b>rentabilidad real</b> de cada coche.' },
    { sel: '[data-tour="t-stats"]', seccion: 'Resumen', titulo: 'Tu resumen en directo',
      texto: 'Leads disponibles ahora, tus clientes activos y, si eres VIP, tus operaciones e inversión en marcha.' },
    { seccion: 'Listo', titulo: 'Ya conoces tu panel',
      texto: 'Empieza por la <b>Central de Leads</b>. Puedes volver a ver esto con <b style="color:var(--gold)">¿Cómo funciona?</b>' },
  ];

  const go = (icon, texto, externo) => (
    <span className="hc-go">{icon} {texto} {externo ? '↗' : <ArrowRight size={15} />}</span>
  );

  return (
    <div className="hub-scene" ref={sceneRef}>
      {/* ===== fondos ===== */}
      <div className="hc-sky" aria-hidden="true" />
      <div className="hc-layer hc-far" aria-hidden="true">
        {stars.far.map((s, i) => <i key={i} style={{ left: s.x + '%', top: s.y + '%', width: s.r + 'px', height: s.r + 'px', animationDelay: s.d + 's' }} />)}
      </div>
      <div className="hc-layer hc-near" aria-hidden="true">
        {stars.near.map((s, i) => <i key={i} style={{ left: s.x + '%', top: s.y + '%', width: s.r + 'px', height: s.r + 'px', animationDelay: s.d + 's' }} />)}
      </div>
      <div className="hc-img" style={{ backgroundImage: `url('${HERO}')` }} aria-hidden="true" />
      <div className="hc-imgScrim" aria-hidden="true" />

      {/* ===== contenido ===== */}
      <div className="hc-page">
        {/* topbar */}
        <header className="hc-top">
          <div className="hc-brand">
            <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
            <div>
              <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
              <div className="hc-plat">Plataforma</div>
            </div>
          </div>
          <MenuDrawer perfil={perfil} email={email} />
        </header>

        {/* saludo */}
        <div className="hc-greet">
          <div className="hc-kick">{saludo}</div>
          <h1 className="display hc-title">Hola, {nombre}. <span className="acento-serif hc-serif">tu central te espera.</span></h1>
          <div className="hc-nudge">Tienes <b>{stats.leadsDisp ?? 0} leads</b> disponibles ahora mismo <span className="hc-arr">→</span></div>
          <div style={{ marginTop: 16 }}><BotonGuia onClick={guia.abrir} texto="¿Cómo funciona la plataforma?" /></div>
        </div>

        {/* barra de datos en directo */}
        <div className="hc-pulse" data-tour="t-stats">
          <div className="hc-chip live"><span className="hc-dotlive" />{stats.leadsDisp ?? 0} leads en directo</div>
          <div className="hc-chip"><b>{stats.misClientes ?? 0}</b> clientes activos</div>
          {stats.peritaciones != null && <div className="hc-chip"><b>{stats.peritaciones}</b> peritadas</div>}
          {(esVip || esAdmin) && <div className="hc-chip"><b>{stats.opsVip ?? 0}</b> operaciones VIP</div>}
          {(esVip || esAdmin) && <div className="hc-chip"><span className="hc-g">{eur(stats.inversionActiva)}</span> invertidos</div>}
        </div>

        {/* bento */}
        <div className={'hc-bento' + (!(esVip || esAdmin) ? ' novip' : '')}>
          <div className="hc-card hc-central" data-tour="t-central" onClick={() => router.push('/central')}>
            <div className="hc-glow g-red" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-red" />Leads en directo</span>
              <h2 className="display hc-ct">Central de Leads</h2>
              <p className="hc-cd">Reserva y gestiona tus clientes de importación en tiempo real. El corazón de tu operativa.</p>
              <span className="hc-live"><span className="hc-dotlive" />{stats.leadsDisp ?? 0} esperando ahora</span>
              {go(<Target size={15} />, 'Entrar')}
            </div>
          </div>

          <div className="hc-card hc-perito" data-tour="t-peritacion" onClick={() => router.push('/peritacion')}>
            <div className="hc-glow g-blue" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-blue" />Inspección guiada</span>
              <h2 className="display hc-ct">Peritación</h2>
              <p className="hc-cd">Revisa la unidad paso a paso y sabe si hay algo de lo que preocuparse.</p>
              {go(<ClipboardCheck size={15} />, 'Entrar')}
            </div>
          </div>

          {(esVip || esAdmin) && (
            <div className="hc-card hc-vip" data-tour="t-vip" onClick={() => router.push('/vip')}>
              <div className="hc-glow g-gold" /><div className="hc-shine" /><div className="hc-c">
                <span className="hc-badge"><span className="dt dt-gold" />Exclusivo</span>
                <h2 className="display hc-ct">Inversión VIP</h2>
                <p className="hc-cd">Coinversión en coches de alta gama seleccionados por Collector.</p>
                {go(<Gem size={15} />, 'Entrar')}
              </div>
            </div>
          )}

          <div className="hc-card hc-recursos" data-tour="t-recursos" onClick={() => router.push('/recursos')}>
            <div className="hc-glow g-cosmo" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-cosmo" />El universo del importador</span>
              <h2 className="display hc-ct">Recursos</h2>
              <p className="hc-cd">Plantillas, contratos y contactos de confianza —transporte, gestorías, ITV— para cerrar cada operación.</p>
              {go(<FolderOpen size={15} />, 'Explorar el universo')}
            </div>
          </div>

          <div className="hc-card hc-stock" data-tour="t-stock" onClick={() => window.open(URL_STOCK, '_blank', 'noopener,noreferrer')}>
            <div className="hc-glow g-blue" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-blue" />Cesión de venta</span>
              <h2 className="display hc-ct">Subir unidades</h2>
              {go(<UploadCloud size={15} />, 'Entrar', true)}
            </div>
          </div>

          <div className="hc-card hc-formacion" data-tour="t-formacion" onClick={() => window.open(URL_FORMACION, '_blank', 'noopener,noreferrer')}>
            <div className="hc-glow g-gold" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-gold" />Academia</span>
              <h2 className="display hc-ct">Formación</h2>
              {go(<GraduationCap size={15} />, 'Entrar', true)}
            </div>
          </div>

          <div className="hc-card hc-nexocar" data-tour="t-nexocar" onClick={() => window.open(URL_NEXOCAR, '_blank', 'noopener,noreferrer')}>
            <div className="hc-glow g-red" /><div className="hc-shine" /><div className="hc-c">
              <span className="hc-badge"><span className="dt dt-red" />Herramienta</span>
              <h2 className="display hc-ct">NEXOCAR</h2>
              <p className="hc-cd">Calcula importaciones y analiza la rentabilidad real de cada coche.</p>
              {go(<Gauge size={15} />, 'Entrar', true)}
            </div>
          </div>
        </div>
      </div>

      <GuiaTour run={guia.run} steps={pasosHub} onClose={guia.cerrar} />
      <BottomNav perfil={perfil} activa="inicio" />

      <style jsx global>{`
        .hub-scene{position:relative;min-height:100vh;overflow-x:hidden;background:#060810;color:#ece7dd}

        /* ----- fondos ----- */
        .hub-scene .hc-sky{position:fixed;inset:0;z-index:0;background:
          radial-gradient(1100px 700px at 50% 120%, rgba(90,122,168,.10), transparent 60%),#060810}
        .hub-scene .hc-layer{position:fixed;inset:-80px;z-index:0;pointer-events:none;will-change:transform}
        .hub-scene .hc-layer i{position:absolute;background:#cfd6e4;border-radius:50%}
        .hub-scene .hc-far i{animation:hcTw 4s ease-in-out infinite alternate}
        .hub-scene .hc-near i{animation:hcTw 2.6s ease-in-out infinite alternate}
        @keyframes hcTw{from{opacity:.2}to{opacity:.95}}
        .hub-scene .hc-near{animation:hcDrift 60s linear infinite}
        @keyframes hcDrift{from{translate:0 0}to{translate:26px -16px}}

        /* HERO: una sola imagen (coche) fundida al cosmos. --hc-hero-h y
           background-position son las palancas si quieres ver más/menos coche. */
        .hub-scene .hc-img{position:fixed;top:0;left:0;right:0;height:820px;z-index:1;pointer-events:none;
          background-position:center 48%;background-size:cover;background-repeat:no-repeat;transform:scale(1.04);will-change:transform;
          -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 40%,rgba(0,0,0,.6) 72%,rgba(0,0,0,.15) 90%,rgba(0,0,0,0) 100%);
                  mask-image:linear-gradient(to bottom,#000 0%,#000 40%,rgba(0,0,0,.6) 72%,rgba(0,0,0,.15) 90%,rgba(0,0,0,0) 100%)}
        .hub-scene .hc-imgScrim{position:fixed;top:0;left:0;right:0;height:820px;z-index:1;pointer-events:none;background:
          linear-gradient(115deg, rgba(6,8,16,.5) 0%, rgba(6,8,16,.16) 36%, rgba(6,8,16,0) 66%),
          linear-gradient(180deg, rgba(6,8,16,0) 58%, rgba(6,8,16,.4) 80%, rgba(6,8,16,.85) 93%, #060810 100%)}
        @media (prefers-reduced-motion:reduce){
          .hub-scene .hc-far i,.hub-scene .hc-near i,.hub-scene .hc-near{animation:none}
        }

        /* ----- layout ----- */
        .hub-scene .hc-page{position:relative;z-index:3;max-width:1040px;margin:0 auto;padding:26px 26px 90px}
        .hub-scene .hc-top{display:flex;justify-content:space-between;align-items:center}
        .hub-scene .hc-brand{display:flex;align-items:center;gap:12px}
        .hub-scene .hc-plat{font-size:9.5px;letter-spacing:2.5px;color:#b9c0cf;font-weight:700;text-transform:uppercase;margin-top:2px}

        .hub-scene .hc-greet{margin-top:34px;margin-bottom:15px}
        .hub-scene .hc-kick{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c8cedb;font-weight:700;margin-bottom:12px}
        .hub-scene .hc-title{font-size:clamp(34px,5.2vw,52px);line-height:.99;letter-spacing:-1.4px;margin:0;text-shadow:0 4px 34px rgba(0,0,0,.8);max-width:15ch}
        .hub-scene .hc-serif{color:var(--red-soft,#e85a4f)}
        .hub-scene .hc-nudge{margin-top:15px;display:inline-flex;align-items:center;gap:10px;font-size:15px;color:#e8e0d2;text-shadow:0 2px 16px rgba(0,0,0,.9)}
        .hub-scene .hc-nudge b{color:#e3c987;font-weight:700}
        .hub-scene .hc-arr{color:#e3c987}

        .hub-scene .hc-pulse{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 20px}
        .hub-scene .hc-chip{display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:30px;border:1px solid rgba(255,255,255,.12);
          background:rgba(12,15,24,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:12.5px;color:#d7d0c2}
        .hub-scene .hc-chip b{font-weight:800;color:#fff;font-size:14px}
        .hub-scene .hc-chip .hc-g{color:#e3c987}
        .hub-scene .hc-chip.live{border-color:rgba(232,68,59,.55);background:linear-gradient(90deg,rgba(198,26,26,.24),rgba(12,15,24,.5))}
        .hub-scene .hc-dotlive{width:8px;height:8px;border-radius:50%;background:#e85a4f;box-shadow:0 0 0 0 rgba(232,90,79,.7);animation:hcPl 1.8s infinite}
        @keyframes hcPl{0%{box-shadow:0 0 0 0 rgba(232,90,79,.6)}70%{box-shadow:0 0 0 7px rgba(232,90,79,0)}100%{box-shadow:0 0 0 0 rgba(232,90,79,0)}}

        /* ----- bento ----- */
        .hub-scene .hc-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:160px;gap:15px;perspective:1200px;
          grid-template-areas:
            "central central perito vip"
            "central central recursos recursos"
            "stock formacion nexocar nexocar"}
        .hub-scene .hc-bento.novip{grid-template-areas:
            "central central perito perito"
            "central central recursos recursos"
            "stock formacion nexocar nexocar"}
        .hub-scene .hc-central{grid-area:central}
        .hub-scene .hc-perito{grid-area:perito}
        .hub-scene .hc-vip{grid-area:vip}
        .hub-scene .hc-recursos{grid-area:recursos}
        .hub-scene .hc-stock{grid-area:stock}
        .hub-scene .hc-formacion{grid-area:formacion}
        .hub-scene .hc-nexocar{grid-area:nexocar}

        .hub-scene .hc-card{position:relative;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.17);cursor:pointer;
          background:linear-gradient(180deg,rgba(32,36,50,.46),rgba(15,18,28,.6));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.06);transition:transform .18s ease,border-color .25s,box-shadow .25s;transform-style:preserve-3d}
        .hub-scene .hc-card:hover{border-color:rgba(232,163,61,.5);box-shadow:0 20px 50px rgba(0,0,0,.5)}
        .hub-scene .hc-glow{position:absolute;top:-30%;right:-15%;width:55%;height:70%;border-radius:50%;filter:blur(34px);opacity:.4;z-index:0}
        .hub-scene .hc-central .hc-glow{width:80%;height:75%;opacity:.5}
        .hub-scene .hc-shine{position:absolute;inset:0;z-index:1;opacity:0;transition:opacity .25s;
          background:radial-gradient(240px 240px at var(--mx,50%) var(--my,0%),rgba(255,255,255,.1),transparent 60%)}
        .hub-scene .hc-card:hover .hc-shine{opacity:1}
        .hub-scene .hc-c{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;height:100%;padding:19px}
        .hub-scene .g-red{background:radial-gradient(circle,rgba(198,26,26,.6),transparent 70%)}
        .hub-scene .g-blue{background:radial-gradient(circle,rgba(70,130,180,.55),transparent 70%)}
        .hub-scene .g-gold{background:radial-gradient(circle,rgba(201,161,77,.55),transparent 70%)}
        .hub-scene .g-cosmo{background:radial-gradient(circle,rgba(150,110,210,.5),transparent 70%)}

        .hub-scene .hc-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:800;letter-spacing:1px;
          text-transform:uppercase;padding:6px 13px;border-radius:30px;margin-bottom:auto;color:#e7ecf4;background:rgba(9,11,18,.5);
          border:1px solid rgba(255,255,255,.15);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
        .hub-scene .hc-badge .dt{width:6px;height:6px;border-radius:50%;flex:none}
        .hub-scene .dt-red{background:#e85a4f;box-shadow:0 0 8px rgba(232,90,79,.8)}
        .hub-scene .dt-blue{background:#7fa6d8;box-shadow:0 0 8px rgba(127,166,216,.8)}
        .hub-scene .dt-gold{background:#E8A33D;box-shadow:0 0 8px rgba(232,163,61,.8)}
        .hub-scene .dt-cosmo{background:#b08ce8;box-shadow:0 0 8px rgba(176,140,232,.8)}

        .hub-scene .hc-ct{font-size:22px;letter-spacing:-.6px;color:#fff;margin:0 0 5px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
        .hub-scene .hc-central .hc-ct{font-size:32px}
        .hub-scene .hc-cd{font-size:12.5px;line-height:1.45;color:#c9c2b4;max-width:32ch;margin:0;text-shadow:0 1px 8px rgba(0,0,0,.6)}
        .hub-scene .hc-central .hc-cd{font-size:14px;max-width:34ch}
        .hub-scene .hc-live{margin-top:10px;display:inline-flex;align-items:center;gap:7px;font-size:12px;color:#f0c9c4}
        .hub-scene .hc-go{margin-top:12px;display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:#efe6d4}
        .hub-scene .hc-go svg:last-child{color:#e3c987}

        /* ----- móvil ----- */
        @media (max-width:860px){
          .hub-scene .hc-bento{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px;
            grid-template-areas:
              "central central"
              "central central"
              "perito vip"
              "recursos recursos"
              "stock formacion"
              "nexocar nexocar"}
          .hub-scene .hc-bento.novip{grid-template-areas:
              "central central"
              "central central"
              "perito perito"
              "recursos recursos"
              "stock formacion"
              "nexocar nexocar"}
        }
        @media (max-width:560px){
          .hub-scene .hc-page{padding:20px 15px 80px}
          .hub-scene .hc-img{height:470px;background-position:center 50%}
          .hub-scene .hc-imgScrim{height:470px}
          .hub-scene .hc-greet{margin-top:26px;margin-bottom:150px}
          .hub-scene .hc-title{font-size:32px}
          .hub-scene .hc-bento{grid-template-columns:1fr;grid-auto-rows:auto;
            grid-template-areas:"central" "perito" "vip" "recursos" "stock" "formacion" "nexocar"}
          .hub-scene .hc-bento.novip{grid-template-areas:"central" "perito" "recursos" "stock" "formacion" "nexocar"}
          .hub-scene .hc-card{min-height:148px}
          .hub-scene .hc-central{min-height:240px}
        }
      `}</style>
    </div>
  );
}
