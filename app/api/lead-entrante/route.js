// =====================================================================
//  GPSO COLLECTOR · Puerta de entrada de leads (webhook)
//  Ruta EXACTA:  app/api/lead-entrante/route.js
//  v4 — captura DOS formularios:
//    · Form simple (Facebook): preguntas con ¿?
//    · Super form (4 páginas): campos ricos (marca, anio, km, color, iva…)
//  Regla nueva: descartamos SOLO la basura conocida de GHL y guardamos
//  TODO lo demás en 'detalles'. Marca como premium (dorado) los leads
//  que traen ficha completa del super form.
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Puerta de leads GPSO activa' });
}

// claves técnicas de GHL que NO queremos ver nunca en 'detalles'
const BASURA = new Set([
  'tags','contact','country','location','workflow','contact id','contactid',
  'customdata','custom data','triggerdata','trigger data','contact type','contacttype',
  'date created','datecreated','contact source','contactsource','attribution source',
  'attributionsource','full name','fullname','first name','last name','email','phone',
  'id','user','userid','user id','company','businessname','business name','timezone',
  'dnd','source','datetime','date','time','contactid','locationid','location id',
  'accepto','acepto','politica','política','privacidad','consent','consentimiento',
]);

const norm = (s) => String(s).trim().toLowerCase();

// etiquetas "bonitas" para las claves técnicas del super form
const ETIQUETAS = {
  marca:'Marca', modelo:'Modelo', motorizacion:'Motorización', version:'Versión',
  combustible:'Combustible', transmision:'Transmisión', traccion:'Tracción',
  carroceria:'Carrocería', anio_desde:'Año desde', anio_hasta:'Año hasta',
  año_desde:'Año desde', año_hasta:'Año hasta', ano_desde:'Año desde', ano_hasta:'Año hasta',
  km_min:'Km mínimos', km_max:'Km máximos', kilometros_min:'Km mínimos', kilometros_max:'Km máximos',
  precio_min:'Precio mínimo', precio_minimo:'Precio mínimo',
  presupuesto:'Presupuesto', presupuesto_max:'Presupuesto', presupuesto_maximo:'Presupuesto',
  color:'Color exterior', color_exterior:'Color exterior',
  tapiceria:'Tapicería', tapiceria_interior:'Tapicería',
  extras:'Extras', info_adicional:'Información adicional', informacion_adicional:'Información adicional',
  comunidad:'Comunidad', comunidad_autonoma:'Comunidad', provincia:'Provincia', ciudad:'Ciudad',
  iva_deducible:'IVA deducible', iva:'IVA deducible',
  plazo:'Plazo', urgencia:'Urgencia', pago:'Forma de pago', financiacion:'Financiación', motivo:'Motivo',
};

// ¿es un campo que debemos guardar? -> todo lo que NO sea basura ni vacío
function esUtil(clave) {
  const k = norm(clave);
  if (BASURA.has(k)) return false;
  if (k.includes('object')) return false;
  if (k === '') return false;
  return true;
}

// clasifica para rellenar columnas base (por nombre de clave O texto de pregunta)
function clasifica(clave) {
  const k = norm(clave);
  if (k.includes('marca')) return 'marca';
  if (k.includes('modelo') || k.includes('coche') || k.includes('vehiculo')) return 'modelo';
  if (k.includes('presupuesto') || k.includes('budget') || k.includes('precio_max')) return 'presupuesto';
  if (k.includes('plazo') || k.includes('urgencia') || k.includes('cuando')) return 'plazo';
  if (k.includes('pago') || k.includes('financ') || k.includes('contado') || k.includes('dinero')) return 'pago';
  if (k.includes('comunidad') || k.includes('ciudad') || k.includes('provincia') || k.includes('localidad') || k.includes('ubicacion')) return 'ciudad';
  return null;
}

