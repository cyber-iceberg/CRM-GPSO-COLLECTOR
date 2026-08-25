// =====================================================================
//  app/peritacion/lib/motor.js
//  Puntuación, semáforo y lectura cruzada de la inspección.
//  Funciones puras: entra la guía + el estado, sale el resultado.
//  Sin React, sin Supabase. Se puede testear y, el día que haga falta,
//  portar a una función de Postgres para recalcular en servidor.
// =====================================================================

export const SEV_LABEL = { leve: 'Leve', medio: 'Medio', grave: 'Grave' };

/* ------------------------------------------------------------ lectura */
export const bloqueDe = (guia, id) => guia.find((b) => b.id === id);
export const itemsDe = (est, bid) => (est?.[bid]?.items) || {};
export const estadoItem = (est, bid, i) => itemsDe(est, bid)['it_' + i]?.estado || null;

export function defectosDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.checklist
    .map((t, i) => ({ texto: t, idx: i, ...(items['it_' + i] || {}) }))
    .filter((x) => x.estado === 'def' && x.severidad);
}
export function observacionesDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.checklist
    .map((t, i) => ({ texto: t, idx: i, ...(items['it_' + i] || {}) }))
    .filter((x) => x.estado === 'obs');
}
export function evaluadosDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.checklist.filter((_, i) => items['it_' + i]?.estado).length;
}

/* ---------------------------------------------------------- puntuación */
export function notaBloque(b, est) {
  const pen = defectosDe(b, est).reduce((a, d) => a + (b.penalizacion[d.severidad] || 0), 0);
  return Math.max(0, b.max - pen);
}

export function calcular(guia, est, cierre = {}) {
  const notas = {};
  guia.forEach((b) => { notas[b.id] = notaBloque(b, est); });
  const total = Object.values(notas).reduce((a, n) => a + n, 0);

  const banderas = [];
  guia.forEach((b) => {
    const m = est?.[b.id]?.banderas || {};
    b.banderas.forEach((f, i) => { if (m['bf_' + i]) banderas.push({ bloque: b.nombre, bloque_id: b.id, texto: f }); });
  });
  if (cierre.recomendacion === 'negativa')
    banderas.push({ bloque: 'Cierre', bloque_id: 'cierre', texto: 'Recomendación negativa del perito tras la peritación completa' });

  const totalItems = guia.reduce((a, b) => a + b.checklist.length, 0);
  const evaluados = guia.reduce((a, b) => a + evaluadosDe(b, est), 0);
  const completitud = totalItems ? Math.round((evaluados / totalItems) * 100) : 0;

  const semaforo = banderas.length ? 'ROJO' : total >= 84 ? 'VERDE' : total >= 54 ? 'AMARILLO' : 'ROJO';

  return { notas, total, banderas, completitud, evaluados, totalItems, semaforo, concluyente: completitud >= 70 };
}

export const costeTotal = (costes) =>
  Object.values(costes || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);

/* Texto oficial de la guía para la nota de un bloque ("12 a 14 -> ...") */
export function leerNota(b, nota) {
  const l = (b.guia?.lectura_nota || []).find((linea) => {
    const m = linea.match(/^(\d+)(?:\s*a\s*(\d+))?\s*(?:\/\s*\d+)?\s*->/);
    if (!m) return false;
    const a = +m[1], c = m[2] ? +m[2] : a;
    return nota >= Math.min(a, c) && nota <= Math.max(a, c);
  });
  return l ? l.split('->')[1].trim() : 'Sin valorar todavía';
}

/* ------------------------------------------------ lectura cruzada final
   Aquí es donde vive el criterio de Collector Academy. Cada patrón que os
   haya costado dinero alguna vez debería acabar en esta lista.          */
