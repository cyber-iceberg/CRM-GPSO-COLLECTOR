'use client';

// =====================================================================
//  app/peritacion/Informe.jsx
//  El informe pro que ve el alumno al terminar y enseña al cliente.
//  · Ficha + veredicto de 140 puntos
//  · Coche pintado (mapa de micras) y ruedas con datos
//  · TODAS las anotaciones resumidas por bloque (que no se pierdan)
//  · Fotos de estado juntas · números · patrones
// =====================================================================

import { Flag, Car, Camera, Gauge, MapPin, Calendar, Printer } from 'lucide-react';
import { BLOQUES, META, PIEZAS_PINTURA, RUEDAS } from './lib/contenido';
import { defectosDe, observacionesDe } from './lib/motor';

const COLOR_MIC = (v) => { const n = parseFloat(v); if (!n) return 'nada'; if (n <= 150) return 'ok'; if (n <= 250) return 'medio'; return 'alto'; };

const SEM = {
  VERDE:    { c: 'var(--green)', bg: 'var(--green-bg)', bd: 'var(--green-bd)', t: 'Compra recomendable' },
  AMARILLO: { c: 'var(--gold)', bg: 'rgba(232,163,61,.10)', bd: 'rgba(232,163,61,.35)', t: 'Compra posible con negociación' },
  ROJO:     { c: 'var(--red-soft)', bg: 'var(--red-bg)', bd: 'var(--red-bd)', t: 'Compra no recomendable' },
};
const DESG = { uniforme: 'Parejo', bordes: 'Por los bordes', centro: 'Por el centro', un_lado: 'Solo un lado', parches: 'A parches' };


/* las banderas de item vienen con el texto del checklist; lo pasamos a la
   frase de hallazgo si existe, para que no diga "Sin testigos encendidos" */
function fraseBandera(f) {
  for (const b of BLOQUES) {
    if (b.id !== f.bloque_id) continue;
    const it = b.items.find((x) => x.t === f.texto);
    if (it?.mal) return it.mal;
  }
  return f.texto;
}

