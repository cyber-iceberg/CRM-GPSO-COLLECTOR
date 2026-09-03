'use client';

// =====================================================================
//  GPSO COLLECTOR · Fiscalidad del Importador (cliente)
//  app/recursos/fiscalidad/FiscalidadClient.jsx
//  Grafo de notas conectadas (estilo Obsidian) · v1 privada (solo admin)
//  El contenido vive en NODES y EDGES — añadir capas = añadir entradas.
// =====================================================================

import { useState, useEffect, useRef } from 'react';
import MenuDrawer from '../../components/MenuDrawer';

// ---------------------------------------------------------------------
//  DATOS DEL GRAFO · editar aquí para añadir nodos/conexiones
// ---------------------------------------------------------------------
const NODES = {
  particular: { x: 250, y: 90, t: 'Particular', s: 'sin alta de actividad', tier: 'Operador',
    block: ['stock', 'rebu', 'rg', 'a45s', 'q3', 'b218', 'c300'],
    body: `<p>Por defecto <strong>no puede repercutir IVA ni aplicar REBU</strong>. Solo tiene dos puertas: cobrar una comisión de servicios de forma puntual, o la figura de la <strong>entrega ocasional de medios de transporte</strong> — válida para una operación concreta, sin convertirse en empresario.</p><p>La palabra clave es <strong>ocasional</strong>. Si se repite de forma organizada, Hacienda lo reclasifica como actividad económica no declarada.</p><div class="hookline">La ley no pone un número exacto — habla de "habitualidad". Nuestro criterio de seguridad en la academia: máximo 2 al año.</div>` },
  profesional: { x: 620, y: 90, t: 'Profesional', s: 'autónomo o empresa', tier: 'Operador',
    body: `<p>Dado de alta en la actividad de compraventa. Tiene <strong>las tres vías abiertas</strong>: REBU, Régimen General y servicios + suplido — y elegir la que toca en cada operación es lo que separa a un importador que gana dinero de uno que se lo regala a Hacienda.</p><p>Con el <strong>NIF-IVA (alta en el ROI)</strong> puede además comprar en la UE con exención.</p>` },
  intermediario: { x: 980, y: 90, t: 'Intermediario', s: 'nunca toca la propiedad', tier: 'Operador',
    block: ['stock', 'rebu', 'rg', 'a45s', 'q3', 'b218', 'c300'],
    body: `<p>El coche va <strong>directo del vendedor al comprador final</strong> — nunca pasa por su titularidad ni su tesorería. Solo factura honorarios de gestión (con IVA 21%) y suplidos si adelantó importes de terceros.</p><p>Es un <strong>rol</strong>, no una forma jurídica: cualquiera de los tres operadores puede actuar así en una operación concreta.</p>` },

  stock: { x: 430, y: 280, t: 'Compra de stock', s: 'compras sin cliente esperando', tier: 'Operación',
    body: `<p>El coche se compra <strong>para el escaparate</strong>: capital propio inmovilizado y riesgo de rotación. La forma de facturar la venta futura queda determinada por <strong>cómo entró el coche</strong> — no por lo que te convenga después.</p>` },
  carta: { x: 800, y: 280, t: 'Importación a la carta', s: 'el cliente ya existe', tier: 'Operación',
    body: `<p>Se busca, negocia e importa <strong>un coche concreto para un cliente concreto</strong>. Menos riesgo de stock muerto, margen más ajustado — y por eso aquí la elección entre REBU, Régimen General o servicios <strong>importa mucho más</strong>.</p>` },

  rebu: { x: 300, y: 470, t: 'REBU', s: 'IVA solo sobre el margen', tier: 'Forma de facturar',
    body: `<p>Solo si el coche se adquirió <strong>sin IVA deducible</strong> (particular, otro REBU, operación exenta). En la factura al cliente el IVA no se desglosa — va dentro del precio — y por eso <strong>el cliente nunca puede deducírselo</strong>.</p><div class="formula">Margen = venta (IVA incl.) − compra (IVA incl.)
Base imponible = margen × 100 / 121
<b>IVA a ingresar = margen − base</b></div><div class="hookline">El IVA del REBU sale de TU margen. Es la partida que casi nadie resta cuando calcula su ROI.</div>` },
  rg: { x: 620, y: 470, t: 'Régimen General', s: 'IVA deducible · sobre el total', tier: 'Forma de facturar',
    body: `<p>El coche entró <strong>con IVA deducible</strong> (concesionario, o intracomunitaria exenta con tu NIF-IVA). Repercutes el 21% sobre el precio total de venta, desglosado en factura — <strong>si el cliente es empresa, se lo deduce</strong>.</p><p>Matiz que casi todo el mundo confunde: cuando el coche es <strong>mercancía para revender</strong>, su IVA se deduce al 100% — la presunción del 50% es solo para coches de uso propio de la empresa.</p><div class="formula">Base = precio de venta pactado
IVA repercutido = base × 21% <b>(lo paga el cliente aparte)</b>
Tu margen = base − coste total</div>` },
  serv: { x: 940, y: 470, t: 'Servicios + suplido', s: 'el coche no es tuyo fiscalmente', tier: 'Forma de facturar',
    body: `<p>No compras ni vendes el coche: cobras <strong>honorarios de gestión</strong> (con IVA 21%) y repercutes como <strong>suplido</strong> los importes exactos de terceros pagados en nombre del cliente.</p><p><strong>Suplido real = importe fijado por un tercero que no puedes negociar</strong> (impuestos, tasas). Lo que sí negocias y ejecutas más barato (transporte, gestoría) es parte de tu precio de servicio cerrado — y lo que ahorras ejecutándolo, es tuyo.</p><div class="hookline">Tu base imponible es solo tus honorarios — no el valor del coche. Por eso con un coche de 40.000 € puedes estar ingresando 383 € de IVA, no 6.000.</div>` },

  a45s: { x: 170, y: 690, t: 'Mercedes A45 S', s: 'stock · REBU', tier: 'Caso real', esCaso: true, clip: true,
    chips: ['Stock', 'REBU', '🎬 clip'],
    body: `<p>Comprado en Alemania y vendido en España como stock puro, facturado por REBU.</p><div class="formula">Compra: <b>43.000 €</b> · Gastos reales: <b>6.016,55 €</b>
Venta: <b>53.990 €</b> (IVA no desglosado)
Margen REBU = 10.990 € → base 9.082,64 €
<b>IVA a ingresar: 1.907,36 €</b></div><div class="kpi"><span class="k">Margen real neto</span><span class="v">3.066 €</span></div><div class="hookline">La hoja de cálculo marcaba un ROI del 10,15%. El real, tras restar el IVA REBU, es del 6,26%. Casi 4 puntos que se esfuman cuando llega el modelo 303.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  q3: { x: 400, y: 690, t: 'Audi Q3', s: 'a la carta · REBU', tier: 'Caso real', esCaso: true, clip: true,
    chips: ['A la carta', 'REBU', '🎬 clip'],
    body: `<p>Operación calculada <strong>antes de comprar</strong> — así se decide una importación a la carta.</p><div class="formula">Compra negociada: <b>15.249 €</b> (rebaja −750 €)
Importación: <b>2.420 €</b> → invertido 17.669 €
Venta pactada: <b>20.900 €</b>
Margen REBU 5.651 € → <b>IVA: 981 €</b></div><div class="kpi"><span class="k">Beneficio neto previsto</span><span class="v">2.250 €</span></div><div class="hookline">20.900 € está POR DEBAJO del mínimo de mercado (21.500 €). Nadie pone ese precio a un stock — solo tiene sentido si ya sabes a quién se lo vendes.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  b218: { x: 620, y: 690, t: 'BMW 218 GC', s: 'stock · Régimen General', tier: 'Caso real', esCaso: true,
    chips: ['Stock', 'Régimen General', 'Financiación'],
    body: `<p>Comprado con IVA deducible y vendido con el 21% desglosado en factura.</p><div class="formula">Compra: <b>16.798 €</b> · Gastos: <b>3.088,19 €</b>
Base venta: <b>20.652 €</b> + IVA 4.338 €
Total factura cliente: <b>24.990 €</b></div><div class="kpi"><span class="k">Margen (1.515,81 + 750 financiación)</span><span class="v">2.265 €</span></div><div class="hookline">Aquí el IVA no toca tu margen — lo paga el cliente aparte y tú solo lo pasas a Hacienda. Compara con el A45S: mismo negocio, dos matemáticas distintas.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  c300: { x: 840, y: 690, t: 'Mercedes C300', s: 'a la carta · Régimen General', tier: 'Caso real', esCaso: true, clip: true,
    chips: ['A la carta', 'Régimen General', '🎬 clip'],
    body: `<p>Compra con el <strong>19% alemán por delante</strong> — pagado, reclamado y devuelto.</p><div class="formula">Pagado en Alemania: 31.880 € → neto <b>26.789,92 €</b>
(19% alemán devuelto: <b>5.090,08 €</b>)
Gastos: 582,50 € → coste total 27.372,42 €
Factura: <b>36.500 €</b> = base 30.165,29 + IVA 6.334,71</div><div class="kpi"><span class="k">Margen real · ROI 10,2%</span><span class="v">2.793 €</span></div><div class="hookline">5.090 € de IVA extranjero parados en tesorería hasta que llega el reembolso. El coste oculto del que nadie habla al comprar en concesionario alemán.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },
  z4: { x: 1060, y: 690, t: 'BMW Z4', s: 'a la carta · servicios + suplido', tier: 'Caso real', esCaso: true, clip: true,
    chips: ['A la carta', 'Servicios + suplido', '🎬 clip'],
    body: `<p>El coche nunca fue de GPSO fiscalmente: coche y trámites a precio cerrado, honorarios aparte con su IVA.</p><div class="formula">Coche y trámites: <b>41.342 €</b>
Honorarios: <b>1.823 €</b> + IVA <b>383 €</b>
Total cliente: <b>43.548 €</b></div><div class="kpi"><span class="k">Margen real de la operación</span><span class="v">~2.700 €</span></div><div class="hookline">Con un coche de más de 40.000 €, el IVA ingresado a Hacienda fue de 383 €. No es un truco: la base imponible son tus honorarios, porque el coche jamás fue tuyo.</div><div class="fotos">Fotos de la operación — pendiente de encajar</div>` },

  nifiva: { x: 1160, y: 280, t: 'NIF-IVA / ROI', s: 'capa · quién compra en la UE', tier: 'Capa transversal', sat: true, clip: true,
    chips: ['Concepto', '🎬 clip'],
    body: `<p>Para comprar en la UE <strong>con exención</strong>, el comprador necesita un NIF-IVA válido en el VIES. Si tu cliente empresa no lo tiene, el proveedor alemán le cobraría su 19% — y recuperarlo desde España es lento y farragoso.</p><p>La solución: <strong>compras tú con tu NIF-IVA y revendes en España con factura normal</strong> — ese IVA español sí se lo deduce sin problema.</p><div class="hookline">Si tu cliente no tiene NIF-IVA: o lo tienes tú y compras por él, o va a pagar un IVA extranjero que casi nunca recupera.</div>` },
  ded: { x: 1160, y: 470, t: 'Deducción 50 / 100', s: 'capa · cuánto se deduce el comprador', tier: 'Capa transversal', sat: true,
    chips: ['Concepto'],
    body: `<p>Un turismo de uso mixto afecto a la empresa se presume deducible al <strong>50%</strong> (art. 95.Tres LIVA). Deducir más exige probarlo — y la jurisprudencia suele respaldar a Hacienda salvo prueba sólida.</p><p>El <strong>100% automático</strong> es solo para una lista cerrada: agentes comerciales, autoescuelas, transporte de mercancías o viajeros, vigilancia.</p><p>Y el matiz clave para vosotros: el coche que es <strong>stock para revender se deduce al 100% siempre</strong> — esta presunción no le aplica.</p>` },
  limite: { x: 120, y: 230, t: 'Límite del particular', s: 'la ocasionalidad', tier: 'Capa transversal', sat: true,
    chips: ['Concepto'],
    body: `<p>La figura de la entrega ocasional permite a un particular actuar como sujeto pasivo <strong>para una operación concreta</strong>. Si se repite de forma organizada, deja de ser ocasional.</p><div class="hookline">Criterio de seguridad de la academia: máximo 2 al año — no porque la ley diga "2", sino para no acercarse nunca a la frontera de la habitualidad.</div>` },
};

const EDGES = [
  ['particular', 'carta'], ['profesional', 'stock'], ['profesional', 'carta'], ['intermediario', 'carta'],
  ['stock', 'rebu'], ['stock', 'rg'],
  ['carta', 'rebu'], ['carta', 'rg'], ['carta', 'serv'],
  ['rebu', 'a45s'], ['rebu', 'q3'], ['rg', 'b218'], ['rg', 'c300'], ['serv', 'z4'],
  ['nifiva', 'rg', 1], ['nifiva', 'c300', 1],
  ['ded', 'rg', 1], ['ded', 'b218', 1],
  ['limite', 'particular', 1],
];

const NODE_H = 56; // altura aprox. de nodo para anclar las curvas

function edgePath([a, b]) {
  const na = NODES[a], nb = NODES[b];
  let p1, p2;
  if (Math.abs(na.y - nb.y) < 60) {
    const left = na.x < nb.x;
    p1 = [na.x + (left ? 75 : -75), na.y];
    p2 = [nb.x + (left ? -75 : 75), nb.y];
  } else {
    const down = na.y < nb.y;
    p1 = [na.x, na.y + (down ? NODE_H / 2 : -NODE_H / 2)];
    p2 = [nb.x, nb.y + (down ? -NODE_H / 2 : NODE_H / 2)];
  }
  const my = (p1[1] + p2[1]) / 2;
  return `M ${p1[0]} ${p1[1]} C ${p1[0]} ${my}, ${p2[0]} ${my}, ${p2[0]} ${p2[1]}`;
}

export default function FiscalidadClient({ email, perfil }) {
  const [sel, setSel] = useState(null);
  const [lit, setLit] = useState(null);      // Set de ids iluminados
  const [cosmos, setCosmos] = useState(null); // capa de fondo (solo cliente)
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Capa cosmos: micro-nodos y enlaces finos generados en cliente
    const dots = [];
    for (let i = 0; i < 90; i++) {
      dots.push({
        x: Math.random() * 1280, y: Math.random() * 880,
        r: Math.random() * 1.6 + 0.6,
        d: (Math.random() * 26 + 14).toFixed(0),      // duración deriva
        o: (Math.random() * 0.25 + 0.08).toFixed(2),  // opacidad
      });
    }
    const links = [];
    for (let i = 0; i < 60; i++) {
      const a = dots[Math.floor(Math.random() * dots.length)];
      const b = dots[Math.floor(Math.random() * dots.length)];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 40 && dist < 260) links.push({ a, b });
    }
    setCosmos({ dots, links });
  }, []);

  const vecinos = (id, dir) =>
    EDGES.filter(e => e[dir === 'down' ? 0 : 1] === id).map(e => e[dir === 'down' ? 1 : 0]);

  const seleccionar = (id) => {
    const s = new Set([id]);
    const block = new Set(NODES[id].block || []);
    const walk = (cur, dir) => {
      for (const nx of vecinos(cur, dir)) {
        if (block.has(nx) || s.has(nx)) continue;
        s.add(nx); walk(nx, dir);
      }
    };
    walk(id, 'down'); walk(id, 'up');
    setSel(id); setLit(s);
  };

  const cerrar = () => { setSel(null); setLit(null); };
  const n = sel ? NODES[sel] : null;

  return (
    <div className="fisc-bg">
      <header className="fisc-top">
        <span className="marca">gpso collector<span className="dot">.</span></span>
        <h1>Fiscalidad del Importador</h1>
        <span className="badge-priv">Privado · solo admin</span>
        <div className="top-right">
          <a href="/recursos" className="volver">← Recursos</a>
          <MenuDrawer perfil={perfil} email={email} />
        </div>
      </header>

      <div className="viewport">
        <div className={'canvas' + (lit ? ' dim' : '')}>

          {/* capa cosmos (fondo) */}
          <svg className="cosmos" viewBox="0 0 1280 880" aria-hidden="true">
            {cosmos && cosmos.links.map((l, i) => (
              <line key={'l' + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
            ))}
            {cosmos && cosmos.dots.map((d, i) => (
              <circle key={'d' + i} cx={d.x} cy={d.y} r={d.r}
                style={{ opacity: d.o, animationDuration: d.d + 's', animationDelay: (i % 9) + 's' }} />
            ))}
          </svg>

          {/* cables del grafo estructurado */}
          <svg className="wires" viewBox="0 0 1280 880">
            {EDGES.map((e, i) => {
              const on = lit && lit.has(e[0]) && lit.has(e[1]);
              return (
                <g key={i}>
                  <path id={'w' + i} d={edgePath(e)}
                    className={'wire' + (e[2] ? ' dashed' : '') + (on ? ' on' : '')} />
                  {!e[2] && !reduceRef.current && [0, 1].map(k => (
                    <circle key={k} r="2.4" className={'spark' + (on ? ' on' : '')}>
                      <animateMotion dur={(4 + (i % 4) + k * 1.7) + 's'} repeatCount="indefinite"
                        begin={(k * 2.1) + 's'}>
                        <mpath href={'#w' + i} />
                      </animateMotion>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>

          <span className="tier-label" style={{ top: 82 }}>¿Quién?</span>
          <span className="tier-label" style={{ top: 272 }}>¿Qué?</span>
          <span className="tier-label" style={{ top: 462 }}>¿Cómo?</span>
          <span className="tier-label" style={{ top: 682 }}>Casos reales</span>

          {Object.entries(NODES).map(([id, nd]) => (
            <button key={id}
              className={
                'node' + (nd.esCaso ? ' case' : '') + (nd.sat ? ' sat' : '') +
                (lit && lit.has(id) ? ' litnode' : '') + (sel === id ? ' active' : '')
              }
              style={{ left: nd.x, top: nd.y }}
              onClick={() => seleccionar(id)}>
              <span className="t">{nd.t}{nd.clip && <span className="clipb">clip</span>}</span>
              <span className="s">{nd.s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* panel de nota */}
      <aside className={'panel' + (n ? ' open' : '')} aria-live="polite">
        <button className="cerrar" onClick={cerrar} aria-label="Cerrar nota">✕</button>
        {n && (
          <>
            <div className="phead">
              <div className="chips">
                <span className="chip">{n.tier}</span>
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
        .pbody p strong{font-weight:500;color:#e8d9a8}
        .pbody .formula{border:1px solid #232833;border-left:2px solid #c6a04a;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0;font-size:12.5px;line-height:1.8;color:#8b93a3;white-space:pre-line}
        .pbody .formula b{color:#e9e6df;font-weight:500}
        .pbody .kpi{display:flex;align-items:baseline;justify-content:space-between;border-top:1px solid #232833;padding:14px 2px 0;margin-top:18px}
        .pbody .kpi .k{font-size:12px;color:#8b93a3}
        .pbody .kpi .v{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:600;color:#3ddc97}
        .pbody .fotos{margin-top:20px;border:1px dashed #232833;border-radius:8px;padding:22px;text-align:center;font-size:12px;color:#8b93a3}
        .pbody .hookline{margin-top:18px;padding:14px 16px;border-radius:8px;background:rgba(198,160,74,.08);border:1px solid rgba(198,160,74,.35);font-size:13.5px;line-height:1.55;color:#e8d9a8}
      `}</style>

      <style jsx>{`
        .fisc-bg{position:fixed;inset:0;background:#0a0c10;color:#e9e6df;font-family:'Space Grotesk',sans-serif;font-weight:300;overflow:hidden}
        .fisc-bg::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(198,160,74,.05) 1px,transparent 1px);background-size:34px 34px}

        .fisc-top{position:absolute;top:0;left:0;right:0;z-index:40;display:flex;align-items:baseline;gap:18px;padding:20px 28px 14px;background:linear-gradient(to bottom,rgba(10,12,16,.96) 60%,rgba(10,12,16,0))}
        .marca{font-weight:600;font-size:15px;letter-spacing:.3px;color:#e9e6df}
        .marca .dot{color:#c6a04a}
        h1{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:clamp(20px,3vw,30px);line-height:1;color:#e8d9a8;margin:0}
        .badge-priv{font-size:10.5px;letter-spacing:.8px;color:#c6a04a;border:1px solid rgba(198,160,74,.5);border-radius:20px;padding:3px 10px}
        .top-right{margin-left:auto;display:flex;align-items:center;gap:16px}
        .volver{font-size:13px;color:#8b93a3;text-decoration:none}
        .volver:hover{color:#c6a04a}

        .viewport{position:absolute;inset:0;overflow:auto;padding:110px 40px 60px}
        .canvas{position:relative;width:1280px;height:880px;margin:0 auto}

        .cosmos{position:absolute;inset:0;width:100%;height:100%}
        .cosmos line{stroke:rgba(139,147,163,.10);stroke-width:.6}
        .cosmos circle{fill:#8b93a3;animation:deriva linear infinite alternate}
        @keyframes deriva{from{transform:translate(0,0)}to{transform:translate(14px,-10px)}}
        @media (prefers-reduced-motion: reduce){.cosmos circle{animation:none}}

        .wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
        .wires :global(.wire){fill:none;stroke:#232833;stroke-width:1.4;transition:stroke .35s,opacity .35s}
        .wires :global(.wire.dashed){stroke-dasharray:3 6}
        .wires :global(.wire.on){stroke:#c6a04a}
        .canvas.dim .wires :global(.wire:not(.on)){opacity:.16}
        .wires :global(.spark){fill:#c6a04a;opacity:.35;transition:opacity .35s}
        .wires :global(.spark.on){opacity:1;fill:#e8d9a8}
        .canvas.dim .wires :global(.spark:not(.on)){opacity:.05}

        .tier-label{position:absolute;left:0;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#8b93a3;width:110px;text-align:right;font-style:italic}

        .node{position:absolute;transform:translate(-50%,-50%);background:#12151c;border:1px solid #232833;border-radius:10px;color:#e9e6df;font-family:'Space Grotesk',sans-serif;padding:11px 16px 10px;min-width:132px;text-align:left;cursor:pointer;transition:border-color .3s,box-shadow .3s,opacity .3s,transform .2s}
        .node:hover{border-color:#c6a04a;transform:translate(-50%,-50%) scale(1.03)}
        .node:focus-visible{outline:2px solid #e8d9a8;outline-offset:3px}
        .node .t{display:block;font-weight:500;font-size:14px;letter-spacing:.2px}
        .node .s{display:block;font-size:11px;color:#8b93a3;margin-top:3px}
        .node.case{border-color:rgba(198,160,74,.55);box-shadow:0 0 22px rgba(198,160,74,.10),inset 0 0 14px rgba(198,160,74,.05);animation:latido 5s ease-in-out infinite}
        @keyframes latido{0%,100%{box-shadow:0 0 18px rgba(198,160,74,.08),inset 0 0 14px rgba(198,160,74,.05)}50%{box-shadow:0 0 30px rgba(198,160,74,.20),inset 0 0 14px rgba(198,160,74,.05)}}
        @media (prefers-reduced-motion: reduce){.node.case{animation:none}}
        .node.case .t{color:#e8d9a8}
        .node.sat{border-style:dashed;background:transparent}
        .node.active{border-color:#e8d9a8;box-shadow:0 0 30px rgba(198,160,74,.35)}
        .canvas.dim .node:not(.litnode){opacity:.22}
        .clipb{display:inline-block;font-size:10px;color:#0a0c10;background:#c6a04a;border-radius:4px;padding:1px 6px;margin-left:7px;font-weight:600;vertical-align:2px}

        .panel{position:fixed;top:0;right:0;bottom:0;width:420px;z-index:50;background:#12151c;border-left:1px solid #232833;transform:translateX(102%);transition:transform .38s cubic-bezier(.22,.9,.3,1);display:flex;flex-direction:column}
        .panel.open{transform:translateX(0)}
        .phead{padding:26px 28px 18px;border-bottom:1px solid #232833}
        .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .chip{font-size:10.5px;letter-spacing:.6px;color:#8b93a3;border:1px solid #232833;border-radius:20px;padding:3px 10px}
        .chip.gold{color:#c6a04a;border-color:rgba(198,160,74,.5)}
        .panel h2{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:30px;color:#e8d9a8;line-height:1.05;margin:0}
        .pbody{padding:22px 28px 40px;overflow-y:auto;flex:1}
        .cerrar{position:absolute;top:20px;right:20px;background:none;border:1px solid #232833;border-radius:50%;width:32px;height:32px;color:#8b93a3;cursor:pointer;font-size:15px;transition:border-color .2s,color .2s;z-index:2}
        .cerrar:hover{border-color:#c6a04a;color:#c6a04a}

        @media (max-width:900px){
          .panel{top:auto;left:0;right:0;width:auto;max-height:62vh;border-left:none;border-top:1px solid #232833;border-radius:16px 16px 0 0;transform:translateY(105%)}
          .panel.open{transform:translateY(0)}
          .viewport{padding:96px 16px 40px}
          .badge-priv{display:none}
        }
      `}</style>
    </div>
  );
}
