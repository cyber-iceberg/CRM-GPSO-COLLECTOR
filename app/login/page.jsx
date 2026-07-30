'use client';

// =====================================================================
//  GPSO COLLECTOR · LOGIN  ·  app/login/page.jsx  (v2 — marca premium)
//  Logo tipografico "gpso collector.", botones rojo->dorado.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo]         = useState('login');
  const [nombre, setNombre]     = useState('');
  const [email, setEmail]       = useState('');
  const [pass, setPass]         = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');
  const [ok, setOk]             = useState('');

  async function submit() {
    setError(''); setOk('');
    if (!email || !pass) { setError('Rellena email y contrasena.'); return; }
    if (modo === 'registro' && !nombre) { setError('Dinos tu nombre.'); return; }
    setCargando(true);
    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        router.push('/'); router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { nombre } } });
        if (error) throw error;
        setOk('Cuenta creada. Un admin la activara antes de que puedas coger leads.');
        setModo('login');
      }
    } catch (e) { setError(traducir(e.message)); }
    finally { setCargando(false); }
  }

  function traducir(msg) {
    if (!msg) return 'Algo ha fallado. Intentalo de nuevo.';
    if (msg.includes('Invalid login')) return 'Email o contrasena incorrectos.';
    if (msg.includes('already registered')) return 'Ese email ya tiene cuenta.';
    if (msg.includes('Email not confirmed')) return 'Email sin confirmar. Avisa al admin.';
    if (msg.includes('at least 6')) return 'La contrasena necesita al menos 6 caracteres.';
    return msg;
  }

  return (
    <div className="gpso-bg" style={S.wrap}>
      <div className="caja" style={S.card}>
        {/* Logo tipografico */}
        <div className="marca" style={{ fontSize: 30, marginBottom: 4 }}>
          gpso<span className="low">collector<span className="dot">.</span></span>
        </div>
        <div style={S.tagline}>CENTRAL DE LEADS</div>
        <div className="de-line" style={{ margin: '14px 0 20px' }} />

        <div style={S.switch}>
          <button onClick={() => { setModo('login'); setError(''); setOk(''); }}
            style={{ ...S.switchBtn, ...(modo === 'login' ? S.switchActive : {}) }}>Entrar</button>
          <button onClick={() => { setModo('registro'); setError(''); setOk(''); }}
            style={{ ...S.switchBtn, ...(modo === 'registro' ? S.switchActive : {}) }}>Crear cuenta</button>
        </div>

        {modo === 'registro' && (
          <div style={S.field}>
            <label className="etiqueta">Nombre</label>
            <input className="campo" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
          </div>
        )}
        <div style={S.field}>
          <label className="etiqueta">Email</label>
          <input className="campo" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tucorreo@email.com" autoComplete="email" />
        </div>
        <div style={S.field}>
          <label className="etiqueta">Contrasena</label>
          <input className="campo" type="password" value={pass} onChange={e => setPass(e.target.value)}
            placeholder="********" autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {error && <div className="aviso error" style={{ marginTop: 4 }}>{error}</div>}
        {ok && <div className="aviso ok" style={{ marginTop: 4 }}>{ok}</div>}

        <button className="btn-de" disabled={cargando} onClick={submit} style={{ width: '100%', marginTop: 16, fontSize: 14 }}>
          {cargando ? 'Un momento...' : (modo === 'login' ? 'ENTRAR' : 'CREAR CUENTA')}
        </button>

        <p style={S.pie}>Acceso exclusivo para alumnos de la formacion GPSO Collector.</p>
      </div>
    </div>
  );
}

const S = {
  wrap: { display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 },
  card: { width: '100%', maxWidth: 400, padding: 28 },
  tagline: { fontSize: 11, letterSpacing: 3, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase' },
  switch: { display: 'flex', gap: 6, marginBottom: 18, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 },
  switchBtn: { flex: 1, background: 'transparent', border: 'none', color: 'var(--gray-mid)', fontWeight: 600, fontSize: 13.5, padding: '8px', borderRadius: 7, cursor: 'pointer' },
  switchActive: { background: 'var(--red)', color: '#fff' },
  field: { marginBottom: 12 },
  pie: { fontSize: 11.5, color: 'var(--gray-mid)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 },
};
