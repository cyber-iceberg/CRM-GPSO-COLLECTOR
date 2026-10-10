'use client';

// =====================================================================
//  GPSO COLLECTOR · NodoVisual  ·  app/components/NodoVisual.jsx
//  El "orbe" de las constelaciones (Fiscalidad, Operativa, futuras).
//  Estilo: PERLA DE ORO PULIDO. Para cambiar el look de TODOS los nodos
//  de todas las páginas, se edita SOLO este archivo.
//
//  USO (dentro de un botón .nodo):
//    import NodoVisual from '../../components/NodoVisual';
//    <NodoVisual tono="oro" cerrado={tieneHijosOcultos} />
//
//  tono:    'oro' (conocimiento / contratos) | 'azul' (contactos)
//  cerrado: dibuja el aro punteado "tiene cosas dentro sin abrir"
//
//  El TAMAÑO lo decide la clase del botón padre .nodo:
//    .nodo.raiz → grande · .nodo.caso → mediano · .nodo.comp → mediano+
//    .nodo.sat  → pequeño (aro punteado, sin perla) · por defecto → base
//  Los estados hover / activo / dim ya vienen del .nodo padre.
// =====================================================================

export default function NodoVisual({ tono = 'oro', cerrado = false, className = '' }) {
  const cls = 'nv-orbe'
    + (tono === 'azul' ? ' azul' : '')
    + (cerrado ? ' cerrado' : '')
    + (className ? ' ' + className : '');
  return (
    <span className={cls} aria-hidden="true">
      <style jsx global>{`
        .nv-orbe{
          position:relative;width:32px;height:32px;border-radius:50%;flex:none;
          background:linear-gradient(165deg,#fff3cf 0%,#e3c987 28%,#8a6d2f 52%,#edd79c 74%,#6e5424 100%);
          box-shadow:
            0 0 16px rgba(201,161,77,.45), 0 0 44px rgba(201,161,77,.15),
            inset 0 1.5px 1.5px rgba(255,246,216,.65), inset 0 -3px 5px rgba(70,52,20,.55);
          transition:box-shadow .3s, transform .3s;
        }
        /* reflejo especular (brillo de perla) */
        .nv-orbe::before{
          content:'';position:absolute;top:13%;left:16%;width:46%;height:30%;border-radius:50%;
          background:radial-gradient(circle, rgba(255,255,255,.92) 0%, rgba(255,255,255,0) 68%);
          transform:rotate(-22deg);pointer-events:none;
        }
        /* -------- tono azul (contactos) -------- */
        .nv-orbe.azul{
          background:linear-gradient(165deg,#eaf2ff 0%,#9db4d6 28%,#3a5473 52%,#b9ceea 74%,#26384f 100%);
          box-shadow:
            0 0 16px rgba(127,166,216,.4), 0 0 44px rgba(127,166,216,.14),
            inset 0 1.5px 1.5px rgba(235,244,255,.65), inset 0 -3px 5px rgba(25,40,60,.55);
        }
        /* -------- aro "tiene hijos ocultos" -------- */
        .nv-orbe.cerrado::after{
          content:'';position:absolute;inset:-8px;border-radius:50%;
          border:1px dashed rgba(201,161,77,.55);animation:nvGirar 14s linear infinite;
        }
        .nv-orbe.azul.cerrado::after{border-color:rgba(127,166,216,.5)}
        @keyframes nvGirar{to{transform:rotate(360deg)}}

        /* -------- tamaños por rol (clase en el botón .nodo) -------- */
        .nodo.raiz .nv-orbe{width:48px;height:48px;animation:nvLatido 3.2s ease-in-out infinite}
        .nodo.caso .nv-orbe{width:40px;height:40px}
        .nodo.comp .nv-orbe{width:44px;height:44px;animation:nvLatido 2.6s ease-in-out infinite}
        @keyframes nvLatido{
          0%,100%{box-shadow:0 0 18px rgba(201,161,77,.5),0 0 50px rgba(201,161,77,.2),inset 0 1.5px 1.5px rgba(255,246,216,.65),inset 0 -3px 5px rgba(70,52,20,.55)}
          50%{box-shadow:0 0 30px rgba(201,161,77,.9),0 0 85px rgba(201,161,77,.36),inset 0 1.5px 1.5px rgba(255,246,216,.65),inset 0 -3px 5px rgba(70,52,20,.55)}
        }

        /* -------- satélite: aro punteado pequeño, sin perla -------- */
        .nodo.sat .nv-orbe{width:22px;height:22px;background:transparent;border:1.5px dashed rgba(201,161,77,.7);box-shadow:none}
        .nodo.sat .nv-orbe::before{display:none}
        .nodo.sat:hover .nv-orbe{box-shadow:0 0 16px rgba(201,161,77,.4)}

        /* -------- estados hover / activo -------- */
        .nodo:hover .nv-orbe{transform:scale(1.1);
          box-shadow:0 0 24px rgba(201,161,77,.8),0 0 70px rgba(201,161,77,.3),inset 0 1.5px 1.5px rgba(255,246,216,.75),inset 0 -3px 5px rgba(70,52,20,.5)}
        .nodo:hover .nv-orbe.azul{
          box-shadow:0 0 24px rgba(127,166,216,.7),0 0 60px rgba(127,166,216,.26),inset 0 1.5px 1.5px rgba(235,244,255,.75),inset 0 -3px 5px rgba(25,40,60,.5)}
        .nodo.activo .nv-orbe{
          box-shadow:0 0 28px rgba(240,226,182,.95),0 0 80px rgba(201,161,77,.42),inset 0 1.5px 1.5px rgba(255,246,216,.75),inset 0 -3px 5px rgba(70,52,20,.5)}
        .nodo.activo .nv-orbe.azul{
          box-shadow:0 0 28px rgba(205,224,243,.9),0 0 70px rgba(127,166,216,.4),inset 0 1.5px 1.5px rgba(235,244,255,.75),inset 0 -3px 5px rgba(25,40,60,.5)}

        @media (prefers-reduced-motion: reduce){
          .nodo.raiz .nv-orbe,.nodo.comp .nv-orbe{animation:none}
          .nv-orbe.cerrado::after{animation:none}
        }
      `}</style>
    </span>
  );
}
