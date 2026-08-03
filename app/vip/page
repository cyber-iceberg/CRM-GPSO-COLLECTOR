// =====================================================================
//  GPSO COLLECTOR · Portal Inversión VIP (servidor)  ·  app/vip/page.jsx
//  Valida sesión + acceso VIP, lee operaciones y compromisos, y pinta
//  el showroom. Solo entran perfiles con vip=true y activo=true.
// =====================================================================

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import ShowroomVip from './ShowroomVip';

export const dynamic = 'force-dynamic';

export default async function VipPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip, tier_inversor')
    .eq('id', user.id)
    .single();

  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip && perfil.activo;

  // operaciones visibles (la vista ya filtra por es_vip); admin ve todo via tabla base
  let operaciones = [];
  if (esVip || esAdmin) {
    const q = esAdmin
      ? supabase.from('operaciones_vip').select('*').in('estado', ['abierta','financiada','en_proceso','vendida']).order('created_at', { ascending: false })
      : supabase.from('v_operaciones_vip').select('*').order('created_at', { ascending: false });
    const { data } = await q;
    operaciones = data || [];
  }

  // mis compromisos (para "mi cartera" y saber en cuáles ya entré)
  const { data: misCompromisos } = await supabase
    .from('compromisos')
    .select('*')
    .eq('inversor_id', user.id);

  return (
    <ShowroomVip
      user={{ id: user.id, email: user.email }}
      perfil={perfil}
      esVip={!!esVip}
      esAdmin={!!esAdmin}
      operacionesIniciales={operaciones}
      misCompromisos={misCompromisos || []}
    />
  );
}
