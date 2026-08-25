// =====================================================================
//  app/peritacion/lib/motor.js  ·  v5
//  Penalización FIJA por ítem. El alumno marca ok/obs/def; si es def,
//  resta el pen del ítem. Nada de elegir gravedad.
//  Soporta mediciones (micras por pieza, mm/freno por rueda) que no
//  puntúan pero alimentan el informe y la lectura cruzada.
// =====================================================================

/* ------------------------------------------------------------ lectura */
export const bloqueDe = (guia, id) => guia.find((b) => b.id === id);
export const itemsDe = (est, bid) => (est?.[bid]?.items) || {};
export const estadoItem = (est, bid, i) => itemsDe(est, bid)['it_' + i]?.estado || null;

export function defectosDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.items
    .map((it, i) => ({ ...it, idx: i, ...(items['it_' + i] || {}) }))
    .filter((x) => x.estado === 'def');
}
export function observacionesDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.items
    .map((it, i) => ({ ...it, idx: i, ...(items['it_' + i] || {}) }))
    .filter((x) => x.estado === 'obs');
}
export function evaluadosDe(b, est) {
  const items = itemsDe(est, b.id);
  return b.items.filter((_, i) => items['it_' + i]?.estado).length;
}

/* ---------------------------------------------------------- puntuación */
export function notaBloque(b, est) {
  const pen = defectosDe(b, est).reduce((a, d) => a + (d.pen || 0), 0);
  return Math.max(0, b.max - pen);
}

export function calcular(guia, est, cierre = {}) {
  const notas = {};
  guia.forEach((b) => { notas[b.id] = notaBloque(b, est); });
  const total = Object.values(notas).reduce((a, n) => a + n, 0);

  // banderas: un ítem-defecto marcado que además es rojo, o marca manual
  const banderas = [];
  guia.forEach((b) => {
    defectosDe(b, est).forEach((d) => {
      if (d.rojo) banderas.push({ bloque: b.nombre, bloque_id: b.id, texto: d.t });
    });
    const man = est?.[b.id]?.banderas || {};
    b.banderas.forEach((f, i) => { if (man['bf_' + i]) banderas.push({ bloque: b.nombre, bloque_id: b.id, texto: f }); });
  });
  if (cierre.recomendacion === 'negativa')
    banderas.push({ bloque: 'Cierre', bloque_id: 'cierre', texto: 'Recomendación negativa del perito tras la peritación' });
  // dedup por texto+bloque
  const seen = new Set();
  const banderasU = banderas.filter((x) => { const k = x.bloque_id + '|' + x.texto; if (seen.has(k)) return false; seen.add(k); return true; });

  const totalItems = guia.reduce((a, b) => a + b.items.length, 0);
  const evaluados = guia.reduce((a, b) => a + evaluadosDe(b, est), 0);
  const completitud = totalItems ? Math.round((evaluados / totalItems) * 100) : 0;

  const semaforo = banderasU.length ? 'ROJO' : total >= 84 ? 'VERDE' : total >= 54 ? 'AMARILLO' : 'ROJO';

  return { notas, total, banderas: banderasU, completitud, evaluados, totalItems, semaforo, concluyente: completitud >= 70 };
}

export const costeTotal = (costes) =>
  Object.values(costes || {}).reduce((a, v) => a + (parseFloat(v) || 0), 0);

/* Texto de la guía para la nota del bloque, según lectura:[[min,max,txt]] */
export function leerNota(b, nota) {
  const l = (b.lectura || []).find(([a, c]) => nota >= Math.min(a, c) && nota <= Math.max(a, c));
  return l ? l[2] : 'Sin valorar todavía';
}

