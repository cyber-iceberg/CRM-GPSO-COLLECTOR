'use client';

// =====================================================================
//  GPSO COLLECTOR · LOGIN  ·  app/login/page.jsx  (v6)
//  v6: Panel de BIENVENIDA para nuevos miembros — les explica que el
//      siguiente paso es crear cuenta y que usen el MISMO email de la
//      formación en vídeo para que el acceso se active más rápido.
//      Incluye atajo directo a la pestaña "Crear cuenta".
//  v5.1: botón ENTRAR con degradado rojo (el token --btn-grad salía blanco).
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const LOGO = '/collector.jpg'; // sube tu logo a public/collector.jpg
// Degradado rojo del botón (fijo aquí para no depender del tema).
const GRAD_ROJO = 'linear-gradient(100deg, #1a1212 0%, #3a1414 52%, #C61A1A 100%)';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [cargando, setCargando] = useState(false);
  const [entrando, setEntrando] = useState(false); // overlay a pantalla completa
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
        // login correcto: mostramos overlay y NO quitamos el cargando,
        // así no hay hueco en blanco mientras carga la home.
        setEntrando(true);
        router.push('/'); router.refresh();
        return; // dejamos el overlay puesto hasta que la home tome el control
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { nombre } } });
        if (error) throw error;
        setOk('Cuenta creada. Un admin la activará antes de que puedas coger leads.');
        setModo('login');
        setCargando(false);
      }
    } catch (e) {
      setError(traducir(e.message));
      setCargando(false);
      setEntrando(false);
    }
  }
  function traducir(msg) {
    if (!msg) return 'Algo ha fallado. Inténtalo de nuevo.';
    if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.';
    if (msg.includes('already registered')) return 'Ese email ya tiene cuenta. Prueba a entrar.';
    if (msg.includes('Email not confirmed')) return 'Email sin confirmar. Avisa al admin.';
    if (msg.includes('at least 6')) return 'La contraseña necesita al menos 6 caracteres.';
    return msg;
  }

  // estilo de pestaña activa (rojo) para que no salga blanca
  const segActivo = { background: GRAD_ROJO, color: '#fff' };

  return (
    <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>

      {/* OVERLAY "ENTRANDO…" a pantalla completa */}
      {entrando && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(8,6,9,.92)', backdropFilter: 'blur(6px)',
          display: 'grid', placeItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-gpso" />
            <div style={{ marginTop: 18, fontWeight: 700, fontSize: 16, color: '#f4f4f4' }}>Entrando…</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: '#8a8a8a' }}>Preparando tu Central</div>
          </div>
        </div>
      )}

      <div className="glass" style={{ width: '100%', maxWidth: 400, overflow: 'hidden' }}>

        <div style={{ textAlign: 'center', padding: '32px 26px 20px' }}>
          <div className="hero-logo" style={{ width: 88, height: 88, borderRadius: 20 }}>
            <img src={LOGO} alt="GPSO Collector" />
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 12 }}>
            Central de Clientes
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--card-bd)' }} />

        {/* ===== BIENVENIDA · NUEVOS MIEMBROS ===== */}
        <div style={{
          margin: '18px 26px 0',
          padding: '14px 16px',
          borderRadius: 14,
          border: '1px solid rgba(201,161,77,.34)',
          background: 'linear-gradient(180deg, rgba(201,161,77,.11), rgba(201,161,77,.025))',
          boxShadow: 'inset 0 1px 0 rgba(255,240,205,.07)'
        }}>
          <div style={{
            fontSize: 12.5, fontWeight: 800, letterSpacing: .4,
            color: '#e3c987', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase'
          }}>
            <span style={{ fontSize: 13 }}>✦</span> Bienvenido a tu Central
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.62, color: '#c7bfb0' }}>
            ¿Es tu primera vez? Tu siguiente paso es <b style={{ color: '#e7ddc8' }}>crear tu cuenta</b>.
            Usa <b style={{ color: '#e7ddc8' }}>el mismo email</b> con el que te registraste en la formación
            en vídeo y tu acceso se activará mucho más rápido. Créala y descubre lo que te espera dentro.
          </div>
          {modo === 'login' && (
            <button
              onClick={() => { setModo('registro'); setError(''); setOk(''); }}
              style={{
                marginTop: 11, background: 'none', border: 'none', cursor: 'pointer',
                color: '#e3c987', fontWeight: 700, fontSize: 12.5, padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
              Crear mi cuenta ahora →
            </button>
          )}
        </div>

        <div style={{ padding: '18px 26px 26px' }}>
          <div className="seg" style={{ display: 'flex', width: '100%', marginBottom: 18 }}>
            <button className={`seg-btn ${modo === 'login' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', ...(modo === 'login' ? segActivo : {}) }}
              onClick={() => { setModo('login'); setError(''); setOk(''); }}>Entrar</button>
            <button className={`seg-btn ${modo === 'registro' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center', ...(modo === 'registro' ? segActivo : {}) }}
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
            {modo === 'registro' && (
              <div style={{ fontSize: 11, color: 'var(--gray-mid)', marginTop: 5, lineHeight: 1.4 }}>
                El mismo que usaste en la formación en vídeo.
              </div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="etiqueta">Contraseña</label>
            <input className="campo" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          {error && <div className="aviso error" style={{ marginTop: 4 }}>{error}</div>}
          {ok && <div className="aviso ok" style={{ marginTop: 4 }}>{ok}</div>}

          <button className="btn-de" disabled={cargando} onClick={submit}
            style={{ width: '100%', marginTop: 16, fontSize: 14, background: GRAD_ROJO, color: '#fff' }}>
            {cargando
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="spinner-mini" /> {modo === 'login' ? 'ENTRANDO…' : 'CREANDO…'}</span>
              : (modo === 'login' ? 'ENTRAR' : 'CREAR CUENTA')}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--gray-mid)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Acceso exclusivo para alumnos de la formación GPSO Collector.
          </p>
        </div>
      </div>
    </div>
  );
}
