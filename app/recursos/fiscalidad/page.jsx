// =====================================================================
//  GPSO COLLECTOR · Fiscalidad del Importador (servidor)
//  app/recursos/fiscalidad/page.jsx
//  ABIERTO a todos los alumnos activos.
// =====================================================================

import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import FiscalidadClient from './FiscalidadClient';

export const dynamic = 'force-dynamic';

export default async function FiscalidadPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.activo) redirect('/');
  // (antes: if (perfil.rol !== 'admin') redirect('/recursos');)
  // Ahora abierto a todos los alumnos activos.

  return <FiscalidadClient email={user.email} perfil={perfil} />;
}
