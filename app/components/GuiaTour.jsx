'use client';

// =====================================================================
//  GPSO COLLECTOR · GuiaTour  ·  app/components/GuiaTour.jsx
//  Motor de tutorial interactivo (coach-marks) reutilizable.
//  · Resalta un elemento (spotlight) + tarjeta explicativa.
//  · Auto la 1ª vez (localStorage) + reabrible con un botón.
//  · Responsive: en móvil la tarjeta va como hoja inferior.
//  · Independiente del diseño: usa las variables de globals.css.
//
//  USO:
//    import GuiaTour, { BotonGuia, useGuia } from '../components/GuiaTour';
//    const guia = useGuia('central-v1');          // key única por tutorial
//    <BotonGuia onClick={guia.abrir} />           // botón "¿Cómo funciona?"
//    <GuiaTour run={guia.run} steps={PASOS} onClose={guia.cerrar} />
//
//  Cada paso: { sel, titulo, texto, seccion?, antes?, placement? }
//    sel      -> selector CSS del elemento a resaltar (ej. '[data-tour="stats"]')
//                si no se encuentra / no se pasa -> paso centrado sin spotlight
//    texto    -> admite HTML simple (<b>, <span>…)
//    antes    -> función que se ejecuta al entrar al paso (ej. cambiar de pestaña)
//    placement-> 'auto' | 'top' | 'bottom' (por defecto 'auto')
// =====================================================================

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { X, ArrowLeft, HelpCircle } from 'lucide-react';

/* Hook: controla apertura + "ya visto" en localStorage */
export function useGuia(key, { auto = true } = {}) {
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!auto) return;
    let visto = false;
    try { visto = localStorage.getItem('guia_' + key) === '1'; } catch {}
    if (!visto) {
      // pequeño delay para que la página pinte antes de arrancar
      const t = setTimeout(() => setRun(true), 650);
      return () => clearTimeout(t);
    }
  }, [key, auto]);
  const marcarVisto = () => { try { localStorage.setItem('guia_' + key, '1'); } catch {} };
  return {
    run,
    abrir: () => setRun(true),
    cerrar: () => { setRun(false); marcarVisto(); },
  };
}

/* Botón reutilizable para reabrir la guía */
export function BotonGuia({ onClick, texto = '¿Cómo funciona?', style }) {
  return (
    <button onClick={onClick} style={{ ...S.helpBtn, ...style }} title="Ver el tutorial">
      <HelpCircle size={15} /> <span className="guia-help-txt">{texto}</span>
    </button>
  );
}

