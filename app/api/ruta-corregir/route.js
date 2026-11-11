// =====================================================================
//  LA RUTA · Corrección de ejercicios de pensar con IA (Claude API)
//  Ponlo en:  app/api/ruta-corregir/route.js
//  Necesita la variable de entorno:  ANTHROPIC_API_KEY
//  (En Vercel: Settings → Environment Variables → ANTHROPIC_API_KEY)
// =====================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Modelo de Claude. Puedes cambiarlo por otro de tu cuenta si quieres.
const MODELO = 'claude-3-5-sonnet-20241022';

export async function POST(req) {
  try {
    const { pregunta, criterio, respuesta } = await req.json();

    if (!respuesta || String(respuesta).trim().length < 5) {
      return Response.json({ apto: false, nota: 0, feedback: 'Escribe una respuesta más completa para poder evaluarla.' });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      // Sin clave: deja el ejercicio pendiente (no bloquea el resto).
      return Response.json({ apto: null, nota: null, pendiente: true,
        feedback: 'La corrección automática por IA aún no está configurada. Tu respuesta queda registrada para revisión.' });
    }

    const system =
      'Eres el evaluador de una academia de importación de coches. Corriges la respuesta de un alumno a un ejercicio de pensar. ' +
      'Evalúa SOLO según el criterio dado, con tono constructivo y cercano. No seas ni demasiado duro ni regalado. ' +
      'Responde EXCLUSIVAMENTE con un JSON válido, sin texto alrededor: ' +
      '{"apto": boolean, "nota": number (0-100), "feedback": "2-3 frases en español, qué está bien y qué mejorar"}. ' +
      'apto = true si la nota es 60 o más.';

    const user =
      `PREGUNTA:\n${pregunta}\n\n` +
      `CRITERIO DE CORRECCIÓN (lo que debe demostrar una buena respuesta):\n${criterio}\n\n` +
      `RESPUESTA DEL ALUMNO:\n${respuesta}\n\n` +
      'Evalúa y responde solo con el JSON.';

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODELO, max_tokens: 500, system, messages: [{ role: 'user', content: user }] }),
    });

    if (!r.ok) {
      return Response.json({ apto: false, nota: 0, feedback: 'No se pudo evaluar ahora mismo. Inténtalo de nuevo en un momento.' });
    }

    const data = await r.json();
    const txt = (data?.content?.[0]?.text) || '';
    let out;
    try { out = JSON.parse(txt.match(/\{[\s\S]*\}/)[0]); }
    catch { out = { apto: false, nota: 0, feedback: 'No se pudo interpretar la corrección. Reformula tu respuesta e inténtalo de nuevo.' }; }

    // normaliza
    out.nota = Math.max(0, Math.min(100, Number(out.nota) || 0));
    out.apto = out.apto === true || out.nota >= 60;
    out.feedback = String(out.feedback || '').slice(0, 600);
    return Response.json(out);

  } catch (e) {
    return Response.json({ apto: false, nota: 0, feedback: 'Error de corrección. Inténtalo de nuevo.' }, { status: 200 });
  }
}
