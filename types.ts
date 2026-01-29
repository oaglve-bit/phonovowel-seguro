
export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2'
}

export type Gender = 'male' | 'female';
export type AgeGroup = 'adult' | 'child';

export interface VocalProfile {
  gender: Gender;
  age: AgeGroup;
}

export interface VowelPoint {
  f1: number;
  f2: number;
}

export interface VowelData {
  ipa: string;
  example: string;
  f1: number; // Center F1
  f2: number; // Center F2
  widthF1?: number; // VFD height dispersion
  widthF2?: number; // VFD width dispersion
  trajectory?: VowelPoint[]; // Path for diphthongs (25%, 50%, 75% duration)
}

export interface PracticeWord {
  text: string;
  phonetic: string;
  whatsUp: string; // Emoji-phonetic representation
  intonation: string; // Intonation pattern using ━ and ⬆️ symbols
  vowels: VowelData[];
}

export interface ScoreEntry {
  word: string;
  status: 'hit' | 'miss';
  timestamp: number;
}
