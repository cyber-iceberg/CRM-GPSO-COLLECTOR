// =====================================================================
//  GPSO COLLECTOR · Operativa (servidor)
//  app/recursos/operativa/page.jsx
//  Contratos descargables + contactos de confianza.
//  ABIERTO a todos los alumnos activos.
// =====================================================================

import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import OperativaClient from './OperativaClient';

export const dynamic = 'force-dynamic';

export default async function OperativaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.activo) redirect('/');

  return <OperativaClient email={user.email} perfil={perfil} />;
}
