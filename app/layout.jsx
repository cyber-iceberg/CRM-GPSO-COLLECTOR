// =====================================================================
//  GPSO COLLECTOR · Root layout  ·  app/layout.jsx
//  Tema CLARO por defecto (con opcion de oscuro). Script anti-parpadeo.
//  Fuentes precargadas con next/font (elimina el FOUC).
// =====================================================================
import { Cormorant_Garamond, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ThemeToggle from './components/ThemeToggle';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'GPSO Collector · Central de Leads',
  description: 'Reserva y gestiona tus clientes de importación.',
  icons: {
    icon: '/collector.jpg',
    shortcut: '/collector.jpg',
    apple: '/collector.jpg',
  },
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
    <html
      lang="es"
      data-theme="light"
      className={`${cormorant.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
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
