'use client';

// =====================================================================
//  GPSO COLLECTOR · Menú inferior móvil  ·  app/components/BottomNav.jsx
//  5 accesos con la Central destacada en el centro (tipo app nativa).
//  Solo visible en móvil (se oculta en escritorio por CSS).
//  Uso: <BottomNav perfil={perfil} activa="central" />
// =====================================================================

import { useRouter } from 'next/navigation';
import { Home, GraduationCap, Target, Gem, FolderOpen, Lock } from 'lucide-react';

const URL_FORMACION = 'https://academy.gpsocollector.com';

export default function BottomNav({ perfil, activa }) {
  const router = useRouter();
  const esVip = perfil && (perfil.vip || perfil.rol === 'admin');

  const irExterno = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <nav className="bottomnav">
      <button className={`bn-item ${activa === 'inicio' ? 'on' : ''}`} onClick={() => router.push('/')}>
        <Home size={20} /><span>Inicio</span>
      </button>

      <button className="bn-item" onClick={() => irExterno(URL_FORMACION)}>
        <GraduationCap size={20} /><span>Formación</span>
      </button>

      {/* CENTRAL · destacada en el centro */}
      <button className={`bn-center ${activa === 'central' ? 'on' : ''}`} onClick={() => router.push('/central')}>
        <div className="bn-center-circle"><Target size={24} /></div>
        <span>Leads</span>
      </button>

      <button className={`bn-item ${activa === 'vip' ? 'on' : ''}`} onClick={() => router.push('/vip')}>
        <span style={{ position: 'relative' }}>
          <Gem size={20} />
          {!esVip && <Lock size={11} className="bn-lock" />}
        </span>
        <span>VIP</span>
      </button>

      <button className={`bn-item ${activa === 'recursos' ? 'on' : ''}`} onClick={() => router.push('/recursos')}>
        <FolderOpen size={20} /><span>Recursos</span>
      </button>
    </nav>
  );
}
