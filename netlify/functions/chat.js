exports.handler = async (event, context) => {
  // Configuración de permisos (CORS) para Netlify
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Responder a la verificación del navegador
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Obtener la llave segura desde Netlify
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Falta la API Key en Netlify" }) };
  }

  try {
    // 2. Procesar la solicitud
    const { prompt } = JSON.parse(event.body);

    // 3. Llamar a Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt || "Hello" }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.9 }
      })
    });

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};