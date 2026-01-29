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
Entonación: MANDATORY: You MUST use the arrow ⬆️ for the peak/stress syllable. 
Authorized symbols ONLY: ━ (low) and ⬆️ (high/stress).
Example: ━ ⬆️(BOUT) ━
NEVER use dashes like '-' or '—' for the stress.
`;

export const getPracticeWords = async (level: CEFRLevel, targetPhonemes: string[] = []): Promise<PracticeWord[]> => {
  // AJUSTE DE DIFICULTAD: Si es C1 o C2, prohibimos palabras comunes.
  const difficultyInstruction = (level === 'C1' || level === 'C2') 
    ? "STRICTLY ADVANCED VOCABULARY. Do NOT use common words like 'about', 'water', 'time'. Use academic, scientific, or literary words (e.g., 'Epistemology', 'Ubiquitous', 'Cacophony')."
    : "Use standard vocabulary suitable for the level.";

  const phonemeContext = targetPhonemes.length > 0 
    ? `IMPORTANT: Every word MUST contain at least one of these IPA sounds: [${targetPhonemes.join(', ')}].`
    : `Generate a diverse set of words.`;

  const prompt = `Generate exactly 10 American English practice words for CEFR Level ${level}. 
      ${difficultyInstruction}
      ${phonemeContext}
      
      For each word, provide:
      1. "text": English spelling.
      2. "phonetic": Standard IPA.
      3. "whatsUp": Emoji-phonetic representation using these EXACT rules: ${EMOJI_RULES}. 
      4. "intonation": Intonation pattern using: ${INTONATION_RULES}.
      5. "vowels": Formant data for primary vowels. 
      
      Return ONLY a raw JSON array.`;

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) return [];

    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(textResponse);

  } catch (error: any) {
    console.error("Error:", error);
    alert("⚠️ Error: " + error.message);
    return [];
  }
};