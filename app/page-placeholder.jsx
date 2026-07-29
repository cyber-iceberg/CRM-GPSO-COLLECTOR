// =====================================================================
//  GPSO COLLECTOR · Home provisional  ·  app/page.jsx
//  Solo para el PRIMER deploy verde. En la Fase 2 la sustituimos por
//  el catálogo real conectado a Supabase.
// =====================================================================

import Link from 'next/link';

export default function Home() {
  return (
    <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="caja" style={{ maxWidth: 420, textAlign: 'center', padding: 30 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, background: 'var(--de-line)',
          display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17, color: '#000',
          margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(221,0,0,.3)',
        }}>GP</div>

        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
          GPSO <span style={{ color: 'var(--red)' }}>COLLECTOR</span>
        </h1>
        <div className="texto-alemania" style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, marginBottom: 18 }}>
          CENTRAL DE LEADS
        </div>
        <div className="de-line" style={{ margin: '0 auto 20px', maxWidth: 120 }} />

        <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Proyecto en marcha. Pronto podrás reservar y gestionar tus clientes de importación desde aquí.
        </p>

        <Link href="/login" className="btn-de" style={{ display: 'inline-flex', width: '100%' }}>
          Acceder
        </Link>
      </div>
    </div>
  );
}
