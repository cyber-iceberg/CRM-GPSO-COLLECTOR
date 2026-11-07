'use client';

// =====================================================================
//  LA RUTA DEL IMPORTADOR · Motor jugable  ·  app/recursos/ruta/RutaClient.jsx
//  Mapa (Mundo 1) + cámara (zoom/pan) + checkpoints + coche-avatar +
//  entrada a escenario con panel de nivel + progreso.
//  - Recibe { mundo, niveles, perfil } desde el server; si no llegan,
//    usa los datos semilla de abajo (FALLBACK) para renderizar igual.
//  - El coche se aparca en el nivel actual y "conduce" al siguiente al
//    completar (transición sobre el mapa).
//  Requiere: /mundo1.webp en /public  ·  lucide-react
// =====================================================================

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import {
  BookOpen, Search, ClipboardCheck, ShoppingCart, Truck, Crown,
  Lock, Check, Play, ChevronRight, Flame, Zap, ArrowLeft, X, FileText, Sheet, Film,
} from 'lucide-react';

const MAPA_ASPECT = 1914 / 822;

const ICONOS = { book: BookOpen, search: Search, clipboard: ClipboardCheck, handshake: ShoppingCart, truck: Truck, crown: Crown, flag: Search };
const RICON = { file: FileText, sheet: Sheet, play: Film };

// ---------- DATOS SEMILLA (si el server no pasa nada) ----------
const FALLBACK_NIVELES = [
  { slug:'fundamentos', titulo:'Fundamentos', subtitulo:'Costa de salida', descripcion:'Entiende el negocio y la mentalidad del importador.',
    orden:1, pos_x:13.3, pos_y:79.0, cam_zoom:2.4, icono:'book', xp:100, estado:'completado', escenario_url:'/escenario-fundamentos.webp',
    misiones:[{titulo:'Ver módulos 1–3 de la formación',tipo:'ver',xp:40,estado:'ok'},
              {titulo:'Masterclass: una operación de principio a fin',tipo:'ver',xp:30,estado:'ok'},
              {titulo:'Test: márgenes y flujo de una importación',tipo:'test',xp:30,estado:'ok'}],
    recursos:[{titulo:'Guía: cómo funciona una importación',icono:'file'},{titulo:'Glosario del importador',icono:'file'}] },
  { slug:'cazar', titulo:'Cazar oportunidades', subtitulo:'El viaducto', descripcion:'Aprende a detectar coches con potencial en el mercado alemán.',
    orden:2, pos_x:31.4, pos_y:55.5, cam_zoom:2.6, icono:'search', xp:150, estado:'en_curso', escenario_url:'/escenario-cazar.webp',
    misiones:[{titulo:'Ver los módulos de búsqueda / sourcing',tipo:'ver',xp:40,estado:'ok'},
              {titulo:'Guardar 5 coches con potencial',tipo:'tarea',xp:60,estado:'en_curso'},
              {titulo:'Ejercicio: ¿es una oportunidad?',tipo:'ejercicio',xp:50,estado:'pendiente'}],
    recursos:[{titulo:'Checklist de compra',icono:'file'},{titulo:'Plantilla de análisis de margen',icono:'sheet'},{titulo:'Masterclass: mercado alemán',icono:'play'}] },
  { slug:'peritar', titulo:'Peritar el coche', subtitulo:'El circuito', descripcion:'Evalúa el estado real y el valor de un coche.',
    orden:3, pos_x:15.7, pos_y:35.0, cam_zoom:2.8, icono:'clipboard', xp:180, estado:'bloqueado', escenario_url:'/escenario-peritar.webp',
    misiones:[{titulo:'Completar una peritación guiada',tipo:'tarea',xp:80,estado:'pendiente'},
              {titulo:'Caso práctico: detectar los fallos',tipo:'ejercicio',xp:50,estado:'pendiente'},
              {titulo:'Test: puntos críticos de inspección',tipo:'test',xp:50,estado:'pendiente'}],
    recursos:[{titulo:'Guía de peritación',icono:'file'},{titulo:'Checklist mecánico',icono:'file'}] },
  { slug:'negociar', titulo:'Negociar y comprar', subtitulo:'El concesionario', descripcion:'Contacta, negocia y cierra la compra con seguridad.',
    orden:4, pos_x:79.4, pos_y:48.0, cam_zoom:2.8, icono:'handshake', xp:200, estado:'bloqueado', escenario_url:'/escenario-negociar.webp',
    misiones:[{titulo:'Simular una negociación',tipo:'tarea',xp:70,estado:'pendiente'},
              {titulo:'Rellenar un contrato de reserva',tipo:'tarea',xp:60,estado:'pendiente'},
              {titulo:'Test: cláusulas y señales de estafa',tipo:'test',xp:70,estado:'pendiente'}],
    recursos:[{titulo:'Plantillas de contrato',icono:'file'},{titulo:'Guión de negociación',icono:'file'}] },
  { slug:'importar', titulo:'Traer e importar', subtitulo:'La aduana', descripcion:'Logística, transporte y matriculación en España.',
    orden:5, pos_x:55.4, pos_y:53.5, cam_zoom:2.8, icono:'truck', xp:200, estado:'bloqueado', escenario_url:'/escenario-importar.webp',
    misiones:[{titulo:'Organizar el transporte',tipo:'tarea',xp:60,estado:'pendiente'},
              {titulo:'Preparar la documentación de importación',tipo:'tarea',xp:70,estado:'pendiente'},
              {titulo:'Gestión de matriculación (ITV, impuestos, DGT)',tipo:'tarea',xp:70,estado:'pendiente'}],
    recursos:[{titulo:'Contrato de gestión de matriculación',icono:'file'},{titulo:'Checklist de trámites',icono:'file'}] },
  { slug:'meta', titulo:'Meta: Importador', subtitulo:'El castillo', descripcion:'Cierra tu primera operación completa.',
    orden:6, pos_x:71.8, pos_y:9.7, cam_zoom:2.6, icono:'crown', xp:300, estado:'bloqueado', escenario_url:'/escenario-meta.webp',
    misiones:[{titulo:'Entregar el coche al cliente',tipo:'tarea',xp:100,estado:'pendiente'},
              {titulo:'Completar una operación de principio a fin',tipo:'tarea',xp:100,estado:'pendiente'},
              {titulo:'Examen final → rango Importador',tipo:'test',xp:100,estado:'pendiente'}],
    recursos:[{titulo:'Plantilla de entrega',icono:'file'},{titulo:'Resumen de toda la ruta',icono:'file'}] },
];
const FALLBACK_PERFIL = { nivel:7, rango:'Buscador Pro', xp_total:1240, xp_sig:2000, rango_sig:'Perito Jr.', racha:12, coche_tier:1 };

