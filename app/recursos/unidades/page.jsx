// =====================================================================
//  GPSO COLLECTOR · Unidades para importar (servidor)
//  app/recursos/unidades/page.jsx
//  Guía de qué coche importar por tramo de capital + simulador.
//  Abierto a los alumnos activos (los datos van en unidades-data.js).
// =====================================================================

import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import UnidadesClient from './UnidadesClient';

export const dynamic = 'force-dynamic';

export default async function UnidadesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles_alumno')
    .select('nombre, rol, activo, vip')
    .eq('id', user.id)
    .single();

  if (!perfil || !perfil.activo) redirect('/');

  return <UnidadesClient email={user.email} perfil={perfil} />;
}
