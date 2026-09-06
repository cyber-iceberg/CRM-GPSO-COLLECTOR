// =====================================================================
//  GPSO COLLECTOR · Recursos = El Mundo (servidor)
//  app/recursos/page.jsx
//  Reemplaza el Recursos antiguo. Puerta de entrada al mundo de módulos.
// =====================================================================

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import MundoClient from './MundoClient';

export const dynamic = 'force-dynamic';

export default async function RecursosPage() {
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
