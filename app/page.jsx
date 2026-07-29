// =====================================================================
//  GPSO COLLECTOR · Central de Leads (REAL)  ·  app/page.jsx
//  Servidor: valida sesion, lee perfil + catalogo + mis leads de Supabase
//  y se lo pasa al cliente. Sustituye a la home provisional.
// =====================================================================

import { createClient } from '../lib/supabase/server';
import { redirect } from 'next/navigation';
import CentralClient from './CentralClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, leads_ganados, leads_perdidos, leads_expirados')
    .eq('id', user.id)
    .single();

  const { data: catalogo } = await supabase
    .from('v_catalogo')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: misLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('alumno_id', user.id)
    .eq('estado', 'reservado')
    .order('reservado_en', { ascending: false });

  const { data: config } = await supabase.from('config').select('*').single();

  const { data: motivos } = await supabase
    .from('motivos_descarte')
    .select('*')
    .eq('activo', true)
    .order('orden');

  return (
    <CentralClient
      user={{ id: user.id, email: user.email }}
      perfil={perfil}
      catalogoInicial={catalogo || []}
      misLeadsInicial={misLeads || []}
      config={config || { slots_max: 3, cooldown_horas: 4, expiracion_sin_contactar_horas: 24 }}
      motivos={motivos || []}
    />
  );
}
