
import { VowelData } from './types';

// Refined American English Phonetic Sounds.
// Focused on the core set used in standard pronunciation training.
// F1 (Y-axis): Height/Aperture. [150 - 950]
// F2 (X-axis): Advancement. [600 - 2500]
export const AMERICAN_VOWELS: Record<string, VowelData> = {
  // --- HIGH (CLOSED) ---
  'i': { ipa: 'i', example: 'beet', f1: 300, f2: 2400, widthF1: 60, widthF2: 300 },
  'u': { ipa: 'u', example: 'boot', f1: 300, f2: 700, widthF1: 70, widthF2: 200 },
  'j': { ipa: 'j', example: 'yes', f1: 280, f2: 2300, widthF1: 50, widthF2: 250 },
  'w': { ipa: 'w', example: 'win', f1: 280, f2: 750, widthF1: 50, widthF2: 200 },
  
  // --- NEAR-HIGH ---
  'ɪ': { ipa: 'ɪ', example: 'bit', f1: 380, f2: 2050, widthF1: 80, widthF2: 250 },
  'ʊ': { ipa: 'ʊ', example: 'foot', f1: 400, f2: 1050, widthF1: 90, widthF2: 220 },
  
  // --- CLOSE-MID ---
  'e': { ipa: 'e', example: 'say', f1: 450, f2: 2200, widthF1: 100, widthF2: 300 },
  'o': { ipa: 'o', example: 'go', f1: 450, f2: 750, widthF1: 100, widthF2: 200 },
  
  // --- MID (CENTRAL) ---
  'ə': { ipa: 'ə', example: 'sofa', f1: 520, f2: 1500, widthF1: 180, widthF2: 350 },
  
  // --- OPEN-MID ---
  'ɛ': { ipa: 'ɛ', example: 'bet', f1: 580, f2: 1950, widthF1: 120, widthF2: 280 },
  'ɜ': { ipa: 'ɜ', example: 'bird', f1: 550, f2: 1350, widthF1: 120, widthF2: 300 },
  'ʌ': { ipa: 'ʌ', example: 'but', f1: 600, f2: 1100, widthF1: 140, widthF2: 300 },
  'ɔ': { ipa: 'ɔ', example: 'thought', f1: 580, f2: 750, widthF1: 130, widthF2: 250 },
  
  // --- NEAR-OPEN ---
  'æ': { ipa: 'æ', example: 'bat', f1: 750, f2: 1850, widthF1: 200, widthF2: 400 },
  
  // --- OPEN ---
  'a': { ipa: 'a', example: 'car', f1: 850, f2: 1450, widthF1: 150, widthF2: 350 },
  'ɑ': { ipa: 'ɑ', example: 'hot', f1: 850, f2: 950, widthF1: 150, widthF2: 300 },

  // --- DIPHTHONGS ---
  'aɪ': { 
    ipa: 'aɪ', example: 'eye', f1: 800, f2: 1800, widthF1: 180, widthF2: 350,
    trajectory: [{f1: 850, f2: 1450}, {f1: 650, f2: 1800}, {f1: 400, f2: 2100}]
  },
  'aʊ': { 
    ipa: 'aʊ', example: 'cow', f1: 800, f2: 1100, widthF1: 180, widthF2: 350,
    trajectory: [{f1: 850, f2: 1450}, {f1: 650, f2: 1100}, {f1: 420, f2: 850}]
  },
  'ɔɪ': { 
    ipa: 'ɔɪ', example: 'boy', f1: 550, f2: 1400, widthF1: 150, widthF2: 400,
    trajectory: [{f1: 580, f2: 750}, {f1: 500, f2: 1400}, {f1: 400, f2: 2000}]
  },
  'eɪ': { 
    ipa: 'eɪ', example: 'bait', f1: 480, f2: 2100, widthF1: 150, widthF2: 400,
    trajectory: [{f1: 500, f2: 2000}, {f1: 450, f2: 2150}, {f1: 350, f2: 2300}]
  },
  'oʊ': { 
    ipa: 'oʊ', example: 'boat', f1: 500, f2: 900, widthF1: 130, widthF2: 300,
    trajectory: [{f1: 550, f2: 1000}, {f1: 480, f2: 900}, {f1: 380, f2: 800}]
  }
};

export const CEFR_DESCRIPTIONS: Record<string, string> = {
  'A1': 'Beginner: Basic everyday words',
  'A2': 'Elementary: Simple routine tasks',
  'B1': 'Intermediate: Familiar topics and experiences',
  'B2': 'Upper Intermediate: Complex ideas and technical discussion',
  'C1': 'Advanced: Wide range of demanding texts',
  'C2': 'Proficiency: Mastery of nuanced language',
};
