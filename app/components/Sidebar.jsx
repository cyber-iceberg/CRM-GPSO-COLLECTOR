'use client';

// =====================================================================
//  GPSO COLLECTOR · Menú lateral global  ·  app/components/Sidebar.jsx
//  Rail de iconos que se EXPANDE al pasar el ratón (iconos → etiquetas).
//  Pensado para estar en TODAS las páginas: mételo una vez en app/layout.jsx
//  justo dentro del <body>:   <Sidebar />
//  y da a tu contenido un margen izquierdo en escritorio (ver nota abajo).
//  En móvil se oculta (usas tu BottomNav).
// =====================================================================

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { LayoutGrid, Target, ClipboardCheck, FolderOpen, GraduationCap, Gauge, Gem, LifeBuoy, LogOut } from 'lucide-react';

const URL_FORMACION = 'https://academy.gpsocollector.com';
const URL_NEXOCAR = 'https://nexocar.app';

export default function Sidebar() {
  const router = useRouter();
  const path = usePathname() || '/';
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!vivo || !data?.user) return;
        setEmail(data.user.email || '');
        const { data: p } = await supabase.from('perfiles_alumno').select('nombre, rol, vip').eq('id', data.user.id).single();
        if (vivo && p) setPerfil(p);
      } catch {}
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;
  const plan = esAdmin ? 'Admin' : (esVip ? 'VIP' : 'Alumno');

  const NAV = [
    { label: 'Inicio',          icon: LayoutGrid,     href: '/' },
    { label: 'Central de Leads', icon: Target,         href: '/central', primary: true }, // ← la jefa (botón dorado)
    { label: 'Peritación',      icon: ClipboardCheck, href: '/peritacion' },
    { label: 'Recursos',        icon: FolderOpen,     href: '/recursos' },
    ...((esVip || esAdmin) ? [{ label: 'Inversión VIP', icon: Gem, href: '/vip' }] : []),
    { label: 'Formación',       icon: GraduationCap,  href: URL_FORMACION, ext: true },
    { label: 'NEXOCAR',         icon: Gauge,          href: URL_NEXOCAR,   ext: true },
  ];

  const go = (it) => { if (it.ext) window.open(it.href, '_blank', 'noopener,noreferrer'); else router.push(it.href); };
  const activo = (h) => (h === '/' ? path === '/' : path.startsWith(h));
  async function salir() { try { await supabase.auth.signOut(); } catch {} router.push('/login'); router.refresh(); }

  return (
    <aside className="gp-rail" aria-label="Menú principal">
      <div className="gp-top">
        <div className="gp-logo"><img src="/collector.jpg" alt="GPSO" /></div>
        <span className="gp-brand">gpso<b>collector</b></span>
      </div>

      <nav className="gp-nav">
        {NAV.map((it) => {
          const Ic = it.icon;
          return (
            <button key={it.label} className={'gp-item' + (it.primary ? ' primary' : '') + (!it.ext && activo(it.href) ? ' on' : '')} onClick={() => go(it)} title={it.label}>
              <span className="gp-ic"><Ic size={21} /></span>
              <span className="gp-lbl">{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="gp-foot">
        <div className="gp-acc">
          <span className="gp-crown">♛</span>
          <div className="gp-acc-tx">
            <div className="gp-plan">{plan}</div>
            <div className="gp-mail">{email}</div>
          </div>
        </div>
        <button className="gp-item" onClick={() => router.push('/soporte')} title="Soporte">
          <span className="gp-ic"><LifeBuoy size={20} /></span><span className="gp-lbl">Soporte</span>
        </button>
        <button className="gp-item" onClick={salir} title="Cerrar sesión">
          <span className="gp-ic"><LogOut size={20} /></span><span className="gp-lbl">Cerrar sesión</span>
        </button>
      </div>

      <style jsx>{`
        .gp-rail{position:fixed;top:0;left:0;bottom:0;width:76px;z-index:60;display:flex;flex-direction:column;
          background:rgba(9,11,16,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          border-right:1px solid rgba(255,255,255,.07);overflow:hidden;padding:16px 0;
          font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
          transition:width .24s cubic-bezier(.2,.7,.3,1),box-shadow .24s}
        .gp-rail:hover{width:252px;box-shadow:24px 0 60px rgba(0,0,0,.45)}

        .gp-top{display:flex;align-items:center;gap:12px;padding:0 16px 16px}
        .gp-logo{width:44px;height:44px;border-radius:12px;overflow:hidden;border:1px solid rgba(201,161,77,.45);flex:none;background:#1a1412}
        .gp-logo img{width:100%;height:100%;object-fit:cover}
        .gp-brand{font-size:17px;font-weight:800;letter-spacing:-.4px;color:#aab2c2;white-space:nowrap;opacity:0;transition:opacity .2s}
        .gp-brand b{color:#eef1f6;font-weight:800}
        .gp-rail:hover .gp-brand{opacity:1}

        .gp-nav{display:flex;flex-direction:column;gap:4px;padding:6px 14px}
        .gp-item{display:flex;align-items:center;gap:14px;width:100%;height:48px;padding:0 13px;border:none;border-radius:13px;
          background:none;color:#9aa3b2;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:600;white-space:nowrap;
          transition:background .2s,color .2s}
        .gp-item:hover{background:rgba(255,255,255,.06);color:#eef1f6}
        /* página actual: resaltado sutil */
        .gp-item.on{color:#ead9b4;background:rgba(201,161,77,.12)}
        /* la JEFA (Central de Leads): botón dorado, siempre destacado */
        .gp-item.primary{color:#1a140a;background:linear-gradient(135deg,#e7cf92,#c9a14d);box-shadow:0 8px 22px rgba(201,161,77,.34);font-weight:700}
        .gp-item.primary:hover{background:linear-gradient(135deg,#f0dca0,#d4ab53);color:#1a140a}
        .gp-item.primary.on{background:linear-gradient(135deg,#e7cf92,#c9a14d)}
        .gp-ic{flex:none;width:22px;display:grid;place-items:center}
        .gp-lbl{opacity:0;transition:opacity .2s}
        .gp-rail:hover .gp-lbl{opacity:1}

        .gp-foot{margin-top:auto;padding:6px 14px;display:flex;flex-direction:column;gap:4px}
        .gp-acc{display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:8px;border-radius:12px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);overflow:hidden}
        .gp-crown{flex:none;color:#e3c987;font-size:16px;width:22px;text-align:center}
        .gp-acc-tx{overflow:hidden;white-space:nowrap}
        .gp-plan{font-size:12.5px;font-weight:700;color:#e3c987;opacity:0;transition:opacity .2s}
        .gp-mail{font-size:11px;color:#9aa3b2;opacity:0;transition:opacity .2s;overflow:hidden;text-overflow:ellipsis}
        .gp-rail:hover .gp-plan,.gp-rail:hover .gp-mail{opacity:1}

        @media (max-width:860px){ .gp-rail{display:none} }
      `}</style>
    </aside>
  );
}
