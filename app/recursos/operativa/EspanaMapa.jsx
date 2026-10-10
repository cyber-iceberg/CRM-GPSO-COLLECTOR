'use client';

// =====================================================================
//  GPSO COLLECTOR · EspanaMapa · app/recursos/operativa/EspanaMapa.jsx
//  Mapa interactivo de España por comunidades para el bloque ITV.
//  · Resalta las comunidades que tienen ITV (punto dorado).
//  · Click en una comunidad → onSelect(id). La seleccionada va en dorado.
//  · Canarias en recuadro aparte (como los mapas reales).
//  Props:
//    conCount(id) -> nº de ITV activas en esa comunidad (para resaltar)
//    sel          -> id de la comunidad seleccionada
//    onSelect(id) -> callback al clicar
// =====================================================================

import { useState } from 'react';
import { MAPA } from './espana-geo';

export default function EspanaMapa({ conCount = () => 0, sel = null, onSelect = () => {} }) {
  const [hover, setHover] = useState(null);
  const { w, h, canariasBox: cb, regions } = MAPA;
  const nombre = (id) => regions.find(r => r.id === id)?.name;
  const activa = hover || sel;

  return (
    <div className="mapa-wrap">
      <div className="mapa-head">
        <h2 className="mapa-h">¿Dónde pasas la ITV?</h2>
        <div className="mapa-hs">{activa ? nombre(activa) : 'toca tu comunidad'}</div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mapa-svg" role="img" aria-label="Mapa de España por comunidades">
        {/* recuadro Canarias */}
        <rect x={cb.x} y={cb.y} width={cb.w} height={cb.h} rx="7" className="mapa-cbox" />
        <text x={cb.x + 9} y={cb.y + 16} className="mapa-clabel">Canarias</text>

        {regions.map(r => {
          const n = conCount(r.id);
          const cls = 'reg' + (n > 0 ? ' has' : '') + (sel === r.id ? ' sel' : '') + (hover === r.id ? ' hov' : '');
          return (
            <path key={r.id} d={r.d} className={cls}
              onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(r.id)}>
              <title>{r.name}{n ? ` · ${n} ITV` : ''}</title>
            </path>
          );
        })}

        {/* puntos en las que tienen ITV */}
        {regions.map(r => conCount(r.id) > 0 && (
          <circle key={'d' + r.id} cx={r.c[0]} cy={r.c[1]} r={sel === r.id ? 3.4 : 2.6} className="mapa-dot" />
        ))}
      </svg>

      <style jsx>{`
        .mapa-wrap{width:100%;max-width:760px;margin:0 auto;padding:0 10px;transform-origin:50% 46%;
          animation:mapaIn 1.1s cubic-bezier(.16,.82,.24,1) both}
        @keyframes mapaIn{
          0%{opacity:0;transform:scale(.12) translateY(18px);filter:blur(11px)}
          55%{opacity:1}
          100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}
        }
        .mapa-head{text-align:center;margin-bottom:12px;animation:headIn .55s ease .45s both}
        @keyframes headIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion:reduce){.mapa-wrap,.mapa-head{animation:none}}
        .mapa-h{font-family:var(--font-cormorant),Georgia,serif;font-weight:600;font-size:clamp(20px,2.6vw,26px);color:#ecdcae;margin:0}
        .mapa-hs{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8ea3c4;margin-top:5px;min-height:14px;transition:color .2s}
        .mapa-svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 20px 60px rgba(0,0,0,.5))}
      `}</style>

      {/* estilos de las regiones en global (los targetea el <path>) */}
      <style jsx global>{`
        .mapa-svg .reg{fill:rgba(120,150,195,.07);stroke:rgba(150,180,222,.32);stroke-width:.8;cursor:pointer;
          transition:fill .2s,stroke .2s,filter .2s}
        .mapa-svg .reg.has{fill:rgba(120,160,215,.20);stroke:rgba(170,200,240,.55)}
        .mapa-svg .reg.hov{fill:rgba(227,201,135,.18);stroke:rgba(227,201,135,.75)}
        .mapa-svg .reg.sel{fill:rgba(227,201,135,.30);stroke:#e3c987;stroke-width:1.4;
          filter:drop-shadow(0 0 6px rgba(227,201,135,.55))}
        .mapa-svg .mapa-cbox{fill:none;stroke:rgba(150,180,222,.22);stroke-width:.8;stroke-dasharray:3 4}
        .mapa-svg .mapa-clabel{fill:#7f8a9e;font-size:8px;letter-spacing:1px;text-transform:uppercase;font-family:var(--font-space-grotesk),sans-serif}
        .mapa-svg .mapa-dot{fill:#e3c987;filter:drop-shadow(0 0 4px rgba(227,201,135,.85));pointer-events:none}
      `}</style>
    </div>
  );
}
