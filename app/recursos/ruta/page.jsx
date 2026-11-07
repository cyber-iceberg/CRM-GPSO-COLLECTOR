// =====================================================================
//  LA RUTA DEL IMPORTADOR · Server page  ·  app/recursos/ruta/page.jsx
//  Carga mundo + niveles (con misiones y recursos) + perfil del alumno.
//  Si las tablas aún no existen o algo falla, pasa null y el cliente
//  renderiza con sus datos semilla (así funciona desde el minuto uno).
// =====================================================================

import { createClient } from '../../../lib/supabase/server';
import RutaClient from './RutaClient';

export const dynamic = 'force-dynamic';

export default async function RutaPage() {
  let mundo = null, niveles = null, perfil = null, esAdmin = false;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ¿es admin? (para poder entrar a todos los niveles y revisar)
    if (user) {
      const { data: pa } = await supabase
        .from('perfiles_alumno').select('rol').eq('id', user.id).single();
      esAdmin = pa?.rol === 'admin';
    }

    // Mundo 1
    const { data: m } = await supabase
      .from('ruta_mundos').select('*').eq('slug', 'mundo-1').single();
    mundo = m || null;

    if (mundo) {
      // Niveles del mundo (tronco común + rama elegida; de momento todos)
      const { data: nivs } = await supabase
        .from('ruta_niveles')
        .select('*, ruta_misiones(*), ruta_recursos(*)')
        .eq('mundo_id', mundo.id)
        .order('orden', { ascending: true });

      // Progreso del alumno
      let progreso = [];
      if (user) {
        const { data: pr } = await supabase
          .from('ruta_progreso').select('*').eq('alumno_id', user.id);
        progreso = pr || [];
        const { data: pf } = await supabase
          .from('ruta_perfil').select('*').eq('alumno_id', user.id).single();
        if (pf) perfil = pf;
      }

      niveles = (nivs || []).map((n, i) => {
        const pg = progreso.find(p => p.nivel_id === n.id);
        // estado por defecto: 1º disponible, el resto bloqueado (hasta tener progreso real)
        const estado = pg?.estado || (i === 0 ? 'en_curso' : 'bloqueado');
        const okIds = pg?.misiones_ok || [];
        return {
          id: n.id,
          slug: n.slug, titulo: n.titulo, subtitulo: n.subtitulo, descripcion: n.descripcion,
          orden: n.orden, pos_x: Number(n.pos_x), pos_y: Number(n.pos_y),
          cam_zoom: Number(n.cam_zoom), icono: n.icono, xp: n.xp, escenario_url: n.escenario_url,
          estado,
          misiones: (n.ruta_misiones || [])
            .sort((a, b) => a.orden - b.orden)
            .map(ms => ({ titulo: ms.titulo, tipo: ms.tipo, xp: ms.xp,
              estado: okIds.includes(ms.id) ? 'ok' : 'pendiente' })),
          recursos: (n.ruta_recursos || [])
            .sort((a, b) => a.orden - b.orden)
            .map(r => ({ titulo: r.titulo, icono: r.icono, url: r.url })),
        };
      });

      if (!niveles.length) niveles = null; // deja que el cliente use su semilla
    }
  } catch (e) {
    // tablas aún no creadas, etc. → fallback del cliente
    mundo = null; niveles = null; perfil = null;
  }

  return <RutaClient mundo={mundo} niveles={niveles} perfil={perfil} esAdmin={esAdmin} />;
}
