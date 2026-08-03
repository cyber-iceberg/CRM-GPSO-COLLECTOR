'use client';

// =====================================================================
//  GPSO COLLECTOR · Menú hamburguesa (drawer)  ·  app/components/MenuDrawer.jsx
//  Botón que abre un panel lateral con la navegación de la plataforma.
//  Reutilizable en cualquier página (Home, Central, VIP...).
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { Menu, X, Home, Target, Gem, UploadCloud, User, ShieldCheck, LogOut } from 'lucide-react';

// URL de la app de Albert (subir unidades). Cambiar aquí cuando esté lista.
const URL_STOCK = 'https://gpsocollector.com/acceso';

export default function MenuDrawer({ perfil, email }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;

  async function salir() {
    await supabase.auth.signOut();
    router.push('/login'); router.refresh();
  }
  function ir(ruta) { setOpen(false); router.push(ruta); }
  function irStock() { setOpen(false); window.open(URL_STOCK, '_blank', 'noopener,noreferrer'); }

  return (
    <>
      <button className="icobtn burger" onClick={() => setOpen(true)} title="Menú" aria-label="Abrir menú">
        <Menu size={20} />
      </button>

      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} />
      <div className={`drawer ${open ? 'on' : ''}`}>
        <div className="dhead">
          <div className="who">Sesión iniciada<b>{perfil?.nombre || email}</b></div>
          <button className="dclose" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={22} /></button>
        </div>

        <a className="mitem" onClick={() => ir('/')}><span className="ico"><Home size={18} /></span><div>Inicio<small>Tu panel</small></div></a>
        <a className="mitem" onClick={() => ir('/central')}><span className="ico"><Target size={18} /></span><div>Central de Leads<small>Reserva y gestiona clientes</small></div></a>
        {(esVip || esAdmin) && (
          <a className="mitem vip" onClick={() => ir('/vip')}><span className="ico"><Gem size={18} /></span><div>Inversión VIP<small>Coinversión alta gama</small></div></a>
        )}
        <a className="mitem" onClick={irStock}><span className="ico"><UploadCloud size={18} /></span><div>Subir unidades<small>Cede tu coche para venta ↗</small></div></a>

        <div className="dsep" />
        <a className="mitem" onClick={() => ir('/cuenta')}><span className="ico"><User size={18} /></span><div>Mi cuenta<small>Perfil y ajustes</small></div></a>
        {esAdmin && (
          <a className="mitem" onClick={() => ir('/admin')}><span className="ico"><ShieldCheck size={18} /></span><div>Administración<small>Gestión de la plataforma</small></div></a>
        )}

        <div className="mspacer" />
        <div className="dsep" />
        <a className="mitem salir" onClick={salir}><span className="ico"><LogOut size={18} /></span><div>Cerrar sesión</div></a>
      </div>
    </>
  );
}
