import { CEFRLevel, PracticeWord } from "../types";

const EMOJI_RULES = `
TABLA DE CONVERSIÓN (IPA -> EMOJIS):
1. /ʃ/ =shh
2. /ʒ/ =zhh
3. /tʃ/ =ch
4. /dʒ/ =y
5. /ɑː/ =😲
6. /ɑ̃/ =😲
7. /ʊ/ =😘
8. /ər/ =🤯
9. /j/ =😬
10. /ɪ/ =😑
11. /ə/ =😑
12. /ɔː/ =😑
13. /ʌ/ =😑
14. /ɛ/ =😑
15. /ɜ/ =😚
16. /ɝ/ =😚
17. /w/ =😚
18. /a/ =😍
19. /o/ =😗
20. /uː/ =uu
21. /u/ =u
22. /e/ =e
23. /iː/ =ii
24. /i/ =i
25. /ӕ/ =[😀+🤒]
26. /θ/ =😜
27. /ð/ =😜
28. /m/ =m
29. /p/ =p
30. /b/ =b
31. /t/ =t
32. /d/ =d
33. /f/ =f
34. /v/ =v
35. /k/ =k
36. /g/ =g
37. /s/ =s
38. /z/ =z
39. /h/ =h
40. /r/ =r
41. /l/ =l
42. /ŋ/ =ng
43. /n̩/ =n
44. /aɪ/ =[😍😑]
45. /aʊ/ =[😍😘]
46. /eɪ/ =[😄😑]
47. /ɔɪ/ =[😑😑]
48. /oʊ/ =[😗😘]
49. /ɔ/ =😑
50. /ˈ/ = ˈ
51. /ˌ/ = ˌ
52. /ɹ/ =r
`;

const INTONATION_RULES = `
Entonación: Use ━ for valleys (low pitch) and ⬆️(Syllable) for peaks (high stress). 
Format: ━ (STRESS) ━
`;

/**
 * Generates a list of practice words using THE SECURE NETLIFY FUNCTION.
 * @param level The CEFR level to target.
 * @param targetPhonemes Optional list of IPA symbols to prioritize.
 */
export const getPracticeWords = async (level: CEFRLevel, targetPhonemes: string[] = []): Promise<PracticeWord[]> => {
  const phonemeContext = targetPhonemes.length > 0 
    ? `IMPORTANT: Every single generated word MUST contain at least one of these IPA sounds: [${targetPhonemes.join(', ')}].`
    : `Generate a diverse and unpredictable set of words suitable for the level. Avoid the most common 'textbook' examples (like "apple", "cat", "dog") and try to find interesting vocabulary.`;

  // Construimos el prompt con TODAS las reglas
  const prompt = `Generate exactly 10 American English practice words for CEFR Level ${level}. 
      ${phonemeContext}
      
      Variety is critical: do not repeat words from previous sessions. Use a mix of nouns, verbs, and adjectives.
      
      For each word, provide:
      1. "text": English spelling.
      2. "phonetic": Standard IPA.
      3. "whatsUp": Emoji-phonetic representation using these EXACT rules and symbols: ${EMOJI_RULES}. 
      IMPORTANT: For complex sounds like /ӕ/ or diphthongs, use the bracket format exactly as shown (e.g. [😀+🤒]).
      4. "intonation": Intonation pattern using: ${INTONATION_RULES}.
      5. "vowels": Formant data for primary vowels in the word. 
          Note: The Schwa (/ə/) is a mutable vowel. If the sound is a schwa, categorize it as "ə" but understand it can vary in height.
      
      Return ONLY a raw JSON array. Do not include markdown formatting like \`\`\`json.`;

  try {
    // LLAMADA SEGURA A NETLIFY
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraemos el texto de la respuesta de Google
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) return [];

    // Limpieza: Quitamos bloques de código markdown si la IA los pone
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(textResponse);

  } catch (error) {
    console.error("Error obteniendo palabras:", error);
    // Si falla, retornamos array vacío para que la App use su fallback
    return [];
  }
};