// =====================================================================
//  GPSO COLLECTOR · Unidades para importar · DATOS
//  app/recursos/unidades/unidades-data.js
//  Fuente: "Guía rápida de búsqueda 0–50.000 €" (revisión 29/10/2026).
//  Para actualizar la guía se edita SOLO este archivo.
//
//  Cada coche:  n = nombre corto (orbe) · m = modelo y motor · d = perfil
//               co = compra objetivo en origen [mín, máx]
//               inv = inversión estimada puesto en España [mín, máx]
//               dem = demanda (Amplia | Selectiva | Nicho) · f = filtro de compra
//               top = true → "empezar por aquí"
// =====================================================================

export const REVISION = '29/10/2026';

export const TRAMOS = [
  {
    id: 't0', t: 'Hasta 10.000 €', corto: '< 10k', s: 'primer coche, mínimo capital',
    lead: 'Inversión total con el coche importado y listo para vender en España. Origen Alemania / Bélgica.',
    empezar: 'Empieza por Peugeot 108 1.0, Fiat 500 1.2, Clio IV y Fiesta 1.25. Solo comprar con margen contrastado.',
    provision: '2.400–3.200 € orientativos por importación, matriculación, revisión, preparación y reserva.',
    objetivo: 1000,
    coches: [
      { n: 'Peugeot 108', m: 'Peugeot 108 · 1.0 VTi', d: '2015–2017 · 69 CV · manual', co: [3200, 4300], inv: [5600, 7200], dem: 'Amplia', f: 'Priorizar oportunidad', top: true },
      { n: 'Fiat 500', m: 'Fiat 500 · 1.2 FIRE', d: '2014–2017 · 69 CV · preferir Lounge', co: [3600, 4900], inv: [6200, 7900], dem: 'Amplia', f: 'Imagen y acabado clave', top: true },
      { n: 'Clio IV', m: 'Renault Clio IV · 1.2 / 0.9 TCe', d: '2014–2016 · 75–90 CV · manual', co: [3600, 4800], inv: [6200, 7800], dem: 'Amplia', f: 'Revisar motor e historial', top: true },
      { n: 'Fiesta 1.25', m: 'Ford Fiesta · 1.25 Duratec', d: '2014–2016 · 82 CV · manual', co: [3200, 4400], inv: [5800, 7300], dem: 'Amplia', f: 'Evitar 1.0 sin historial', top: true },
      { n: 'VW up!', m: 'VW up! · 1.0 MPI', d: '2014–2017 · 60–75 CV', co: [3400, 4500], inv: [5900, 7400], dem: 'Selectiva', f: 'Comparar con Mii' },
      { n: 'Hyundai i10', m: 'Hyundai i10 · 1.0 MPI', d: '2015–2017 · 66–67 CV', co: [3500, 4600], inv: [5900, 7500], dem: 'Amplia', f: 'Solo con gran descuento' },
      { n: 'Kia Picanto', m: 'Kia Picanto · 1.0 CVVT', d: '2015–2017 · 66 CV', co: [3000, 4100], inv: [5400, 7100], dem: 'Amplia', f: 'Margen muy ajustado' },
      { n: 'Toyota Aygo', m: 'Toyota Aygo · 1.0 VVT-i', d: '2014–2016 · 69 CV · manual', co: [3400, 4600], inv: [5900, 7500], dem: 'Amplia', f: 'Objetivo muy exigente' },
      { n: 'Fabia III', m: 'Škoda Fabia III · 1.0 MPI', d: '2015–2016 · 60–75 CV', co: [3300, 4300], inv: [5900, 7200], dem: 'Amplia', f: 'Confirmar generación' },
      { n: 'Sandero', m: 'Dacia Sandero · 0.9 TCe', d: '2015–2016 · 90 CV · Stepway', co: [3400, 4500], inv: [6100, 7500], dem: 'Amplia', f: 'Solo precio de flota' },
      { n: 'Corsa E', m: 'Opel Corsa E · 1.4', d: '2015–2017 · 90 CV', co: [3600, 4700], inv: [6300, 7900], dem: 'Amplia', f: 'Precio límite estricto' },
      { n: 'SEAT Mii', m: 'SEAT Mii · 1.0 MPI', d: '2014–2016 · 60–75 CV', co: [2900, 4000], inv: [5400, 6900], dem: 'Selectiva', f: 'España ya es barata' },
    ],
  },
  {
    id: 't1', t: 'Hasta 20.000 €', corto: '10–20k', s: 'el tramo con más salida',
    lead: 'Inversión total con el coche importado y preparado para vender en España. Origen Alemania / Bélgica.',
    empezar: 'Empieza por León, Golf, A3, Arona y Polo. Formentor solo si aparece una unidad excepcional.',
    provision: '3.500–4.500 € de provisión ilustrativa sobre la compra. No es una cotización de gastos.',
    objetivo: 1500,
    coches: [
      { n: 'León FR', m: 'SEAT León FR · 1.4 / 1.5 TSI', d: '2017–2020 · 125–150 CV', co: [10500, 13000], inv: [14000, 17500], dem: 'Amplia', f: 'Priorizar búsqueda', top: true },
      { n: 'Golf VII', m: 'VW Golf VII restyling · 1.5 TSI', d: '2017–2019 · 130–150 CV', co: [10500, 13000], inv: [14000, 17500], dem: 'Amplia', f: 'Priorizar búsqueda', top: true },
      { n: 'A3 Sportback', m: 'Audi A3 Sportback · 1.4 / 1.5 TFSI', d: '2016–2019 · preferible S line', co: [12000, 14500], inv: [15500, 19000], dem: 'Amplia', f: 'Priorizar búsqueda', top: true },
      { n: 'Arona FR', m: 'SEAT Arona FR · 1.0 TSI', d: '2019–2022 · 110–115 CV', co: [9000, 11500], inv: [12500, 16000], dem: 'Amplia', f: 'Priorizar búsqueda', top: true },
      { n: 'VW Polo', m: 'VW Polo · 1.0 TSI', d: '2018–2021 · 95–115 CV', co: [8500, 11000], inv: [12000, 15500], dem: 'Amplia', f: 'Priorizar búsqueda', top: true },
      { n: 'Ibiza FR', m: 'SEAT Ibiza FR · 1.0 TSI', d: '2018–2021 · 95–115 CV', co: [8000, 10500], inv: [11500, 15000], dem: 'Amplia', f: 'Comparar equipamiento' },
      { n: 'Clase A', m: 'Mercedes A180 / A200 · W176', d: '2016–2018 · preferible AMG Line', co: [12000, 14500], inv: [15500, 19000], dem: 'Selectiva', f: 'Revisar estado y extras' },
      { n: 'Focus ST-Line', m: 'Ford Focus ST-Line · 1.0 EcoBoost', d: '2019–2021 · 125 CV', co: [9000, 11500], inv: [12500, 16000], dem: 'Amplia', f: 'Revisión mecánica clave' },
      { n: 'Puma ST-Line', m: 'Ford Puma ST-Line · 1.0 mHEV', d: '2020–2022 · 125 CV', co: [10500, 13000], inv: [14000, 17500], dem: 'Amplia', f: 'Validar historial' },
      { n: 'Hyundai i30', m: 'Hyundai i30 · 1.4 T-GDI', d: '2018–2020 · 140 CV · preferible N Line', co: [9500, 12000], inv: [13000, 16500], dem: 'Amplia', f: 'Comparar versión exacta' },
      { n: 'SEAT Ateca', m: 'SEAT Ateca · 1.4 / 1.5 TSI', d: '2017–2019 · 150 CV', co: [11000, 13500], inv: [14500, 18000], dem: 'Amplia', f: 'Validar margen' },
      { n: 'Formentor', m: 'CUPRA Formentor · 1.5 TSI', d: '2021–2022 · 150 CV', co: [13500, 15000], inv: [17000, 19500], dem: 'Amplia', f: 'Compra excepcional' },
    ],
  },
  {
    id: 't2', t: 'De 20.000 a 40.000 €', corto: '20–40k', s: 'premium: el precio de entrada manda',
    lead: 'Perfiles más caros, con un precio de entrada que debe dejar margen.',
    empezar: 'Regla: son objetivos de compra exigentes. Ninguna operación es rentable solo por aparecer en esta lista.',
    provision: '4.000–8.000 € de provisión orientativa, según perfil.',
    objetivo: 2500,
    coches: [
      { n: 'Formentor VZ', m: 'CUPRA Formentor VZ · 310 CV', d: '2021 · 60.000–90.000 km', co: [20000, 21500], inv: [24500, 27500], dem: 'Selectiva', f: 'Requiere descuento' },
      { n: 'GLC 220 d', m: 'Mercedes GLC 220 d', d: '2021 · 60.000–90.000 km', co: [26000, 27500], inv: [30000, 33000], dem: 'Selectiva', f: 'Comparar acabado' },
      { n: 'Q5 Sportback', m: 'Audi Q5 Sportback · 40 TDI', d: '2021 · 60.000–90.000 km', co: [25500, 27000], inv: [29500, 32500], dem: 'Selectiva', f: 'Objetivo exigente' },
      { n: 'Audi S3', m: 'Audi S3 Sportback · 8Y', d: '2021 · 50.000–80.000 km', co: [26500, 28000], inv: [31500, 34500], dem: 'Nicho', f: 'Objetivo exigente' },
      { n: 'GTI Clubsport 45', m: 'VW Golf GTI Clubsport 45', d: '2021–2022 · 40.000–70.000 km', co: [26000, 27500], inv: [31000, 34000], dem: 'Nicho', f: 'No sobrevalorar reventa' },
      { n: 'BMW X4', m: 'BMW X4 · xDrive20d', d: '2022 · 60.000–90.000 km', co: [27500, 29000], inv: [32000, 35000], dem: 'Selectiva', f: 'Solo con descuento' },
      { n: 'BMW 430i', m: 'BMW 430i · G22 M Sport', d: '2022 · 50.000–80.000 km', co: [29500, 31000], inv: [34500, 37500], dem: 'Nicho', f: 'Comprar muy selectivo' },
      { n: 'Macan 2.0', m: 'Porsche Macan · 2.0, 245 CV', d: '2019 facelift · 80.000–110.000 km', co: [28000, 29500], inv: [34000, 37500], dem: 'Selectiva', f: 'Reserva mecánica mayor' },
      { n: 'M240i F22', m: 'BMW M240i · F22', d: '2019 · 60.000–90.000 km', co: [23500, 25000], inv: [29000, 32000], dem: 'Nicho', f: 'Compra excepcional' },
    ],
  },
  {
    id: 't3', t: 'De 40.000 a 50.000 €', corto: '40–50k', s: 'más capital, comprador específico',
    lead: 'Mayor capital y comprador más específico: exige más margen y más reserva.',
    empezar: 'Compara primero M240i G42, M2 Competition y RS3 8Y. GLC, Macan S, M440i y Cayman exigen una compra especialmente buena.',
    provision: 'Antes de pagar: al menos 3 unidades españolas equivalentes, historial, peritación y costes e impuestos cerrados.',
    objetivo: 3500,
    coches: [
      { n: 'M240i G42', m: 'BMW M240i · G42 xDrive, 374 CV', d: '2022 · 40.000–70.000 km', co: [34500, 36000], inv: [40500, 43000], dem: 'Nicho', f: 'Priorizar comparativas', top: true },
      { n: 'M2 Competition', m: 'BMW M2 Competition · DKG, 410 CV', d: '2019–2020 · 50.000–80.000 km', co: [38000, 39500], inv: [45000, 47500], dem: 'Nicho', f: 'Priorizar comparativas', top: true },
      { n: 'RS3 8Y', m: 'Audi RS3 Sportback · 8Y, 400 CV', d: '2022 · 40.000–60.000 km', co: [40000, 41500], inv: [47000, 49500], dem: 'Nicho', f: 'Negociar; confirmar 8Y', top: true },
      { n: 'GLC X254', m: 'Mercedes GLC 220 d · X254, 197 CV', d: '2023 · 25.000–50.000 km', co: [37000, 38500], inv: [41500, 44000], dem: 'Selectiva', f: 'Objetivo exigente' },
      { n: 'Macan S', m: 'Porsche Macan S · facelift, 354 CV', d: '2019 · 80.000–100.000 km', co: [34000, 35500], inv: [40500, 43000], dem: 'Selectiva', f: 'Objetivo no localizado' },
      { n: 'M440i', m: 'BMW M440i · G22 xDrive, 374 CV', d: '2021 · 40.000–70.000 km', co: [34500, 36000], inv: [40000, 42500], dem: 'Nicho', f: 'Objetivo exigente' },
      { n: '718 Cayman', m: 'Porsche 718 Cayman · 2.0 PDK, 300 CV', d: '2017–2018 · 50.000–75.000 km', co: [38000, 40000], inv: [44000, 47000], dem: 'Nicho', f: 'Compra excepcional' },
    ],
  },
];

