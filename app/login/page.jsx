'use client';

// =====================================================================
//  GPSO COLLECTOR · LOGIN  ·  app/login/page.jsx  (v4)
//  Logo UNIFICADO dentro de la tarjeta. Tema claro por defecto.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const LOGO = '/collector.jpg'; // sube tu logo a public/collector.jpg

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function submit() {
    setError(''); setOk('');
    if (!email || !pass) { setError('Rellena email y contraseña.'); return; }
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
        setOk('Cuenta creada. Un admin la activará antes de que puedas coger leads.');
        setModo('login');
      }
    } catch (e) { setError(traducir(e.message)); }
    finally { setCargando(false); }
  }
  function traducir(msg) {
    if (!msg) return 'Algo ha fallado. Inténtalo de nuevo.';
    if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.';
    if (msg.includes('already registered')) return 'Ese email ya tiene cuenta.';
    if (msg.includes('Email not confirmed')) return 'Email sin confirmar. Avisa al admin.';
    if (msg.includes('at least 6')) return 'La contraseña necesita al menos 6 caracteres.';
    return msg;
  }

  return (
    <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 400, overflow: 'hidden' }}>

        {/* CABECERA UNIFICADA: logo + tagline dentro de la misma tarjeta */}
        <div style={{ textAlign: 'center', padding: '32px 26px 20px' }}>
          <div className="hero-logo" style={{ width: 88, height: 88, borderRadius: 20 }}>
            <img src={LOGO} alt="GPSO Collector" />
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 12 }}>
            Central de Leads
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--card-bd)' }} />

        {/* FORMULARIO */}
        <div style={{ padding: '22px 26px 26px' }}>
          <div className="seg" style={{ display: 'flex', width: '100%', marginBottom: 18 }}>
            <button className={`seg-btn ${modo === 'login' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setModo('login'); setError(''); setOk(''); }}>Entrar</button>
            <button className={`seg-btn ${modo === 'registro' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setModo('registro'); setError(''); setOk(''); }}>Crear cuenta</button>
          </div>

          {modo === 'registro' && (
            <div style={{ marginBottom: 12 }}>
              <label className="etiqueta">Nombre</label>
              <input className="campo" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label className="etiqueta">Email</label>
            <input className="campo" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@email.com" autoComplete="email" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="etiqueta">Contraseña</label>
            <input className="campo" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          {error && <div className="aviso error" style={{ marginTop: 4 }}>{error}</div>}
          {ok && <div className="aviso ok" style={{ marginTop: 4 }}>{ok}</div>}

          <button className="btn-de" disabled={cargando} onClick={submit} style={{ width: '100%', marginTop: 16, fontSize: 14 }}>
            {cargando ? 'Un momento…' : (modo === 'login' ? 'ENTRAR' : 'CREAR CUENTA')}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--gray-mid)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Acceso exclusivo para alumnos de la formación GPSO Collector.
          </p>
        </div>
      </div>
    </div>
  );
}
