import { detectLanguageAndTransliterate } from '../services/deepSeekService';

export function transliterate(text: string): string {
  const transliterationMap: { [key: string]: string } = {
    // Hindi to English
    'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n',
    '्': '', 'ः': 'h',

    // Common Indian food terms
    'दाल': 'dal', 'चावल': 'chawal', 'रोटी': 'roti',
    'सब्जी': 'sabji', 'पनीर': 'paneer', 'मसाला': 'masala',
    'चाय': 'chai', 'लस्सी': 'lassi', 'दही': 'dahi',
    'समोसा': 'samosa', 'पकोड़ा': 'pakora', 'चटनी': 'chutney',
    'बिरयानी': 'biryani', 'नान': 'naan', 'कोफ्ता': 'kofta',
    'पराठा': 'paratha', 'राइता': 'raita', 'खीर': 'kheer',
    'जलेबी': 'jalebi', 'हलवा': 'halwa', 'पूरी': 'poori',
  };

  let result = text;
  
  // Replace each character/word with its transliteration
  Object.entries(transliterationMap).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  return result;
}

export function detectLanguage(text: string): 'hindi' | 'english' {
  // Basic detection - if the text contains Devanagari characters
  const devanagariPattern = /[\u0900-\u097F]/;
  return devanagariPattern.test(text) ? 'hindi' : 'english';
}

export async function processName(text: string): Promise<{
  original: string;
  transliterated: string | null;
  language: string;
}> {
  try {
    const result = await detectLanguageAndTransliterate(text);
    return result;
  } catch (error) {
    console.error('Error processing name:', error);
    return {
      original: text,
      transliterated: null,
      language: 'unknown'
    };
  }
} 