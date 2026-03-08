import { TopicId } from './types';

export type TonePrimary = 'curious' | 'excited' | 'supportive' | 'argumentative' | 'contemplative' | 'playful' | 'neutral';

export interface ToneResult {
  primary: TonePrimary;
  intensity: number;     // 0..1
  valence: number;       // -1..+1
  arousal: number;       // 0..1
  topicHints: TopicId[];
}

// Keyword dictionaries
const POSITIVE_WORDS = new Set([
  'love', 'great', 'amazing', 'awesome', 'beautiful', 'wonderful', 'fantastic',
  'good', 'happy', 'excited', 'yes', 'absolutely', 'brilliant', 'perfect',
  'cool', 'nice', 'thanks', 'agree', 'together', 'welcome', 'inspiring',
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'bad', 'terrible', 'awful', 'ugly', 'wrong', 'no', 'never',
  'disagree', 'annoying', 'boring', 'stupid', 'broken', 'fail', 'worst',
]);

const CURIOUS_WORDS = new Set([
  'why', 'how', 'what', 'wonder', 'curious', 'interesting', 'think',
  'maybe', 'perhaps', 'explore', 'possible', 'imagine',
]);

const SUPPORTIVE_WORDS = new Set([
  'help', 'support', 'together', 'team', 'share', 'care', 'understand',
  'agree', 'welcome', 'kind', 'friend', 'community',
]);

const ARGUMENTATIVE_WORDS = new Set([
  'but', 'however', 'actually', 'wrong', 'disagree', 'no', 'never',
  'impossible', 'ridiculous', 'nonsense', 'clearly',
]);

const PLAYFUL_WORDS = new Set([
  'haha', 'lol', 'fun', 'play', 'game', 'silly', 'joke', 'wild',
  'whoa', 'wow', 'omg', 'yay', 'woo',
]);

const CONTEMPLATIVE_WORDS = new Set([
  'hmm', 'consider', 'reflect', 'deep', 'meaning', 'philosophy',
  'ponder', 'essence', 'truth', 'wisdom', 'soul', 'silence',
]);

// Topic keyword mapping
const TOPIC_KEYWORDS: Record<string, TopicId[]> = {
  'ai': ['ai-agents'],
  'agent': ['ai-agents'],
  'llm': ['ai-agents'],
  'claude': ['ai-agents'],
  'spatial': ['spatial-computing'],
  'vr': ['spatial-computing'],
  'ar': ['spatial-computing'],
  '3d': ['spatial-computing'],
  'metaverse': ['spatial-computing'],
  'game': ['game-design'],
  'design': ['game-design'],
  'gameplay': ['game-design'],
  'music': ['music'],
  'sound': ['music'],
  'audio': ['music'],
  'rhythm': ['music'],
  'world': ['worldbuilding'],
  'lore': ['worldbuilding'],
  'story': ['worldbuilding'],
  'narrative': ['worldbuilding'],
  'accessible': ['accessibility'],
  'accessibility': ['accessibility'],
  'inclusive': ['accessibility'],
  'open': ['open-standards'],
  'standard': ['open-standards'],
  'interop': ['open-standards'],
  'protocol': ['open-standards'],
  'social': ['social-presence'],
  'presence': ['social-presence'],
  'community': ['social-presence'],
  'connection': ['social-presence'],
};

function countMatches(words: string[], dict: Set<string>): number {
  return words.filter(w => dict.has(w)).length;
}

export function analyzeTone(text: string): ToneResult {
  const lower = text.toLowerCase();
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const wordCount = Math.max(words.length, 1);

  // Punctuation signals
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const capsRatio = text.replace(/[^a-zA-Z]/g, '').length > 0
    ? (text.match(/[A-Z]/g) || []).length / text.replace(/[^a-zA-Z]/g, '').length
    : 0;
  const ellipses = (text.match(/\.\.\./g) || []).length;

  // Category scores
  const scores: Record<TonePrimary, number> = {
    curious: countMatches(words, CURIOUS_WORDS) / wordCount + questions * 0.2,
    excited: exclamations * 0.15 + capsRatio * 0.5 + countMatches(words, PLAYFUL_WORDS) / wordCount * 0.3,
    supportive: countMatches(words, SUPPORTIVE_WORDS) / wordCount,
    argumentative: countMatches(words, ARGUMENTATIVE_WORDS) / wordCount,
    contemplative: countMatches(words, CONTEMPLATIVE_WORDS) / wordCount + ellipses * 0.15,
    playful: countMatches(words, PLAYFUL_WORDS) / wordCount + exclamations * 0.05,
    neutral: 0.1, // baseline
  };

  // Pick primary
  let primary: TonePrimary = 'neutral';
  let maxScore = 0;
  for (const [tone, score] of Object.entries(scores) as [TonePrimary, number][]) {
    if (score > maxScore) { maxScore = score; primary = tone; }
  }

  // Valence: positive - negative
  const posCount = countMatches(words, POSITIVE_WORDS);
  const negCount = countMatches(words, NEGATIVE_WORDS);
  const valence = Math.max(-1, Math.min(1, (posCount - negCount) / wordCount * 2));

  // Arousal: exclamations, caps, word count intensity
  const arousal = Math.min(1, exclamations * 0.15 + capsRatio * 0.4 + Math.min(wordCount / 20, 0.3) + maxScore * 0.3);

  // Intensity
  const intensity = Math.min(1, maxScore * 2 + arousal * 0.3);

  // Topic hints
  const topicHints: TopicId[] = [];
  const seenTopics = new Set<TopicId>();
  for (const word of words) {
    const topics = TOPIC_KEYWORDS[word];
    if (topics) {
      for (const t of topics) {
        if (!seenTopics.has(t)) { seenTopics.add(t); topicHints.push(t); }
      }
    }
  }

  return { primary, intensity, valence, arousal, topicHints };
}
