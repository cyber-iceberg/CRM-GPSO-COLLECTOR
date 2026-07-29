// =====================================================================
//  GPSO COLLECTOR · Cliente Supabase para el SERVIDOR
//  Ruta: lib/supabase/server.js
//  Next 14.2.3 -> cookies() es sincrono (sin await).
// =====================================================================
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // Se llama desde un Server Component: el middleware refresca la sesion.
          }
        },
      },
    }
  );
}
