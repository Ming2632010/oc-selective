import { TYPE_LABELS, WRITING_TYPES, type WritingType } from '@/lib/units';

export type DecodeGuide = {
  form: WritingType;
  formLabel: string;
  formOptions: string[];
  topic: string;
  topicOptions: string[];
  audience: string;
  audienceOptions: string[];
};

export type DecodeAnswers = {
  formLabel: string | null;
  topic: string | null;
  audience: string | null;
};

const DEFAULT_AUDIENCE: Record<WritingType, string> = {
  narrative: 'a reader who does not already know the story',
  diary_entry: 'yourself, writing in a private diary',
  news_report: 'readers of the local paper',
  explanation: 'a younger student who has not studied this yet',
  advice_sheet: 'students who need practical, kind help',
  review: 'other students your age who might go or read it',
  advertisement: 'families or students you want to persuade',
  persuasive_text: 'the school community, including people who disagree',
  formal_letter: 'the person in charge (principal, council, or coach)',
  speech: 'listeners in an assembly or your year group',
  email: 'the person you are writing to, in a polite email voice',
};

const AUDIENCE_DISTRACTORS = [
  'a toddler who wants a bedtime story',
  'shoppers in a supermarket queue',
  'a sports umpire during a match',
  'tourists who have never been to Australia',
];

const TOPIC_DISTRACTORS = [
  'describe your favourite weekend with no specific job',
  'list classroom rules in bullet points only',
  'retell a fairy tale you already know',
  'write a packing list for a camp',
];

export function defaultPurposes(type: string): string[] {
  switch (type) {
    case 'narrative':
    case 'diary_entry':
      return ['narrate'];
    case 'news_report':
    case 'explanation':
    case 'review':
      return ['inform'];
    case 'advice_sheet':
      return ['advise'];
    default:
      return ['persuade'];
  }
}

function asWritingType(value: string): WritingType {
  return (WRITING_TYPES as string[]).includes(value)
    ? (value as WritingType)
    : 'narrative';
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = items.slice();
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    h = Math.imul(h, 1664525) + 1013904223;
    const j = Math.abs(h) % (i + 1);
    const current = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = current;
  }
  return arr;
}

function uniqueOptions(correct: string, extras: string[], seed: string, count = 3): string[] {
  const rest: string[] = [];
  for (const extra of extras) {
    const trimmed = extra.trim();
    if (trimmed && trimmed !== correct && !rest.includes(trimmed)) rest.push(trimmed);
  }
  const picked = [correct, ...seededShuffle(rest, seed).slice(0, Math.max(0, count - 1))];
  return seededShuffle(picked, `${seed}-final`);
}

function fallbackTopic(description: string, title: string): string {
  const match = description.match(/Write (?:a |an |the )?([^\n.]+)/i);
  if (match?.[1]) return match[1].trim();
  const line = description
    .split('\n')
    .map((row) => row.trim())
    .find((row) => row.length > 24);
  return line || title;
}

export function isDecodeGuide(value: unknown): value is DecodeGuide {
  if (!value || typeof value !== 'object') return false;
  const row = value as DecodeGuide;
  return (
    typeof row.form === 'string' &&
    typeof row.formLabel === 'string' &&
    Array.isArray(row.formOptions) &&
    row.formOptions.length >= 2 &&
    typeof row.topic === 'string' &&
    Array.isArray(row.topicOptions) &&
    row.topicOptions.length >= 2 &&
    typeof row.audience === 'string' &&
    Array.isArray(row.audienceOptions) &&
    row.audienceOptions.length >= 2
  );
}

export function parseDecodeGuide(value: unknown): DecodeGuide | null {
  if (typeof value === 'string') {
    try {
      return parseDecodeGuide(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return isDecodeGuide(value) ? value : null;
}

export function buildDecodeGuide(prompt: {
  prompt_type: string;
  title: string;
  description: string;
  decode_topic?: string | null;
  decode_audience?: string | null;
  decode_topic_options?: string[] | null;
  decode_audience_options?: string[] | null;
  decode_guide?: DecodeGuide | null;
}): DecodeGuide {
  const existing = parseDecodeGuide(prompt.decode_guide);
  if (existing) return existing;

  const form = asWritingType(prompt.prompt_type);
  const formLabel = TYPE_LABELS[form];
  const topic = (prompt.decode_topic ?? fallbackTopic(prompt.description, prompt.title)).trim();
  const audience = (
    prompt.decode_audience ??
    DEFAULT_AUDIENCE[form]
  ).trim();

  const otherForms = WRITING_TYPES.filter((type) => type !== form).map(
    (type) => TYPE_LABELS[type],
  );

  return {
    form,
    formLabel,
    formOptions: uniqueOptions(formLabel, otherForms, `${prompt.title}-form`),
    topic,
    topicOptions: uniqueOptions(
      topic,
      [...(prompt.decode_topic_options ?? []), ...TOPIC_DISTRACTORS],
      `${prompt.title}-topic`,
    ),
    audience,
    audienceOptions: uniqueOptions(
      audience,
      [...(prompt.decode_audience_options ?? []), ...AUDIENCE_DISTRACTORS],
      `${prompt.title}-audience`,
    ),
  };
}

export function gradeDecode(guide: DecodeGuide, answers: DecodeAnswers) {
  return {
    form: answers.formLabel === guide.formLabel,
    topic: answers.topic === guide.topic,
    audience: answers.audience === guide.audience,
  };
}
