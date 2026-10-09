'use client';

// =====================================================================
//  GPSO COLLECTOR · HOME / Dashboard (cliente)  ·  app/HomeClient.jsx
//  Saludo + 7 accesos (Central, Peritación, VIP, Subir unidades,
//  Formación, Recursos, NEXOCAR) + stats + menú.
//  + Tutorial interactivo del panel (GuiaTour).
// =====================================================================

import { useRouter } from 'next/navigation';
import MenuDrawer from './components/MenuDrawer';
import BottomNav from './components/BottomNav';
import GuiaTour, { BotonGuia, useGuia } from './components/GuiaTour';
import { Target, Gem, UploadCloud, ArrowRight, GraduationCap, FolderOpen, Gauge, ClipboardCheck } from 'lucide-react';

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

  const guia = useGuia('hub-v1');

  // ---- Pasos del tutorial del panel (qué es cada herramienta) ----
  const pasosHub = [
    { seccion: 'Tu panel', titulo: `Hola, ${nombre}. Este es tu panel.`,
      texto: 'Desde aquí entras a todo. Te enseño en 30 segundos para qué sirve cada herramienta. Usa <b>Siguiente</b> o las flechas.' },
    { sel: '[data-tour="t-central"]', seccion: 'Herramienta', titulo: 'Central de Leads',
      texto: 'El corazón de todo. Llegan en tiempo real personas que quieren comprar o importar un coche: las <b>reservas</b>, las <b>contactas</b> y <b>cierras</b> la venta.' },
    { sel: '[data-tour="t-peritacion"]', seccion: 'Herramienta', titulo: 'Peritación',
      texto: 'Inspecciona la unidad <b>paso a paso</b>: 140 puntos (documentación, chapa, motor, prueba en marcha…), espesómetro, ruedas e <b>informe final con semáforo</b>. Para no comprar a ciegas.' },
    ...((esVip || esAdmin) ? [{ sel: '[data-tour="t-vip"]', seccion: 'Herramienta', titulo: 'Inversión VIP',
      texto: 'Coinvierte con nosotros en coches de alta gama seleccionados por Collector. Exclusivo para miembros <b style="color:var(--gold)">VIP</b>.' }] : []),
    { sel: '[data-tour="t-stock"]', seccion: 'Herramienta', titulo: 'Subir unidades',
      texto: '¿Tienes un coche para vender? Súbelo y lo <b>gestionamos en venta</b> desde nuestro stock. Se abre en la plataforma de stock.' },
    { sel: '[data-tour="t-formacion"]', seccion: 'Herramienta', titulo: 'Formación',
      texto: 'Todos los <b>módulos, vídeos y masterclasses</b> de la academia. Aquí está el conocimiento paso a paso.' },
    { sel: '[data-tour="t-recursos"]', seccion: 'Herramienta', titulo: 'Recursos',
      texto: 'Tu caja de herramientas: <b>plantillas, contratos, contactos</b> (gestorías, transporte…) y datos clave para ejecutar cada paso.' },
    { sel: '[data-tour="t-nexocar"]', seccion: 'Herramienta', titulo: 'NEXOCAR',
      texto: 'Calcula una importación de principio a fin y mira la <b>rentabilidad real</b> de cada coche antes de comprarlo.' },
    { sel: '[data-tour="t-stats"]', seccion: 'Resumen', titulo: 'Tu resumen de un vistazo',
      texto: 'Leads disponibles ahora, tus clientes activos, unidades peritadas y, si eres VIP, tus operaciones e inversión en marcha.' },
    { seccion: 'Listo', titulo: 'Ya conoces tu panel',
      texto: 'Empieza por la <b>Central de Leads</b>. Puedes volver a ver este tutorial cuando quieras con <b style="color:var(--gold)">¿Cómo funciona?</b>' },
  ];

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
          <div style={{ marginTop: 14 }}><BotonGuia onClick={guia.abrir} texto="¿Cómo funciona la plataforma?" /></div>
        </div>

        {/* accesos */}
        <div style={S.cards}>
          <Acc onClick={() => router.push('/central')} tour="t-central"
            img="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000"
            badge="● Leads en directo" badgeClass="leads"
            titulo="Central de Leads" desc="Reserva y gestiona tus clientes de importación en tiempo real."
            icon={<Target size={16} />} />

          {/* NUEVO · sube una foto a public/peritacion.jpg (un coche en un taller
              o alguien revisando bajos funciona bien). Mientras no exista, la
              tarjeta se ve con el degradado sin imagen: no rompe nada. */}
          <Acc onClick={() => router.push('/peritacion')} tour="t-peritacion"
            img="/peritacion.jpg"
            badge="⬢ Inspección guiada" badgeClass="perito"
            titulo="Peritación" desc="Revisa la unidad paso a paso y sabe si hay algo de lo que preocuparse."
            icon={<ClipboardCheck size={16} />} />

          {(esVip || esAdmin) && (
            <Acc onClick={() => router.push('/vip')} tour="t-vip"
              img="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000"
              badge="◆ Exclusivo" badgeClass="vip"
              titulo="Inversión VIP" desc="Coinversión en coches de alta gama seleccionados por Collector."
              icon={<Gem size={16} />} />
          )}

          <Acc onClick={() => window.open(URL_STOCK, '_blank', 'noopener,noreferrer')} tour="t-stock"
            img="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000"
            badge="↗ Cesión de venta" badgeClass="stock"
            titulo="Subir unidades" desc="Sube tu coche y lo gestionamos en venta desde nuestro stock."
            icon={<UploadCloud size={16} />} externo />

          <Acc onClick={() => window.open(URL_FORMACION, '_blank', 'noopener,noreferrer')} tour="t-formacion"
          img="/formacion.jpg"
            badge="🎓 Academia" badgeClass="stock"
            titulo="Formación" desc="Accede a los módulos, vídeos y masterclases de la academia."
            icon={<GraduationCap size={16} />} externo />

          <Acc onClick={() => router.push('/recursos')} tour="t-recursos"
            img="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1000"
            badge="⬡ Guía práctica" badgeClass="stock"
            titulo="Recursos" desc="Plantillas, documentos y herramientas para ejecutar cada paso."
            icon={<FolderOpen size={16} />} />

          <Acc onClick={() => window.open(URL_NEXOCAR, '_blank', 'noopener,noreferrer')} tour="t-nexocar"
            img="https://images.unsplash.com/photo-1611859266238-4b98091d9d9b?w=1000"
            badge="↗ Herramienta" badgeClass="stock"
            titulo="NEXOCAR" desc="Calcula importaciones y analiza la rentabilidad de cada coche."
            icon={<Gauge size={16} />} externo />
        </div>

        {/* stats */}
        <div data-tour="t-stats" style={S.quick}>
          <Kpi l="Leads disponibles" v={stats.leadsDisp} />
          <Kpi l="Tus clientes activos" v={stats.misClientes} />
          {stats.peritaciones != null && <Kpi l="Unidades peritadas" v={stats.peritaciones} />}
          {(esVip || esAdmin) && <Kpi l="Operaciones VIP" v={stats.opsVip} />}
          {(esVip || esAdmin) && <Kpi l="Tu inversión activa" v={eur(stats.inversionActiva)} gold />}
        </div>
      </div>
      <GuiaTour run={guia.run} steps={pasosHub} onClose={guia.cerrar} />
      <BottomNav perfil={perfil} activa="inicio" />
    </div>
  );
}

function Acc({ onClick, img, badge, badgeClass, titulo, desc, icon, externo, tour }) {
  return (
    <div className="acc-card" data-tour={tour} onClick={onClick}>
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
