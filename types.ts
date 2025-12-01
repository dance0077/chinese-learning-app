
export enum AppMode {
  READING = 'READING',
  POETRY = 'POETRY',
  CHARACTERS = 'CHARACTERS',
  IMAGE_COMPOSITION = 'IMAGE_COMPOSITION'
}

export enum GradeLevel {
  ONE = '一年级',
  TWO = '二年级',
  THREE = '三年级',
  FOUR = '四年级',
  FIVE = '五年级',
  SIX = '六年级'
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ReadingArticle {
  title: string;
  author?: string;
  content: string;
  questions: Question[];
}

export interface Poem {
  title: string;
  author: string;
  dynasty: string;
  content: string[];
  pinyin?: string[];
  translation: string;
  analysis: string;
  tags: string[];
  questions: Question[];
}

export interface CharacterData {
  char: string;
  pinyin: string;
  radical: string;
  strokes: number;
  definition: string;
  etymology: string;
  vocabulary: string[];
  commonPhrases: string[];
}

export interface ImageCompositionData {
  imageUrl: string;
  topic: string;
  tips: {
    time: string;
    location: string;
    characters: string;
    event: string;
  };
  vocabulary: string[]; // Helper words
  sampleText: string; // A sample essay
}

export interface CompositionEvaluation {
  score: number; // 0-100
  comment: string;
  goodPoints: string[];
  suggestions: string[];
}

export interface AppSettings {
  model: string;
  apiMode: 'official' | 'proxy';
  userApiKey: string;      // Key for official mode
  proxyUrl: string;        // Base URL for proxy
  proxyApiKey: string;     // Key for proxy mode
}
