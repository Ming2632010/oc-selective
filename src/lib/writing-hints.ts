/** Shared hint coverage and diary-shape helpers for marking. */

export function wordCountOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function lastLinesHaveReflection(content: string): boolean {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  const close = paragraphs.at(-1) || content.slice(-180);
  return /\b(felt|feel|feeling|tired|proud|glad|sorry|fun|remember|realised|realized|hope|wish|miss(?:ed)?|loved|will never forget|tomorrow|next time|still|now i|i now)\b/i.test(
    close,
  );
}

/** Time-order moves at a sentence or paragraph start — not “next to me” or “coming second”. */
const SEQUENCE_START =
  /(?:^|[.!?]\s+|\n\s*)(Then(?:\s+we|\s+came)?|After(?:\s+that|\s+we)?|Afterwards|Later|Finally|First(?:ly)?|At the end|By the end)\b/gi;

export function sequenceStartCount(text: string): number {
  const pattern = new RegExp(SEQUENCE_START.source, 'gi');
  return (text.match(pattern) ?? []).length;
}

export function looksLikeEventList(content: string, wc = wordCountOf(content)): boolean {
  return wc >= 80 && sequenceStartCount(content) >= 3;
}

export function hasDevelopedFocalScene(content: string): boolean {
  return /\b(wanted to|debated|wrestled|difficult (choice|decision)|split second|should I|heart raced)\b/i.test(
    content,
  );
}

export function isWeakVocabularyFalsePositive(
  word: string,
  content: string,
  start: number,
  end: number,
): boolean {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  const window = content.slice(Math.max(0, start - 28), Math.min(content.length, end + 28)).toLowerCase();
  if (key === 'very' && /\bthe very (end|next|same|first|last|thought|idea|start)\b/.test(window)) {
    return true;
  }
  if (key === 'went' && /\bwent (off|on|out|through|missing|ahead)\b/.test(window)) {
    return true;
  }
  return false;
}

export type HintFamily = 'opening' | 'moment' | 'close' | 'generic';

export function hintFamily(hint: string): HintFamily {
  const h = hint.toLowerCase();
  if (/set the scene|how the day began|open with|opening|hook and set/.test(h)) return 'opening';
  if (/tense or funny|funny moment|during an event|build tension|vivid detail/.test(h)) return 'moment';
  if (
    /reflect|feelings at the end|how you felt|satisfying or surprising ending|resolve the (story|discovery)/.test(
      h,
    )
  ) {
    return 'close';
  }
  return 'generic';
}

export function hintCovered(content: string, hint: string): boolean {
  const trimmed = hint.trim();
  if (!trimmed) return false;
  const hay = content.toLowerCase();
  const family = hintFamily(trimmed);
  if (family === 'opening') {
    return /\b(morning|arrived|began|started|woke|early|marched|chilly|oval|first thing)\b/i.test(content);
  }
  if (family === 'moment') {
    return /\b(tripped|fell|stumble|stumbled|raced|sprint|laughed|funny|debated|wrestled|choice|cheered|starter gun|heart raced)\b/i.test(
      content,
    );
  }
  if (family === 'close') {
    return lastLinesHaveReflection(content);
  }

  const keywords = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 6);
  if (keywords.length === 0) return hay.length > 80;
  const hits = keywords.filter((word) => hay.includes(word)).length;
  return hits >= Math.min(2, keywords.length);
}

export function isEventListAdvice(text: string): boolean {
  return /lists lots of things|full-day timetable|cut two smaller|change what you write about: grow one moment|not a list of what happened/i.test(
    text,
  );
}

export function isOpeningDetailNag(text: string): boolean {
  return /opening lacks detail|how the day began|specific activities|as you arrived at the carnival|day's start|day’s start/i.test(
    text,
  );
}

export function isMissingHintAdvice(text: string): boolean {
  return /still missing/i.test(text);
}

export function isUndevelopedIdeaPraise(text: string): boolean {
  return /clear idea to build on|mark will rise when that idea is developed/i.test(text);
}
