// =====================================================================
//  GPSO COLLECTOR · Puerta de entrada de leads (webhook)
//  Ruta EXACTA:  app/api/lead-entrante/route.js
//  v3 — filtra la morralla de GHL, guarda solo las PREGUNTAS reales del
//  formulario, y rellena columnas base (vehiculo/ciudad/presupuesto +
//  extras para la tarjeta: marca, pago, plazo).
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Puerta de leads GPSO activa' });
}

// claves tecnicas de GHL que NO queremos ver nunca
const BASURA = new Set([
  'tags','contact','country','location','workflow','contact id','contactid',
  'customdata','custom data','triggerdata','trigger data','contact type','contacttype',
  'date created','datecreated','contact source','contactsource','attribution source',
  'attributionsource','full name','fullname','first name','last name','email','phone',
  'id','user','userid','user id','company','businessname','business name','timezone',
  'dnd','source','datetime','date','time',
]);

// normaliza para comparar (minusculas, sin acentos raros)
const norm = (s) => String(s).trim().toLowerCase();

// ¿es una pregunta real del formulario? (contiene ? o ¿) o un campo util conocido
function esPregunta(clave) {
  const k = norm(clave);
  if (BASURA.has(k)) return false;
  if (k.includes('object')) return false;
  if (clave.includes('?') || clave.includes('¿')) return true;
  // campos utiles aunque no lleven ?
  const utiles = ['marca','modelo','coche','vehiculo','presupuesto','plazo','urgencia','ciudad','provincia','pago','financiacion','financiación','motivo','extras'];
  return utiles.some((u) => k.includes(u));
}

// detecta a que "categoria" pertenece una pregunta por su texto
function clasifica(clave) {
  const k = norm(clave);
  if (k.includes('marca')) return 'marca';
  if (k.includes('presupuesto') || k.includes('budget')) return 'presupuesto';
  if (k.includes('plazo') || k.includes('urgencia') || k.includes('cuando')) return 'plazo';
  if (k.includes('pago') || k.includes('financ') || k.includes('contado') || k.includes('dinero')) return 'pago';
  if (k.includes('ciudad') || k.includes('provincia') || k.includes('localidad') || k.includes('ubicacion')) return 'ciudad';
  if (k.includes('modelo') || k.includes('coche') || k.includes('vehiculo')) return 'modelo';
  return null;
}

export async function POST(request) {
  const token = request.headers.get('x-gpso-token');
  if (!token || token !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'json_invalido' }, { status: 400 }); }

  const g = (...keys) => {
    for (const k of keys) {
      if (body[k] != null && String(body[k]).trim() !== '' && norm(body[k]) !== '[object object]') return String(body[k]).trim();
    }
    return null;
  };

  // BASE directos
  const nombre    = g('nombre', 'full_name', 'fullname', 'name', 'nombre_completo', 'first_name');
  const telefono  = g('telefono', 'phone', 'phone_number', 'telefono_movil', 'movil');
  const email     = g('email', 'correo', 'email_address');

  // Recorremos TODO el body quedandonos solo con preguntas reales,
  // y de paso extraemos marca/presupuesto/plazo/pago/ciudad/modelo.
  const detalles = {};
  let marca = null, presupuestoTxt = null, plazo = null, pago = null, ciudadForm = null, modelo = null;

  // si viene un objeto 'detalles' anidado, lo aplanamos primero
  const fuente = {};
  if (body.detalles && typeof body.detalles === 'object') Object.assign(fuente, body.detalles);
  Object.assign(fuente, body);

  for (const [k, v] of Object.entries(fuente)) {
    if (v == null) continue;
    const valor = String(v).trim();
    if (valor === '' || norm(valor) === '[object object]') continue;
    if (!esPregunta(k)) continue;

    detalles[k] = valor; // guardamos la pregunta legible tal cual

    const cat = clasifica(k);
    if (cat === 'marca' && !marca) marca = valor;
    else if (cat === 'presupuesto' && !presupuestoTxt) presupuestoTxt = valor;
    else if (cat === 'plazo' && !plazo) plazo = valor;
    else if (cat === 'pago' && !pago) pago = valor;
    else if (cat === 'ciudad' && !ciudadForm) ciudadForm = valor;
    else if (cat === 'modelo' && !modelo) modelo = valor;
  }

  // COLUMNAS BASE para la tarjeta del catalogo
  // vehiculo = marca (o modelo, o lo que haya); si nada, texto generico
  const vehiculo = marca || modelo || g('vehiculo','vehicle','car','coche') || 'Consulta de importación';
  // ciudad: del formulario, o del campo city de GHL si es texto util
  const ciudadRaw = ciudadForm || g('ciudad','city','provincia','localidad');
  const ciudad = (ciudadRaw && norm(ciudadRaw) !== '[object object]' && norm(ciudadRaw) !== 'es') ? ciudadRaw : null;
  // presupuesto: intentamos sacar un numero del texto ("15.000€ - 20.000€" -> 15000)
  let presupuesto = null;
  const presuBase = presupuestoTxt || g('presupuesto','budget','precio');
  if (presuBase) {
    const m = String(presuBase).replace(/\./g, '').match(/\d{3,}/);
    if (m) presupuesto = parseInt(m[0], 10);
  }
  // guardamos tambien los "extras" para la tarjeta dentro de detalles
  if (pago) detalles['Forma de pago'] = pago;
  if (plazo && !Object.keys(detalles).some(k => norm(k).includes('plazo'))) detalles['Plazo'] = plazo;

  const calorRaw = (g('calor') || 'medio').toLowerCase();
  const calor = ['alto', 'medio', 'bajo'].includes(calorRaw) ? calorRaw : 'medio';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('leads')
    .insert({ nombre, telefono, email, vehiculo, ciudad, calor, presupuesto, detalles })
    .select('id')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  try { await supabase.from('lead_eventos').insert({ lead_id: data.id, tipo: 'creado' }); } catch (e) {}

  return NextResponse.json({ ok: true, id: data.id });
}