// nombre legible de una clave
function etiquetar(clave) {
  const k = norm(clave).replace(/\s+/g,'_');
  if (ETIQUETAS[k]) return ETIQUETAS[k];
  // si es una pregunta (lleva ?), la dejamos tal cual
  if (clave.includes('?') || clave.includes('¿')) return clave.trim();
  // si no, capitalizamos la clave técnica
  return clave.trim().replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
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

  // BASE directos (datos estándar del contacto)
  const nombre    = g('nombre', 'full_name', 'fullname', 'name', 'nombre_completo', 'first_name');
  const telefono  = g('telefono', 'phone', 'phone_number', 'telefono_movil', 'movil');
  const email     = g('email', 'correo', 'email_address');

  // aplanar: si viene 'detalles' anidado, lo mezclamos
  const fuente = {};
  if (body.detalles && typeof body.detalles === 'object') Object.assign(fuente, body.detalles);
  Object.assign(fuente, body);

  const detalles = {};
  let marca=null, modelo=null, presupuestoTxt=null, plazo=null, pago=null, ciudadForm=null;
  let camposReales = 0; // para detectar si es super form (ficha rica)

  for (const [k, v] of Object.entries(fuente)) {
    if (v == null) continue;
    let valor = Array.isArray(v) ? v.join(', ') : String(v).trim();
    if (valor === '' || norm(valor) === '[object object]') continue;
    if (!esUtil(k)) continue;

    const etiqueta = etiquetar(k);
    detalles[etiqueta] = valor;
    camposReales++;

    const cat = clasifica(k);
    if (cat === 'marca' && !marca) marca = valor;
    else if (cat === 'modelo' && !modelo) modelo = valor;
    else if (cat === 'presupuesto' && !presupuestoTxt) presupuestoTxt = valor;
    else if (cat === 'plazo' && !plazo) plazo = valor;
    else if (cat === 'pago' && !pago) pago = valor;
    else if (cat === 'ciudad' && !ciudadForm) ciudadForm = valor;
  }

  // COLUMNAS BASE para la tarjeta
  const vehiculo = marca || modelo || g('vehiculo','vehicle','car','coche') || 'Consulta de importación';
  const ciudadRaw = ciudadForm || g('ciudad','city','provincia','localidad','comunidad');
  const ciudad = (ciudadRaw && norm(ciudadRaw) !== '[object object]' && norm(ciudadRaw) !== 'es') ? ciudadRaw : null;

  let presupuesto = null;
  const presuBase = presupuestoTxt || g('presupuesto','budget','precio');
  if (presuBase) {
    const m = String(presuBase).replace(/\./g, '').match(/\d{3,}/);
    if (m) presupuesto = parseInt(m[0], 10);
  }

  // CALOR según urgencia/plazo
  let calor = 'medio';
  if (plazo) {
    const p = norm(plazo);
    if (p.includes('antes posible') || p.includes('lo antes') || p.includes('ya') || p.includes('urgente') || p.includes('inmediat')) calor = 'alto';
    else if (p.includes('sin prisa') || p.includes('mirando') || p.includes('no tengo prisa') || p.includes('futuro')) calor = 'bajo';
    else if (p.includes('mes')) calor = 'medio';
  } else {
    const calorRaw = (g('calor') || 'medio').toLowerCase();
    calor = ['alto', 'medio', 'bajo'].includes(calorRaw) ? calorRaw : 'medio';
  }

  // PREMIUM (dorado): SOLO si trae campos exclusivos del super form.
  // El formulario simple (6 preguntas) NO tiene ninguno de estos,
  // así que nunca se marcará premium por error.
  const clavesSuper = ['Año desde','Año hasta','Km máximos','Km mínimos','Color exterior','Tapicería','IVA deducible','Carrocería','Transmisión','Tracción','Motorización'];
  const premium = clavesSuper.some(c => detalles[c] != null);
  if (premium) detalles.__premium = true;

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

  return NextResponse.json({ ok: true, id: data.id, premium });
}
