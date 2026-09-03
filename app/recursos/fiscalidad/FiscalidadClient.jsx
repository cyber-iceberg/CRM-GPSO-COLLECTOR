'use client';

// =====================================================================
//  GPSO COLLECTOR · Fiscalidad del Importador (cliente) · v7
//  app/recursos/fiscalidad/FiscalidadClient.jsx
//  Cambios v7:
//  · TODO el contenido reestructurado en bloques cortos (idea + dato),
//    nada de párrafos largos: se lee de un vistazo.
//  · Estilos del comparador movidos a :global para que carguen siempre.
//  · Calculadora y tabla comparativa bien maquetadas.
//  El contenido de cada nodo se define con helpers (lead, punto, formula,
//  kpi, hook) que generan HTML estructurado y consistente.
// =====================================================================

import { useState, useEffect, useRef } from 'react';
import MenuDrawer from '../../components/MenuDrawer';

const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ---- helpers de contenido: generan bloques HTML consistentes ----
const lead = (t) => `<p class="n-lead">${t}</p>`;
const punto = (label, t) => `<div class="n-punto"><span class="n-tag">${label}</span><span class="n-txt">${t}</span></div>`;
const datos = (rows) => `<div class="n-datos">${rows.map(([k, v]) => `<div class="n-fila"><span>${k}</span><b>${v}</b></div>`).join('')}<\/div>`;
const kpi = (k, v) => `<div class="n-kpi"><span>${k}</span><b>${v}</b></div>`;
const hook = (t) => `<div class="n-hook">${t}</div>`;
const fotos = () => `<div class="n-fotos">Fotos de la operación · pendiente</div>`;

