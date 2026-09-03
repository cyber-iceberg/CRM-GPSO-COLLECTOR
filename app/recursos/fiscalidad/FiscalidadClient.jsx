'use client';

// =====================================================================
//  GPSO COLLECTOR · Fiscalidad del Importador (cliente) · v4
//  app/recursos/fiscalidad/FiscalidadClient.jsx
//  Cambios v4:
//  · El panel de nota ya no tapa el grafo: el lienzo se comprime y
//    hace scroll automático para mantener el nodo elegido a la vista.
//  · Click en un nodo ya abierto = COLAPSA sus destinos con la misma
//    animación con la que brotaron (retirada hacia atrás).
//  · Fondo con más vida: más estrellas, parpadeo, parallax con el ratón.
//  · Halo de luz que sigue al cursor y hace brillar lo que toca.
// =====================================================================

import { useState, useEffect, useRef } from 'react';
import MenuDrawer from '../../components/MenuDrawer';

// ---------------------------------------------------------------------
//  DATOS · revealBy = qué nodos, al expandirse, hacen brotar este nodo
// ---------------------------------------------------------------------
const NODES = {
  origen: { x: 170, y: 480, t: 'La operación', s: 'toca para abrir el mapa', origen: true,
    body: `<p>Toda operación de importación se describe respondiendo <strong>tres preguntas en orden</strong>: quién la hace, qué tipo de operación es, y cómo se factura.</p><p>No existe "la forma correcta" — existen tres formas de facturar, cada una con su lógica, su gasto y su tributación. Elegir la que toca es lo que separa a un importador que gana dinero de uno que se lo regala a Hacienda.</p>` },

  particular: { x: 520, y: 235, t: 'Particular', s: 'sin alta de actividad', revealBy: ['origen'],
    block: ['stock', 'rebu', 'rg', 'a45s', 'q3', 'b218', 'c300'],
    body: `<p>Por defecto <strong>no puede repercutir IVA ni aplicar REBU</strong>. Solo tiene dos puertas: cobrar una comisión de servicios de forma puntual, o la figura de la <strong>entrega ocasional de medios de transporte</strong> — válida para una operación concreta, sin convertirse en empresario.</p><p>La palabra clave es <strong>ocasional</strong>. Si se repite de forma organizada, Hacienda lo reclasifica como actividad económica no declarada.</p><div class="hookline">La ley no pone un número exacto — habla de "habitualidad". Nuestro criterio de seguridad en la academia: máximo 2 al año.</div>` },
  profesional: { x: 520, y: 480, t: 'Profesional', s: 'autónomo o empresa', revealBy: ['origen'],
    body: `<p>Dado de alta en la actividad de compraventa. Tiene <strong>las tres vías abiertas</strong>: REBU, Régimen General y servicios + suplido — y elegir la que toca en cada operación es lo que separa a un importador que gana dinero de uno que se lo regala a Hacienda.</p><p>Con el <strong>NIF-IVA (alta en el ROI)</strong> puede además comprar en la UE con exención.</p>` },
  intermediario: { x: 520, y: 725, t: 'Intermediario', s: 'nunca toca la propiedad', revealBy: ['origen'],
    block: ['stock', 'rebu', 'rg', 'a45s', 'q3', 'b218', 'c300'],
    body: `<p>El coche va <strong>directo del vendedor al comprador final</strong> — nunca pasa por su titularidad ni su tesorería. Solo factura honorarios de gestión (con IVA 21%) y suplidos si adelantó importes de terceros.</p><p>Es un <strong>rol</strong>, no una forma jurídica: cualquiera de los tres operadores puede actuar así en una operación concreta.</p>` },

  limite: { x: 850, y: 115, t: 'Límite del particular', s: 'la ocasionalidad', sat: true, revealBy: ['particular'],
    chips: ['Concepto'],
    body: `<p>La figura de la entrega ocasional permite a un particular actuar como sujeto pasivo <strong>para una operación concreta</strong>. Si se repite de forma organizada, deja de ser ocasional.</p><div class="hookline">Criterio de seguridad de la academia: máximo 2 al año — no porque la ley diga "2", sino para no acercarse nunca a la frontera de la habitualidad.</div>` },

  stock: { x: 860, y: 360, t: 'Compra de stock', s: 'compras sin cliente esperando', revealBy: ['profesional'],
    body: `<p>El coche se compra <strong>para el escaparate</strong>: capital propio inmovilizado y riesgo de rotación. La forma de facturar la venta futura queda determinada por <strong>cómo entró el coche</strong> — no por lo que te convenga después.</p>` },
  carta: { x: 860, y: 610, t: 'Importación a la carta', s: 'el cliente ya existe', revealBy: ['particular', 'profesional', 'intermediario'],
    body: `<p>Se busca, negocia e importa <strong>un coche concreto para un cliente concreto</strong>. Menos riesgo de stock muerto, margen más ajustado — y por eso aquí la elección entre REBU, Régimen General o servicios <strong>importa mucho más</strong>.</p>` },

  rebu: { x: 1210, y: 295, t: 'REBU', s: 'IVA solo sobre el margen', revealBy: ['stock', 'carta'],
    body: `<p>Solo si el coche se adquirió <strong>sin IVA deducible</strong> (particular, otro REBU, operación exenta). En la factura al cliente el IVA no se desglosa — va dentro del precio — y por eso <strong>el cliente nunca puede deducírselo</strong>.</p><div class="formula">Margen = venta (IVA incl.) − compra (IVA incl.)
Base imponible = margen × 100 / 121
<b>IVA a ingresar = margen − base</b></div><div class="hookline">El IVA del REBU sale de TU margen. Es la partida que casi nadie resta cuando calcula su ROI.</div>` },
  rg: { x: 1210, y: 530, t: 'Régimen General', s: 'IVA deducible · sobre el total', revealBy: ['stock', 'carta'],
    body: `<p>El coche entró <strong>con IVA deducible</strong> (concesionario, o intracomunitaria exenta con tu NIF-IVA). Repercutes el 21% sobre el precio total de venta, desglosado en factura — <strong>si el cliente es empresa, se lo deduce</strong>.</p><p>Matiz que casi todo el mundo confunde: cuando el coche es <strong>mercancía para revender</strong>, su IVA se deduce al 100% — la presunción del 50% es solo para coches de uso propio de la empresa.</p><div class="formula">Base = precio de venta pactado
IVA repercutido = base × 21% <b>(lo paga el cliente aparte)</b>
Tu margen = base − coste total</div>` },
  serv: { x: 1210, y: 765, t: 'Servicios + suplido', s: 'el coche no es tuyo fiscalmente', revealBy: ['carta'],
    body: `<p>No compras ni vendes el coche: cobras <strong>honorarios de gestión</strong> (con IVA 21%) y repercutes como <strong>suplido</strong> los importes exactos de terceros pagados en nombre del cliente.</p><p><strong>Suplido real = importe fijado por un tercero que no puedes negociar</strong> (impuestos, tasas). Lo que sí negocias y ejecutas más barato (transporte, gestoría) es parte de tu precio de servicio cerrado — y lo que ahorras ejecutándolo, es tuyo.</p><div class="hookline">Tu base imponible es solo tus honorarios — no el valor del coche. Por eso con un coche de 40.000 € puedes estar ingresando 383 € de IVA, no 6.000.</div>` },

  nifiva: { x: 1230, y: 105, t: 'NIF-IVA / ROI', s: 'capa · quién compra en la UE', sat: true, clip: true, revealBy: ['rg'],
    chips: ['Concepto', '🎬 clip'],
    body: `<p>Para comprar en la UE <strong>con exención</strong>, el comprador necesita un NIF-IVA válido en el VIES. Si tu cliente empresa no lo tiene, el proveedor alemán le cobraría su 19% — y recuperarlo desde España es lento y farragoso.</p><p>La solución: <strong>compras tú con tu NIF-IVA y revendes en España con factura normal</strong> — ese IVA español sí se lo deduce sin problema.</p><div class="hookline">Si tu cliente no tiene NIF-IVA: o lo tienes tú y compras por él, o va a pagar un IVA extranjero que casi nunca recupera.</div>` },
  ded: { x: 1230, y: 950, t: 'Deducción 50/100', s: 'capa · cuánto deduce el comprador', sat: true, revealBy: ['rg'],
    chips: ['Concepto'],
    body: `<p>Un turismo de uso mixto afecto a la empresa se presume deducible al <strong>50%</strong> (art. 95.Tres LIVA). Deducir más exige probarlo — y la jurisprudencia suele respaldar a Hacienda salvo prueba sólida.</p><p>El <strong>100% automático</strong> es solo para una lista cerrada: agentes comerciales, autoescuelas, transporte de mercancías o viajeros, vigilancia.</p><p>Y el matiz clave para vosotros: el coche que es <strong>stock para revender se deduce al 100% siempre</strong> — esta presunción no le aplica.</p>` },

  a45s: { x: 1600, y: 180, t: 'Mercedes A45 S', s: 'stock · REBU', esCaso: true, clip: true, revealBy: ['rebu'],
    chips: ['Stock', 'REBU', '🎬 clip'],
    body: `<p>Comprado en Alemania y vendido en España como stock puro, facturado por REBU.</p><div class="formula">Compra: <b>43.000 €</b> · Gastos reales: <b>6.016,55 €</b>
Venta: <b>53.990 €</b> (IVA no desglosado)
Margen REBU = 10.990 € → base 9.082,64 €
<b>IVA a ingresar: 1.907,36 €</b></div><div class="kpi"><span class="k">Margen real neto</span><span class="v">3.066 €</span></div><div class="hookline">La hoja de cálculo marcaba un ROI del 10,15%. El real, tras restar el IVA REBU, es del 6,26%. Casi 4 puntos que se esfuman cuando llega el modelo 303.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  q3: { x: 1600, y: 365, t: 'Audi Q3', s: 'a la carta · REBU', esCaso: true, clip: true, revealBy: ['rebu'],
    chips: ['A la carta', 'REBU', '🎬 clip'],
    body: `<p>Operación calculada <strong>antes de comprar</strong> — así se decide una importación a la carta.</p><div class="formula">Compra negociada: <b>15.249 €</b> (rebaja −750 €)
Importación: <b>2.420 €</b> → invertido 17.669 €
Venta pactada: <b>20.900 €</b>
Margen REBU 5.651 € → <b>IVA: 981 €</b></div><div class="kpi"><span class="k">Beneficio neto previsto</span><span class="v">2.250 €</span></div><div class="hookline">20.900 € está POR DEBAJO del mínimo de mercado (21.500 €). Nadie pone ese precio a un stock — solo tiene sentido si ya sabes a quién se lo vendes.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  b218: { x: 1600, y: 550, t: 'BMW 218 GC', s: 'stock · Régimen General', esCaso: true, revealBy: ['rg'],
    chips: ['Stock', 'Régimen General', 'Financiación'],
    body: `<p>Comprado con IVA deducible y vendido con el 21% desglosado en factura.</p><div class="formula">Compra: <b>16.798 €</b> · Gastos: <b>3.088,19 €</b>
Base venta: <b>20.652 €</b> + IVA 4.338 €
Total factura cliente: <b>24.990 €</b></div><div class="kpi"><span class="k">Margen (1.515,81 + 750 financiación)</span><span class="v">2.265 €</span></div><div class="hookline">Aquí el IVA no toca tu margen — lo paga el cliente aparte y tú solo lo pasas a Hacienda. Compara con el A45S: mismo negocio, dos matemáticas distintas.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  c300: { x: 1600, y: 735, t: 'Mercedes C300', s: 'a la carta · Régimen General', esCaso: true, clip: true, revealBy: ['rg'],
    chips: ['A la carta', 'Régimen General', '🎬 clip'],
    body: `<p>Compra con el <strong>19% alemán por delante</strong> — pagado, reclamado y devuelto.</p><div class="formula">Pagado en Alemania: 31.880 € → neto <b>26.789,92 €</b>
(19% alemán devuelto: <b>5.090,08 €</b>)
Gastos: 582,50 € → coste total 27.372,42 €
Factura: <b>36.500 €</b> = base 30.165,29 + IVA 6.334,71</div><div class="kpi"><span class="k">Margen real · ROI 10,2%</span><span class="v">2.793 €</span></div><div class="hookline">5.090 € de IVA extranjero parados en tesorería hasta que llega el reembolso. El coste oculto del que nadie habla al comprar en concesionario alemán.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  z4: { x: 1600, y: 920, t: 'BMW Z4', s: 'a la carta · servicios + suplido', esCaso: true, clip: true, revealBy: ['serv'],
    chips: ['A la carta', 'Servicios + suplido', '🎬 clip'],
    body: `<p>El coche nunca fue de GPSO fiscalmente: coche y trámites a precio cerrado, honorarios aparte con su IVA.</p><div class="formula">Coche y trámites: <b>41.342 €</b>
Honorarios: <b>1.823 €</b> + IVA <b>383 €</b>
Total cliente: <b>43.548 €</b></div><div class="kpi"><span class="k">Margen real de la operación</span><span class="v">~2.700 €</span></div><div class="hookline">Con un coche de más de 40.000 €, el IVA ingresado a Hacienda fue de 383 €. No es un truco: la base imponible son tus honorarios, porque el coche jamás fue tuyo.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
};

const EDGES = [
  ['origen', 'particular'], ['origen', 'profesional'], ['origen', 'intermediario'],
  ['particular', 'carta'], ['profesional', 'stock'], ['profesional', 'carta'], ['intermediario', 'carta'],
  ['stock', 'rebu'], ['stock', 'rg'],
  ['carta', 'rebu'], ['carta', 'rg'], ['carta', 'serv'],
  ['rebu', 'a45s'], ['rebu', 'q3'], ['rg', 'b218'], ['rg', 'c300'], ['serv', 'z4'],
  ['particular', 'limite', 1],
  ['nifiva', 'rg', 1], ['nifiva', 'c300', 1],
  ['ded', 'rg', 1], ['ded', 'b218', 1],
];

function radio(n) {
  if (n.origen) return 24;
  if (n.esCaso) return 20;
  if (n.sat) return 11;
  return 16;
}

function edgePath([a, b]) {
  const na = NODES[a], nb = NODES[b];
  const left = na.x <= nb.x;
  const ra = radio(na) + 2, rb = radio(nb) + 2;
  const p1 = [na.x + (left ? ra : -ra), na.y];
  const p2 = [nb.x + (left ? -rb : rb), nb.y];
  const mx = (p1[0] + p2[0]) / 2;
  return `M ${p1[0]} ${p1[1]} C ${mx} ${p1[1]}, ${mx} ${p2[1]}, ${p2[0]} ${p2[1]}`;
}

const esVisible = (id, exp) => {
  const n = NODES[id];
  if (n.origen) return true;
  return (n.revealBy || []).some(p => exp.has(p));
};

export default function FiscalidadClient({ email, perfil }) {
  const [expandidos, setExpandidos] = useState(() => new Set());
  const [cerrando, setCerrando] = useState(() => new Set());
  const [sel, setSel] = useState(null);
  const [lit, setLit] = useState(null);
  const [cosmos, setCosmos] = useState(null);
  const viewRef = useRef(null);
  const cosmosRef = useRef(null);
  const haloRef = useRef(null);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = [];
    for (let i = 0; i < 160; i++) {
      dots.push({
        x: Math.random() * 1860, y: Math.random() * 1060,
        r: Math.random() * 1.6 + 0.5,
        d: (Math.random() * 28 + 14).toFixed(0),
        tw: (Math.random() * 5 + 2.5).toFixed(1),
        o: (Math.random() * 0.3 + 0.08).toFixed(2),
      });
    }
    const links = [];
    for (let i = 0; i < 85; i++) {
      const a = dots[Math.floor(Math.random() * dots.length)];
      const b = dots[Math.floor(Math.random() * dots.length)];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 40 && dist < 240) links.push({ a, b });
    }
    setCosmos({ dots, links });
    if (viewRef.current) viewRef.current.scrollTo({ left: 0, top: 200 });

    // halo que sigue al ratón + parallax del cosmos
    if (reduceRef.current) return;
    let mx = -600, my = -600, hx = -600, hy = -600, raf;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      hx += (mx - hx) * 0.09;
      hy += (my - hy) * 0.09;
      if (haloRef.current) haloRef.current.style.transform = `translate(${hx - 260}px, ${hy - 260}px)`;
      if (cosmosRef.current) {
        const dx = (mx / window.innerWidth - 0.5) * -26;
        const dy = (my / window.innerHeight - 0.5) * -18;
        cosmosRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  const visible = (id) => esVisible(id, expandidos);
  const tieneOcultos = (id) =>
    Object.entries(NODES).some(([k, n]) => (n.revealBy || []).includes(id) && !visible(k));

  const vecinos = (id, dir) =>
    EDGES.filter(e => !e[2] && e[dir === 'down' ? 0 : 1] === id).map(e => e[dir === 'down' ? 1 : 0]);

  const iluminar = (id, exp) => {
    const s = new Set([id]);
    const block = new Set(NODES[id].block || []);
    const walk = (cur, dir) => {
      for (const nx of vecinos(cur, dir)) {
        if (block.has(nx) || s.has(nx) || !esVisible(nx, exp)) continue;
        s.add(nx); walk(nx, dir);
      }
    };
    walk(id, 'down'); walk(id, 'up');
    return s;
  };

  const clickNodo = (id) => {
    if (cerrando.size) return; // esperar a que termine una retirada en curso

    if (expandidos.has(id)) {
      // ------- COLAPSAR: retirar hacia atrás lo que brotó de aquí -------
      const nx = new Set(expandidos); nx.delete(id);
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (const e of [...nx]) {
          if (!esVisible(e, nx)) { nx.delete(e); cambio = true; }
        }
      }
      const fuera = Object.keys(NODES).filter(k => visible(k) && !esVisible(k, nx));
      if (fuera.length) {
        setCerrando(new Set(fuera));
        setTimeout(() => {
          setExpandidos(nx);
          setCerrando(new Set());
        }, 430);
      }
      setSel(id);
      setLit(iluminar(id, nx));
      return;
    }

    // ------- EXPANDIR: hacer brotar los destinos -------
    const nx = new Set(expandidos); nx.add(id);
    setExpandidos(nx);
    setSel(id);
    setLit(iluminar(id, nx));
    if (viewRef.current) {
      const anchoUtil = viewRef.current.clientWidth;
      const destino = Math.max(0, NODES[id].x + 380 - anchoUtil * 0.62);
      viewRef.current.scrollTo({ left: destino, behavior: 'smooth' });
    }
  };

  const cerrar = () => { setSel(null); setLit(null); };
  const n = sel ? NODES[sel] : null;

  const nodosVisibles = Object.entries(NODES).filter(([id]) => visible(id));
  const edgesVisibles = EDGES.map((e, i) => ({ e, i })).filter(({ e }) => visible(e[0]) && visible(e[1]));

  return (
    <div className="fisc-bg">
      <div className="halo" ref={haloRef} aria-hidden="true" />

      <header className="fisc-top">
        <div className="brand-wrap">
          <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
          <div>
            <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
            <div className="sublabel">Fiscalidad del Importador · Privado</div>
          </div>
        </div>
        <div className="top-right">
          <a href="/recursos" className="volver">← Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className={'viewport' + (n ? ' conPanel' : '')} ref={viewRef}>
        <div className={'canvas' + (lit ? ' dim' : '')}>

          <svg className="cosmos" ref={cosmosRef} viewBox="0 0 1860 1060" aria-hidden="true">
            {cosmos && cosmos.links.map((l, i) => (
              <line key={'l' + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
            ))}
            {cosmos && cosmos.dots.map((d, i) => (
              <circle key={'d' + i} cx={d.x} cy={d.y} r={d.r}
                style={{
                  opacity: d.o,
                  animationDuration: d.d + 's, ' + d.tw + 's',
                  animationDelay: (i % 9) + 's, ' + (i % 5) + 's',
                }} />
            ))}
          </svg>

          <svg className="wires" viewBox="0 0 1860 1060">
            {edgesVisibles.map(({ e, i }) => {
              const on = lit && lit.has(e[0]) && lit.has(e[1]);
              const seva = cerrando.has(e[0]) || cerrando.has(e[1]);
              return (
                <g key={i} className={seva ? 'seva' : ''}>
                  {on && !e[2] && (
                    <path d={edgePath(e)} className="glow" pathLength="1" />
                  )}
                  <path id={'w' + i} d={edgePath(e)} pathLength="1"
                    className={'wire' + (e[2] ? ' dashed' : '') + (on ? ' on' : '')} />
                  {!e[2] && !reduceRef.current && (
                    <circle r="2.6" className={'spark' + (on ? ' on' : '')}>
                      <animateMotion dur={(4 + (i % 4)) + 's'} repeatCount="indefinite">
                        <mpath href={'#w' + i} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {nodosVisibles.map(([id, nd]) => (
            <button key={id}
              className={
                'nodo' + (nd.esCaso ? ' caso' : '') + (nd.sat ? ' sat' : '') + (nd.origen ? ' raiz' : '') +
                (lit && lit.has(id) ? ' litnode' : '') + (sel === id ? ' activo' : '') +
                (cerrando.has(id) ? ' seva' : '')
              }
              style={{ left: nd.x, top: nd.y }}
              onClick={() => clickNodo(id)}>
              <span className={'orbe' + (tieneOcultos(id) && !expandidos.has(id) ? ' cerrado' : '')} />
              <span className="etq">
                <span className="t">{nd.t}{nd.clip && <span className="clipb">CLIP</span>}</span>
                <span className="s">{nd.s}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <aside className={'panel' + (n ? ' open' : '')} aria-live="polite">
        <button className="cerrar" onClick={cerrar} aria-label="Cerrar nota">✕</button>
        {n && (
          <>
            <div className="phead">
              <div className="chips">
                {(n.chips || []).map((c, i) => (
                  <span key={i} className={'chip' + (/REBU|General|suplido|clip/.test(c) ? ' gold' : '')}>{c}</span>
                ))}
              </div>
              <h2>{n.t}</h2>
            </div>
            <div className="pbody" dangerouslySetInnerHTML={{ __html: n.body }} />
          </>
        )}
      </aside>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Space+Grotesk:wght@300;400;500;600&display=swap');
        .pbody p{font-size:14px;line-height:1.65;color:#e9e6df;margin:0 0 14px}
        .pbody p strong{font-weight:500;color:#ecdcae}
        .pbody .formula{border:1px solid #232833;border-left:2px solid #c9a14d;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0;font-size:12.5px;line-height:1.8;color:#8b93a3;white-space:pre-line}
        .pbody .formula b{color:#e9e6df;font-weight:500}
        .pbody .kpi{display:flex;align-items:baseline;justify-content:space-between;border-top:1px solid #232833;padding:14px 2px 0;margin-top:18px}
        .pbody .kpi .k{font-size:12px;color:#8b93a3}
        .pbody .kpi .v{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:#3ddc97}
        .pbody .fotos{margin-top:20px;border:1px dashed #232833;border-radius:8px;padding:22px;text-align:center;font-size:12px;color:#8b93a3}
        .pbody .hookline{margin-top:18px;padding:14px 16px;border-radius:8px;background:rgba(201,161,77,.08);border:1px solid rgba(201,161,77,.35);font-size:13.5px;line-height:1.55;color:#ecdcae}
      `}</style>

      <style jsx>{`
        .fisc-bg{position:fixed;inset:0;background:radial-gradient(1300px 760px at 42% 45%, #0e1118 0%, #0a0c10 60%);color:#e9e6df;font-family:'Space Grotesk',sans-serif;font-weight:300;overflow:hidden}

        .halo{position:fixed;top:0;left:0;width:520px;height:520px;pointer-events:none;z-index:2;border-radius:50%;background:radial-gradient(circle, rgba(201,161,77,.14) 0%, rgba(201,161,77,.05) 38%, transparent 68%);mix-blend-mode:screen;will-change:transform}
        @media (prefers-reduced-motion: reduce){.halo{display:none}}

        .fisc-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:16px 28px 12px;background:linear-gradient(to bottom,rgba(10,12,16,.94) 55%,rgba(10,12,16,0))}
        .brand-wrap{display:flex;align-items:center;gap:12px}
        .sublabel{font-size:9.5px;letter-spacing:2.5px;color:#8b93a3;font-weight:700;text-transform:uppercase;margin-top:3px}
        .top-right{display:flex;align-items:center;gap:16px}
        .volver{font-size:13px;color:#8b93a3;text-decoration:none;text-transform:uppercase;letter-spacing:1px}
        .volver:hover{color:#c9a14d}

        .viewport{position:absolute;inset:0;overflow:auto;padding:90px 40px 40px;transition:right .38s cubic-bezier(.22,.9,.3,1)}
        .viewport.conPanel{right:420px}
        .canvas{position:relative;width:1860px;height:1060px}

        .cosmos{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);will-change:transform}
        .cosmos line{stroke:rgba(139,147,163,.09);stroke-width:.6}
        .cosmos circle{fill:#8b93a3;animation:deriva linear infinite alternate, brillo ease-in-out infinite alternate}
        @keyframes deriva{from{transform:translate(0,0)}to{transform:translate(18px,-14px)}}
        @keyframes brillo{from{fill-opacity:.35}to{fill-opacity:1}}
        @media (prefers-reduced-motion: reduce){.cosmos circle{animation:none}}

        .wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
        .wires :global(.glow){fill:none;stroke:rgba(227,201,135,.22);stroke-width:7;stroke-linecap:round}
        .wires :global(.wire){fill:none;stroke:rgba(201,161,77,.32);stroke-width:1.2;stroke-dasharray:1;stroke-dashoffset:0;animation:traza .9s ease both;transition:stroke .35s,opacity .35s}
        @keyframes traza{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
        .wires :global(.wire.dashed){stroke:rgba(139,147,163,.35);stroke-dasharray:.012 .014;animation:none}
        .wires :global(.wire.on){stroke:#e9d194;stroke-width:1.7}
        .canvas.dim .wires :global(.wire:not(.on)){opacity:.14}
        .wires :global(.spark){fill:#c9a14d;opacity:.5;transition:opacity .35s}
        .wires :global(.spark.on){opacity:1;fill:#f0e2b6}
        .canvas.dim .wires :global(.spark:not(.on)){opacity:.05}
        .wires :global(g.seva){opacity:0;transition:opacity .4s ease}
        @media (prefers-reduced-motion: reduce){.wires :global(.wire){animation:none}}

        /* ---------- nodos orbe ---------- */
        .nodo{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:11px;background:none;border:none;padding:8px;cursor:pointer;color:#e9e6df;font-family:'Space Grotesk',sans-serif;animation:brota .55s cubic-bezier(.2,.9,.3,1.4) both;transition:opacity .35s;z-index:3}
        @keyframes brota{from{opacity:0;transform:translate(-50%,-50%) scale(.25)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        .nodo.seva{animation:sevaAnim .43s cubic-bezier(.6,-.3,.8,.6) both;pointer-events:none}
        @keyframes sevaAnim{from{opacity:1;transform:translate(-50%,-50%) scale(1)}to{opacity:0;transform:translate(-50%,-50%) scale(.2)}}
        @media (prefers-reduced-motion: reduce){.nodo{animation:none}.nodo.seva{animation:none;opacity:0}}
        .nodo:focus-visible{outline:2px solid #ecdcae;outline-offset:4px;border-radius:10px}

        .orbe{width:32px;height:32px;border-radius:50%;position:relative;background:radial-gradient(circle at 35% 30%, #f0e2b6 0%, #c9a14d 45%, #6b5526 100%);box-shadow:0 0 16px rgba(201,161,77,.5), 0 0 44px rgba(201,161,77,.16);transition:box-shadow .3s, transform .3s;flex:none}
        .orbe.cerrado::after{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px dashed rgba(201,161,77,.55);animation:girar 14s linear infinite}
        @keyframes girar{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.orbe.cerrado::after{animation:none}}

        .nodo:hover .orbe{box-shadow:0 0 24px rgba(201,161,77,.85), 0 0 70px rgba(201,161,77,.32);transform:scale(1.1)}
        .nodo.activo .orbe{box-shadow:0 0 28px rgba(240,226,182,.95), 0 0 80px rgba(201,161,77,.45)}

        .nodo.raiz .orbe{width:48px;height:48px;animation:latido 3.2s ease-in-out infinite}
        @keyframes latido{0%,100%{box-shadow:0 0 18px rgba(201,161,77,.55),0 0 50px rgba(201,161,77,.2)}50%{box-shadow:0 0 34px rgba(201,161,77,.95),0 0 95px rgba(201,161,77,.38)}}
        @media (prefers-reduced-motion: reduce){.nodo.raiz .orbe{animation:none}}

        .nodo.caso .orbe{width:40px;height:40px;background:radial-gradient(circle at 35% 30%, #fdf6e0 0%, #e3c987 40%, #8a6d2f 100%)}
        .nodo.sat .orbe{width:22px;height:22px;background:transparent;border:1.5px dashed rgba(201,161,77,.7);box-shadow:none}
        .nodo.sat:hover .orbe{box-shadow:0 0 16px rgba(201,161,77,.4)}

        .etq{text-align:center;max-width:210px}
        .etq .t{display:block;font-weight:600;font-size:15px;letter-spacing:1.1px;text-transform:uppercase;text-shadow:0 2px 12px rgba(10,12,16,.95)}
        .nodo.caso .etq .t{color:#ecdcae;font-size:16px}
        .nodo.raiz .etq .t{font-size:17px;color:#ecdcae}
        .etq .s{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#8b93a3;margin-top:4px;text-shadow:0 2px 8px rgba(10,12,16,.95)}
        .clipb{display:inline-block;font-size:9px;letter-spacing:.5px;color:#0a0c10;background:#c9a14d;border-radius:4px;padding:1px 5px;margin-left:7px;font-weight:600;vertical-align:2px}
        .canvas.dim .nodo:not(.litnode){opacity:.18}

        /* ---------- panel ---------- */
        .panel{position:fixed;top:0;right:0;bottom:0;width:420px;z-index:50;background:#12151c;border-left:1px solid #232833;transform:translateX(102%);transition:transform .38s cubic-bezier(.22,.9,.3,1);display:flex;flex-direction:column}
        .panel.open{transform:translateX(0)}
        .phead{padding:26px 28px 18px;border-bottom:1px solid #232833}
        .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .chip{font-size:10.5px;letter-spacing:.6px;color:#8b93a3;border:1px solid #232833;border-radius:20px;padding:3px 10px;text-transform:uppercase}
        .chip.gold{color:#c9a14d;border-color:rgba(201,161,77,.5)}
        .panel h2{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:30px;color:#ecdcae;line-height:1.05;margin:0}
        .pbody{padding:22px 28px 40px;overflow-y:auto;flex:1}
        .cerrar{position:absolute;top:20px;right:20px;background:none;border:1px solid #232833;border-radius:50%;width:32px;height:32px;color:#8b93a3;cursor:pointer;font-size:15px;transition:border-color .2s,color .2s;z-index:2}
        .cerrar:hover{border-color:#c9a14d;color:#c9a14d}

        @media (max-width:900px){
          .panel{top:auto;left:0;right:0;width:auto;max-height:62vh;border-left:none;border-top:1px solid #232833;border-radius:16px 16px 0 0;transform:translateY(105%)}
          .panel.open{transform:translateY(0)}
          .viewport{padding:84px 16px 30px}
          .viewport.conPanel{right:0}
        }
      `}</style>
    </div>
  );
}
