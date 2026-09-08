import { createJsonCompletion, isOpenAIConfigured } from '@/lib/openai';
import {
  parseMiniPrompt,
  type ChecklistItem,
  type MiniMarkResult,
  type PhraseSentencePrompt,
} from '@/lib/mini-item-kinds';

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`´‘’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesPhrase(answer: string, phrase: string) {
  const phraseWords = normalize(phrase);
  return Boolean(phraseWords) && ` ${normalize(answer)} `.includes(` ${phraseWords} `);
}

function fallbackMark(prompt: PhraseSentencePrompt, answer: string): MiniMarkResult {
  const checks: ChecklistItem[] = [
    {
      id: 'phrase',
      label: `Use the phrase “${prompt.phrase}”.`,
      passed: includesPhrase(answer, prompt.phrase),
    },
    {
      id: 'length',
      label: `Use at least ${prompt.minWords} words.`,
      passed: answer.trim().split(/\s+/).filter(Boolean).length >= prompt.minWords,
    },
    {
      id: 'capital',
      label: 'Start with a capital letter.',
      passed: /^["“'‘]?[A-Z]/.test(answer.trim()),
    },
    {
      id: 'punctuation',
      label: 'Finish with a full stop, question mark, or exclamation mark.',
      passed: /[.!?]["”'’]?$/.test(answer.trim()),
    },
  ];
  return {
    isCorrect: checks.every((check) => check.passed),
    explanation:
      'Your sentence has been checked for the required phrase and sentence basics. AI feedback is temporarily unavailable.',
    sample: prompt.sample,
    checks,
  };
}

function aiMarkFromResponse(
  raw: string,
  prompt: PhraseSentencePrompt,
  answer: string,
): MiniMarkResult | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const unitMatch = parsed.unit_match === true;
    const feedback = typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '';
    if (!feedback || feedback.length > 500) return null;

    const requiredPhrase = includesPhrase(answer, prompt.phrase);
    const completeSentence =
      /^["“'‘]?[A-Z]/.test(answer.trim()) && /[.!?]["”'’]?$/.test(answer.trim());
    const enoughWords =
      answer.trim().split(/\s+/).filter(Boolean).length >= prompt.minWords;
    const checks: ChecklistItem[] = [
      {
        id: 'phrase',
        label: `Use the phrase “${prompt.phrase}”.`,
        passed: requiredPhrase,
      },
      {
        id: 'sentence',
        label: 'Write a complete sentence.',
        passed: completeSentence && enoughWords,
      },
      {
        id: 'unit-match',
        label: 'Make the sentence fit this unit’s writing task.',
        passed: unitMatch,
      },
    ];
    return {
      isCorrect: checks.every((check) => check.passed),
      explanation: feedback,
      sample: prompt.sample,
      checks,
    };
  } catch {
    return null;
  }
}

export async function markPhraseSentence(input: {
  prompt: unknown;
  answerText: string;
  unitLabel: string;
}): Promise<MiniMarkResult> {
  const prompt = parseMiniPrompt('phrase_sentence', input.prompt) as PhraseSentencePrompt;
  const fallback = fallbackMark(prompt, input.answerText);
  if (!isOpenAIConfigured()) return fallback;

  try {
    const raw = await createJsonCompletion({
      temperature: 0.2,
      system: [
        'You are a supportive NSW Selective Writing teacher marking one Year 5–6 sentence.',
        'Check whether the sentence genuinely fits the requested writing task and uses the exact required phrase.',
        'Do not require sophisticated vocabulary or penalise small spelling mistakes.',
        'Return only JSON: { "unit_match": boolean, "feedback": string }.',
        'Feedback must be one specific, encouraging sentence under 60 words.',
      ].join('\n'),
      user: {
        unit: input.unitLabel,
        task: prompt.task,
        required_phrase: prompt.phrase,
        student_sentence: input.answerText,
      },
    });
    return aiMarkFromResponse(raw, prompt, input.answerText) ?? fallback;
  } catch (error) {
    console.error('[mark-phrase-sentence] AI marking failed; using fallback:', error);
    return fallback;
  }
}