// ---------------------------------------------------------------------
//  DATOS · revealBy = qué nodos, al expandirse, hacen brotar este nodo
// ---------------------------------------------------------------------
const NODES = {
  origen: { x: 170, y: 500, t: 'La operación', s: 'toca para abrir el mapa', origen: true,
    body:
      lead('Toda operación se define con 3 preguntas, en orden.') +
      punto('1 · Quién', 'particular, profesional o intermediario') +
      punto('2 · Qué', 'compra de stock o importación a la carta') +
      punto('3 · Cómo', 'REBU, IVA general o servicios') +
      hook('No hay "una forma correcta". Elegir la que toca en cada caso es lo que separa ganar dinero de regalárselo a Hacienda.') },

  // ---------------- CAMINO DEL PARTICULAR ----------------
  particular: { x: 520, y: 230, t: 'Particular', s: 'sin darte de alta en nada', revealBy: ['origen'],
    body:
      lead('Compras y vendes a tu nombre, como cualquier persona.') +
      punto('Sin', 'REBU, IVA ni facturas de venta') +
      punto('Tributa en', 'tu declaración de la renta') +
      punto('Tus rutas', 'stock y a la carta, igual que un pro') +
      hook('Tu único límite: que sea puntual, no tu forma de vivir.') },
  p_stock: { x: 880, y: 105, t: 'Stock como particular', s: 'compras, disfrutas, vendes', revealBy: ['particular'],
    body:
      lead('Compras un coche a tu nombre y lo vendes más caro.') +
      punto('La ganancia es', 'un incremento de patrimonio') +
      punto('No haces', 'ninguna factura') +
      datos([['Ganancia', 'venta − (compra + gastos)'], ['Se declara', 'en la renta del año siguiente'], ['Hasta 6.000 €', 'pagas el 19%']]) +
      hook('Sí, puedes ganar dinero con coches sin ser autónomo. La condición: que sea puntual.') },
  p_carta: { x: 880, y: 295, t: 'A la carta como particular', s: 'traes un coche por encargo', revealBy: ['particular'],
    body:
      lead('Alguien te pide un coche concreto y cobras por traerlo.') +
      punto('Puedes', 'emitir una factura suelta con IVA') +
      punto('Tributa en', 'tu renta, como el resto') +
      hook('Si se vuelve tu día a día, deja de ser puntual y toca darse de alta.') },
  limite: { x: 1180, y: 200, t: 'El límite: 2 al año', s: 'la regla de la ocasionalidad', sat: true, clip: true, revealBy: ['p_stock', 'p_carta'],
    chips: ['Concepto', '🎬 clip'],
    body:
      lead('Las dos rutas del particular funcionan porque son puntuales.') +
      punto('La ley dice', '"habitualidad", sin un número exacto') +
      punto('Si te repites', 'Hacienda te obliga a darte de alta, con retroactivo y sanciones') +
      hook('Criterio de la academia: máximo 2 al año. No es la ley — es el margen para no acercarse a la frontera.') },
  golf: { x: 1240, y: 105, t: 'Golf VII GTI', s: 'stock como particular', esCaso: true, clip: true, revealBy: ['p_stock'],
    chips: ['Particular', 'Stock', '🎬 clip'],
    body:
      lead('Coche real de un alumno, vendido como particular.') +
      datos([['Compra + gastos', '≈ 18.250 €'], ['Venta', '21.750 €'], ['Ganancia declarada', '3.500 €'], ['Renta (19%)', '665 €']]) +
      kpi('Neto tras la renta', '2.835 €') +
      hook('Golf GTI 2014, 80.000 km. La ganancia va a la renta como incremento de patrimonio. Sin factura, sin REBU, sin IVA.') +
      fotos() },

  // ---------------- CAMINO DEL PROFESIONAL / INTERMEDIARIO ----------------
  profesional: { x: 520, y: 545, t: 'Profesional', s: 'autónomo o empresa', revealBy: ['origen'],
    body:
      lead('Dado de alta en compraventa. Las tres vías abiertas.') +
      punto('Puede usar', 'REBU, IVA general o servicios') +
      punto('Con NIF-IVA', 'compra en la UE con exención') +
      hook('Elegir bien la vía en cada operación es donde está el dinero.') },
  intermediario: { x: 520, y: 790, t: 'Intermediario', s: 'nunca toca la propiedad', revealBy: ['origen'],
    block: ['stock', 'rebu_s', 'rg_s', 'a45s', 'b218'],
    body:
      lead('El coche va directo del vendedor al comprador final.') +
      punto('No toca', 'ni la titularidad ni tu tesorería') +
      punto('Solo factura', 'honorarios (con IVA) y suplidos') +
      hook('Es un rol, no una forma jurídica: cualquiera puede actuar así en una operación.') },

  stock: { x: 880, y: 470, t: 'Compra de stock', s: 'compras sin cliente esperando', revealBy: ['profesional'],
    body:
      lead('Compras para el escaparate, sin cliente todavía.') +
      punto('Riesgo', 'capital parado hasta que rote') +
      punto('La vía la marca', 'cómo entró el coche, no lo que te convenga') },
  carta: { x: 880, y: 780, t: 'Importación a la carta', s: 'el cliente ya existe', revealBy: ['profesional', 'intermediario'],
    body:
      lead('Importas un coche concreto para un cliente concreto.') +
      punto('Ventaja', 'sin riesgo de stock muerto') +
      punto('Reto', 'margen ajustado → la vía importa mucho más') },

  // --- vías de la rama STOCK ---
  rebu_s: { x: 1240, y: 380, t: 'REBU', s: 'stock · IVA sobre el margen', revealBy: ['stock'],
    body:
      lead('Stock comprado sin IVA deducible (a particular).') +
      punto('En factura', 'el IVA no se desglosa, va dentro') +
      punto('El cliente', 'no puede deducírselo') +
      datos([['Margen', 'venta − compra (coche)'], ['Base', 'margen ÷ 1,21'], ['IVA a ingresar', 'margen − base']]) +
      hook('El IVA del REBU sale de TU margen. Es lo que casi nadie resta al calcular su ROI.') },
  rg_s: { x: 1240, y: 560, t: 'Régimen General', s: 'stock · IVA sobre el total', revealBy: ['stock'],
    body:
      lead('Stock comprado con IVA deducible (concesionario / UE exento).') +
      punto('Repercutes', '21% sobre el total, desglosado') +
      punto('Si el cliente es empresa', 'se lo deduce') +
      punto('Como stock', 'deduces el 100% del IVA de compra') +
      hook('La presunción del 50% es solo para coches de uso propio de la empresa, no para el stock.') },

  // --- vías de la rama A LA CARTA ---
  rebu_c: { x: 1240, y: 700, t: 'REBU', s: 'a la carta · IVA sobre el margen', revealBy: ['carta'],
    body:
      lead('Encargo comprado sin IVA deducible (a particular).') +
      punto('En factura', 'el IVA no se desglosa, va dentro') +
      punto('El cliente', 'no puede deducírselo') +
      datos([['Margen', 'venta − compra (coche)'], ['Base', 'margen ÷ 1,21'], ['IVA a ingresar', 'margen − base']]) +
      hook('El IVA del REBU sale de TU margen. Es lo que casi nadie resta al calcular su ROI.') },
  rg_c: { x: 1240, y: 860, t: 'Régimen General', s: 'a la carta · IVA sobre el total', revealBy: ['carta'],
    body:
      lead('Encargo comprado con IVA deducible (concesionario / UE exento).') +
      punto('Repercutes', '21% sobre el total, desglosado') +
      punto('Si el cliente es empresa', 'se lo deduce') +
      hook('Aquí es donde entra el NIF-IVA: si el cliente no lo tiene, compras tú y le revendes con factura española.') },
  serv: { x: 1240, y: 1020, t: 'Servicios + suplido', s: 'a la carta · el coche no es tuyo', revealBy: ['carta'],
    body:
      lead('No compras ni vendes: gestionas y cobras honorarios.') +
      punto('Honorarios', 'con IVA 21%') +
      punto('Suplido', 'el importe exacto de terceros (impuestos, tasas)') +
      punto('Ojo', 'lo que negocias barato (transporte, gestoría) es tu precio, no suplido') +
      hook('Tu base imponible son tus honorarios, no el valor del coche. Por eso con un coche de 40.000 € ingresas 383 € de IVA, no 6.000.') },

  nifiva: { x: 1450, y: 940, t: 'NIF-IVA / ROI', s: 'capa · quién compra en la UE', sat: true, clip: true, revealBy: ['rg_c'],
    chips: ['Concepto', '🎬 clip'],
    body:
      lead('Para comprar en la UE con exención hace falta NIF-IVA (VIES).') +
      punto('Si el cliente no lo tiene', 'el alemán le cobra su 19%, difícil de recuperar') +
      punto('La solución', 'compras tú con tu NIF-IVA y le revendes con factura española') +
      hook('Si tu cliente no tiene NIF-IVA: o lo tienes tú y compras por él, o paga un IVA extranjero que casi nunca recupera.') },
  ded: { x: 1450, y: 480, t: 'Deducción 50/100', s: 'capa · cuánto deduce el comprador', sat: true, revealBy: ['rg_s'],
    chips: ['Concepto'],
    body:
      lead('Cuánto IVA se deduce un cliente empresa según el uso del coche.') +
      datos([['Turismo uso mixto', '50% (art. 95.Tres LIVA)'], ['Más del 50%', 'hay que probarlo'], ['100% automático', 'comerciales, autoescuelas, transporte, vigilancia'], ['Stock para revender', '100% siempre']]) +
      hook('Deducir más del 50% exige prueba sólida — la jurisprudencia suele dar la razón a Hacienda.') },

  // --- casos reales de STOCK ---
  a45s: { x: 1620, y: 320, t: 'Mercedes A45 S', s: 'stock · REBU', esCaso: true, clip: true, revealBy: ['rebu_s'],
    chips: ['Stock', 'REBU', '🎬 clip'],
    body:
      lead('Comprado a particular alemán y revendido como stock por REBU.') +
      datos([['Compra', '43.000 €'], ['Gastos reales', '6.016,55 €'], ['Venta', '53.990 €'], ['Margen REBU', '10.990 €'], ['IVA a ingresar', '1.907,36 €']]) +
      kpi('Margen real neto', '3.066 €') +
      hook('La hoja marcaba 10,15% de ROI. El real, tras el IVA REBU, es 6,26%. Casi 4 puntos que se esfuman con el modelo 303.') +
      fotos() },
  b218: { x: 1620, y: 560, t: 'BMW 218 GC', s: 'stock · Régimen General', esCaso: true, revealBy: ['rg_s'],
    chips: ['Stock', 'Régimen General', 'Financiación'],
    body:
      lead('Comprado con IVA deducible y vendido con el 21% desglosado.') +
      datos([['Compra', '16.798 €'], ['Gastos', '3.088,19 €'], ['Base venta', '20.652 €'], ['IVA', '4.338 €'], ['Total cliente', '24.990 €']]) +
      kpi('Margen (1.515 + 750 finan.)', '2.265 €') +
      hook('El IVA no toca tu margen: lo paga el cliente aparte. Compara con el A45S — mismo negocio, dos matemáticas distintas.') +
      fotos() },

  // --- casos reales de A LA CARTA ---
  q3: { x: 1620, y: 700, t: 'Audi Q3', s: 'a la carta · REBU', esCaso: true, clip: true, revealBy: ['rebu_c'],
    chips: ['A la carta', 'REBU', '🎬 clip'],
    body:
      lead('Calculado antes de comprar — así se decide una operación a la carta.') +
      datos([['Compra negociada', '15.249 € (−750)'], ['Importación', '2.420 €'], ['Invertido', '17.669 €'], ['Venta pactada', '20.900 €'], ['IVA REBU', '981 €']]) +
      kpi('Beneficio neto previsto', '2.250 €') +
      fotos() },
  c300: { x: 1620, y: 860, t: 'Mercedes C300', s: 'a la carta · Régimen General', esCaso: true, clip: true, revealBy: ['rg_c'],
    chips: ['A la carta', 'Régimen General', '🎬 clip'],
    body:
      lead('Compra con el 19% alemán por delante: pagado, reclamado y devuelto.') +
      datos([['Pagado en DE', '31.880 €'], ['Neto (19% fuera)', '26.789,92 €'], ['IVA DE devuelto', '5.090,08 €'], ['Factura (base+IVA)', '30.165 + 6.335']]) +
      kpi('Margen real · ROI 10,2%', '2.793 €') +
      hook('5.090 € de IVA extranjero parados en tesorería hasta el reembolso. El coste oculto de comprar en concesionario alemán.') +
      fotos() },
  z4: { x: 1620, y: 1020, t: 'BMW Z4', s: 'a la carta · servicios + suplido', esCaso: true, clip: true, revealBy: ['serv'],
    chips: ['A la carta', 'Servicios', '🎬 clip'],
    body:
      lead('El coche nunca fue de GPSO: precio cerrado + honorarios aparte.') +
      datos([['Coche + trámites', '41.342 €'], ['Honorarios', '1.823 €'], ['IVA (21%)', '383 €'], ['Total cliente', '43.548 €']]) +
      kpi('Margen real', '~2.700 €') +
      hook('Coche de 40.000 € e ingresas 383 € de IVA. La base son tus honorarios, porque el coche jamás fue tuyo.') +
      fotos() },

  comparador: { x: 1980, y: 1020, t: 'Comparador', s: 'REBU vs IVA vs servicios', esCaso: true, clip: true, comparador: true, revealBy: ['z4'],
    chips: ['Herramienta', '🎬 clip'] },
};

