// =====================================================================
//  GPSO COLLECTOR · Fiscalidad del Importador (servidor)
//  app/recursos/fiscalidad/page.jsx
//  PRIVADO: solo rol admin. Los alumnos son redirigidos a /recursos.
//  No hay tarjeta de acceso en Recursos — se entra por URL directa.
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
  if (perfil.rol !== 'admin') redirect('/recursos');

  return <FiscalidadClient email={user.email} perfil={perfil} />;
}
