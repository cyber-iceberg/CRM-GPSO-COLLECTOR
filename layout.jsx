// =====================================================================
//  GPSO COLLECTOR · Root layout  ·  app/layout.jsx
//  - Importa el design system (globals.css)
//  - Script anti-parpadeo: fija el tema ANTES de pintar (sin FOUC)
//  - Botón de tema flotante disponible en toda la app
// =====================================================================

import './globals.css';
import ThemeToggle from './components/ThemeToggle';

export const metadata = {
  title: 'GPSO Collector · Central de Leads',
  description: 'Reserva y gestiona tus clientes de importación.',
};

// Se ejecuta antes de pintar nada: lee el tema guardado y lo aplica.
// Evita el "flash" de tema equivocado al cargar.
const scriptAntiParpadeo = `
(function(){
  try {
    var t = localStorage.getItem('gpso-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptAntiParpadeo }} />
      </head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