export function Informe({ res, patrones, resp, medic, ficha, costes, ct, cierre, fotos, setPaso, aviso }) {
  const s = SEM[res.semaforo];

  // anotaciones: recoge todo lo escrito en cada punto + obs de bloque
  const anotaciones = BLOQUES.map((b) => {
    const items = resp[b.id]?.items || {};
    const puntos = b.items.map((it, i) => ({ it, i, ...(items['it_' + i] || {}) }))
      .filter((x) => (x.estado === 'def' || x.estado === 'obs') || x.nota);
    const obs = resp[b.id]?.obs;
    return { b, puntos, obs };
  }).filter((x) => x.puntos.length || x.obs);

  // fotos: aplanar todas las que haya
  const todasFotos = [];
  Object.entries(fotos || {}).forEach(([clave, arr]) => {
    const [bid, slot] = clave.split(':');
    const bloque = BLOQUES.find((x) => x.id === bid);
    const def = bloque?.fotos?.find((f) => f.id === slot);
    (arr || []).forEach((f) => todasFotos.push({ ...f, bloque: bloque?.nombre, etiqueta: def?.label || 'Defecto' }));
  });

  const micras = medic?.micras || {};
  const hayMicras = Object.values(micras).some((v) => parseFloat(v) > 0);
  const ruedas = medic?.ruedas || {};
  const hayRuedas = Object.values(ruedas).some((r) => r?.mm || r?.freno || r?.desgaste);

  const nDef = BLOQUES.reduce((a, b) => a + defectosDe(b, resp).length, 0);
  const nObs = BLOQUES.reduce((a, b) => a + observacionesDe(b, resp).length, 0);

  return (
    <div className="pt-informe">
      {/* CABECERA IMPRIMIBLE */}
      <div className="pt-inf-head">
        <div>
          <p className="pt-eyebrow">{META.titulo} · {META.puntos_comprobacion} puntos</p>
          <h1 className="display" style={{ fontSize: 26, margin: '2px 0 0' }}>{ficha.modelo || 'Unidad'}</h1>
        </div>
        <div className={'pt-inf-sello v-' + res.semaforo} style={{ borderColor: s.bd, background: s.bg, color: s.c }}>
          <b>{res.semaforo}</b><span>{res.total}/100</span>
        </div>
      </div>

      <div className="pt-inf-ficha">
        {ficha.vin && <span><Car size={12} /> {ficha.vin}</span>}
        {ficha.km && <span><Gauge size={12} /> {Number(ficha.km).toLocaleString('es-ES')} km</span>}
        {ficha.ciudad && <span><MapPin size={12} /> {ficha.ciudad}</span>}
        {ficha.fecha && <span><Calendar size={12} /> {ficha.fecha}</span>}
        {ficha.vendedor && <span>{ficha.vendedor}</span>}
      </div>

      {/* VEREDICTO */}
      <div className="glass pt-veredicto" style={{ borderColor: s.bd, background: s.bg, marginTop: 14 }}>
        <h2 className="display" style={{ fontSize: 21, margin: '0 0 6px' }}>{s.t}</h2>
        {!res.concluyente && <p className="pt-v-aviso">Solo se revisó el {res.completitud}%: resultado no concluyente.</p>}
        {res.banderas.length > 0 && (
          <div className="pt-inf-banderas">
            <p className="pt-k" style={{ color: 'var(--red-soft)', display: 'flex', alignItems: 'center', gap: 6 }}><Flag size={13} /> {res.banderas.length} bandera{res.banderas.length > 1 ? 's' : ''} roja{res.banderas.length > 1 ? 's' : ''}</p>
            {res.banderas.map((f, i) => <p key={i} className="pt-inf-bandera">{fraseBandera(f)} <em>{f.bloque}</em></p>)}
          </div>
        )}
      </div>

      {/* QUÉ HA PASADO */}
      {patrones.length > 0 && (<>
        <h3 className="pt-h3">Qué ha pasado en la inspección</h3>
        {patrones.map((p, i) => (
          <div key={i} className="glass pt-hallazgo" style={{ borderLeftColor: p.nivel === 'alto' ? 'var(--red-soft)' : 'var(--gold)' }}>
            <p className="pt-k">{p.titulo}</p><p style={{ margin: '5px 0 0', color: 'var(--text-soft)', fontSize: 14 }}>{p.texto}</p>
          </div>
        ))}
      </>)}

      {/* COCHE PINTADO */}
      {hayMicras && (<>
        <h3 className="pt-h3">Mapa de pintura</h3>
        <div className="glass pt-card">
          <CochePintado micras={micras} />
          <div className="pt-leyenda" style={{ marginTop: 8 }}>
            <span><i style={{ background: 'var(--green)' }} /> Fábrica</span>
            <span><i style={{ background: 'var(--gold)' }} /> Repintado</span>
            <span><i style={{ background: 'var(--red-soft)' }} /> Masilla / golpe</span>
          </div>
        </div>
      </>)}

      {/* RUEDAS */}
      {hayRuedas && (<>
        <h3 className="pt-h3">Neumáticos y frenos</h3>
        <div className="glass pt-card pt-inf-ruedas">
          {RUEDAS.map((r) => {
            const v = ruedas[r.id] || {};
            if (!v.mm && !v.freno && !v.desgaste) return null;
            return (
              <div key={r.id} className="pt-inf-rueda">
                <span className="pt-inf-rueda-l">{r.label}</span>
                <div className="pt-inf-rueda-d">
                  {v.mm && <span><b>{v.mm}</b> mm</span>}
                  {v.freno && <span><b>{v.freno}</b>% freno</span>}
                  {v.desgaste && <span className="pt-inf-desg">{DESG[v.desgaste] || v.desgaste}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ANOTACIONES RESUMIDAS — lo que pediste que no se pierda */}
      {anotaciones.length > 0 && (<>
        <h3 className="pt-h3">Todo lo anotado</h3>
        <div className="glass pt-card">
          {anotaciones.map(({ b, puntos, obs }) => (
            <div key={b.id} className="pt-anota-bloque">
              <p className="pt-anota-t">{b.nombre}</p>
              {puntos.map((p) => {
                // el informe redacta: usa la frase de hallazgo, no la etiqueta del checklist
                const frase = p.estado === 'def' ? (p.it.mal || p.it.t)
                            : p.estado === 'obs' ? (p.it.obs || p.it.t)
                            : p.it.t;
                return (
                  <div key={p.i} className={'pt-anota-l a-' + (p.estado || 'nota')}>
                    <span className="pt-anota-punto">
                      {p.estado === 'def' && <b className="pt-anota-def">Defecto</b>}
                      {p.estado === 'obs' && <b className="pt-anota-obs">A vigilar</b>}
                      {frase}
                      {p.estado === 'def' && <em className="pt-anota-pen">−{p.it.pen}</em>}
                    </span>
                    {p.nota && <span className="pt-anota-nota">“{p.nota}”</span>}
                    {p.campo && <span className="pt-anota-campo">{p.campo}</span>}
                  </div>
                );
              })}
              {obs && <p className="pt-anota-obs-bloque">{obs}</p>}
            </div>
          ))}
        </div>
      </>)}

      {/* FOTOS */}
      {todasFotos.length > 0 && (<>
        <h3 className="pt-h3"><Camera size={13} style={{ verticalAlign: -2, marginRight: 5 }} /> Fotos ({todasFotos.length})</h3>
        <div className="glass pt-card">
          <div className="pt-inf-fotos">
            {todasFotos.map((f) => (
              <figure key={f.id} className="pt-inf-foto">
                <img src={f.url} alt={f.etiqueta} />
                <figcaption>{f.etiqueta}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </>)}

      {/* NÚMEROS */}
      <h3 className="pt-h3">Números</h3>
      <div className="glass pt-card">
        <div className="pt-kpi"><span>Precio pedido</span><b className="display">{ficha.precio ? parseFloat(ficha.precio).toLocaleString('es-ES') + ' €' : '—'}</b></div>
        <div className="pt-kpi"><span>Costes detectados</span><b className="display">{ct.toLocaleString('es-ES')} €</b></div>
        <div className="pt-kpi"><span>Coste real de entrada</span><b className="display" style={{ fontSize: 24 }}>{((parseFloat(ficha.precio) || 0) + ct).toLocaleString('es-ES')} €</b></div>
        {ct > 0 && <p className="pt-cob" style={{ marginTop: 10 }}>Pide al menos {ct.toLocaleString('es-ES')} € de ajuste, o sale de tu margen.</p>}
      </div>

      {cierre.notas && (<>
        <h3 className="pt-h3">Notas del alumno</h3>
        <div className="glass pt-card"><p style={{ margin: 0, color: 'var(--text-soft)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{cierre.notas}</p></div>
      </>)}

      <p className="pt-cob" style={{ textAlign: 'center', margin: '18px 0 0' }}>
        Peritación de {META.puntos_comprobacion} puntos · {nDef} defectos · {nObs} observaciones · {res.completitud}% revisado
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        <button className="btn-de" onClick={() => window.print()} style={{ flex: 1, minWidth: 180, padding: '14px' }}><Printer size={15} style={{ verticalAlign: -2, marginRight: 7 }} /> DESCARGAR PDF</button>
      </div>
      <p className="pt-cob" style={{ textAlign: 'center', marginTop: 8 }}>Se abre el diálogo de impresión: elige “Guardar como PDF”.</p>
    </div>
  );
}

/* silueta del coche en modo resultado (misma forma, solo lectura) */
function CochePintado({ micras }) {
  const fill = { nada: 'var(--panel2)', ok: 'var(--green)', medio: 'var(--gold)', alto: 'var(--red-soft)' };
  const col = (id) => fill[COLOR_MIC(micras?.[id])];
  const op = (id) => (COLOR_MIC(micras?.[id]) === 'nada' ? 0.4 : 0.9);
  const Z = ({ id, d, cx, cy }) => (
    <g>
      <path d={d} fill={col(id)} fillOpacity={op(id)} stroke="rgba(255,255,255,.12)" strokeWidth="0.6" strokeLinejoin="round" />
      {micras?.[id] && <text x={cx} y={cy} textAnchor="middle" fontSize="6.5" fontWeight="600" fill="var(--text)">{micras[id]}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 150 250" className="pt-coche" style={{ maxWidth: 180, margin: '0 auto', display: 'block' }} role="img" aria-label="Mapa de pintura del coche">
      <path d="M75 6 C95 6 108 16 112 34 L116 70 C119 90 119 120 118 150 L116 210 C114 232 100 244 75 244 C50 244 36 232 34 210 L32 150 C31 120 31 90 34 70 L38 34 C42 16 55 6 75 6 Z" fill="var(--panel)" stroke="var(--card-bd)" strokeWidth="1.2" />
      <path d="M46 60 L104 60 L98 78 L52 78 Z" fill="rgba(255,255,255,.04)" />
      <path d="M52 168 L98 168 L104 186 L46 186 Z" fill="rgba(255,255,255,.04)" />
      <Z id="capo" cx={75} cy={38} d="M46 20 C50 12 60 10 75 10 C90 10 100 12 104 20 L106 54 L44 54 Z" />
      <Z id="techo" cx={75} cy={125} d="M52 80 L98 80 L98 166 L52 166 Z" />
      <Z id="porton" cx={75} cy={208} d="M44 192 L106 192 L104 226 C100 234 90 236 75 236 C60 236 50 234 46 226 Z" />
      <Z id="ad_izq" cx={39} cy={46} d="M33 34 L44 34 L44 60 L34 60 Z" />
      <Z id="pd_izq" cx={41} cy={90} d="M33 66 L50 66 L50 110 L33 106 Z" />
      <Z id="pt_izq" cx={41} cy={138} d="M33 114 L50 114 L50 158 L33 158 Z" />
      <Z id="at_izq" cx={39} cy={184} d="M33 164 L44 164 L44 200 L34 196 Z" />
      <Z id="ad_der" cx={111} cy={46} d="M106 34 L117 34 L116 60 L106 60 Z" />
      <Z id="pd_der" cx={109} cy={90} d="M100 66 L117 66 L117 106 L100 110 Z" />
      <Z id="pt_der" cx={109} cy={138} d="M100 114 L117 114 L117 158 L100 158 Z" />
      <Z id="at_der" cx={111} cy={184} d="M106 164 L117 164 L116 196 L106 200 Z" />
      <Z id="pilar_izq" cx={56} cy={125} d="M52 80 L60 80 L60 166 L52 166 Z" />
      <Z id="pilar_der" cx={94} cy={125} d="M90 80 L98 80 L98 166 L90 166 Z" />
    </svg>
  );
}