export default function GuiaTour({ run, steps = [], onClose, zIndex = 2000 }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const tipRef = useRef(null);
  const [tipH, setTipH] = useState(230);

  const total = steps.length;
  const step = steps[i];

  // al abrir, siempre desde el principio
  useEffect(() => { if (run) setI(0); }, [run]);

  const medir = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    if (!step) return;
    const el = step.sel ? document.querySelector(step.sel) : null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // al cambiar de paso: ejecutar "antes", hacer scroll al elemento y medir
  useLayoutEffect(() => {
    if (!run || !step) return;
    try { step.antes?.(); } catch {}
    const el = step.sel ? document.querySelector(step.sel) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // medir tras el scroll (dos frames + un pequeño margen)
    const t = setTimeout(medir, 380);
    requestAnimationFrame(() => requestAnimationFrame(medir));
    return () => clearTimeout(t);
  }, [run, i, step, medir]);

  // recalcular en resize / scroll
  useEffect(() => {
    if (!run) return;
    const onR = () => medir();
    window.addEventListener('resize', onR);
    window.addEventListener('scroll', onR, true);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('scroll', onR, true);
    };
  }, [run, medir]);

  // alto real de la tarjeta para colocarla bien
  useEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight || 230);
  }, [i, run, rect]);

  // teclado: flechas / esc
  useEffect(() => {
    if (!run) return;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line

  if (!run || !step) return null;

  const esMovil = vp.w <= 560;
  const pad = 8;
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // posición de la tarjeta
  let tipStyle;
  if (esMovil) {
    tipStyle = { left: 12, right: 12, bottom: 14, width: 'auto', maxWidth: 'none' };
  } else if (!hole) {
    tipStyle = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 430 };
  } else {
    const W = 430, margin = 16, gap = 16;
    const abajo = hole.top + hole.height + gap + tipH < vp.h;
    let top = abajo ? hole.top + hole.height + gap : hole.top - gap - tipH;
    if (top < margin) top = margin;
    if (top + tipH > vp.h - margin) top = vp.h - margin - tipH;
    let left = hole.left + hole.width / 2 - W / 2;
    left = Math.max(margin, Math.min(left, vp.w - W - margin));
    tipStyle = { left, top, width: W };
  }

  const cerrar = () => onClose?.();
  const next = () => { if (i < total - 1) setI(i + 1); else cerrar(); };
  const prev = () => setI(Math.max(0, i - 1));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex }} aria-live="polite">
      {/* capa oscura + hueco (spotlight con box-shadow gigante) */}
      {hole ? (
        <>
          <div onClick={cerrar} style={{ position: 'fixed', inset: 0, cursor: 'pointer' }} />
          <div style={{
            position: 'fixed', top: hole.top, left: hole.left, width: hole.width, height: hole.height,
            borderRadius: 14, boxShadow: '0 0 0 3px var(--gold), 0 0 0 9999px rgba(6,5,6,.76)',
            pointerEvents: 'none', transition: 'all .35s cubic-bezier(.2,.8,.2,1)',
          }} />
        </>
      ) : (
        <div onClick={cerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(6,5,6,.78)', cursor: 'pointer' }} />
      )}

      {/* tarjeta */}
      <div ref={tipRef} style={{ ...S.tip, ...tipStyle, position: 'fixed' }}>
        <button onClick={cerrar} style={S.x} title="Cerrar (Esc)"><X size={16} /></button>
        <div style={S.step}>Paso {i + 1} de {total}{step.seccion ? ` · ${step.seccion}` : ''}</div>
        <div className="display" style={S.tt}>{step.titulo}</div>
        <div style={S.tx} dangerouslySetInnerHTML={{ __html: step.texto }} />
        <div style={S.row}>
          <div style={S.dots}>
            {steps.map((_, k) => (
              <span key={k} style={{ ...S.dot, ...(k === i ? S.dotOn : {}) }} onClick={() => setI(k)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {i > 0 && <button onClick={prev} style={S.b}><ArrowLeft size={15} /></button>}
            <button onClick={next} style={{ ...S.b, ...S.bPrimary }}>
              {i < total - 1 ? 'Siguiente' : 'Entendido'}
            </button>
          </div>
        </div>
        {i === 0 && total > 1 && (
          <button onClick={cerrar} style={S.skip}>Saltar tutorial</button>
        )}
      </div>
    </div>
  );
}

const S = {
  helpBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
    color: 'var(--gold)', background: 'rgba(232,163,61,.10)', border: '1px solid rgba(232,163,61,.35)',
    borderRadius: 20, padding: '7px 13px', cursor: 'pointer',
  },
  tip: {
    background: 'linear-gradient(150deg, rgba(20,16,18,.98), rgba(11,9,10,.97))',
    border: '1px solid rgba(232,163,61,.38)', borderRadius: 18,
    boxShadow: '0 30px 80px rgba(0,0,0,.7)', padding: 22, color: 'var(--text)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  },
  x: {
    position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
    color: 'var(--gray-mid)', cursor: 'pointer', padding: 2, lineHeight: 0,
  },
  step: { fontSize: 11.5, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, paddingRight: 24 },
  tt: { fontSize: 24, lineHeight: 1.1, marginBottom: 10, color: 'var(--text)' },
  tx: { fontSize: 15, lineHeight: 1.55, color: 'var(--text-soft)' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  dots: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  dot: { width: 7, height: 7, borderRadius: 50, background: 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'all .2s' },
  dotOn: { background: 'var(--gold)', width: 20, borderRadius: 10 },
  b: {
    fontFamily: 'inherit', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
    border: '1px solid var(--card-bd)', background: 'transparent', color: 'var(--text-soft)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  bPrimary: { background: 'var(--btn-grad)', color: 'var(--btn-fg)', border: 'none' },
  skip: {
    position: 'absolute', bottom: -30, left: 0, background: 'none', border: 'none',
    color: 'rgba(255,255,255,.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 4,
  },
};
