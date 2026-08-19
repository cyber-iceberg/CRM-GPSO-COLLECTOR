'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  Saludo + 6 accesos (Central, VIP, Subir unidades, Formación, Recursos, NEXOCAR) + stats + menú.
// =====================================================================

import { useRouter } from 'next/navigation';
import MenuDrawer from './components/MenuDrawer';
import BottomNav from './components/BottomNav';
import { Target, Gem, UploadCloud, ArrowRight, GraduationCap, FolderOpen, Gauge } from 'lucide-react';

// URL de la app de Albert (subir unidades). Cambiar aquí cuando esté lista.
const URL_STOCK = 'https://gpsocollector.com/acceso';
const URL_FORMACION = 'https://academy.gpsocollector.com';
const URL_NEXOCAR = 'https://nexocar.app';

export default function HomeClient({ email, perfil, stats }) {
  const router = useRouter();
  const esAdmin = perfil && perfil.rol === 'admin';
  const esVip = perfil && perfil.vip;
  const nombre = (perfil?.nombre || email || '').split('@')[0].split(' ')[0];

  const eur = (n) => (n || 0).toLocaleString('es-ES') + ' €';

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '22px 22px 60px' }}>

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
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gray-mid)', fontWeight: 700 }}>Bienvenido de nuevo</div>
          <h1 className="display" style={{ fontSize: 'clamp(28px,5vw,44px)', marginTop: 8, lineHeight: 1.05 }}>
            Hola, {nombre}. <span className="acento-serif" style={{ color: 'var(--red-soft)' }}>¿por dónde empezamos?</span>
          </h1>
        </div>

        {/* accesos */}
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

          <Acc onClick={() => window.open(URL_STOCK, '_blank', 'noopener,noreferrer')}
            img="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000"
            badge="↗ Cesión de venta" badgeClass="stock"
            titulo="Subir unidades" desc="Sube tu coche y lo gestionamos en venta desde nuestro stock."
            icon={<UploadCloud size={16} />} externo />

          <Acc onClick={() => window.open(URL_FORMACION, '_blank', 'noopener,noreferrer')}
            img="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000"
            badge="🎓 Academia" badgeClass="stock"
            titulo="Formación" desc="Accede a los módulos, vídeos y masterclases de la academia."
            icon={<GraduationCap size={16} />} externo />

          <Acc onClick={() => router.push('/recursos')}
            img="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000"
            badge="⬡ Guía práctica" badgeClass="stock"
            titulo="Recursos" desc="Plantillas, documentos y herramientas para ejecutar cada paso."
            icon={<FolderOpen size={16} />} />

          <Acc onClick={() => window.open(URL_NEXOCAR, '_blank', 'noopener,noreferrer')}
            img="https://images.unsplash.com/photo-1611859266238-4b98091d9d9b?w=1000"
            badge="↗ Herramienta" badgeClass="stock"
            titulo="NEXOCAR" desc="Calcula importaciones y analiza la rentabilidad de cada coche."
            icon={<Gauge size={16} />} externo />
        </div>

        {/* stats */}
        <div style={S.quick}>
          <Kpi l="Leads disponibles" v={stats.leadsDisp} />
          <Kpi l="Tus clientes activos" v={stats.misClientes} />
          {(esVip || esAdmin) && <Kpi l="Operaciones VIP" v={stats.opsVip} />}
          {(esVip || esAdmin) && <Kpi l="Tu inversión activa" v={eur(stats.inversionActiva)} gold />}
        </div>
      </div>
      <BottomNav perfil={perfil} activa="inicio" />
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
          <h2 className="display" style={{ fontSize: 23, color: '#fff' }}>{titulo}</h2>
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
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 },
  quick: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginTop: 26 },
};
