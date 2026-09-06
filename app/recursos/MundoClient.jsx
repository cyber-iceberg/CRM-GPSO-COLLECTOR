'use client';

// =====================================================================
//  GPSO COLLECTOR · Recursos = El Mundo (cliente) · v2
//  app/recursos/MundoClient.jsx
//  Cada MÓDULO (tema) se dibuja con la SILUETA de un logo de marca,
//  pero la etiqueta manda: el nombre es el tema (Fiscalidad, etc.).
//  Añadir módulo = una entrada en MODULOS con su patrón de estrellas.
// =====================================================================

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import MenuDrawer from '../components/MenuDrawer';

// ---- patrones de constelación (silueta de marca), coords relativas ----
// Estrella de 3 puntas (Mercedes): centro + 3 brazos
const ESTRELLA_MB = [[0, 0], [0, -72], [62, 36], [-62, 36], [0, -38], [33, 19], [-33, 19]];
// Hélice cuartada (BMW): círculo de 8 + centro
const HELICE_BMW = (() => {
  const pts = [[0, 0]];
  for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i; pts.push([Math.cos(a) * 62, Math.sin(a) * 62]); }
  return pts;
})();
// Patrón angular (Cupra/deportivo): flechas/triángulos
const ANGULAR = [[0, -60], [-46, -10], [46, -10], [-30, 40], [30, 40], [0, 8], [0, 60]];
// Escudo (genérico premium)
const ESCUDO = [[0, -62], [50, -40], [56, 14], [0, 62], [-56, 14], [-50, -40], [0, 0]];

// ---------------------------------------------------------------------
const MODULOS = [
  {
    id: 'fiscalidad', t: 'Fiscalidad', s: 'del importador',
    cx: 400, cy: 420, activo: true, href: '/recursos/fiscalidad',
    marca: 'Mercedes', stars: ESTRELLA_MB,
    desc: 'Quién, qué y cómo se factura cada operación — con coches reales.',
  },
  {
    id: 'logistica', t: 'Logística', s: 'transporte y ruta',
    cx: 850, cy: 250, activo: false,
    marca: 'BMW', stars: HELICE_BMW,
    desc: 'Cómo traer el coche: camión, ruta propia, tiempos y costes.',
  },
  {
    id: 'negociacion', t: 'Negociación', s: 'compra en origen',
    cx: 1200, cy: 470, activo: false,
    marca: 'Cupra', stars: ANGULAR,
    desc: 'Cómo negociar el precio en Alemania y cerrar la compra.',
  },
  {
    id: 'homologacion', t: 'Homologación', s: 'ITV y matriculación',
    cx: 720, cy: 690, activo: false,
    marca: 'Audi', stars: ESCUDO,
    desc: 'Legalizar y matricular el vehículo en España, paso a paso.',
  },
];

