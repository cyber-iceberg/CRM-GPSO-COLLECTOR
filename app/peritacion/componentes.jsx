'use client';

// =====================================================================
//  app/peritacion/componentes.jsx
//  Piezas de interfaz de la peritación, sobre el sistema AURA.
//  Se importan desde PeritacionClient para no tener un fichero de 1500
//  líneas. Todo con clases .pt- y variables de globals.css.
// =====================================================================

import { useState, useRef } from 'react';
import {
  Check, AlertTriangle, XCircle, Eye, Camera, Info, ChevronDown, Flag,
} from 'lucide-react';

/* ------------------------------------------------------------- ÍTEM */
/* Cerrado por defecto. El tip (hacer/normal/alerta) se despliega al tocar
   "cómo revisar". Al marcar Defecto, ese botón se ilumina para invitar a
   abrirlo justo cuando más falta hace saber si es grave.               */
export function Item({ b, i, it, onEstado, onNota, onFoto, fotos }) {
  const [abierto, setAbierto] = useState(false);
  const item = b.items[i];
  const esDef = it?.estado === 'def';
  const esObs = it?.estado === 'obs';

  return (
    <li className={'pt-item' + (it?.estado ? ' e-' + it.estado : '')}>
      <div className="pt-item-cab">
        <p className="pt-item-t">{item.t}</p>
        <span className="pt-item-meta">
          <span className="pt-pen">−{item.pen}</span>
          {item.rojo && <Flag size={12} className="pt-item-flag" />}
        </span>
      </div>

      {/* botón de ayuda: se ilumina si hay defecto y el tip sigue cerrado */}
      <button
        className={'pt-tip-btn' + (esDef && !abierto ? ' urge' : '') + (abierto ? ' on' : '')}
        onClick={() => setAbierto(!abierto)}
      >
        <Info size={13} /> {abierto ? 'Ocultar' : (esDef ? 'Revisa cómo valorarlo' : 'Cómo revisar esto')}
        <ChevronDown size={13} className="pt-tip-chev" style={{ transform: abierto ? 'rotate(180deg)' : 'none' }} />
      </button>

      {abierto && (
        <div className="pt-tip">
          <p className="pt-tip-l l-hacer"><Eye size={14} /> <span>{item.tip.hacer}</span></p>
          <p className="pt-tip-l l-normal"><Check size={14} /> <span>{item.tip.normal}</span></p>
          <p className="pt-tip-l l-alerta"><AlertTriangle size={14} /> <span>{item.tip.alerta}</span></p>
        </div>
      )}

      <div className="pt-seg3">
        {[['ok', 'Correcto', Check], ['obs', 'Observación', AlertTriangle], ['def', 'Defecto', XCircle]].map(([v, l, Ico]) => (
          <button key={v} className={'pt-b3 b-' + v + (it?.estado === v ? ' on' : '')}
            onClick={() => onEstado(it?.estado === v ? null : v)}>
            <Ico size={13} /> {l}
          </button>
        ))}
      </div>

      {/* campo de medición del ítem (opciones / número) */}
      {item.campo && (it?.estado || item.campo.siempre) && (
        <CampoItem campo={item.campo} valor={it?.campo} onChange={(v) => onNota({ campo: v })} />
      )}

      {(esDef || esObs) && (
        <input className="campo pt-nota-in" placeholder={esDef ? 'Qué has visto exactamente' : 'Qué quieres vigilar'}
          value={it?.nota || ''} onChange={(e) => onNota({ nota: e.target.value })} />
      )}

      {esDef && onFoto && (
        <FotoInline fotos={fotos} onFile={onFoto} label="Foto del defecto" />
      )}
    </li>
  );
}

