// =====================================================================
//  app/peritacion/page.jsx  ·  server component
//  Mismo patrón que app/central/page.jsx: aquí se comprueba la sesión,
//  se cargan datos y se pasan como props al cliente.
//  createClient() es síncrono (Next 14.2.3, cookies() sin await).
// =====================================================================

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import PeritacionClient from './PeritacionClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Peritación · GPSO Collector',
  description: 'Peritación guiada de una unidad, paso a paso, desde el móvil.',
};

export default async function PeritacionPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [perfilRes, guiaRes, listaRes] = await Promise.all([
    supabase.from('perfiles_alumno').select('*').eq('id', user.id).single(),
    supabase.from('peritacion_guias').select('version, titulo, contenido').eq('activa', true).single(),
    supabase.from('v_mis_peritaciones').select('*')
      .eq('alumno_id', user.id).order('actualizada_en', { ascending: false }).limit(40),
  ]);

  return (
    <PeritacionClient
      user={{ id: user.id, email: user.email }}
      perfil={perfilRes.data}
      guia={guiaRes.data || null}
      listaInicial={listaRes.data || []}
    />
  );
}