const EDGES = [
  ['origen', 'particular'], ['origen', 'profesional'], ['origen', 'intermediario'],
  ['particular', 'p_stock'], ['particular', 'p_carta'],
  ['p_stock', 'golf'],
  ['p_stock', 'limite'], ['p_carta', 'limite'],
  ['profesional', 'stock'], ['profesional', 'carta'], ['intermediario', 'carta'],
  // rama stock
  ['stock', 'rebu_s'], ['stock', 'rg_s'],
  ['rebu_s', 'a45s'], ['rg_s', 'b218'],
  // rama a la carta
  ['carta', 'rebu_c'], ['carta', 'rg_c'], ['carta', 'serv'],
  ['rebu_c', 'q3'], ['rg_c', 'c300'], ['serv', 'z4'],
  ['z4', 'comparador'],
  // capas transversales (línea discontinua)
  ['nifiva', 'rg_c', 1], ['nifiva', 'c300', 1],
  ['ded', 'rg_s', 1], ['ded', 'b218', 1],
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

// ---------------------------------------------------------------------
//  CALCULADORA REBU
// ---------------------------------------------------------------------
function CalculadoraREBU() {
  const [compra, setCompra] = useState('43000');
  const [venta, setVenta] = useState('53990');
  const [gastos, setGastos] = useState('6016.55');

  const c = parseFloat(compra) || 0;
  const v = parseFloat(venta) || 0;
  const g = parseFloat(gastos) || 0;
  const margen = Math.max(0, v - c);
  const base = margen / 1.21;
  const iva = margen - base;
  const beneficio = v - c - g - iva;

  return (
    <div className="calc">
      <label className="calc-in">Precio de compra
        <span><input inputMode="decimal" value={compra} onChange={e => setCompra(e.target.value)} /><i>€</i></span>
      </label>
      <label className="calc-in">Precio de venta
        <span><input inputMode="decimal" value={venta} onChange={e => setVenta(e.target.value)} /><i>€</i></span>
      </label>
      <label className="calc-in">Gastos de importación
        <span><input inputMode="decimal" value={gastos} onChange={e => setGastos(e.target.value)} /><i>€</i></span>
      </label>
      <div className="calc-out">
        <div className="co"><span>Margen</span><b>{fmt(margen)} €</b></div>
        <div className="co"><span>Base imponible</span><b>{fmt(base)} €</b></div>
        <div className="co destaca"><span>IVA REBU a Hacienda</span><b>{fmt(iva)} €</b></div>
        <div className="co final"><span>Beneficio neto</span><b>{fmt(beneficio)} €</b></div>
      </div>
      <p className="calc-nota">El IVA del REBU sale de tu margen. Cambia los números y ve cuánto se lleva Hacienda.</p>
    </div>
  );
}

// ---------------------------------------------------------------------
//  COMPARATIVA Z4 por las 3 vías (números reales verificados)
// ---------------------------------------------------------------------
function ComparativaZ4() {
  const cocheBruto = 36650;
  const cocheNeto = cocheBruto / 1.19;
  const ivaAleman = cocheBruto - cocheNeto;
  const gastos = 4692;
  const totalCliente = 43548;
  const ahorro = 900;

  const serv = { iva: 383, margen: 1823 + ahorro };
  const margenRebu = totalCliente - cocheBruto;
  const ivaRebu = margenRebu - margenRebu / 1.21;
  const rebu = { iva: ivaRebu, margen: margenRebu - ivaRebu - gastos + ahorro };
  const baseIva = totalCliente / 1.21;
  const ivaVia = { iva: (totalCliente - baseIva) - ivaAleman, margen: baseIva - cocheNeto - gastos + ahorro };

  const filas = [
    { k: 'Servicios', sub: 'lo que hicimos', d: serv, real: true },
    { k: 'REBU', sub: 'compras y revendes', d: rebu },
    { k: 'IVA general', sub: '19% DE fuera, 21% ES', d: ivaVia },
  ];

  return (
    <div className="comp">
      <p className="comp-intro">Mismo Z4, mismo precio final (<b>43.548 €</b>). Solo cambia cómo lo facturas:</p>
      <div className="comp-grid">
        <div className="comp-head"><span>Vía</span><span>IVA</span><span>Margen</span></div>
        {filas.map((f, i) => (
          <div className={'comp-fila' + (f.real ? ' real' : '')} key={i}>
            <span className="via"><b>{f.k}{f.real && <em>REAL</em>}</b><i>{f.sub}</i></span>
            <span className="iva">{fmt(f.d.iva)} €</span>
            <span className="mar">{fmt(f.d.margen)} €</span>
          </div>
        ))}
      </div>
      <div className="comp-hook">Tres escalones: <b>2.723 € / 1.909 € / 1.400 €</b>. El mismo coche te deja el doble o la mitad según cómo factures.</div>
    </div>
  );
}

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
    for (let i = 0; i < 180; i++) {
      dots.push({
        x: Math.random() * 2280, y: Math.random() * 1240,
        r: Math.random() * 1.6 + 0.5,
        d: (Math.random() * 28 + 14).toFixed(0),
        tw: (Math.random() * 5 + 2.5).toFixed(1),
        o: (Math.random() * 0.3 + 0.08).toFixed(2),
      });
    }
    const links = [];
    for (let i = 0; i < 95; i++) {
      const a = dots[Math.floor(Math.random() * dots.length)];
      const b = dots[Math.floor(Math.random() * dots.length)];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 40 && dist < 240) links.push({ a, b });
    }
    setCosmos({ dots, links });
    if (viewRef.current) viewRef.current.scrollTo({ left: 0, top: 180 });

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
    if (cerrando.size) return;
    if (expandidos.has(id)) {
      const nx = new Set(expandidos); nx.delete(id);
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (const e of [...nx]) { if (!esVisible(e, nx)) { nx.delete(e); cambio = true; } }
      }
      const fuera = Object.keys(NODES).filter(k => visible(k) && !esVisible(k, nx));
      if (fuera.length) {
        setCerrando(new Set(fuera));
        setTimeout(() => { setExpandidos(nx); setCerrando(new Set()); }, 430);
      }
      setSel(id);
      setLit(iluminar(id, nx));
      return;
    }
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
  const esComp = n && n.comparador;

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

      <div className={'viewport' + (n ? (esComp ? ' conPanelAncho' : ' conPanel') : '')} ref={viewRef}>
        <div className={'canvas' + (lit ? ' dim' : '')}>

          <svg className="cosmos" ref={cosmosRef} viewBox="0 0 2280 1240" aria-hidden="true">
            {cosmos && cosmos.links.map((l, i) => (
              <line key={'l' + i} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />
            ))}
            {cosmos && cosmos.dots.map((d, i) => (
              <circle key={'d' + i} cx={d.x} cy={d.y} r={d.r}
                style={{ opacity: d.o, animationDuration: d.d + 's, ' + d.tw + 's', animationDelay: (i % 9) + 's, ' + (i % 5) + 's' }} />
            ))}
          </svg>

          <svg className="wires" viewBox="0 0 2280 1240">
            {edgesVisibles.map(({ e, i }) => {
              const on = lit && lit.has(e[0]) && lit.has(e[1]);
              const seva = cerrando.has(e[0]) || cerrando.has(e[1]);
              return (
                <g key={i} className={seva ? 'seva' : ''}>
                  {on && !e[2] && (<path d={edgePath(e)} className="glow" pathLength="1" />)}
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
                (nd.comparador ? ' comp' : '') +
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

      <aside className={'panel' + (n ? ' open' : '') + (esComp ? ' ancho' : '')} aria-live="polite">
        <button className="cerrar" onClick={cerrar} aria-label="Cerrar nota">✕</button>
        {n && (
          <>
            <div className="phead">
              <div className="chips">
                {(n.chips || []).map((c, i) => (
                  <span key={i} className={'chip' + (/REBU|General|suplido|clip|Particular|Herramienta|Stock|carta|Financ|Concepto/.test(c) ? ' gold' : '')}>{c}</span>
                ))}
              </div>
              <h2>{n.t}</h2>
            </div>
            <div className="pbody">
              {esComp ? (
                <>
                  <p className="lead-comp">Calcula el REBU de cualquier coche y compara vías al instante.</p>
                  <div className="sec">Calculadora REBU</div>
                  <CalculadoraREBU />
                  <div className="sec">El mismo Z4, por las 3 vías</div>
                  <ComparativaZ4 />
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: n.body }} />
              )}
            </div>
          </>
        )}
      </aside>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Space+Grotesk:wght@300;400;500;600&display=swap');

        /* ---- bloques de contenido estructurado (todas las notas) ---- */
        .pbody .n-lead{font-size:15px;line-height:1.5;color:#ecdcae;font-weight:400;margin:0 0 18px}
        .pbody .n-punto{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-top:1px solid #1c212b}
        .pbody .n-punto:first-of-type{border-top:none;padding-top:2px}
        .pbody .n-tag{flex:none;min-width:74px;font-size:9.5px;letter-spacing:.8px;text-transform:uppercase;color:#c9a14d;font-weight:600;padding-top:2px}
        .pbody .n-txt{font-size:13.5px;line-height:1.5;color:#d4d8e0}
        .pbody .n-datos{border:1px solid #232833;border-radius:9px;overflow:hidden;margin:16px 0}
        .pbody .n-fila{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 13px;border-top:1px solid #1a1e26;font-size:12.5px;color:#8b93a3}
        .pbody .n-fila:first-child{border-top:none}
        .pbody .n-fila b{color:#e9e6df;font-weight:500;text-align:right}
        .pbody .n-kpi{display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 0;padding:14px 0 0;border-top:1px solid #232833}
        .pbody .n-kpi span{font-size:12px;color:#8b93a3}
        .pbody .n-kpi b{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:#3ddc97}
        .pbody .n-hook{margin-top:18px;padding:13px 15px;border-radius:9px;background:rgba(201,161,77,.08);border:1px solid rgba(201,161,77,.32);font-size:13px;line-height:1.5;color:#ecdcae}
        .pbody .n-fotos{margin-top:16px;border:1px dashed #2a303c;border-radius:9px;padding:16px;text-align:center;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6a7180}

        /* ---- panel comparador ---- */
        .pbody .lead-comp{font-size:14px;line-height:1.55;color:#e9e6df;margin:0 0 6px}
        .pbody .sec{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:19px;color:#ecdcae;margin:24px 0 14px;padding-bottom:8px;border-bottom:1px solid #232833}
        .pbody .calc-in{display:block;font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#8b93a3;margin-bottom:11px}
        .pbody .calc-in span{position:relative;display:block;margin-top:5px}
        .pbody .calc-in input{width:100%;background:#0d1017;border:1px solid #232833;border-radius:8px;padding:10px 30px 10px 12px;color:#ecdcae;font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:500}
        .pbody .calc-in input:focus{outline:none;border-color:#c9a14d}
        .pbody .calc-in i{position:absolute;right:12px;top:11px;color:#8b93a3;font-size:13px;font-style:normal}
        .pbody .calc-out{border:1px solid #232833;border-radius:10px;overflow:hidden;margin-top:6px}
        .pbody .co{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;font-size:12.5px;color:#8b93a3;border-bottom:1px solid #1a1e26}
        .pbody .co b{color:#e9e6df;font-weight:500;font-size:14px}
        .pbody .co.destaca{background:rgba(201,161,77,.07)}
        .pbody .co.destaca b{color:#c9a14d}
        .pbody .co.final{background:rgba(61,220,151,.06);border-bottom:none}
        .pbody .co.final b{color:#3ddc97;font-family:'Cormorant Garamond',serif;font-size:22px}
        .pbody .calc-nota{font-size:11.5px;line-height:1.5;color:#8b93a3;margin:12px 2px 0}

        .pbody .comp-intro{font-size:13.5px;line-height:1.55;color:#e9e6df;margin:0 0 14px}
        .pbody .comp-intro b{color:#ecdcae;font-weight:500}
        .pbody .comp-grid{border:1px solid #232833;border-radius:10px;overflow:hidden}
        .pbody .comp-head,.pbody .comp-fila{display:grid;grid-template-columns:1.6fr 1fr 1fr;align-items:center;gap:8px;padding:11px 14px}
        .pbody .comp-head{background:#0d1017;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:#8b93a3}
        .pbody .comp-head span:not(:first-child),.pbody .comp-fila span:not(.via){text-align:right}
        .pbody .comp-fila{border-top:1px solid #1a1e26;font-size:12.5px}
        .pbody .comp-fila .via{display:flex;flex-direction:column;gap:2px}
        .pbody .comp-fila .via b{color:#e9e6df;font-weight:500;display:flex;align-items:center;gap:6px}
        .pbody .comp-fila .via i{font-style:normal;font-size:9.5px;color:#6a7180}
        .pbody .comp-fila .via em{font-style:normal;font-size:8px;letter-spacing:.5px;background:#3ddc97;color:#04140d;border-radius:3px;padding:1px 5px;font-weight:600}
        .pbody .comp-fila .iva{color:#e0876a;font-weight:500}
        .pbody .comp-fila .mar{color:#3ddc97;font-weight:600}
        .pbody .comp-fila.real{background:rgba(61,220,151,.06)}
        .pbody .comp-hook{margin-top:16px;padding:13px 15px;border-radius:9px;background:rgba(201,161,77,.08);border:1px solid rgba(201,161,77,.32);font-size:13px;line-height:1.5;color:#ecdcae}
        .pbody .comp-hook b{color:#f0e2b6;font-weight:600}
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
        .viewport.conPanelAncho{right:560px}
        .canvas{position:relative;width:2280px;height:1240px}

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
        .wires :global(.wire.dashed){stroke:rgba(139,147,163,.4);stroke-dasharray:5 6;animation:none}
        .wires :global(.wire.on){stroke:#e9d194;stroke-width:1.7}
        .canvas.dim .wires :global(.wire:not(.on)){opacity:.16}
        .wires :global(.spark){fill:#c9a14d;opacity:.5;transition:opacity .35s}
        .wires :global(.spark.on){opacity:1;fill:#f0e2b6}
        .canvas.dim .wires :global(.spark:not(.on)){opacity:.05}
        .wires :global(g.seva){opacity:0;transition:opacity .4s ease}
        @media (prefers-reduced-motion: reduce){.wires :global(.wire){animation:none}}

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
        .nodo.comp .orbe{width:44px;height:44px;background:radial-gradient(circle at 35% 30%, #fff 0%, #f0e2b6 30%, #c9a14d 65%, #6b5526 100%);animation:latido 2.6s ease-in-out infinite}
        .nodo.sat .orbe{width:22px;height:22px;background:transparent;border:1.5px dashed rgba(201,161,77,.7);box-shadow:none}
        .nodo.sat:hover .orbe{box-shadow:0 0 16px rgba(201,161,77,.4)}

        .etq{text-align:center;max-width:210px}
        .etq .t{display:block;font-weight:600;font-size:15px;letter-spacing:1.1px;text-transform:uppercase;text-shadow:0 2px 12px rgba(10,12,16,.95)}
        .nodo.caso .etq .t{color:#ecdcae;font-size:16px}
        .nodo.raiz .etq .t,.nodo.comp .etq .t{font-size:17px;color:#ecdcae}
        .etq .s{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#8b93a3;margin-top:4px;text-shadow:0 2px 8px rgba(10,12,16,.95)}
        .clipb{display:inline-block;font-size:9px;letter-spacing:.5px;color:#0a0c10;background:#c9a14d;border-radius:4px;padding:1px 5px;margin-left:7px;font-weight:600;vertical-align:2px}
        .canvas.dim .nodo:not(.litnode){opacity:.18}

        .panel{position:fixed;top:0;right:0;bottom:0;width:420px;z-index:50;background:#12151c;border-left:1px solid #232833;transform:translateX(102%);transition:transform .38s cubic-bezier(.22,.9,.3,1);display:flex;flex-direction:column}
        .panel.ancho{width:560px}
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
          .panel,.panel.ancho{top:auto;left:0;right:0;width:auto;max-height:72vh;border-left:none;border-top:1px solid #232833;border-radius:16px 16px 0 0;transform:translateY(105%)}
          .panel.open{transform:translateY(0)}
          .viewport{padding:84px 16px 30px}
          .viewport.conPanel,.viewport.conPanelAncho{right:0}
        }
      `}</style>
    </div>
  );
}
