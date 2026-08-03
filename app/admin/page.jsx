// =====================================================================
//  GPSO COLLECTOR · Panel Admin (servidor)  ·  app/admin/page.jsx
//  Solo rol=admin. Carga datos de las 4 secciones y los pasa al cliente.
// =====================================================================

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno').select('nombre, rol, vip').eq('id', user.id).single();

  if (!perfil || perfil.rol !== 'admin') redirect('/');

  // datos de las 4 secciones (best-effort)
  const [alumnos, operaciones, leads, config, motivos] = await Promise.all([
    supabase.from('v_admin_alumnos').select('*'),
    supabase.from('operaciones_vip').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('config').select('*').single(),
    supabase.from('motivos_descarte').select('*').order('orden'),
  ]);

  return (
    <AdminClient
      email={user.email}
      perfil={perfil}
      alumnos={alumnos.data || []}
      operaciones={operaciones.data || []}
      leads={leads.data || []}
      config={config.data || {}}
      motivos={motivos.data || []}
    />
  );
}
