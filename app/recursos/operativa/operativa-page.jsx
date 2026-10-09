// =====================================================================
//  GPSO COLLECTOR · Operativa (servidor)
//  app/recursos/operativa/page.jsx
//  Contratos descargables + contactos de confianza (por bloques).
//  ABIERTO a todos los alumnos activos. El admin gestiona los contactos.
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

  // RLS decide qué filas llegan: el alumno ve solo los activos; el admin, todos.
  const { data: contactos } = await supabase
    .from('contactos_operativa')
    .select('*')
    .order('categoria', { ascending: true })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  return <OperativaClient email={user.email} perfil={perfil} contactosIniciales={contactos || []} />;
}
