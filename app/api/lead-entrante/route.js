// =====================================================================
//  GPSO COLLECTOR · Puerta de entrada de leads (webhook)
//  Ruta EXACTA:  app/api/lead-entrante/route.js
//  Recibe un lead (de GHL / Make / Zapier / lo que sea) y lo inserta.
//  Protegido con un token secreto. Universal: da igual el origen.
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Prueba rápida en el navegador: debe responder {ok:true,...}
export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Puerta de leads GPSO activa' });
}

export async function POST(request) {
  // 1) Seguridad: token secreto en la cabecera
  const token = request.headers.get('x-gpso-token');
  if (!token || token !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 });
  }

  // 2) Leer el cuerpo
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'json_invalido' }, { status: 400 }); }

  // 3) Mapear campos de forma flexible (acepta varios nombres)
  const g = (...keys) => {
    for (const k of keys) {
      if (body[k] != null && String(body[k]).trim() !== '') return String(body[k]).trim();
    }
    return null;
  };
  const nombre    = g('nombre', 'full_name', 'name', 'nombre_completo', 'first_name');
  const telefono  = g('telefono', 'phone', 'phone_number', 'telefono_movil', 'movil');
  const email     = g('email', 'correo', 'email_address');
  const vehiculo  = g('vehiculo', 'vehicle', 'car', 'coche', 'modelo') || 'Consulta de importación';
  const ciudad    = g('ciudad', 'city', 'provincia');
  const nota      = g('nota', 'mensaje', 'message', 'comentarios', 'notes', 'tags');
  const calorRaw  = (g('calor') || 'medio').toLowerCase();
  const calor     = ['alto', 'medio', 'bajo'].includes(calorRaw) ? calorRaw : 'medio';
  const presuRaw  = g('presupuesto', 'budget', 'precio');
  const presupuesto = presuRaw ? (parseInt(String(presuRaw).replace(/[^\d]/g, ''), 10) || null) : null;

  // 4) Insertar con la clave de servicio (salta RLS de forma segura, solo servidor)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('leads')
    .insert({ nombre, telefono, email, vehiculo, ciudad, nota, calor, presupuesto })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 5) Registrar el evento (si la tabla existe)
  try { await supabase.from('lead_eventos').insert({ lead_id: data.id, tipo: 'creado' }); } catch (e) {}

  return NextResponse.json({ ok: true, id: data.id });
}
