// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (servidor)  ·  app/page.jsx
//  Puerta de entrada: saludo + accesos a las 3 zonas + stats rápidas.
// =====================================================================

import { createClient } from '../lib/supabase/server';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip, tier_inversor')
    .eq('id', user.id)
    .single();

  // stats rápidas (best-effort; si algo falla, se muestra 0)
  const [{ count: leadsDisp }, { count: misClientes }, { count: opsVip }] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('estado', 'disponible'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('alumno_id', user.id).eq('estado', 'reservado'),
    supabase.from('operaciones_vip').select('id', { count: 'exact', head: true }).eq('estado', 'abierta'),
  ]).catch(() => [{ count: 0 }, { count: 0 }, { count: 0 }]);

  // mi inversión activa
  let inversionActiva = 0;
  try {
    const { data: comps } = await supabase.from('compromisos').select('importe').eq('inversor_id', user.id).in('estado', ['comprometido', 'pagado']);
    inversionActiva = (comps || []).reduce((s, c) => s + Number(c.importe || 0), 0);
  } catch (e) { inversionActiva = 0; }

  return (
    <HomeClient
      email={user.email}
      perfil={perfil}
      stats={{
        leadsDisp: leadsDisp || 0,
        misClientes: misClientes || 0,
        opsVip: opsVip || 0,
        inversionActiva,
      }}
    />
  );
}
