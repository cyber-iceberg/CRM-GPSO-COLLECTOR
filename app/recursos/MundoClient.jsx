'use client';

// =====================================================================
//  GPSO COLLECTOR · Recursos = Mapa Galáctico (cliente) · v3
//  app/recursos/MundoClient.jsx
//  Lienzo infinito con ZOOM (rueda) y ARRASTRE (drag). Escala a +10 módulos.
//  Cada módulo se AUTO-COLOCA en espiral — solo añades la entrada a MODULOS.
//  (opcional: si pones cx/cy fijos en un módulo, respeta esa posición)
//
//  Los emblemas de marca (PNG dorados) van en /public/emblemas/<archivo>.
//  El nombre grande es el TEMA; la marca es solo la estética.
// =====================================================================

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MenuDrawer from '../components/MenuDrawer';

// ---------------------------------------------------------------------
//  MÓDULOS · añade aquí. img = archivo en /public/emblemas/
//  activo:true → navegable (href). activo:false → "próximamente".
//  cx/cy opcionales: si los omites, se auto-coloca en espiral.
// ---------------------------------------------------------------------
const MODULOS = [
  { id: 'fiscalidad',   t: 'Fiscalidad',   s: 'del importador',     marca: 'Mercedes',    img: '/mercedes.png',    activo: true, href: '/recursos/fiscalidad',
    cx: 1000, cy: 700, conecta: ['negociacion', 'logistica', 'ventas'],
    desc: 'Quién, qué y cómo se factura cada operación — con coches reales.' },
  { id: 'negociacion',  t: 'Negociación',  s: 'compra en origen',   marca: 'Ferrari',     img: '/ferrari.png',     activo: false,
    cx: 680, cy: 440, conecta: ['logistica'],
    desc: 'Cómo negociar el precio en Alemania y cerrar la compra.' },
  { id: 'logistica',    t: 'Logística',    s: 'transporte y ruta',  marca: 'Cupra',       img: '/cupra.png',       activo: false,
    cx: 1320, cy: 440, conecta: ['ventas'],
    desc: 'Cómo traer el coche: camión, ruta propia, tiempos y costes.' },
  { id: 'ventas',       t: 'Ventas',       s: 'cerrar al cliente',  marca: 'Lamborghini', img: '/lamborghini.png', activo: false,
    cx: 1000, cy: 320,
    desc: 'Cómo presentar, cerrar y entregar la venta al cliente final.' },
];

// auto-colocación en espiral áurea (para los que no tienen cx/cy fijos)
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function layout(mods) {
  let k = 0;
  return mods.map(m => {
    if (m.cx != null && m.cy != null) return m;
    const r = 300 * Math.sqrt(k + 0.6);          // radio crece con la raíz → reparto uniforme
    const a = k * GOLDEN;
    k++;
    return { ...m, cx: 1000 + r * Math.cos(a), cy: 700 + r * Math.sin(a) };
  });
}