// ---------- coche-avatar (top-down) ----------
function Coche({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ filter:'drop-shadow(0 6px 10px rgba(0,0,0,.65))' }}>
      <defs><linearGradient id="rc-bdy" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eef1f6"/><stop offset=".5" stopColor="#aeb6c4"/><stop offset="1" stopColor="#656d7d"/></linearGradient></defs>
      <rect x="16" y="20" width="30" height="20" rx="9" fill="url(#rc-bdy)"/>
      <rect x="20" y="23" width="13" height="14" rx="5" fill="#12151d"/>
      <rect x="34" y="25" width="7" height="10" rx="3" fill="#0c0f16"/>
      <circle cx="44" cy="25" r="2.2" fill="#fff6d6"/><circle cx="44" cy="35" r="2.2" fill="#fff6d6"/>
      <rect x="16.5" y="23" width="2.6" height="14" rx="1.3" fill="#ff3b3b"/>
    </svg>
  );
}

export default function RutaClient({ mundo, niveles, perfil, esAdmin = false }) {
  const NIV = (niveles && niveles.length ? niveles : FALLBACK_NIVELES).slice().sort((a,b)=>a.orden-b.orden);
  const PER = perfil || FALLBACK_PERFIL;
  const admin = esAdmin || perfil?.rol === 'admin';  // admin entra a todos los niveles
  const mapaUrl = (mundo && mundo.imagen_url) || '/mundo1.webp';

  const stageRef = useRef(null);
  const [stage, setStage] = useState({ w: 1200, h: 700 });
  const [vista, setVista] = useState({ modo: 'mapa', idx: null });
  const [cargando, setCargando] = useState(false);
  const [cocheIdx, setCocheIdx] = useState(() => {
    const i = NIV.findIndex(n => n.estado === 'en_curso');
    return i >= 0 ? i : 0;
  });
  const [estados, setEstados] = useState(() => NIV.map(n => n.estado || 'bloqueado'));

  // medir el escenario
  useLayoutEffect(() => {
    const el = stageRef.current; if (!el) return;
    const medir = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const esMovil = stage.w < 820;

  // dimensiones de la "cámara" (el mapa a ancho completo del escenario)
  const CW = stage.w;
  const CH = CW / MAPA_ASPECT;

  // transform de la cámara según la vista
  const cam = (() => {
    if (vista.modo === 'mapa') {
      const foco = NIV[cocheIdx] || NIV[0];
      // en móvil, en vista mapa centramos en el coche con algo de zoom para que se vea
      if (esMovil) {
        const s = 1.9;
        const tx = stage.w * 0.5 - s * (foco.pos_x/100 * CW);
        const ty = stage.h * 0.5 - s * (foco.pos_y/100 * CH);
        return { tx, ty, s };
      }
      const s = 1;
      return { tx: 0, ty: (stage.h - CH) / 2, s };
    }
    const n = NIV[vista.idx];
    const s = (esMovil ? (n.cam_zoom * 0.78) : n.cam_zoom);
    const ax = esMovil ? 0.5 : 0.33;
    const ay = esMovil ? 0.36 : 0.5;
    const tx = stage.w * ax - s * (n.pos_x/100 * CW);
    const ty = stage.h * ay - s * (n.pos_y/100 * CH);
    return { tx, ty, s };
  })();

  const accesible = (i) => admin || estados[i] === 'en_curso' || estados[i] === 'disponible' || estados[i] === 'completado';

  const entrar = useCallback((i) => {
    if (!accesible(i)) return;
    setCargando(true);
    setVista({ modo: 'nivel', idx: i });
    setTimeout(() => setCargando(false), 680);
  }, [estados]);

  const volver = () => setVista({ modo: 'mapa', idx: null });

  // completar nivel (demo): desbloquea el siguiente y el coche conduce hasta él
  const completar = (i) => {
    setEstados(prev => {
      const n = [...prev]; n[i] = 'completado';
      if (i + 1 < n.length) n[i + 1] = 'en_curso';
      return n;
    });
    volver();
    if (i + 1 < NIV.length) setTimeout(() => setCocheIdx(i + 1), 120); // transición del coche
  };

  // cerrar con ESC
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && vista.modo === 'nivel') volver(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [vista.modo]);

  const nivelAbierto = vista.modo === 'nivel' ? NIV[vista.idx] : null;
  const progresoXp = Math.min(100, Math.round((PER.xp_total / (PER.xp_sig || 2000)) * 100));

  // línea-guía de la ruta (une las paradas en orden 1→N)
  const ptsO = NIV.map(n => [n.pos_x/100*CW, n.pos_y/100*CH]);
  const rutaD = ptsO.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const rutaDone = ptsO.slice(0, Math.max(1, cocheIdx+1)).map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');

  return (
    <div className="ruta-root">
      <div className="stage" ref={stageRef}>
        {/* CÁMARA */}
        <div className="cam" style={{ width: CW, height: CH, transform: `translate(${cam.tx}px,${cam.ty}px) scale(${cam.s})` }}>
          <img className="mapa" src={mapaUrl} alt={(mundo&&mundo.nombre)||'La Ruta del Importador'} draggable="false" />

          {/* línea-guía de la ruta */}
          {vista.modo === 'mapa' && (
            <svg className="ruta-linea" viewBox={`0 0 ${CW} ${CH}`} width={CW} height={CH} preserveAspectRatio="none" aria-hidden="true">
              <path className="rl-base" d={rutaD} />
              <path className="rl-done" d={rutaDone} />
            </svg>
          )}

          {/* checkpoints */}
          {NIV.map((n, i) => {
            const st = estados[i];
            const Ic = ICONOS[n.icono] || Search;
            const cls = st === 'completado' ? 'done' : st === 'en_curso' ? 'now' : st === 'disponible' ? 'open' : 'lock';
            const ocultar = vista.modo === 'nivel';
            return (
              <button key={n.slug} className={`cp ${cls} ${ocultar ? 'hide' : ''}`}
                style={{ left: `${n.pos_x}%`, top: `${n.pos_y}%`, transform: `translate(-50%,-50%) scale(${1/cam.s})` }}
                onClick={() => entrar(i)} disabled={!accesible(i)} title={n.titulo}>
                <span className="cp-dot">
                  {st === 'completado' ? <Check size={16}/> : st === 'bloqueado' ? <Lock size={14}/> : <Ic size={16}/>}
                </span>
                <span className="cp-chip">
                  <b>{i + 1}. {n.titulo}</b>
                  <i>{st === 'en_curso' ? '▶ Empieza aquí' : st === 'completado' ? 'Completado' : n.subtitulo}</i>
                </span>
              </button>
            );
          })}

          {/* coche-avatar aparcado en el nivel actual */}
          <div className="coche" style={{ left: `${NIV[cocheIdx].pos_x}%`, top: `${NIV[cocheIdx].pos_y}%`, transform: `translate(-50%,-50%) scale(${1/cam.s})` }}>
            <span className="coche-ring" />
            <Coche size={42} />
          </div>
        </div>

        {/* HUD */}
        <div className={`hud ${vista.modo==='nivel'?'dim':''}`}>
          <div className="hud-l">
            <div className="ring">
              <svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="6"/>
                <circle cx="30" cy="30" r="25" fill="none" stroke="#c9a14d" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="157" strokeDashoffset={157 - 157*progresoXp/100} transform="rotate(-90 30 30)"/></svg>
              <b>{PER.nivel}</b>
            </div>
            <div className="hud-tx">
              <span className="k">Rango</span>
              <span className="rango">{PER.rango}</span>
              <div className="xp"><span style={{ width: `${progresoXp}%` }} /></div>
              <span className="xptx">{PER.xp_total} / {PER.xp_sig} XP · siguiente: <b>{PER.rango_sig}</b></span>
            </div>
          </div>
          <div className="hud-r">
            <span className="pill fire"><Flame size={16}/> {PER.racha}</span>
            <span className="pill"><Zap size={16}/> {PER.xp_total} XP</span>
          </div>
        </div>

        {/* ayuda de navegación (solo en mapa) */}
        {vista.modo === 'mapa' && (
          <div className="hint">Sigue el camino — toca cada parada en orden <b>1 → {NIV.length}</b>{admin ? ' · modo admin: entras a todas' : ''}</div>
        )}

        {/* título mundo (solo en mapa) */}
        {vista.modo === 'mapa' && (
          <div className="wtitle"><span>Recursos · Mundo interactivo</span><b>La Ruta del Importador</b></div>
        )}

        {/* cargando */}
        {cargando && (
          <div className="loader">
            <svg className="spin" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5"/>
              <circle cx="25" cy="25" r="20" fill="none" stroke="#e7cf92" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 160"/></svg>
            <div className="ld-tx"><i>Entrando al escenario</i><b>{nivelAbierto?.titulo}</b></div>
          </div>
        )}

        {/* escenario propio del nivel (crossfade sobre el mapa) */}
        {nivelAbierto?.escenario_url && !cargando && (
          <div className="escena" style={{ backgroundImage: `url(${nivelAbierto.escenario_url})` }}>
            <span className="escena-ring" />
            <div className="escena-car"><Coche size={58} /></div>
            <span className="escena-lbl">🚗 Tu coche está aparcado aquí</span>
          </div>
        )}

        {/* panel de nivel */}
        {nivelAbierto && !cargando && (
          <>
            <button className="volver" onClick={volver}><ArrowLeft size={16}/> Volver al mapa</button>
            <div className="panel">
              <button className="panel-x" onClick={volver}><X size={18}/></button>
              <span className="p-k">Estás en el escenario</span>
              <span className="p-ph">{nivelAbierto.subtitulo} · {estados[vista.idx]==='completado'?'Completado':'En curso'}</span>
              <h2 className="p-h">{nivelAbierto.titulo}</h2>
              <p className="p-d">{nivelAbierto.descripcion}</p>

              <span className="p-sec">Misiones</span>
              {(nivelAbierto.misiones||[]).map((m, k) => {
                const ok = m.estado === 'ok'; const now = m.estado === 'en_curso';
                return (
                  <div key={k} className={`mis ${ok?'d':now?'n':'l'}`}>
                    <span className="mb">{ok ? <Check size={15}/> : now ? <Play size={14}/> : <Lock size={13}/>}</span>
                    <span className="mt"><b>{m.titulo}</b></span>
                    <span className="xpt">+{m.xp} XP</span>
                  </div>
                );
              })}

              {(nivelAbierto.recursos||[]).length > 0 && <>
                <span className="p-sec">Recursos de este nivel</span>
                <div className="rchips">
                  {nivelAbierto.recursos.map((r, k) => { const RI = RICON[r.icono] || FileText;
                    return <span key={k} className="rchip"><RI size={14}/> {r.titulo}</span>; })}
                </div>
              </>}

              <div className="p-cta">
                <button className="btn" onClick={() => completar(vista.idx)}>Continuar misión <ChevronRight size={18}/></button>
                {!nivelAbierto.escenario_url && <span className="park">🚗 Tu coche está aparcado aquí</span>}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .ruta-root{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
        .ruta-root,.ruta-root *{box-sizing:border-box}
        .stage{position:relative;width:100%;height:calc(100vh - 0px);min-height:560px;overflow:hidden;background:#05060b;border-radius:0}
        .cam{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;transition:transform .72s cubic-bezier(.4,.0,.15,1)}
        .mapa{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none}

        /* línea-guía de la ruta */
        .ruta-linea{position:absolute;left:0;top:0;z-index:1;overflow:visible;pointer-events:none}
        .rl-base{fill:none;stroke:rgba(240,207,127,.4);stroke-width:3;stroke-dasharray:2 15;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px rgba(240,200,110,.5))}
        .rl-done{fill:none;stroke:#ffd27a;stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px rgba(255,200,100,.85))}

        /* ayuda de navegación */
        .hint{position:absolute;top:92px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(9,11,18,.72);backdrop-filter:blur(8px);
          border:1px solid rgba(201,161,77,.32);border-radius:40px;padding:9px 18px;font-size:13px;color:#dfe4ee;font-weight:600;white-space:nowrap;box-shadow:0 10px 26px rgba(0,0,0,.4)}
        .hint b{color:#f0d79a}

        /* checkpoints */
        .cp{position:absolute;transform-origin:center;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;padding:0;
          transition:opacity .4s}
        .cp.hide{opacity:0;pointer-events:none}
        .cp:disabled{cursor:not-allowed}
        .cp-dot{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#06120a;border:2px solid rgba(0,0,0,.45);box-shadow:0 6px 18px rgba(0,0,0,.5)}
        .cp.done .cp-dot{background:linear-gradient(135deg,#63d79a,#2d9d63);color:#06240f}
        .cp.now  .cp-dot{background:linear-gradient(135deg,#f3dc9f,#c9a14d);color:#1c1406;animation:cpp 2s ease-in-out infinite}
        .cp.open .cp-dot{background:linear-gradient(135deg,#eef1f6,#aeb6c4);color:#1c1406}
        .cp.lock .cp-dot{background:#1b2230;color:#79859b;border-color:#2a3344}
        @keyframes cpp{0%,100%{box-shadow:0 0 0 0 rgba(201,161,77,.5)}50%{box-shadow:0 0 0 14px rgba(201,161,77,0)}}
        .cp-chip{display:flex;flex-direction:column;align-items:center;line-height:1.1;background:rgba(9,11,18,.8);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.12);border-radius:30px;padding:6px 14px;white-space:nowrap;box-shadow:0 10px 26px rgba(0,0,0,.5)}
        .cp-chip b{font-size:13px;font-weight:800;color:#fff}
        .cp-chip i{font-size:10px;font-style:normal;font-weight:700;letter-spacing:.4px;color:#9aa3b2}
        .cp.now .cp-chip{border-color:rgba(201,161,77,.55)} .cp.now .cp-chip i{color:#eccf8f}
        .cp.done .cp-chip i{color:#8be0b2}

        /* coche */
        .coche{position:absolute;transform-origin:center;z-index:5;pointer-events:none;transition:left 1.8s cubic-bezier(.45,.05,.2,1),top 1.8s cubic-bezier(.45,.05,.2,1)}
        .coche-ring{position:absolute;left:50%;top:50%;width:62px;height:62px;transform:translate(-50%,-50%);border-radius:50%;
          border:2px solid rgba(240,207,127,.85);box-shadow:0 0 0 6px rgba(240,207,127,.12),0 0 22px 5px rgba(240,207,127,.38)}

        /* HUD */
        .hud{position:absolute;top:20px;left:22px;right:22px;z-index:20;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;transition:opacity .4s}
        .hud.dim{opacity:.35}
        .hud-l{display:flex;align-items:center;gap:14px;background:rgba(9,11,18,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:12px 18px}
        .ring{position:relative;width:52px;height:52px;flex:none}.ring svg{width:52px;height:52px}
        .ring b{position:absolute;inset:0;display:grid;place-items:center;font-weight:900;color:#fff;font-size:18px}
        .hud-tx{display:flex;flex-direction:column;gap:2px}
        .hud-tx .k{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#e0bd72;font-weight:800}
        .hud-tx .rango{font-size:17px;font-weight:900;color:#fff;letter-spacing:-.3px}
        .hud-tx .xp{width:210px;height:7px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:4px}
        .hud-tx .xp span{display:block;height:100%;background:linear-gradient(90deg,#f3dc9f,#c9a14d)}
        .hud-tx .xptx{font-size:11px;color:#c3cad8;margin-top:4px;font-weight:600}.hud-tx .xptx b{color:#eccf8f}
        .hud-r{display:flex;gap:10px}
        .pill{display:flex;align-items:center;gap:7px;background:rgba(9,11,18,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);border-radius:40px;padding:11px 17px;color:#fff;font-weight:900;font-size:15px}
        .pill.fire{color:#ff8a4c}

        .wtitle{position:absolute;right:26px;bottom:22px;z-index:12;text-align:right;pointer-events:none}
        .wtitle span{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:19px;color:#f0d79a}
        .wtitle b{display:block;font-size:34px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;margin-top:2px;text-shadow:0 4px 24px rgba(0,0,0,.6)}

        /* loader */
        .loader{position:absolute;inset:0;z-index:30;background:radial-gradient(circle at 50% 46%,rgba(10,12,20,.82),rgba(4,5,10,.96));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;animation:fin .25s}
        @keyframes fin{from{opacity:0}to{opacity:1}}
        .spin{width:66px;height:66px;animation:spin 0.9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .ld-tx{text-align:center}.ld-tx i{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;color:#f0d79a;display:block}
        .ld-tx b{font-size:26px;font-weight:900;color:#fff}

        /* escenario propio del nivel */
        .escena{position:absolute;inset:0;z-index:15;background-size:cover;background-position:center;animation:escin .55s ease}
        @keyframes escin{from{opacity:0}to{opacity:1}}
        .escena-car{position:absolute;left:36%;top:72%;transform:translate(-50%,-50%);z-index:2;filter:drop-shadow(0 8px 14px rgba(0,0,0,.7))}
        .escena-ring{position:absolute;left:36%;top:72%;width:84px;height:84px;transform:translate(-50%,-50%);border-radius:50%;
          border:2px solid rgba(240,207,127,.85);box-shadow:0 0 0 7px rgba(240,207,127,.12),0 0 30px 7px rgba(240,207,127,.4)}
        .escena-lbl{position:absolute;left:36%;top:72%;transform:translate(-50%,52px);white-space:nowrap;font-size:13px;font-weight:800;color:#f0d79a;
          background:rgba(9,11,18,.8);padding:7px 14px;border-radius:30px;border:1px solid rgba(201,161,77,.5);z-index:2}

        /* panel */
        .volver{position:absolute;top:22px;right:24px;z-index:26;display:flex;align-items:center;gap:7px;background:rgba(9,11,18,.72);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.14);border-radius:40px;padding:10px 17px;color:#dfe4ee;font-weight:800;font-size:13.5px;cursor:pointer}
        .panel{position:absolute;top:0;right:0;width:min(560px,46vw);height:100%;z-index:24;padding:0 clamp(24px,3vw,52px);display:flex;flex-direction:column;justify-content:center;gap:3px;
          background:linear-gradient(90deg,rgba(7,9,15,0),rgba(7,9,15,.74) 18%,rgba(7,9,15,.95) 46%);animation:pin .5s cubic-bezier(.2,.7,.3,1)}
        @keyframes pin{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
        .panel-x{display:none}
        .p-k{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;color:#f0d79a}
        .p-ph{font-size:12px;letter-spacing:2.2px;text-transform:uppercase;color:#e0bd72;font-weight:800;margin-top:5px}
        .p-h{font-size:clamp(28px,3.4vw,42px);font-weight:900;color:#fff;letter-spacing:-1px;margin:3px 0 8px}
        .p-d{font-size:15px;color:#c3cad8;line-height:1.5;max-width:460px;margin:0 0 4px}
        .p-sec{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8793a6;font-weight:800;margin:18px 0 9px;display:block}
        .mis{display:flex;align-items:center;gap:12px;padding:12px 15px;border-radius:13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);margin-bottom:8px}
        .mis .mb{width:31px;height:31px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:900}
        .mis.d .mb{background:linear-gradient(135deg,#63d79a,#2d9d63);color:#06240f}
        .mis.n .mb{background:linear-gradient(135deg,#f3dc9f,#c9a14d);color:#1c1406}
        .mis.l .mb{background:#222a3a;color:#7b8699}
        .mis .mt{flex:1}.mis .mt b{font-size:14.5px;font-weight:700;color:#eef2f8}.mis.l .mt b{color:#aab4c6}
        .mis .xpt{font-size:11.5px;font-weight:800;color:#f0d79a;background:rgba(201,161,77,.14);padding:4px 9px;border-radius:20px}
        .rchips{display:flex;gap:9px;flex-wrap:wrap}
        .rchip{display:flex;align-items:center;gap:7px;padding:9px 13px;border-radius:30px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#d6dbe6;font-size:13px;font-weight:600}
        .p-cta{display:flex;align-items:center;gap:14px;margin-top:22px;flex-wrap:wrap}
        .btn{display:flex;align-items:center;gap:7px;padding:15px 26px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,#f3dc9f,#c9a14d);color:#1c1406;font-weight:900;font-size:15px;box-shadow:0 14px 32px rgba(201,161,77,.4)}
        .park{font-size:13px;font-weight:700;color:#f0d79a}

        @media (max-width:820px){
          .stage{height:calc(100vh - 0px);min-height:520px}
          .hud{top:12px;left:12px;right:12px}
          .hud-l{padding:9px 13px;gap:10px}.ring,.ring svg{width:44px;height:44px}.hud-tx .xp{width:150px}
          .hud-tx .rango{font-size:15px}.pill{padding:9px 13px;font-size:14px}
          .wtitle{right:16px;bottom:14px}.wtitle b{font-size:24px}
          .hint{top:auto;bottom:80px;left:12px;right:12px;transform:none;white-space:normal;text-align:center;font-size:12px}
          /* panel como hoja inferior */
          .panel{top:auto;bottom:0;left:0;right:0;width:auto;height:auto;max-height:72%;overflow-y:auto;overflow-x:hidden;padding:22px 20px 26px;justify-content:flex-start;
            background:linear-gradient(180deg,rgba(7,9,15,0),rgba(7,9,15,.9) 14%,rgba(7,9,15,.98));border-top-left-radius:22px;border-top-right-radius:22px;
            animation:pinm .4s ease}
          @keyframes pinm{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
          .panel-x{display:grid;place-items:center;position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#dfe4ee;cursor:pointer}
          .volver{top:auto;bottom:calc(72% + 10px);right:14px}
          .escena-car,.escena-ring,.escena-lbl{left:50%;top:16%}
          .p-cta .btn{width:100%;justify-content:center}
        }
      `}</style>
    </div>
  );
}
