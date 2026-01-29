// Archivo: api/chat.js
export default async function handler(req, res) {
  // 1. Configurar CORS (por seguridad estándar)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar pre-flight request (necesario para navegadores)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Verificación de seguridad
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta la API Key en Vercel" });
  }

  try {
    // 3. Obtener el prompt (Vercel ya nos da el body parseado)
    const { prompt } = req.body || {};
    const message = prompt || "Hello";

    // 4. Configuración para Google Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.9
      }
    };

    // 5. Llamada a Google
    const googleResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!googleResponse.ok) {
       const errorData = await googleResponse.text();
       return res.status(googleResponse.status).json({ error: "Error en Google", details: errorData });
    }

    const data = await googleResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error en Vercel Function:", error);
    return res.status(500).json({ error: error.message });
  }
}