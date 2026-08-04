// =====================================================================
//  GPSO COLLECTOR · Middleware de sesion
//  Ruta: middleware.js  (en la RAIZ del proyecto, junto a package.json)
//  Refresca la sesion en cada peticion y protege las rutas privadas.
// =====================================================================
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
 const rutasPublicas = ['/login', '/auth', '/api'];
  const esPublica = rutasPublicas.some((r) => ruta.startsWith(r));

  // Sin sesion en ruta privada -> a login
  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Con sesion intentando ir a login -> a la home
  if (user && ruta === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Aplica a todo menos assets estaticos e imagenes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