export default function MundoClient({ email, perfil }) {
  const router = useRouter();
  const [cosmos, setCosmos] = useState(null);
  const [hover, setHover] = useState(null);
  const cosmosRef = useRef(null);
  const haloRef = useRef(null);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = [];
    for (let i = 0; i < 210; i++) {
      dots.push({
        x: Math.random() * 1600, y: Math.random() * 900,
        r: Math.random() * 1.5 + 0.4,
        d: (Math.random() * 30 + 14).toFixed(0),
        tw: (Math.random() * 5 + 2.5).toFixed(1),
        o: (Math.random() * 0.28 + 0.06).toFixed(2),
      });
    }
    setCosmos({ dots });

    if (reduceRef.current) return;
    let mx = -600, my = -600, hx = -600, hy = -600, raf;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      hx += (mx - hx) * 0.09; hy += (my - hy) * 0.09;
      if (haloRef.current) haloRef.current.style.transform = `translate(${hx - 280}px, ${hy - 280}px)`;
      if (cosmosRef.current) {
        const dx = (mx / window.innerWidth - 0.5) * -30;
        const dy = (my / window.innerHeight - 0.5) * -22;
        cosmosRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  const entrar = (m) => { if (m.activo && m.href) router.push(m.href); };

  // conecta las estrellas de una constelación siguiendo su forma
  const constLines = (m) => {
    const pts = m.stars.map(([dx, dy]) => [m.cx + dx, m.cy + dy]);
    const segs = [];
    const core = pts[0];
    // radios desde el centro a cada punta (da la forma de "estrella/logo")
    for (let i = 1; i < pts.length; i++) segs.push([core, pts[i]]);
    return segs;
  };

  return (
    <div className="mundo-bg">
      <div className="halo" ref={haloRef} aria-hidden="true" />

      <header className="mundo-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">Recursos</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/" className="volver">← Inicio</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className="titulo">
        <h1>El Mundo del Importador</h1>
        <p>Cada constelación es un módulo. Toca para entrar.</p>
      </div>

      <div className="viewport">
        <div className="canvas">
          <svg className="cosmos" ref={cosmosRef} viewBox="0 0 1600 900" aria-hidden="true">
            {cosmos && cosmos.dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r}
                style={{ opacity: d.o, animationDuration: d.d + 's, ' + d.tw + 's', animationDelay: (i % 9) + 's, ' + (i % 5) + 's' }} />
            ))}
          </svg>

          <svg className="const-wires" viewBox="0 0 1600 900">
            {MODULOS.map(m => (
              <g key={m.id} className={'cw' + (m.activo ? ' on' : '') + (hover === m.id ? ' hov' : '')}>
                {constLines(m).map((s, i) => (
                  <line key={i} x1={s[0][0]} y1={s[0][1]} x2={s[1][0]} y2={s[1][1]} />
                ))}
              </g>
            ))}
          </svg>

          {MODULOS.map(m => (
            <button key={m.id}
              className={'modulo' + (m.activo ? ' activo' : ' pronto') + (hover === m.id ? ' hov' : '')}
              style={{ left: m.cx, top: m.cy }}
              onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
              onClick={() => entrar(m)}
              disabled={!m.activo}>
              {m.stars.map(([dx, dy], i) => (
                <span key={i} className={'star' + (i === 0 ? ' core' : '')}
                  style={{ left: dx, top: dy, animationDelay: (i * 0.35) + 's' }} />
              ))}
              <span className="m-etq">
                <span className="m-t">{m.t}</span>
                <span className="m-s">{m.activo ? m.s : 'próximamente'}</span>
              </span>
            </button>
          ))}

          {hover && (() => {
            const m = MODULOS.find(x => x.id === hover);
            return (
              <div className="tip" style={{ left: m.cx, top: m.cy - 130 }}>
                <b>{m.t}</b>
                <span>{m.desc}</span>
                {m.activo ? <em className="go">Entrar →</em> : <em className="soon">Próximamente</em>}
              </div>
            );
          })()}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Space+Grotesk:wght@300;400;500;600&display=swap');
        .mundo-bg{position:fixed;inset:0;background:radial-gradient(1400px 800px at 45% 42%, #0f1219 0%, #0a0c10 62%);color:#e9e6df;font-family:'Space Grotesk',sans-serif;font-weight:300;overflow:hidden}
        .halo{position:fixed;top:0;left:0;width:560px;height:560px;pointer-events:none;z-index:2;border-radius:50%;background:radial-gradient(circle, rgba(201,161,77,.13) 0%, rgba(201,161,77,.04) 40%, transparent 68%);mix-blend-mode:screen;will-change:transform}
        @media (prefers-reduced-motion: reduce){.halo{display:none}}

        .mundo-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:16px 28px 12px;background:linear-gradient(to bottom,rgba(10,12,16,.9) 55%,rgba(10,12,16,0))}
        .brand-wrap{display:flex;align-items:center;gap:12px}
        .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .top-right{display:flex;align-items:center;gap:16px}
        .volver{font-size:13px;color:#8b93a3;text-decoration:none;text-transform:uppercase;letter-spacing:1px}
        .volver:hover{color:#c9a14d}

        .titulo{position:absolute;top:92px;left:0;right:0;z-index:20;text-align:center;pointer-events:none}
        .titulo h1{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:clamp(26px,4vw,40px);color:#ecdcae;margin:0}
        .titulo p{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8b93a3;margin:8px 0 0}

        .viewport{position:absolute;inset:0;overflow:auto;padding-top:56px}
        .canvas{position:relative;width:1600px;height:900px;margin:0 auto}

        .cosmos{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);will-change:transform}
        .cosmos circle{fill:#8b93a3;animation:deriva linear infinite alternate, brillo ease-in-out infinite alternate}
        @keyframes deriva{from{transform:translate(0,0)}to{transform:translate(18px,-14px)}}
        @keyframes brillo{from{fill-opacity:.3}to{fill-opacity:1}}
        @media (prefers-reduced-motion: reduce){.cosmos circle{animation:none}}

        .const-wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
        .const-wires .cw line{stroke:rgba(139,147,163,.16);stroke-width:1;transition:stroke .4s}
        .const-wires .cw.on line{stroke:rgba(201,161,77,.38)}
        .const-wires .cw.on.hov line{stroke:rgba(233,209,148,.8)}

        .modulo{position:absolute;transform:translate(-50%,-50%);width:0;height:0;background:none;border:none;cursor:pointer;z-index:5}
        .modulo.pronto{cursor:not-allowed}
        .star{position:absolute;width:11px;height:11px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%, #f0e2b6 0%, #c9a14d 45%, #6b5526 100%);box-shadow:0 0 10px rgba(201,161,77,.4);animation:pulso 4s ease-in-out infinite}
        .star.core{width:20px;height:20px}
        @keyframes pulso{0%,100%{box-shadow:0 0 8px rgba(201,161,77,.3)}50%{box-shadow:0 0 16px rgba(201,161,77,.6)}}
        @media (prefers-reduced-motion: reduce){.star{animation:none}}

        .modulo.pronto .star{background:radial-gradient(circle at 35% 30%, #6b7180 0%, #3a4150 55%, #232833 100%);box-shadow:none;animation:none;opacity:.45}
        .modulo.activo:hover .star,.modulo.activo.hov .star{box-shadow:0 0 18px rgba(240,226,182,.8);transform:translate(-50%,-50%) scale(1.15)}
        .modulo.activo .star.core{box-shadow:0 0 20px rgba(201,161,77,.6),0 0 46px rgba(201,161,77,.25)}

        .m-etq{position:absolute;left:0;top:104px;transform:translate(-50%,0);text-align:center;white-space:nowrap}
        .m-t{display:block;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:24px;color:#ecdcae;letter-spacing:.5px}
        .modulo.pronto .m-t{color:#6a7180}
        .m-s{display:block;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:#8b93a3;margin-top:4px}
        .modulo.pronto .m-s{color:#565d6b}
        .modulo.activo:hover .m-t,.modulo.activo.hov .m-t{color:#fff;text-shadow:0 0 20px rgba(201,161,77,.5)}

        .tip{position:absolute;transform:translate(-50%,-100%);z-index:30;width:240px;background:#12151c;border:1px solid #232833;border-radius:12px;padding:16px 18px;pointer-events:none;box-shadow:0 20px 50px rgba(0,0,0,.5);animation:tipIn .25s ease both}
        @keyframes tipIn{from{opacity:0;transform:translate(-50%,-92%)}to{opacity:1;transform:translate(-50%,-100%)}}
        .tip b{display:block;font-family:'Cormorant Garamond',serif;font-size:19px;color:#ecdcae;margin-bottom:6px}
        .tip span{display:block;font-size:12.5px;line-height:1.5;color:#c8ccd4}
        .tip em{display:inline-block;font-style:normal;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:10px;font-weight:600}
        .tip em.go{color:#c9a14d}
        .tip em.soon{color:#6a7180}

        @media (max-width:900px){
          .canvas{transform:scale(.6);transform-origin:top center}
          .titulo h1{font-size:24px}
        }
      `}</style>
    </div>
  );
}
