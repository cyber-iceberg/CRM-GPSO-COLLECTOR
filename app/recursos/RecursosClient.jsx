'use client';

// =====================================================================
//  GPSO COLLECTOR · Recursos (cliente)  ·  app/recursos/RecursosClient.jsx
//  Categorías: Números · PDFs · Contactos · Contratos.
//  Contenido de ejemplo -> se irá rellenando. Estructura lista para
//  conectar a base de datos o editar a mano.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuDrawer from '../components/MenuDrawer';
import {
  ArrowLeft, Hash, FileText, Contact, FileSignature, Search,
  Download, ExternalLink, Copy, Check
} from 'lucide-react';

// ---------------------------------------------------------------------
//  CONTENIDO · edita aquí para añadir/quitar recursos (de momento a mano)
// ---------------------------------------------------------------------
const RECURSOS = {
  numeros: [
    { titulo: 'IEDMT — CO2 ≤120g', valor: 'Exento', nota: 'Impuesto de matriculación' },
    { titulo: 'IEDMT — CO2 121-159g', valor: '4,75%' },
    { titulo: 'IEDMT — CO2 160-199g', valor: '9,75%' },
    { titulo: 'IEDMT — CO2 >199g', valor: '14,75%' },
    { titulo: 'IVA importación', valor: '21%' },
  ],
  pdfs: [
    { titulo: 'Guía de importación (ejemplo)', desc: 'Proceso paso a paso', url: '#' },
    { titulo: 'Checklist de inspección', desc: 'Antes de comprar', url: '#' },
  ],
  contactos: [
    { titulo: 'Transportista de confianza', desc: 'Alemania → España', valor: '+34 600 000 000' },
    { titulo: 'Gestoría matriculaciones', desc: 'Trámites ITV/DGT', valor: 'gestoria@ejemplo.com' },
  ],
  contratos: [
    { titulo: 'Contrato de depósito / venta', desc: 'Plantilla intermediación', url: '#' },
    { titulo: 'Autorización de transporte', desc: 'Bilingüe ES/DE', url: '#' },
  ],
};

const CATS = [
  { id: 'numeros', label: 'Números', icon: <Hash size={16} />, desc: 'Impuestos, umbrales y datos clave' },
  { id: 'pdfs', label: 'PDFs', icon: <FileText size={16} />, desc: 'Guías y documentos descargables' },
  { id: 'contactos', label: 'Contactos', icon: <Contact size={16} />, desc: 'Colaboradores y proveedores' },
  { id: 'contratos', label: 'Contratos', icon: <FileSignature size={16} />, desc: 'Plantillas legales' },
];

export default function RecursosClient({ email, perfil }) {
  const router = useRouter();
  const [cat, setCat] = useState('numeros');
  const [q, setQ] = useState('');
  const [copiado, setCopiado] = useState(null);

  function copiar(txt, id) {
    navigator.clipboard?.writeText(txt);
    setCopiado(id); setTimeout(() => setCopiado(null), 1500);
  }

  const items = (RECURSOS[cat] || []).filter(r =>
    !q || (r.titulo + ' ' + (r.desc || '') + ' ' + (r.valor || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="gpso-bg" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '22px 22px 60px' }}>

        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-ghost" onClick={() => router.push('/')} style={{ padding: '10px 12px' }} title="Volver"><ArrowLeft size={16} /></button>
            <div>
              <h1 className="display" style={{ fontSize: 22 }}>Recursos</h1>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--gray-mid)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Todo a mano</div>
            </div>
          </div>
          <MenuDrawer perfil={perfil} email={email} />
        </div>

        {/* categorías */}
        <div style={S.cats}>
          {CATS.map(c => (
            <button key={c.id} className={`glass rec-cat ${cat === c.id ? 'on' : ''}`} onClick={() => { setCat(c.id); setQ(''); }}>
              <span className="rec-cat-ico">{c.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-mid)' }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* buscador */}
        <div style={{ position: 'relative', maxWidth: 380, margin: '22px 0 18px' }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-mid)' }} />
          <input className="campo" placeholder="Buscar en esta categoría…" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>

        {/* items */}
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((r, k) => (
            <div key={k} className="glass" style={S.item}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.titulo}</div>
                {r.desc && <div style={{ fontSize: 12.5, color: 'var(--gray-mid)', marginTop: 2 }}>{r.desc}</div>}
                {r.valor && <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red-soft)', marginTop: 4, fontFamily: 'Bricolage Grotesque' }}>{r.valor}</div>}
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '9px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {r.url.match(/\.pdf|drive|docs/) ? <><Download size={14} /> Abrir</> : <><ExternalLink size={14} /> Ver</>}
                </a>
              )}
              {r.valor && (r.valor.includes('@') || r.valor.match(/\d{6,}/)) && (
                <button className="btn-ghost" onClick={() => copiar(r.valor, k)} style={{ padding: '9px 12px' }} title="Copiar">
                  {copiado === k ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--gray-mid)', fontSize: 14 }}>
              Nada por aquí todavía. Se irá llenando pronto.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  cats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 },
  item: { display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', flexWrap: 'wrap' },
};
