'use client';
// =====================================================================
//  GPSO COLLECTOR · Menú inferior móvil  ·  app/components/BottomNav.jsx
//  5 accesos con la Central destacada en el centro (tipo app nativa).
//  Solo visible en móvil (se oculta en escritorio por CSS).
//  Uso: <BottomNav perfil={perfil} activa="central" />
//
//  CAMBIO: Peritación ocupa el hueco que tenía Formación.
//  Motivo: la barra inferior es para lo que se usa CON EL MÓVIL EN LA MANO.
//  Peritación se usa de pie, delante de un coche, en Alemania. Formación
//  se ve sentado y en pantalla grande, sigue accesible desde la Home y
//  desde el menú lateral. Si prefieres mantenerla aquí, el bloque de
//  Formación está comentado justo debajo: descoméntalo y quita el de
//  Peritación.
// =====================================================================
import { useRouter } from 'next/navigation';
import { Home, ClipboardCheck, Target, Gem, FolderOpen, Lock } from 'lucide-react';

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

      <button className={`bn-item ${activa === 'peritacion' ? 'on' : ''}`} onClick={() => router.push('/peritacion')}>
        <ClipboardCheck size={20} /><span>Peritar</span>
      </button>

      {/* alternativa: volver a Formación en este hueco
      <button className="bn-item" onClick={() => irExterno(URL_FORMACION)}>
        <GraduationCap size={20} /><span>Formación</span>
      </button> */}

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
