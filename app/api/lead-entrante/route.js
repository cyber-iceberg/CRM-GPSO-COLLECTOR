// =====================================================================
//  GPSO COLLECTOR · Puerta de entrada de leads (webhook)
//  Ruta EXACTA:  app/api/lead-entrante/route.js
//  v2 — guarda campos base + TODO lo extra en 'detalles' (JSONB).
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, msg: 'Puerta de leads GPSO activa' });
}

export async function POST(request) {
  // 1) Seguridad
  const token = request.headers.get('x-gpso-token');
  if (!token || token !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 });
  }

  // 2) Cuerpo
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'json_invalido' }, { status: 400 }); }

  // 3) Campos BASE (con nombres flexibles)
  const g = (...keys) => {
    for (const k of keys) {
      if (body[k] != null && String(body[k]).trim() !== '') return String(body[k]).trim();
    }
    return null;
  };
  const nombre    = g('nombre', 'full_name', 'fullname', 'name', 'nombre_completo', 'first_name');
  const telefono  = g('telefono', 'phone', 'phone_number', 'telefono_movil', 'movil');
  const email     = g('email', 'correo', 'email_address');
  const vehiculo  = g('vehiculo', 'vehicle', 'car', 'coche', 'modelo', 'marca') || 'Consulta de importación';
  const ciudad    = g('ciudad', 'city', 'provincia', 'localidad');
  const nota      = g('nota', 'mensaje', 'message', 'comentarios', 'notes');
  const calorRaw  = (g('calor') || 'medio').toLowerCase();
  const calor     = ['alto', 'medio', 'bajo'].includes(calorRaw) ? calorRaw : 'medio';
  const presuRaw  = g('presupuesto', 'budget', 'precio');
  const presupuesto = presuRaw ? (parseInt(String(presuRaw).replace(/[^\d]/g, ''), 10) || null) : null;

  // 4) DETALLES: todo lo que NO es un campo base, se guarda tal cual.
  //    Así cualquier pregunta del formulario (marca, plazo, pago, motivo,
  //    extras...) aparece en la ficha del cliente sin tocar la base de datos.
  //    Dos formas de mandar detalles desde GHL:
  //     a) un objeto: "detalles": { "Marca": "Mercedes", "Plazo": "..." }
  //     b) campos sueltos con etiqueta legible (los recogemos abajo).
  const camposBase = new Set([
    'nombre','full_name','fullname','name','nombre_completo','first_name','last_name',
    'telefono','phone','phone_number','telefono_movil','movil',
    'email','correo','email_address','vehiculo','vehicle','car','coche','modelo',
    'ciudad','city','provincia','localidad','nota','mensaje','message','comentarios','notes',
    'calor','presupuesto','budget','precio','detalles','x-gpso-token',
  ]);
  let detalles = {};
  // a) si viene un objeto 'detalles', lo tomamos de base
  if (body.detalles && typeof body.detalles === 'object') detalles = { ...body.detalles };
  // b) añadimos cualquier otro campo suelto que no sea base
  for (const [k, v] of Object.entries(body)) {
    if (camposBase.has(k)) continue;
    if (v == null || String(v).trim() === '') continue;
    // clave legible: "marca_interes" -> "Marca interes"
    const etiqueta = k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    detalles[etiqueta] = String(v).trim();
  }

  // 5) Insertar
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('leads')
    .insert({ nombre, telefono, email, vehiculo, ciudad, nota, calor, presupuesto, detalles })
    .select('id')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  try { await supabase.from('lead_eventos').insert({ lead_id: data.id, tipo: 'creado' }); } catch (e) {}

  return NextResponse.json({ ok: true, id: data.id });
}
