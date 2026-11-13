'use client';

// =====================================================================
//  GPSO COLLECTOR · Nueva contraseña  ·  app/auth/nueva-contrasena/page.jsx
//  Sirve para las dos cosas:
//   · Recuperar: el alumno llega desde el enlace del email
//     ("¿Olvidaste tu contraseña?" en el login).
//   · Cambiar: el alumno ya ha entrado y viene desde el menú.
//  /auth es ruta pública en el middleware, así que no hace falta tocarlo.
// =====================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

const LOGO = '/collector.jpg';
const GRAD_ROJO = 'linear-gradient(100deg, #1a1212 0%, #3a1414 52%, #C61A1A 100%)';

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [estado, setEstado] = useState('comprobando'); // comprobando | listo | sin-sesion | hecho
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Al abrir: si viene del email, Supabase canjea el código del enlace por una
  // sesión temporal. Si ya había sesión (viene del menú), se usa esa.
  useEffect(() => {
    let vivo = true;
    (async () => {
      let { data: { session } } = await supabase.auth.getSession();
      const code = new URLSearchParams(window.location.search).get('code');
      if (!session && code) {
        const r = await supabase.auth.exchangeCodeForSession(code);
        session = r.data?.session || null;
      }
      if (!vivo) return;
      if (session) { setEmail(session.user?.email || ''); setEstado('listo'); }
      else setEstado('sin-sesion');
      // limpia el ?code de la barra de direcciones
      if (code) window.history.replaceState(null, '', window.location.pathname);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((ev, session) => {
      if ((ev === 'PASSWORD_RECOVERY' || ev === 'SIGNED_IN') && session && vivo) {
        setEmail(session.user?.email || ''); setEstado('listo');
      }
    });
    return () => { vivo = false; sub?.subscription?.unsubscribe(); };
  }, []);

  async function guardar() {
    setError('');
    if (pass.length < 6) { setError('La contraseña necesita al menos 6 caracteres.'); return; }
    if (pass !== pass2) { setError('Las dos contraseñas no coinciden.'); return; }
    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setCargando(false);
    if (error) {
      if (/different from the old|same/i.test(error.message)) setError('La nueva contraseña tiene que ser distinta de la anterior.');
      else if (/session|expired|missing/i.test(error.message)) setEstado('sin-sesion');
      else setError(error.message);
      return;
    }
    setEstado('hecho');
    setTimeout(() => { router.push('/'); router.refresh(); }, 1800);
  }

  return (
    <div className="gpso-bg" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 400, overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '30px 26px 18px' }}>
          <div className="hero-logo" style={{ width: 76, height: 76, borderRadius: 18 }}>
            <img src={LOGO} alt="GPSO Collector" />
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: 'var(--gray-mid)', textTransform: 'uppercase', marginTop: 12 }}>
            Central de Clientes
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--card-bd)' }} />

        <div style={{ padding: '22px 26px 26px' }}>
          {estado === 'comprobando' && (
            <div style={{ textAlign: 'center', padding: '18px 0' }}>
              <div className="spinner-gpso" />
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--gray-mid)' }}>Comprobando el enlace…</div>
            </div>
          )}

          {estado === 'sin-sesion' && (
            <>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f4f4f4' }}>El enlace no es válido</div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: '#c7bfb0', marginTop: 8 }}>
                Ha caducado, ya se usó o lo has abierto en un navegador distinto al que lo pidió.
                Pide uno nuevo desde el login y ábrelo en el mismo navegador.
              </p>
              <button className="btn-de" onClick={() => router.push('/login')}
                style={{ width: '100%', marginTop: 16, fontSize: 14, background: GRAD_ROJO, color: '#fff' }}>
                IR AL LOGIN
              </button>
            </>
          )}

          {estado === 'listo' && (
            <>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f4f4f4' }}>Crea tu nueva contraseña</div>
              {email && <div style={{ fontSize: 12.5, color: 'var(--gray-mid)', marginTop: 5 }}>Cuenta: <b style={{ color: '#e7ddc8' }}>{email}</b></div>}

              <div style={{ marginTop: 16, marginBottom: 12 }}>
                <label className="etiqueta">Nueva contraseña</label>
                <input className="campo" type={ver ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className="etiqueta">Repite la contraseña</label>
                <input className="campo" type={ver ? 'text' : 'password'} value={pass2} onChange={e => setPass2(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && guardar()} />
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--gray-mid)', cursor: 'pointer' }}>
                <input type="checkbox" checked={ver} onChange={e => setVer(e.target.checked)} /> Mostrar contraseña
              </label>

              {error && <div className="aviso error" style={{ marginTop: 12 }}>{error}</div>}

              <button className="btn-de" disabled={cargando} onClick={guardar}
                style={{ width: '100%', marginTop: 16, fontSize: 14, background: GRAD_ROJO, color: '#fff' }}>
                {cargando
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="spinner-mini" /> GUARDANDO…</span>
                  : 'GUARDAR CONTRASEÑA'}
              </button>
            </>
          )}

          {estado === 'hecho' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 30 }}>✓</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f4f4f4', marginTop: 6 }}>Contraseña actualizada</div>
              <div style={{ fontSize: 12.5, color: 'var(--gray-mid)', marginTop: 6 }}>Te llevamos a tu Central…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
