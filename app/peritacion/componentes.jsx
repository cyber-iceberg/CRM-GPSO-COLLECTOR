'use client';

// =====================================================================
//  app/peritacion/componentes.jsx
//  Piezas de interfaz de la peritación, sobre el sistema AURA.
//  Se importan desde PeritacionClient para no tener un fichero de 1500
//  líneas. Todo con clases .pt- y variables de globals.css.
// =====================================================================

import { useState, useRef, useEffect } from 'react';
import {
  Check, AlertTriangle, XCircle, Eye, Camera, Info, ChevronDown, Flag, Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------- ÍTEM */
/* Cerrado por defecto. El tip (hacer/normal/alerta) se despliega al tocar
   "cómo revisar". Al marcar Defecto, ese botón se ilumina para invitar a
   abrirlo justo cuando más falta hace saber si es grave.               */
export function Item({ b, i, it, onEstado, onNota, onFoto, fotos }) {
  const [abierto, setAbierto] = useState(false);
  const item = b.items[i];
  // al cambiar de bloque, cerrar el tip (evita que quede abierto del anterior)
  useEffect(() => { setAbierto(false); }, [b.id, i]);
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
        <div key={f.id} className="pt-foto">
          <img src={f.url} alt="" style={{ opacity: f.subiendo ? .45 : 1 }} />
          <span className={'pt-foto-estado ' + (f.subiendo ? 'sub' : 'ok')}>
            {f.subiendo ? <Loader2 size={13} className="pt-spin" /> : <Check size={13} />}
          </span>
        </div>
      ))}
      <button className="pt-foto-add" onClick={() => ref.current?.click()} title={label}>
        <Camera size={17} /> <span className="pt-foto-add-t">Añadir</span>
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
                {arr[0] ? <img src={arr[0].url} alt={d.label} style={{ opacity: arr[0].subiendo ? .5 : 1 }} /> : <Camera size={18} />}
                {arr.length > 1 && <span className="pt-foto-badge">{arr.length}</span>}
                {arr[0] && (
                  <span className={'pt-slot-estado ' + (arr.some(x=>x.subiendo) ? 'sub' : 'ok')}>
                    {arr.some(x=>x.subiendo) ? <Loader2 size={12} className="pt-spin" /> : <Check size={12} />}
                  </span>
                )}
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
  const fill = { nada: 'var(--panel2)', ok: 'var(--green)', medio: 'var(--gold)', alto: 'var(--red-soft)' };
  const col = (id) => fill[COLOR_MIC(valores?.[id])];
  const op = (id) => (COLOR_MIC(valores?.[id]) === 'nada' ? 0.5 : 0.9);
  const strk = (id) => (sel === id ? 'var(--text)' : 'rgba(255,255,255,.15)');
  const sw = (id) => (sel === id ? 1.4 : 0.6);
  // silueta cenital: cada zona es un path con forma real de esa parte del coche
  const Z = ({ id, d, cx, cy }) => (
    <g onClick={() => setSel(id)} style={{ cursor: 'pointer' }}>
      <path d={d} fill={col(id)} fillOpacity={op(id)} stroke={strk(id)} strokeWidth={sw(id)} strokeLinejoin="round" />
      <text x={cx} y={cy} textAnchor="middle" fontSize="6.5" fontWeight="600" fill="var(--text)" style={{ pointerEvents: 'none' }}>
        {valores?.[id] || '·'}
      </text>
    </g>
  );
  const lbl = piezas.find((p) => p.id === sel)?.label;
  return (
    <div className="pt-espeso">
      <svg viewBox="0 0 150 250" className="pt-coche" role="img" aria-label="Silueta del coche para anotar micras por pieza">
        {/* contorno del coche visto desde arriba */}
        <path d="M75 6 C95 6 108 16 112 34 L116 70 C119 90 119 120 118 150 L116 210 C114 232 100 244 75 244 C50 244 36 232 34 210 L32 150 C31 120 31 90 34 70 L38 34 C42 16 55 6 75 6 Z"
          fill="var(--panel)" stroke="var(--card-bd)" strokeWidth="1.2" />
        {/* parabrisas y luneta (referencias visuales, no clicables) */}
        <path d="M46 60 L104 60 L98 78 L52 78 Z" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" strokeWidth="0.5" />
        <path d="M52 168 L98 168 L104 186 L46 186 Z" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" strokeWidth="0.5" />

        {/* CAPÓ (frente) */}
        <Z id="capo" cx={75} cy={40} d="M46 20 C50 12 60 10 75 10 C90 10 100 12 104 20 L106 54 L44 54 Z" />
        {/* TECHO */}
        <Z id="techo" cx={75} cy={123} d="M52 80 L98 80 L98 166 L52 166 Z" />
        {/* PORTÓN (trasera) */}
        <Z id="porton" cx={75} cy={208} d="M44 192 L106 192 L104 226 C100 234 90 236 75 236 C60 236 50 234 46 226 Z" />

        {/* ALETAS Y PUERTAS izquierda */}
        <Z id="ad_izq" cx={40} cy={44} d="M33 34 L44 34 L44 60 L34 60 Z" />
        <Z id="pd_izq" cx={40} cy={92} d="M33 66 L50 66 L50 110 L33 106 Z" />
        <Z id="pt_izq" cx={40} cy={140} d="M33 114 L50 114 L50 158 L33 158 Z" />
        <Z id="at_izq" cx={40} cy={186} d="M33 164 L44 164 L44 200 L34 196 Z" />
        {/* derecha */}
        <Z id="ad_der" cx={110} cy={44} d="M106 34 L117 34 L116 60 L106 60 Z" />
        <Z id="pd_der" cx={110} cy={92} d="M100 66 L117 66 L117 106 L100 110 Z" />
        <Z id="pt_der" cx={110} cy={140} d="M100 114 L117 114 L117 158 L100 158 Z" />
        <Z id="at_der" cx={110} cy={186} d="M106 164 L117 164 L116 196 L106 200 Z" />
        {/* PILARES (centro, junto al techo) */}
        <Z id="pilar_izq" cx={60} cy={123} d="M52 80 L60 80 L60 166 L52 166 Z" />
        <Z id="pilar_der" cx={90} cy={123} d="M90 80 L98 80 L98 166 L90 166 Z" />
      </svg>

      {sel ? (
        <div className="pt-pieza-in">
          <span className="pt-pieza-nombre">{lbl}</span>
          <div className="pt-euro">
            <input className="campo pt-num" type="number" inputMode="numeric" autoFocus placeholder="µm"
              value={valores?.[sel] || ''} onChange={(e) => onChange(sel, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSel(null); }} />
            <span>µm</span>
            <button className="pt-pieza-ok" onClick={() => setSel(null)}>Listo</button>
          </div>
        </div>
      ) : (
        <p className="pt-espeso-hint">Toca una zona del coche para anotar sus micras</p>
      )}

      <div className="pt-leyenda">
        <span><i style={{ background: 'var(--green)' }} /> Fábrica 80–150</span>
        <span><i style={{ background: 'var(--gold)' }} /> Repintado 150–250</span>
        <span><i style={{ background: 'var(--red-soft)' }} /> Masilla +300</span>
      </div>
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
                <span className="pt-desg-t">Cómo está gastado:</span>
                {[
                  ['uniforme', 'Parejo', 'Se gasta igual por todo el ancho. Lo normal.'],
                  ['bordes', 'Por los bordes', 'Más gastado en los dos bordes: presión baja.'],
                  ['centro', 'Por el centro', 'Más gastado en el centro: presión alta.'],
                  ['un_lado', 'Solo un lado', 'Un borde mucho más que el otro: geometría o suspensión.'],
                  ['parches', 'A parches', 'Desgaste en escalones o zonas: amortiguador.'],
                ].map(([d, lab, ayuda]) => (
                  <button key={d} className={'pt-desg' + (v.desgaste === d ? ' on' : '')} title={ayuda}
                    onClick={() => onChange(r.id, { ...v, desgaste: v.desgaste === d ? '' : d })}>{lab}</button>
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
