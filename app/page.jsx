// =====================================================================
//  GPSO COLLECTOR · Central de Leads (servidor)  ·  app/central/page.jsx
//  Igual que la antigua app/page.jsx, pero ahora vive en /central.
//  Imports a DOS niveles porque está en app/central/.
// =====================================================================

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import CentralClient from './CentralClient';

export const dynamic = 'force-dynamic';

export default async function CentralPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno').select('*').eq('id', user.id).single();

  const { data: config } = await supabase.from('config').select('*').single();
  const { data: motivos } = await supabase.from('motivos_descarte').select('*').order('orden');
  const { data: catalogo } = await supabase.from('v_catalogo').select('*').order('created_at', { ascending: false });
  const { data: misLeads } = await supabase.from('leads').select('*')
    .eq('alumno_id', user.id).eq('estado', 'reservado').order('reservado_en', { ascending: false });

  const cfg = config || { slots_max: 3, cooldown_horas: 4, expiracion_sin_contactar_horas: 24 };

  return (
    <CentralClient
      user={{ id: user.id, email: user.email }}
      perfil={perfil}
      catalogoInicial={catalogo || []}
      misLeadsInicial={misLeads || []}
      config={cfg}
      motivos={motivos || []}
    />
  );
}
