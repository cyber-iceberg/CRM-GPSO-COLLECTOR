// =====================================================================
//  GPSO COLLECTOR · Recursos (servidor)  ·  app/recursos/page.jsx
//  Sección interna: números, PDFs, contactos, contratos de la formación.
// =====================================================================

import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import RecursosClient from './RecursosClient';

export const dynamic = 'force-dynamic';

export default async function RecursosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno').select('nombre, rol, activo, vip').eq('id', user.id).single();

  if (!perfil || !perfil.activo) redirect('/');

  return <RecursosClient email={user.email} perfil={perfil} />;
}
