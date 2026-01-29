// Archivo: netlify/functions/chat.js

export default async (req, context) => {
  // 1. Buscamos la llave en Netlify
  const apiKey = Netlify.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Falta la API Key" }), { status: 500 });
  }

  try {
    // 2. Leemos el mensaje del usuario
    const body = req.body ? await req.json() : {};
    const userMessage = body.prompt || "Hola";

    // 3. Preparamos la conexión con Google Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{ text: userMessage }]
      }]
    };

    // 4. Conectamos con Google
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 5. Devolvemos la respuesta a tu App
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};