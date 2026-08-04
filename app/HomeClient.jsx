'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  6 accesos: Central · VIP · Formación · Recursos · Cesión · NEXOCAR
// =====================================================================

import { useRouter } from 'next/navigation';
import MenuDrawer from './components/MenuDrawer';
import { Target, Gem, GraduationCap, FolderOpen, UploadCloud, Rocket, ArrowRight } from 'lucide-react';

// Enlaces externos (cambiar aquí si cambian)
const URL_FORMACION = 'https://academy.gpsocollector.com';
const URL_STOCK = 'https://gpsocollector.com/acceso';
const URL_NEXOCAR = 'https://nexocar.app';

export default function HomeClient({ email, perfil, stats }) {
  const router = useRouter();
  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;
  const nombre = (perfil?.nombre || email || '').split('@')[0].split(' ')[0];
  const eur = (n) => (n || 0).toLocaleString('es-ES') + ' €';

  const abrir = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '22px 22px 60px' }}>

        {/* topbar */}
        <div style={S.top}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-tile" style={{ width: 46, height: 46 }}><img src="/collector.jpg" alt="GPSO" /></div>
            <div>
              <div className="marca" style={{ fontSize: 18 }}>gpso<span className="low">collector<span className="dot">.</span></span></div>
              <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: 'var(--gray-mid)', fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>Plataforma</div>
            </div>
          </div>
          <MenuDrawer perfil={perfil} email={email} />
        </div>

        {/* saludo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gray-mid)', fontWeight: 700 }}>Bienvenido de nuevo</div>
          <h1 className="display" style={{ fontSize: 'clamp(26px,5vw,42px)', marginTop: 8, lineHeight: 1.05 }}>
            Hola, {nombre}. <span className="acento-serif" style={{ color: 'var(--red-soft)' }}>¿por dónde empezamos?</span>
          </h1>
        </div>

        {/* 6 accesos */}
        <div style={S.cards}>
          <Acc onClick={() => router.push('/central')}
            img="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000"
            badge="● Leads en directo" badgeClass="leads"
            titulo="Central de Leads" desc="Reserva y gestiona tus clientes de importación en tiempo real."
            icon={<Target size={16} />} />

          {(esVip || esAdmin) && (
            <Acc onClick={() => router.push('/vip')}
              img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000"
              badge="◆ Exclusivo" badgeClass="vip"
              titulo="Inversión VIP" desc="Coinversión en coches de alta gama seleccionados por Collector."
              icon={<Gem size={16} />} />
          )}

          <Acc onClick={() => abrir(URL_FORMACION)}
            img="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000"
            badge="↗ Tu formación" badgeClass="form"
            titulo="Formación" desc="Accede a las clases y el programa de la Collector Academy."
            icon={<GraduationCap size={16} />} externo />

          <Acc onClick={() => router.push('/recursos')}
            img="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000"
            badge="◆ Todo a mano" badgeClass="recursos"
            titulo="Recursos" desc="Números, PDFs, contactos y contratos de la formación."
            icon={<FolderOpen size={16} />} />

          <Acc onClick={() => abrir(URL_STOCK)}
            img="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000"
            badge="↗ Cesión de venta" badgeClass="stock"
            titulo="Subir unidades" desc="Sube tu coche y lo gestionamos en venta desde nuestro stock."
            icon={<UploadCloud size={16} />} externo />

          <Acc onClick={() => abrir(URL_NEXOCAR)}
            img="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1000"
            badge="↗ Software" badgeClass="nexo"
            titulo="NEXOCAR" desc="El ERP para importadores: calcula, analiza y gestiona tu stock."
            icon={<Rocket size={16} />} externo />
        </div>

        {/* stats */}
        <div style={S.quick}>
          <Kpi l="Leads disponibles" v={stats.leadsDisp} />
          <Kpi l="Tus clientes activos" v={stats.misClientes} />
          {(esVip || esAdmin) && <Kpi l="Operaciones VIP" v={stats.opsVip} />}
          {(esVip || esAdmin) && <Kpi l="Tu inversión activa" v={eur(stats.inversionActiva)} gold />}
        </div>
      </div>
    </div>
  );
}

function Acc({ onClick, img, badge, badgeClass, titulo, desc, icon, externo }) {
  return (
    <div className="acc-card" onClick={onClick}>
      <div className="acc-bg" style={{ backgroundImage: `url('${img}')` }} />
      <div className={`acc-grad ${badgeClass}`} />
      <div className="acc-cont">
        <span className={`acc-badge ${badgeClass}`}>{badge}</span>
        <div className="acc-mid">
          <h2 className="display" style={{ fontSize: 22, color: '#fff' }}>{titulo}</h2>
          <p className="acc-desc">{desc}</p>
          <span className="acc-go">{icon} Entrar {externo ? '↗' : <ArrowRight size={15} />}</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({ l, v, gold }) {
  return (
    <div className="glass" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--gray-mid)', textTransform: 'uppercase', letterSpacing: .8, fontWeight: 600 }}>{l}</div>
      <div className="display" style={{ fontSize: 26, marginTop: 6, color: gold ? 'var(--gold)' : 'var(--text)' }}>{v}</div>
    </div>
  );
}

const S = {
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 },
  quick: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginTop: 26 },
};