// ---------------------------------------------------------------------
//  REGLA DE DESCARTE · otros modelos bajo 10.000 € que NO compensan
//  al precio público habitual. vES = referencia de venta en España,
//  cMax = compra máxima simulada (2.600 € de costes + 1.000 € restantes).
// ---------------------------------------------------------------------
export const DESCARTE = {
  lead: 'El objetivo no es comprar cualquier coche barato. Casi ninguno de estos es viable al precio público habitual de origen, salvo descuentos extraordinarios.',
  nota: 'Compra máxima simulada con 2.600 € de costes y 1.000 € restantes tras IVA-REBU si procede. Si no aplica REBU, estos techos no valen.',
  coches: [
    { n: 'Fiat Tipo', m: 'Fiat Tipo 1.4 95 CV', d: '2016–2017 · manual', vES: 9500, cMax: 5144, dec: 'Selectivo', f: 'Mejor si SW; el origen normal no deja margen' },
    { n: 'Dacia Dokker', m: 'Dacia Dokker 1.6', d: '2014–2016 · plazas/uso', vES: 9900, cMax: 5544, dec: 'Selectivo', f: 'Verificar clasificación, IVA y 1.6 concreto' },
    { n: 'Micra K14', m: 'Nissan Micra K14 1.0G', d: '2017 · nueva generación', vES: 9000, cMax: 4644, dec: 'Solo subasta', f: 'No confundir con el Micra K13 de 1.2' },
    { n: 'Kia Rio', m: 'Kia Rio 1.2 CVVT', d: '2015–2017 · 5 puertas', vES: 8990, cMax: 4634, dec: 'Solo subasta', f: 'Alemania anunciado demasiado caro' },
    { n: 'smart forfour', m: 'smart forfour 1.0', d: '2015–2017 · 71 CV', vES: 8950, cMax: 4594, dec: 'Solo subasta', f: 'Mejor cinco puertas y pocos kilómetros' },
    { n: 'Ford B-MAX', m: 'Ford B-MAX 1.4', d: '2014–2015 · Duratec', vES: 8490, cMax: 4134, dec: 'Muy selectivo', f: 'Evitar extrapolar ofertas 1.0 EcoBoost' },
    { n: 'Hyundai i20', m: 'Hyundai i20 1.2 MPI', d: '2015–2017 · 75–84 CV', vES: 8200, cMax: 3844, dec: 'Solo flota', f: 'No pagar precio minorista de Alemania' },
    { n: 'Ibiza IV', m: 'SEAT Ibiza IV 1.2 TSI', d: '2015–2016 · 90 CV', vES: 8000, cMax: 3644, dec: 'No retail', f: 'Alta oferta española, descuento obligatorio' },
    { n: 'Twingo III', m: 'Renault Twingo III SCe', d: '2015–2017 · 70 CV', vES: 7500, cMax: 3144, dec: 'No prioridad', f: 'Poca diferencia entre países' },
    { n: 'Citroën C1', m: 'Citroën C1 1.0 VTi', d: '2015–2017 · 69 CV', vES: 7200, cMax: 2844, dec: 'No prioridad', f: 'Solo 1.0; no extrapolar 1.2 PureTech' },
    { n: 'Opel Karl', m: 'Opel Karl 1.0', d: '2015–2017 · 75 CV', vES: 7000, cMax: 2644, dec: 'No prioridad', f: 'Oferta escasa y gran dispersión de precios' },
  ],
  // Anuncios observados el 29/10/2026 (no unidades emparejadas ni precios de cierre)
  brechas: [
    { m: 'Kia Rio 1.2 · 2016', es: 8990, de: 6999, pais: 'DE', lectura: '81k / 67k km' },
    { m: 'Hyundai i20 1.2 · 2016', es: 7990, de: 6190, pais: 'DE', lectura: '134k / 135k km, casi iguales' },
    { m: 'SEAT Ibiza 1.2 TSI · 2016', es: 6990, de: 4990, pais: 'DE', lectura: '167k / 159k km, casi iguales' },
    { m: 'smart forfour 1.0 · 2016', es: 8950, de: 5800, pais: 'DE', lectura: '95k / 86k km; queda poco' },
    { m: 'Opel Karl 1.0 · 2016', es: 5990, de: 4500, pais: 'BE', lectura: '69k / 41k km; no compensa' },
  ],
  ejemplo: { m: 'Kia Rio de 2016', precio: 6999, costes: 2600, venta: 8990 },
};