export function detectarPatrones(guia, est, cierre = {}) {
  const P = [];
  const B = (id) => bloqueDe(guia, id);
  const defs = (id) => { const b = B(id); return b ? defectosDe(b, est) : []; };
  const relevantes = (id) => defs(id).filter((d) => d.severidad !== 'leve');
  const marcado = (id, i, ests) => ests.includes(estadoItem(est, id, i));
  const ev = (id) => { const b = B(id); return b ? evaluadosDe(b, est) : 0; };
  const push = (n, t, d) => P.push({ nivel: n, titulo: t, texto: d });

  if (relevantes('carroceria_y_pintura').length && relevantes('estructura_del_vehiculo').length)
    push('alto', 'Señales convergentes de daño no declarado',
      'Hay defectos relevantes en carrocería y también en estructura. Juntos dejan de ser detalle estético: apuntan a un golpe reparado. Pide el historial de daños y una revisión en taller antes de seguir.');

  if (marcado('documentacion_del_vehiculo', 6, ['def', 'obs']) ||
      marcado('interior_y_equipamiento', 12, ['def', 'obs']) ||
      marcado('documentacion_del_vehiculo', 4, ['def']))
    push('alto', 'Duda sobre el kilometraje real',
      'El kilometraje, el historial o el desgaste interior no cuadran entre sí. Contrasta los sellos de servicio con las facturas y con la lectura de la centralita antes de aceptar la cifra del anuncio.');

  if (defs('motor').length && defs('diagnosis_y_electronica').length)
    push('alto', 'El síntoma del motor tiene respaldo electrónico',
      'Lo que has notado en el motor aparece también en la diagnosis. Ya no es una impresión tuya: hay dato. Guarda la captura de los códigos y pide presupuesto antes de negociar.');

  if (defs('cambio_y_transmision').length && defs('prueba_dinamica').length)
    push('alto', 'Transmisión confirmada en marcha',
      'El comportamiento del cambio se repite en la prueba dinámica. Una caja tocada es de las averías que más margen se comen. Trátalo como coste, no como detalle.');

  if (defs('suspension_direccion_y_frenos').length &&
      (marcado('neumaticos_y_llantas', 1, ['def', 'obs']) ||
       marcado('neumaticos_y_llantas', 2, ['def', 'obs']) ||
       marcado('neumaticos_y_llantas', 7, ['def', 'obs'])))
    push('medio', 'Patrón de geometría o suspensión',
      'Señales en la parte ciclo más desgaste irregular en neumáticos. Suele ser alineación o un elemento vencido; a veces es el rastro de un golpe. Pide medición de geometría.');

  guia.forEach((b) => {
    const leves = defectosDe(b, est).filter((d) => d.severidad === 'leve').length;
    if (leves >= 3)
      push('medio', 'Acumulación de señales menores en ' + b.nombre.toLowerCase(),
        leves + ' defectos leves en el mismo bloque. Por separado no dicen nada; juntos cuentan una historia. Míralos como conjunto antes de darlos por asumibles.');
  });

  if (ev('prueba_dinamica') === 0)
    push('alto', 'Sin prueba dinámica',
      'No has registrado la prueba en marcha. Sin ella la peritación no es concluyente: motor, cambio, dirección y frenos solo se juzgan rodando.');

  if (marcado('motor', 0, ['def']) || estadoItem(est, 'motor', 0) === null)
    push('medio', 'Sin arranque en frío verificado',
      'El arranque en frío enseña lo que un motor caliente esconde. Si llegaste y el coche ya estaba en marcha, vuelve otro día o descuenta esa incertidumbre del precio.');

  if (ev('diagnosis_y_electronica') === 0)
    push('medio', 'Sin diagnosis',
      'Falta la lectura de centralitas. Es la comprobación más barata y la que más discusiones cierra. Hazla antes de pagar.');

  const bDoc = B('documentacion_del_vehiculo');
  if (bDoc && ev(bDoc.id) > 0 && notaBloque(bDoc, est) < bDoc.max * 0.6)
    push('alto', 'La base documental no sostiene la operación',
      'Documentación por debajo del 60%. Un coche puede estar impecable y aun así ser un problema si los papeles no acompañan: la matriculación en España empieza ahí.');

  if (cierre.recomendacion === 'reservas')
    push('medio', 'Recomendación con reservas',
      'Has cerrado con reservas. Escribe exactamente qué falta por confirmar y ponle plazo; las reservas sin plazo acaban en compra a ciegas.');

  return P;
}

/* --------------------------------------------------------- informe txt */
export function informeTexto({ guia, ficha, est, cierre, costes, res, patrones }) {
  const L = [];
  L.push('PERITACIÓN COLLECTOR ACADEMY');
  L.push(`Unidad: ${ficha.modelo || '—'}   VIN: ${ficha.vin || '—'}`);
  L.push(`Km: ${ficha.km || '—'}   Precio pedido: ${ficha.precio ? ficha.precio + ' €' : '—'}`);
  L.push(`Vendedor: ${ficha.vendedor || '—'} (${ficha.ciudad || '—'})   Fecha: ${ficha.fecha || '—'}`);
  L.push('');
  L.push(`RESULTADO: ${res.semaforo}   ${res.total}/100   Cobertura: ${res.completitud}%`);
  if (!res.concluyente) L.push('AVISO: peritación incompleta, resultado no concluyente.');
  L.push('');
  L.push('PUNTUACIÓN POR BLOQUES');
  guia.forEach((b) => L.push(`  ${b.nombre}: ${res.notas[b.id]}/${b.max}`));
  if (res.banderas.length) {
    L.push('', `BANDERAS ROJAS (${res.banderas.length})`);
    res.banderas.forEach((f) => L.push(`  · ${f.texto} [${f.bloque}]`));
  }
  const conDef = guia.filter((b) => defectosDe(b, est).length);
  if (conDef.length) {
    L.push('', 'DEFECTOS REGISTRADOS');
    conDef.forEach((b) => {
      L.push(`  ${b.nombre}`);
      defectosDe(b, est).forEach((d) =>
        L.push(`    · [${SEV_LABEL[d.severidad]} −${b.penalizacion[d.severidad]}] ${d.texto}${d.nota ? ' — ' + d.nota : ''}`));
    });
  }
  if (patrones?.length) {
    L.push('', 'LECTURA DE LA INSPECCIÓN');
    patrones.forEach((p) => L.push(`  · ${p.titulo}: ${p.texto}`));
  }
  const ct = costeTotal(costes);
  if (ct > 0) {
    L.push('', `COSTES ESTIMADOS: ${ct.toLocaleString('es-ES')} €`);
    Object.entries(costes).forEach(([k, v]) => { if (parseFloat(v) > 0) L.push(`  · ${k}: ${v} €`); });
    if (ficha.precio) L.push(`  Coste real de entrada: ${((parseFloat(ficha.precio) || 0) + ct).toLocaleString('es-ES')} €`);
  }
  if (cierre?.notas) L.push('', 'NOTAS DEL ALUMNO: ' + cierre.notas);
  return L.join('\n');
}

export const COSTES = [
  'Neumáticos a corto plazo', 'Frenos a corto plazo', 'Pintura o estética', 'Llantas',
  'Interior', 'Mantenimiento próximo', 'Avería mecánica detectada',
  'Avería electrónica detectada', 'Otros costes probables',
];