export default function MundoClient({ email, perfil }) {
  const router = useRouter();
  const nodos = useMemo(() => layout(MODULOS), []);

  // conexiones calculadas UNA vez (no dependen del hover → no pueden petar)
  const conexiones = useMemo(() => {
    const segs = [];
    for (const m of nodos) {
      for (const destId of (m.conecta || [])) {
        const d = nodos.find(x => x.id === destId);
        if (d && d.cx != null && m.cx != null) {
          const len = Math.round(Math.hypot(d.cx - m.cx, d.cy - m.cy));
          segs.push({ key: m.id + '-' + d.id, a: m.id, b: d.id, x1: m.cx, y1: m.cy, x2: d.cx, y2: d.cy, len });
        }
      }
    }
    return segs;
  }, [nodos]);

  const [cam, setCam] = useState({ x: 0, y: 0, z: 1 });   // desplazamiento y zoom
  const [hover, setHover] = useState(null);
  const [cosmos, setCosmos] = useState(null);
  const dragRef = useRef(null);
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const cieloRef = useRef(null);
  const reduceRef = useRef(false);

  // centrar la cámara en el módulo activo al entrar
  // ocultar el botón de tema global mientras esta página oscura está montada
  useEffect(() => {
    document.body.classList.add('ocultar-theme-toggle');
    return () => document.body.classList.remove('ocultar-theme-toggle');
  }, []);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = [];
    for (let i = 0; i < 90; i++) {
      dots.push({
        x: Math.random() * 2600 - 300, y: Math.random() * 1800 - 200,
        r: Math.random() * 1.6 + 0.4,
        tw: (Math.random() * 5 + 2.5).toFixed(1),
        o: (Math.random() * 0.3 + 0.06).toFixed(2),
      });
    }
    setCosmos({ dots });

    const activo = nodos.find(m => m.activo) || nodos[0];
    if (activo && wrapRef.current) {
      const w = wrapRef.current.clientWidth, h = wrapRef.current.clientHeight;
      setCam({ x: w / 2 - activo.cx, y: h / 2 - activo.cy + 40, z: 1 });
    }

    if (reduceRef.current) return;
    let mx = -600, my = -600, hx = -600, hy = -600, raf;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      hx += (mx - hx) * 0.1; hy += (my - hy) * 0.1;
      if (haloRef.current) haloRef.current.style.transform = `translate(${hx - 300}px, ${hy - 300}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- arrastre ----
  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { sx: p.clientX, sy: p.clientY, camX: cam.x, camY: cam.y, moved: false };
  };
  const onMoveDrag = (e) => {
    const dr = dragRef.current;
    if (!dr) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - dr.sx;
    const dy = p.clientY - dr.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) dr.moved = true;
    setCam(c => ({ ...c, x: dr.camX + dx, y: dr.camY + dy }));
  };
  const onUp = () => { dragRef.current = null; };

  // ---- zoom con rueda ----
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setCam(c => {
      const nz = Math.min(1.8, Math.max(0.45, c.z - e.deltaY * 0.0012));
      return { ...c, z: nz };
    });
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const entrar = (m) => {
    if (dragRef.current && dragRef.current.moved) return; // no navegar si arrastró
    if (m.activo && m.href) router.push(m.href);
  };
  const zoomBtn = (d) => setCam(c => ({ ...c, z: Math.min(1.8, Math.max(0.45, c.z + d)) }));
  const recenter = () => {
    const activo = nodos.find(m => m.activo) || nodos[0];
    if (!activo || !wrapRef.current) return;
    const w = wrapRef.current.clientWidth, h = wrapRef.current.clientHeight;
    setCam({ x: w / 2 - activo.cx, y: h / 2 - activo.cy, z: 1 });
  };

  const emblemaHalo = (i) => {
    // halo de estrellas alrededor del emblema (constelación)
    const pts = [];
    const n = 7;
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI / n) * k + i;
      pts.push([Math.cos(a) * 78, Math.sin(a) * 78]);
    }
    return pts;
  };

  return (
    <div className="mundo-bg">
      <div className="halo" ref={haloRef} aria-hidden="true" />

      {/* fondo cósmico con parallax */}
      <div className="cielo" ref={cieloRef} aria-hidden="true"
        style={{ backgroundPosition: `${cam.x * 0.15}px ${cam.y * 0.15}px` }} />

      <header className="mundo-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">Recursos · El Universo</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/" className="volver">← Inicio</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className="titulo">
        <h1>El Universo del Importador</h1>
        <p>Arrastra para moverte · rueda para zoom · toca un emblema para entrar</p>
      </div>

      <div className="viewport" ref={wrapRef}
        onMouseDown={onDown} onMouseMove={onMoveDrag} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMoveDrag} onTouchEnd={onUp}>

        {/* estrellas de fondo (se mueven a media velocidad → profundidad) */}
        <svg className="cosmos" viewBox="0 0 2600 1800" aria-hidden="true"
          style={{ transform: `translate(${cam.x * 0.5}px, ${cam.y * 0.5}px)` }}>
          {cosmos && cosmos.dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r}
              style={{ opacity: d.o, animation: reduceRef.current ? 'none' : `brillo ${d.tw}s ease-in-out ${(i % 5)}s infinite alternate` }} />
          ))}
        </svg>

        {/* lienzo de módulos (aplica cámara: pan + zoom) */}
        <div className="world" style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})` }}>
          {/* conexiones: apagadas por defecto, se trazan al pasar por un módulo */}
          <svg className="constelinks" width="2600" height="1600" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}>
            {conexiones.map(c => {
              const on = hover === c.a || hover === c.b;
              return (
                <line key={c.key} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                  className={'clink' + (on ? ' on' : '')}
                  style={on ? { ['--len']: c.len } : undefined} />
              );
            })}
          </svg>
          {nodos.map((m, idx) => (
            <div key={m.id}
              className={'nodo' + (m.activo ? ' activo' : ' pronto') + (hover === m.id ? ' hov' : '')}
              style={{ left: m.cx, top: m.cy }}
              onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
              onClick={() => entrar(m)}>
              {/* halo de estrellas */}
              {emblemaHalo(idx).map(([sx, sy], k) => (
                <span key={k} className="halo-star" style={{ left: sx, top: sy, animationDelay: (k * 0.3) + 's' }} />
              ))}
              {/* aro dorado */}
              <span className="aro" />
              {/* emblema */}
              <span className="emblema"><img src={m.img} alt={m.marca} draggable="false" /></span>
              {/* etiqueta */}
              <span className="etq">
                <span className="e-t">{m.t}</span>
                <span className="e-s">{m.activo ? m.s : 'próximamente'}</span>
              </span>
            </div>
          ))}
        </div>

        {/* tooltip */}
        {(() => {
          if (!hover) return null;
          const m = nodos.find(x => x.id === hover);
          if (!m || m.cx == null) return null;
          const sx = m.cx * cam.z + cam.x;
          const sy = m.cy * cam.z + cam.y;
          return (
            <div className="tip" style={{ left: sx, top: sy - 120 * cam.z - 40 }}>
              <b>{m.t}</b>
              <span>{m.desc}</span>
              {m.activo ? <em className="go">Entrar →</em> : <em className="soon">Próximamente</em>}
            </div>
          );
        })()}

        {/* controles de zoom */}
        <div className="ctrl">
          <button onClick={() => zoomBtn(0.2)} aria-label="Acercar">+</button>
          <button onClick={() => zoomBtn(-0.2)} aria-label="Alejar">−</button>
          <button onClick={recenter} aria-label="Centrar" className="rec">⊙</button>
        </div>
      </div>

      <style jsx>{`
        .mundo-bg{position:fixed;inset:0;background:#05070c;color:#e9e6df;font-family:var(--font-space-grotesk),sans-serif;font-weight:300;overflow:hidden}
        .cielo{position:absolute;inset:-40px;z-index:0;background-image:url(/cosmos.jpg);background-size:cover;background-position:center;opacity:.6;will-change:transform}
        .cielo::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%, rgba(5,7,12,.15) 30%, rgba(5,7,12,.72) 100%)}
        .halo{position:fixed;top:0;left:0;width:600px;height:600px;pointer-events:none;z-index:2;border-radius:50%;background:radial-gradient(circle, rgba(201,161,77,.12) 0%, rgba(201,161,77,.04) 42%, transparent 68%);mix-blend-mode:screen;will-change:transform}
        @media (prefers-reduced-motion: reduce){.halo{display:none}}

        .mundo-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:16px 28px 12px;background:linear-gradient(to bottom,rgba(10,12,16,.92) 55%,rgba(10,12,16,0));pointer-events:none}
        .mundo-top .brand-wrap,.mundo-top .top-right{pointer-events:auto}
        .brand-wrap{display:flex;align-items:center;gap:12px}
        .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .top-right{display:flex;align-items:center;gap:16px}
        .volver{font-size:12px;color:#c9c3b4;text-decoration:none;text-transform:uppercase;letter-spacing:1.2px;border:1px solid rgba(201,161,77,.35);border-radius:20px;padding:7px 14px;background:rgba(18,21,28,.5);backdrop-filter:blur(6px);transition:all .25s}
        .volver:hover{color:#f0e2b6;border-color:rgba(201,161,77,.7);background:rgba(18,21,28,.75)}

        .titulo{position:absolute;top:90px;left:0;right:0;z-index:20;text-align:center;pointer-events:none}
        .titulo h1{font-family:var(--font-cormorant),serif;font-weight:600;font-size:clamp(24px,3.6vw,38px);color:#ecdcae;margin:0}
        .titulo p{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#8b93a3;margin:8px 0 0}

        .viewport{position:absolute;inset:0;overflow:hidden;cursor:grab;touch-action:none}
        .viewport:active{cursor:grabbing}

        .cosmos{position:absolute;top:-200px;left:-300px;z-index:1;width:2600px;height:1800px;will-change:transform}
        .cosmos circle{fill:#8b93a3}
        @keyframes brillo{from{fill-opacity:.3}to{fill-opacity:1}}

        .world{position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;z-index:2}
        .constelinks .clink{stroke:rgba(240,210,130,.9);stroke-width:1.8;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(240,200,110,.8));opacity:0}
        .constelinks .clink.on{opacity:1;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:trazar .55s ease-out forwards}
        @keyframes trazar{to{stroke-dashoffset:0}}
        @media (prefers-reduced-motion: reduce){.constelinks .clink.on{animation:none;stroke-dashoffset:0}}

        .nodo{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none}
        .nodo.pronto{cursor:default}

        .halo-star{display:none}
        @keyframes pulso{0%,100%{opacity:.5}50%{opacity:1}}
        @media (prefers-reduced-motion: reduce){.halo-star{animation:none}}
        .nodo.pronto .halo-star{background:#3a4150;box-shadow:none;opacity:.4;animation:none}

        .aro{display:none}
        .nodo.activo .aro{border-color:rgba(201,161,77,.5);box-shadow:0 0 50px rgba(201,161,77,.18) inset, 0 0 30px rgba(201,161,77,.12)}
        .nodo.activo:hover .aro,.nodo.activo.hov .aro{border-color:rgba(240,226,182,.85);box-shadow:0 0 60px rgba(201,161,77,.28) inset, 0 0 50px rgba(201,161,77,.25)}
        .nodo.pronto .aro{border-color:rgba(139,147,163,.18)}

        .emblema{position:absolute;top:0;left:0;width:250px;height:250px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;-webkit-mask-image:radial-gradient(circle, #000 55%, transparent 74%);mask-image:radial-gradient(circle, #000 55%, transparent 74%)}
        .emblema::before{content:'';position:absolute;inset:-6%;border-radius:50%;background:radial-gradient(circle, rgba(5,7,12,.82) 30%, rgba(5,7,12,.35) 55%, transparent 72%);z-index:-1}
        .emblema img{width:100%;height:100%;object-fit:contain;mix-blend-mode:screen;filter:drop-shadow(0 0 6px rgba(240,210,130,.5)) brightness(1.15);transition:transform .3s,filter .3s}
        .nodo.pronto .emblema img{opacity:.35;filter:saturate(.4) brightness(.7)}
        .nodo.activo:hover .emblema img,.nodo.activo.hov .emblema img{transform:scale(1.05);filter:drop-shadow(0 0 20px rgba(240,226,182,.4))}

        .etq{position:absolute;top:135px;left:0;transform:translate(-50%,0);text-align:center;white-space:nowrap}
        .e-t{display:block;font-family:var(--font-cormorant),serif;font-weight:600;font-size:23px;color:#ecdcae;letter-spacing:.5px;text-shadow:0 2px 12px rgba(10,12,16,.9)}
        .nodo.pronto .e-t{color:#6a7180}
        .e-s{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8b93a3;margin-top:4px}
        .nodo.pronto .e-s{color:#565d6b}
        .nodo.activo:hover .e-t,.nodo.activo.hov .e-t{color:#fff;text-shadow:0 0 20px rgba(201,161,77,.5)}

        .tip{position:absolute;transform:translate(-50%,-100%);z-index:30;width:240px;background:#12151c;border:1px solid #232833;border-radius:12px;padding:16px 18px;pointer-events:none;box-shadow:0 20px 50px rgba(0,0,0,.5);animation:tipIn .22s ease both}
        @keyframes tipIn{from{opacity:0;transform:translate(-50%,-92%)}to{opacity:1;transform:translate(-50%,-100%)}}
        .tip b{display:block;font-family:var(--font-cormorant),serif;font-size:19px;color:#ecdcae;margin-bottom:6px}
        .tip span{display:block;font-size:12.5px;line-height:1.5;color:#c8ccd4}
        .tip em{display:inline-block;font-style:normal;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:10px;font-weight:600}
        .tip em.go{color:#c9a14d}
        .tip em.soon{color:#6a7180}

        .ctrl{position:absolute;right:22px;bottom:26px;z-index:30;display:flex;flex-direction:column;gap:8px}
        .ctrl button{width:40px;height:40px;border-radius:10px;background:rgba(18,21,28,.9);border:1px solid #232833;color:#c9a14d;font-size:20px;cursor:pointer;transition:border-color .2s,color .2s;display:flex;align-items:center;justify-content:center}
        .ctrl button:hover{border-color:#c9a14d;color:#f0e2b6}
        .ctrl .rec{font-size:16px}

        @media (max-width:900px){
          .titulo h1{font-size:22px}
          .titulo p{font-size:10px}
        }
      `}</style>
    </div>
  );
}
