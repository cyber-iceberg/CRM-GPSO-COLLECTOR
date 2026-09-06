// =====================================================================
//  GPSO COLLECTOR · El Mundo (mapa de módulos)
//  app/recursos/mundo/page.jsx  (servidor · gate de alumno activo)
// =====================================================================

import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import MundoClient from './MundoClient';

export const dynamic = 'force-dynamic';

export default async function MundoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.activo) redirect('/');

  return <MundoClient email={user.email} perfil={perfil} />;
}
