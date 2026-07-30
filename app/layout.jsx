// =====================================================================
//  GPSO COLLECTOR · Root layout  ·  app/layout.jsx
//  Tema CLARO por defecto (con opcion de oscuro). Script anti-parpadeo.
// =====================================================================

import './globals.css';
import ThemeToggle from './components/ThemeToggle';

export const metadata = {
  title: 'GPSO Collector · Central de Leads',
  description: 'Reserva y gestiona tus clientes de importación.',
};

const scriptAntiParpadeo = `
(function(){
  try {
    var t = localStorage.getItem('gpso-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
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
