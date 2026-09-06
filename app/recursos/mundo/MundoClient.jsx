'use client';

// =====================================================================
//  GPSO COLLECTOR · El Mundo (cliente)
//  app/recursos/mundo/MundoClient.jsx
//  Cada MÓDULO es una constelación: un cúmulo de orbes con su nombre.
//  Fiscalidad está activa (navega a /recursos/fiscalidad); el resto
//  aparecen atenuadas como "próximamente".
//  Añadir un módulo = añadir una entrada a MODULOS.
// =====================================================================

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import MenuDrawer from '../../components/MenuDrawer';

// ---------------------------------------------------------------------
//  MÓDULOS · cx/cy = centro de la constelación (en un lienzo 1600x900)
//  stars = posiciones relativas de los orbes que forman el cúmulo
// ---------------------------------------------------------------------
const MODULOS = [
  {
    id: 'fiscalidad', t: 'Fiscalidad', s: 'del importador',
    cx: 420, cy: 430, activo: true, href: '/recursos/fiscalidad',
    desc: 'Quién, qué y cómo se factura cada operación — con coches reales.',
    stars: [[0, 0], [70, -46], [128, 12], [86, 70], [16, 78], [-54, 40], [-40, -50], [175, -30]],
  },
  {
    id: 'logistica', t: 'Logística', s: 'transporte y ruta',
    cx: 900, cy: 250, activo: false,
    desc: 'Cómo traer el coche: camión, ruta propia, tiempos y costes.',
    stars: [[0, 0], [64, 40], [120, -20], [40, -60], [-44, 30]],
  },
  {
    id: 'homologacion', t: 'Homologación', s: 'ITV y matriculación',
    cx: 1180, cy: 560, activo: false,
    desc: 'Legalizar y matricular el vehículo en España, paso a paso.',
    stars: [[0, 0], [70, -30], [110, 40], [30, 66], [-40, -40]],
  },
  {
    id: 'negociacion', t: 'Negociación', s: 'compra en origen',
    cx: 760, cy: 680, activo: false,
    desc: 'Cómo negociar el precio en Alemania y cerrar la compra.',
    stars: [[0, 0], [60, 44], [116, -8], [46, -56], [-40, 24]],
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
    for (let i = 0; i < 200; i++) {
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

  // líneas internas de cada constelación (encadena sus estrellas)
  const constLines = (m) => {
    const pts = m.stars.map(([dx, dy]) => [m.cx + dx, m.cy + dy]);
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]);
    // un par de cierres para que parezca cúmulo, no cadena
    if (pts.length > 3) { segs.push([pts[0], pts[2]]); segs.push([pts[1], pts[pts.length - 1]]); }
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
            <div className="sublabel">El Mundo · Módulos</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/recursos" className="volver">← Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className="titulo">
        <h1>Elige un módulo</h1>
        <p>Cada constelación es un mundo de conocimiento. Toca para entrar.</p>
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
              {/* orbes del cúmulo */}
              {m.stars.map(([dx, dy], i) => (
                <span key={i} className={'star' + (i === 0 ? ' core' : '')}
                  style={{ left: dx, top: dy, animationDelay: (i * 0.4) + 's' }} />
              ))}
              {/* etiqueta */}
              <span className="m-etq" style={{ left: 0, top: 108 }}>
                <span className="m-t">{m.t}</span>
                <span className="m-s">{m.activo ? m.s : 'próximamente'}</span>
              </span>
            </button>
          ))}

          {/* tooltip de descripción al pasar */}
          {hover && (() => {
            const m = MODULOS.find(x => x.id === hover);
            return (
              <div className="tip" style={{ left: m.cx, top: m.cy - 150 }}>
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

        .titulo{position:absolute;top:96px;left:0;right:0;z-index:20;text-align:center;pointer-events:none}
        .titulo h1{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:clamp(26px,4vw,40px);color:#ecdcae;margin:0}
        .titulo p{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8b93a3;margin:8px 0 0}

        .viewport{position:absolute;inset:0;overflow:auto;padding-top:60px}
        .canvas{position:relative;width:1600px;height:900px;margin:0 auto}

        .cosmos{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);will-change:transform}
        .cosmos circle{fill:#8b93a3;animation:deriva linear infinite alternate, brillo ease-in-out infinite alternate}
        @keyframes deriva{from{transform:translate(0,0)}to{transform:translate(18px,-14px)}}
        @keyframes brillo{from{fill-opacity:.3}to{fill-opacity:1}}
        @media (prefers-reduced-motion: reduce){.cosmos circle{animation:none}}

        .const-wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
        .const-wires .cw line{stroke:rgba(139,147,163,.18);stroke-width:1;transition:stroke .4s}
        .const-wires .cw.on line{stroke:rgba(201,161,77,.4)}
        .const-wires .cw.on.hov line{stroke:rgba(233,209,148,.75)}

        .modulo{position:absolute;transform:translate(-50%,-50%);width:0;height:0;background:none;border:none;cursor:pointer;z-index:5}
        .modulo.pronto{cursor:not-allowed}
        .star{position:absolute;width:12px;height:12px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%, #f0e2b6 0%, #c9a14d 45%, #6b5526 100%);box-shadow:0 0 10px rgba(201,161,77,.4);animation:pulso 4s ease-in-out infinite}
        .star.core{width:20px;height:20px}
        @keyframes pulso{0%,100%{box-shadow:0 0 8px rgba(201,161,77,.3)}50%{box-shadow:0 0 16px rgba(201,161,77,.6)}}
        @media (prefers-reduced-motion: reduce){.star{animation:none}}

        .modulo.pronto .star{background:radial-gradient(circle at 35% 30%, #6b7180 0%, #3a4150 55%, #232833 100%);box-shadow:none;animation:none;opacity:.5}
        .modulo.activo:hover .star,.modulo.activo.hov .star{box-shadow:0 0 18px rgba(240,226,182,.8);transform:translate(-50%,-50%) scale(1.15)}
        .modulo.activo .star.core{box-shadow:0 0 20px rgba(201,161,77,.6),0 0 46px rgba(201,161,77,.25)}

        .m-etq{position:absolute;transform:translate(-50%,0);text-align:center;white-space:nowrap}
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
          .canvas{transform:scale(.62);transform-origin:top center}
          .titulo h1{font-size:24px}
        }
      `}</style>
    </div>
  );
}