function CampoItem({ campo, valor, onChange }) {
  if (campo.tipo === 'opciones') {
    return (
      <div className="pt-campo-item">
        <span className="pt-campo-l">{campo.label}</span>
        <div className="pt-opts">
          {campo.opciones.map((o) => (
            <button key={o} className={'pt-opt' + (valor === o ? ' on' : '')} onClick={() => onChange(valor === o ? '' : o)}>{o}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="pt-campo-item">
      <span className="pt-campo-l">{campo.label}</span>
      <input className="campo pt-campo-num" type="number" inputMode="numeric"
        placeholder={campo.placeholder || ''} value={valor || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ----------------------------------------------------- FOTO en línea */
function FotoInline({ fotos, onFile, label }) {
  const ref = useRef(null);
  return (
    <div className="pt-fotos">
      {(fotos || []).map((f) => (
        <div key={f.id} className="pt-foto" style={{ opacity: f.subiendo ? .5 : 1 }}><img src={f.url} alt="" /></div>
      ))}
      <button className="pt-foto-add" onClick={() => ref.current?.click()} title={label}>
        <Camera size={17} />
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

/* --------------------------------------------- FOTOS DE ESTADO (bloque) */
/* No van por defecto. Son las fotos de carrocería/interior/bajos que se
   piden en el bloque y se recogen todas juntas en el informe.          */
export function FotosEstado({ defs, fotos, onFoto }) {
  const ref = useRef({});
  if (!defs?.length) return null;
  return (
    <div className="pt-fotos-estado">
      <p className="pt-mini-t"><Camera size={13} /> Fotos de estado</p>
      <div className="pt-fotos-grid">
        {defs.map((d) => {
          const arr = fotos?.[d.id] || [];
          return (
            <div key={d.id} className="pt-foto-slot">
              <button className="pt-foto-slot-btn" onClick={() => ref.current[d.id]?.click()}>
                {arr[0] ? <img src={arr[0].url} alt={d.label} /> : <Camera size={18} />}
                {arr.length > 1 && <span className="pt-foto-badge">{arr.length}</span>}
              </button>
              <span className="pt-foto-label">{d.label}</span>
              <input ref={(el) => (ref.current[d.id] = el)} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={(e) => { onFoto(d.id, e.target.files?.[0]); e.target.value = ''; }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------- ESPESÓMETRO (coche) */
/* Planta del coche. Cada pieza abre un input de micras y se colorea sola.
   Verde fábrica · ámbar repintado · rojo masilla.                      */
const COLOR_MIC = (v) => {
  const n = parseFloat(v);
  if (!n) return 'nada';
  if (n <= 150) return 'ok';
  if (n <= 250) return 'medio';
  return 'alto';
};

export function Espesometro({ piezas, valores, onChange, refTexto }) {
  const [sel, setSel] = useState(null);
  // layout de la planta: cada pieza con su rect {x,y,w,h}
  const L = {
    capo:    { x: 30, y: 12, w: 60, h: 20, t: 'Capó' },
    techo:   { x: 30, y: 36, w: 60, h: 30, t: 'Techo' },
    porton:  { x: 30, y: 70, w: 60, h: 18, t: 'Portón' },
    ad_izq:  { x: 4,  y: 12, w: 22, h: 22, t: 'Al.DI' },
    ad_der:  { x: 94, y: 12, w: 22, h: 22, t: 'Al.DD' },
    pd_izq:  { x: 4,  y: 38, w: 22, h: 24, t: 'Pt.DI' },
    pd_der:  { x: 94, y: 38, w: 22, h: 24, t: 'Pt.DD' },
    pt_izq:  { x: 4,  y: 64, w: 22, h: 24, t: 'Pt.TI' },
    pt_der:  { x: 94, y: 64, w: 22, h: 24, t: 'Pt.TD' },
    at_izq:  { x: 4,  y: 90, w: 22, h: 20, t: 'Al.TI' },
    at_der:  { x: 94, y: 90, w: 22, h: 20, t: 'Al.TD' },
    pilar_izq: { x: 30, y: 90, w: 28, h: 20, t: 'Pilar I' },
    pilar_der: { x: 62, y: 90, w: 28, h: 20, t: 'Pilar D' },
  };
  const fill = { nada: 'var(--panel2)', ok: 'var(--green)', medio: 'var(--gold)', alto: 'var(--red-soft)' };
  return (
    <div className="pt-espeso">
      <svg viewBox="0 0 120 116" className="pt-coche" role="img" aria-label="Esquema del coche para el espesómetro">
        <rect x="1" y="8" width="118" height="104" rx="26" fill="var(--panel)" stroke="var(--card-bd)" />
        {piezas.map((p) => {
          const g = L[p.id]; if (!g) return null;
          const estado = COLOR_MIC(valores?.[p.id]);
          return (
            <g key={p.id} onClick={() => setSel(p.id)} style={{ cursor: 'pointer' }}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="4"
                fill={fill[estado]} fillOpacity={estado === 'nada' ? 0.6 : 0.85}
                stroke={sel === p.id ? 'var(--text)' : 'var(--card-bd)'} strokeWidth={sel === p.id ? 1.2 : 0.4} />
              <text x={g.x + g.w / 2} y={g.y + g.h / 2 + 1} textAnchor="middle" fontSize="5"
                fill="var(--text)" style={{ pointerEvents: 'none' }}>
                {valores?.[p.id] ? valores[p.id] : g.t}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="pt-leyenda">
        <span><i style={{ background: 'var(--green)' }} /> 80–150</span>
        <span><i style={{ background: 'var(--gold)' }} /> 150–250</span>
        <span><i style={{ background: 'var(--red-soft)' }} /> +300</span>
      </div>

      {sel && (
        <div className="pt-pieza-in">
          <label>{piezas.find((p) => p.id === sel)?.label} · micras</label>
          <div className="pt-euro">
            <input className="campo" type="number" inputMode="numeric" autoFocus placeholder="µm"
              value={valores?.[sel] || ''} onChange={(e) => onChange(sel, e.target.value)} />
            <span>µm</span>
          </div>
        </div>
      )}
      <p className="pt-ref">{refTexto}</p>
    </div>
  );
}

/* --------------------------------------------------------- RUEDAS x4 */
export function Ruedas({ ruedas, valores, onChange }) {
  return (
    <div className="pt-ruedas">
      <p className="pt-mini-t">Medición por rueda</p>
      <div className="pt-ruedas-grid">
        {ruedas.map((r) => {
          const v = valores?.[r.id] || {};
          return (
            <div key={r.id} className="pt-rueda">
              <span className="pt-rueda-l">{r.label}</span>
              <div className="pt-rueda-campos">
                <div className="pt-rueda-c">
                  <input className="campo" type="number" inputMode="decimal" placeholder="mm"
                    value={v.mm || ''} onChange={(e) => onChange(r.id, { ...v, mm: e.target.value })} />
                  <span>mm dibujo</span>
                </div>
                <div className="pt-rueda-c">
                  <input className="campo" type="number" inputMode="numeric" placeholder="%"
                    value={v.freno || ''} onChange={(e) => onChange(r.id, { ...v, freno: e.target.value })} />
                  <span>% freno</span>
                </div>
              </div>
              <div className="pt-rueda-desg">
                {['uniforme', 'interior', 'exterior', 'escalones'].map((d) => (
                  <button key={d} className={'pt-desg' + (v.desgaste === d ? ' on' : '')}
                    onClick={() => onChange(r.id, { ...v, desgaste: v.desgaste === d ? '' : d })}>{d}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- ELEVADOR */
export function Elevador({ valor, onChange }) {
  return (
    <div className="pt-elevador">
      <p className="pt-mini-t">¿Cómo revisas los bajos?</p>
      <div className="pt-opts">
        {['Elevador', 'Foso', 'No hay, fotos'].map((o) => (
          <button key={o} className={'pt-opt' + (valor === o ? ' on' : '')} onClick={() => onChange(valor === o ? '' : o)}>{o}</button>
        ))}
      </div>
      {valor === 'No hay, fotos' && (
        <p className="pt-ref">Sin elevador, métete debajo con linterna y saca fotos claras de cada zona. Es mejor una foto que una casilla sin mirar.</p>
      )}
    </div>
  );
}
