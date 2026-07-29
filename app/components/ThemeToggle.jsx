'use client';

// =====================================================================
//  GPSO COLLECTOR · Botón de tema claro/oscuro
//  app/components/ThemeToggle.jsx
//  Guarda la elección en localStorage y la aplica a <html data-theme>.
// =====================================================================

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [tema, setTema] = useState('dark');

  useEffect(() => {
    const actual = document.documentElement.getAttribute('data-theme') || 'dark';
    setTema(actual);
  }, []);

  function cambiar() {
    const nuevo = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevo);
    document.documentElement.setAttribute('data-theme', nuevo);
    try { localStorage.setItem('gpso-theme', nuevo); } catch (e) {}
  }

  const esOscuro = tema === 'dark';

  return (
    <button
      className="theme-toggle"
      onClick={cambiar}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
    >
      {esOscuro ? (
        // Sol → estás en oscuro, pulsa para ir a claro
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" /><line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
          <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" /><line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
        </svg>
      ) : (
        // Luna → estás en claro, pulsa para ir a oscuro
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