/* -------------------------------------------------- lectura cruzada */
export function detectarPatrones(guia, est, cierre = {}, medic = {}) {
  const P = [];
  const B = (id) => bloqueDe(guia, id);
  const defs = (id) => { const b = B(id); return b ? defectosDe(b, est) : []; };
  const rel = (id) => defs(id).filter((d) => d.pen >= 2);
  const marc = (id, i, ests) => ests.includes(estadoItem(est, id, i));
  const ev = (id) => { const b = B(id); return b ? evaluadosDe(b, est) : 0; };
  const push = (n, t, d) => P.push({ nivel: n, titulo: t, texto: d });

  if (rel('carroceria_y_pintura').length && rel('estructura_del_vehiculo').length)
    push('alto', 'Señales convergentes de daño no declarado',
      'Defectos relevantes en carrocería y también en estructura. Juntos dejan de ser detalle estético: apuntan a un golpe reparado. Pide el historial de daños y revisión en taller.');

  // micras: alguna pieza muy por encima de la media
  const mic = Object.entries(medic.micras || {}).map(([k, v]) => [k, parseFloat(v)]).filter(([, v]) => v > 0);
  if (mic.length >= 4) {
    const vals = mic.map(([, v]) => v);
    const media = vals.reduce((a, v) => a + v, 0) / vals.length;
    const altas = mic.filter(([, v]) => v > 250 || v > media * 1.8);
    if (altas.length)
      push('alto', 'Espesómetro delata repintado',
        `${altas.length} pieza(s) muy por encima del resto en micras (media ${Math.round(media)} µm). Por encima de 250 µm suele haber masilla o varias capas: reparación de golpe. Contrástalo con la chapa y las holguras.`);
  }

  if (marc('documentacion_del_vehiculo', 6, ['def', 'obs']) || marc('interior_y_equipamiento', 0, ['def', 'obs']))
    push('alto', 'Duda sobre el kilometraje real',
      'Los km, el historial o el desgaste interior no cuadran entre sí. Contrasta sellos, facturas y lectura de centralita antes de aceptar la cifra del anuncio.');

  if (defs('motor').length && defs('diagnosis_y_electronica').length)
    push('alto', 'El síntoma del motor tiene respaldo electrónico',
      'Lo que notaste en el motor aparece también en la diagnosis. Ya no es impresión: hay dato. Guarda los códigos y presupuesta antes de negociar.');

  if (defs('cambio_y_transmision').length && defs('prueba_dinamica').length)
    push('alto', 'Transmisión confirmada en marcha',
      'El comportamiento del cambio se repite en la prueba dinámica. Una caja tocada se come el margen. Trátalo como coste, no como detalle.');

  // desgaste irregular de ruedas + suspensión
  const desgIrreg = Object.values(medic.ruedas || {}).some((r) => r?.desgaste && r.desgaste !== 'uniforme');
  if (defs('suspension_direccion_y_frenos').length && (desgIrreg || marc('neumaticos_y_llantas', 1, ['def', 'obs'])))
    push('medio', 'Patrón de geometría o suspensión',
      'Señales en la parte ciclo más desgaste irregular en neumáticos. Suele ser alineación o un elemento vencido; a veces el rastro de un golpe. Pide medición de geometría.');

  if (defs('mecanica_y_bajos').some((d) => d.t.includes('Correa')))
    push('alto', 'Distribución sin garantía',
      'Has marcado la distribución como defecto. Es la avería más cara si rompe. Exige factura del cambio o presupuéstalo entero antes de cerrar precio.');

  guia.forEach((b) => {
    const leves = defectosDe(b, est).filter((d) => d.pen === 1).length;
    if (leves >= 3)
      push('medio', 'Acumulación de señales menores en ' + b.nombre.toLowerCase(),
        `${leves} defectos leves en el mismo bloque. Por separado no dicen nada; juntos cuentan una historia.`);
  });

  if (ev('prueba_dinamica') === 0)
    push('alto', 'Sin prueba dinámica',
      'No registraste la prueba en marcha. Sin ella la peritación no es concluyente: motor, cambio, dirección y frenos solo se juzgan rodando.');
  if (ev('diagnosis_y_electronica') === 0)
    push('medio', 'Sin diagnosis',
      'Falta la lectura de centralitas. Es lo más barato y lo que más discusiones cierra. Hazla antes de pagar.');
  if (ev('mecanica_y_bajos') === 0)
    push('medio', 'Sin revisar los bajos',
      'No registraste el bloque de mecánica y bajos. Amortiguación, distribución y corrosión no se ven desde arriba: busca elevador o foto por debajo.');

  const bDoc = B('documentacion_del_vehiculo');
  if (bDoc && ev(bDoc.id) > 0 && notaBloque(bDoc, est) < bDoc.max * 0.6)
    push('alto', 'La base documental no sostiene la operación',
      'Documentación por debajo del 60%. Un coche impecable con papeles malos sigue siendo un problema: la matriculación en España empieza ahí.');

  if (cierre.recomendacion === 'reservas')
    push('medio', 'Recomendación con reservas',
      'Cerraste con reservas. Escribe qué falta por confirmar y ponle plazo; las reservas sin plazo acaban en compra a ciegas.');

  return P;
}

export const COSTES = [
  'Neumáticos a corto plazo', 'Frenos a corto plazo', 'Distribución / correa', 'Pintura o estética',
  'Llantas', 'Interior', 'Mantenimiento próximo', 'Avería mecánica detectada',
  'Avería electrónica detectada', 'Otros costes probables',
];
