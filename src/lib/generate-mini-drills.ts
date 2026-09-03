import { randomUUID } from 'crypto';
import { createJsonCompletion, isOpenAIConfigured } from '@/lib/openai';
import type { MiniFocus } from '@/lib/mini-weakness';
import {
  MINI_SKILL_LABELS,
  SEED_MINI_DRILLS,
  type MiniSkill,
} from '@/lib/seed-mini-drills';
import { typeLabel, type WritingType } from '@/lib/units';

export type GeneratedMiniDrill = {
  slug: string;
  module_id: number;
  prompt_type: WritingType;
  skill: MiniSkill;
  title: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
  sort_order: number;
};

/** Title, stem, and options already on the unit (seed or earlier extras). */
export type MiniQuestionRef = {
  title?: string;
  stem: string;
  options?: string[];
};

type RawQuestion = {
  skill?: unknown;
  title?: unknown;
  stem?: unknown;
  options?: unknown;
  correct_index?: unknown;
  explanation?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueOptions(options: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const option of options) {
    if (!option || seen.has(option)) continue;
    seen.add(option);
    out.push(option);
  }
  return out;
}

export function normalizeMiniText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function optionSetKey(options: string[] | undefined) {
  return (options ?? [])
    .map((option) => normalizeMiniText(option))
    .filter(Boolean)
    .sort()
    .join('|');
}

function contentWords(stem: string) {
  return new Set(
    normalizeMiniText(stem)
      .split(' ')
      .filter((word) => word.length > 2),
  );
}

function stemsTooClose(left: string, right: string) {
  const a = normalizeMiniText(left);
  const b = normalizeMiniText(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 40 && longer.includes(shorter)) return true;
  const wa = contentWords(left);
  const wb = contentWords(right);
  if (wa.size < 6 || wb.size < 6) return false;
  let overlap = 0;
  for (const word of Array.from(wa)) {
    if (wb.has(word)) overlap += 1;
  }
  const union = wa.size + wb.size - overlap;
  return union > 0 && overlap / union >= 0.82;
}

export function isSameMiniQuestion(
  candidate: MiniQuestionRef,
  existing: MiniQuestionRef,
) {
  if (stemsTooClose(candidate.stem, existing.stem)) return true;
  const candidateOptions = optionSetKey(candidate.options);
  const existingOptions = optionSetKey(existing.options);
  return Boolean(
    candidateOptions && existingOptions && candidateOptions === existingOptions,
  );
}

export function keepNovelMiniQuestions<T extends MiniQuestionRef>(
  questions: T[],
  alreadyOnUnit: MiniQuestionRef[],
) {
  const seen: MiniQuestionRef[] = [...alreadyOnUnit];
  const unique: T[] = [];
  for (const question of questions) {
    if (seen.some((row) => isSameMiniQuestion(question, row))) continue;
    unique.push(question);
    seen.push(question);
  }
  return unique;
}

function seedQuestionsForModule(moduleId: number): MiniQuestionRef[] {
  return SEED_MINI_DRILLS.filter((drill) => drill.module_id === moduleId).map(
    (drill) => ({
      title: drill.title,
      stem: drill.stem,
      options: drill.options,
    }),
  );
}

function unitQuestionRefs(
  moduleId: number,
  extra: MiniQuestionRef[] = [],
): MiniQuestionRef[] {
  return [...seedQuestionsForModule(moduleId), ...extra];
}

const SKILL_ALIASES: Record<string, MiniSkill> = {
  format: 'format',
  audience: 'audience',
  vocabulary: 'vocabulary',
  'word choice': 'vocabulary',
  wordchoice: 'vocabulary',
  'word_choice': 'vocabulary',
  punctuation: 'punctuation',
  grammar: 'punctuation',
  structure: 'structure',
};

export function normalizeMiniSkill(value: string): MiniSkill | null {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  return SKILL_ALIASES[key] ?? SKILL_ALIASES[key.replace(/\s+/g, '')] ?? null;
}

function threeOptions(options: string[], correctIndex: number) {
  const unique = uniqueOptions(options);
  if (unique.length === 3) {
    const mapped = unique.indexOf(options[correctIndex] ?? '');
    return {
      options: unique,
      correctIndex: mapped >= 0 ? mapped : correctIndex,
    };
  }
  if (unique.length > 3 && Number.isInteger(correctIndex) && correctIndex >= 0) {
    const originalCorrect = options[correctIndex];
    const correct = unique.includes(originalCorrect)
      ? originalCorrect
      : unique[0];
    const rest = unique.filter((option) => option !== correct).slice(0, 2);
    return { options: [correct, ...rest], correctIndex: 0 };
  }
  return { options: unique, correctIndex };
}

export function parseGeneratedQuestion(
  raw: RawQuestion,
  _allowedSkills: MiniSkill[] = [],
): Omit<GeneratedMiniDrill, 'slug' | 'module_id' | 'prompt_type' | 'sort_order'> | null {
  const skill = normalizeMiniSkill(asTrimmedString(raw.skill));
  if (!skill) return null;

  const title = asTrimmedString(raw.title);
  const stem = asTrimmedString(raw.stem);
  const explanation = asTrimmedString(raw.explanation);
  const correctIndex = Number(raw.correct_index);
  const { options, correctIndex: mappedIndex } = threeOptions(
    Array.isArray(raw.options)
      ? raw.options.map((item) => asTrimmedString(item)).filter(Boolean)
      : [],
    correctIndex,
  );

  if (title.length < 3 || title.length > 80) return null;
  if (stem.length < 12 || stem.length > 500) return null;
  if (explanation.length < 12 || explanation.length > 600) return null;
  if (options.length !== 3) return null;
  if (!Number.isInteger(mappedIndex) || mappedIndex < 0 || mappedIndex > 2) {
    return null;
  }

  return {
    skill,
    title,
    stem,
    options,
    correct_index: mappedIndex,
    explanation,
  };
}

export function parseGeneratedPack(
  raw: unknown,
  allowedSkills: MiniSkill[],
): Omit<GeneratedMiniDrill, 'slug' | 'module_id' | 'prompt_type' | 'sort_order'>[] {
  const questions = Array.isArray((raw as { questions?: unknown })?.questions)
    ? ((raw as { questions: RawQuestion[] }).questions ?? [])
    : Array.isArray(raw)
      ? (raw as RawQuestion[])
      : [];

  const parsed = questions
    .map((question) => parseGeneratedQuestion(question, allowedSkills))
    .filter((question): question is NonNullable<typeof question> => Boolean(question));

  const seen = new Set<string>();
  const unique = parsed.filter((question) => {
    const key = question.stem.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (allowedSkills.length === 0) return unique;
  const preferred = unique.filter((question) =>
    allowedSkills.includes(question.skill),
  );
  const rest = unique.filter((question) => !allowedSkills.includes(question.skill));
  return [...preferred, ...rest];
}

async function generateWithOpenAI(input: {
  moduleId: number;
  promptType: WritingType;
  unitLabel: string;
  focus: MiniFocus;
  missedStems: string[];
  packSize: number;
  alreadyOnUnit: MiniQuestionRef[];
}): Promise<ReturnType<typeof parseGeneratedPack>> {
  const skillKeys = input.focus.skills.join(', ');
  const skillLabels = input.focus.skills
    .map((skill) => `${skill} (${MINI_SKILL_LABELS[skill]})`)
    .join(', ');
  const forbidden = input.alreadyOnUnit.slice(0, 24).map((question) => ({
    title: question.title ?? '',
    stem: question.stem,
  }));

  const system = [
    'You write extra multiple-choice mini questions for NSW Selective Writing practice.',
    'Year 5–6 only. Short, clear, not extra-hard. No rare words. No tricks.',
    `Write questions only for these skill keys: ${skillKeys}.`,
    `Human labels: ${skillLabels}.`,
    'The "skill" field MUST be one of exactly: format, audience, vocabulary, punctuation, structure.',
    'Use "vocabulary" for word-choice questions. Never write "word choice" in the skill field.',
    'Each question has exactly 3 short options and one obviously best answer (correct_index 0, 1, or 2).',
    'Wrong options should be common student mix-ups (wrong text type, slang, missing punctuation).',
    'Titles 3-60 characters. Stems one or two sentences. Explanations one or two short sentences.',
    'Invent NEW questions. Do not copy, quote, or lightly rewrite anything in do_not_copy.',
    'Use new names, a new setting, and new options. A paraphrase of a listed stem is not new.',
    'Missed stems show skills to practise — write a different question on that skill, not the same item.',
    'Return ONLY JSON: { "questions": [ { "skill", "title", "stem", "options", "correct_index", "explanation" } ] }',
  ].join('\n');

  const collect = async (copiedLastTime: MiniQuestionRef[]) => {
    const raw = await createJsonCompletion({
      temperature: 0.85,
      system,
      user: {
        text_type: input.promptType,
        unit_label: input.unitLabel,
        target_skills: input.focus.skills,
        why: input.focus.reason,
        how_many: input.packSize + 2,
        missed_question_stems: input.missedStems.slice(0, 8),
        do_not_copy: forbidden,
        still_too_similar_to: copiedLastTime.slice(0, 8).map((question) => ({
          title: question.title ?? '',
          stem: question.stem,
        })),
      },
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }
    return parseGeneratedPack(parsed, input.focus.skills);
  };

  const novel: ReturnType<typeof parseGeneratedPack> = [];
  let rejected: MiniQuestionRef[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parsed = await collect(rejected);
    const kept = keepNovelMiniQuestions(parsed, [
      ...input.alreadyOnUnit,
      ...novel,
    ]);
    rejected = parsed.filter(
      (question) => !kept.some((row) => row.stem === question.stem),
    );
    for (const question of kept) {
      if (novel.length >= input.packSize) break;
      novel.push(question);
    }
    if (novel.length >= input.packSize) break;
  }
  return novel;
}

function fallbackQuestions(
  promptType: WritingType,
  skills: MiniSkill[],
  variation: number,
  alreadyOnUnit: MiniQuestionRef[],
  packSize: number,
): RawQuestion[] {
  const label = typeLabel(promptType);
  const formatCorrect: Record<WritingType, string> = {
    narrative: 'A beginning, a problem or change, and an ending',
    diary_entry: 'A date or “Dear Diary”, first person, and a feeling',
    news_report: 'A headline, the main facts, and often a short quote',
    explanation: 'A clear how or why, in a sensible order',
    advice_sheet: 'A short welcome, useful tips, and a kind close',
    review: 'The title, an opinion, reasons, and a recommendation',
    advertisement: 'A heading, what it offers, and what to do next',
    persuasive_text: 'A clear position, reasons, and a firm ending',
    formal_letter: 'Dear …, a purpose, and Yours sincerely or Yours faithfully',
    speech: 'A greeting to listeners, points, and a thank-you',
    email: 'A subject line, greeting, purpose, and a simple sign-off',
  };

  const bank: Record<MiniSkill, RawQuestion[]> = {
    format: [
      {
        skill: 'format',
        title: 'Stay in form',
        stem: `Which of these belongs in this ${label} and not in an advert?`,
        options: [
          formatCorrect[promptType],
          'BUY NOW OR ELSE!!!!',
          'Once upon a time, magma was a dragon.',
        ],
        correct_index: 0,
        explanation: `Keep the ${label.toLowerCase()} form. Slogans and mixed-up stories belong to other tasks.`,
      },
      {
        skill: 'format',
        title: 'Leave this out',
        stem: `Which should you usually leave out of a ${label}?`,
        options: [
          'A greeting that belongs to a different text type',
          'Sentences the reader can follow',
          'A clear purpose',
        ],
        correct_index: 0,
        explanation: `Mixing forms (diary into a letter, ads into news) costs format marks.`,
      },
      {
        skill: 'format',
        title: 'Purpose on the page',
        stem: `A ${label} is doing its job when the reader can tell:`,
        options: [
          'What this writing is for, in the first few lines',
          'Only the writer’s favourite food',
          'Nothing until a twist on the last line',
        ],
        correct_index: 0,
        explanation: 'Markers look for purpose early. Hiding the job of the text weakens format and structure.',
      },
    ],
    audience: [
      {
        skill: 'audience',
        title: 'Fit the reader',
        stem: `Which tone fits a school ${label}?`,
        options: [
          'Clear, polite, and matched to the reader',
          'Insults if the reader might disagree',
          'Only slang a friend would send at midnight',
        ],
        correct_index: 0,
        explanation: 'Audience marks come from sounding right for that reader — not from shouting or slang.',
      },
      {
        skill: 'audience',
        title: 'Help them in',
        stem: 'Which sentence helps a reader who does not already know the topic?',
        options: [
          'A short, plain sentence that names the idea',
          'You know what I mean.',
          'It is obvious.',
        ],
        correct_index: 0,
        explanation: 'Assume the marker needs each idea said clearly. “You know what I mean” leaves them out.',
      },
      {
        skill: 'audience',
        title: 'No dump of slang',
        stem: `Which is the better line for a ${label} a teacher or marker will read?`,
        options: [
          'A complete sentence with an ordinary word the reader understands',
          'yo this slaps ngl',
          'OMG worst thing ever!!!!',
        ],
        correct_index: 0,
        explanation: 'Save chat slang for friends. Exam writing stays readable and respectful.',
      },
    ],
    vocabulary: [
      {
        skill: 'vocabulary',
        title: 'A clearer word',
        stem: `Which is a better school word than “stuff” or “thing” in a ${label}?`,
        options: ['reason', 'stuff', 'thingy'],
        correct_index: 0,
        explanation: 'Precise everyday words score better than vague fillers. You do not need rare words.',
      },
      {
        skill: 'vocabulary',
        title: 'Useful link',
        stem: 'Which linking word helps the reader follow an idea?',
        options: ['Because', 'Kaboom', 'Lol'],
        correct_index: 0,
        explanation: 'Simple links (because, however, for example) lift word choice without showing off.',
      },
      {
        skill: 'vocabulary',
        title: 'Not too fancy',
        stem: 'Which choice is strong but still Year 5–6?',
        options: ['asked', 'aforementioned', 'yeet'],
        correct_index: 0,
        explanation: 'Markers like control. Made-up slang and dusty formal words both miss the mark.',
      },
    ],
    punctuation: [
      {
        skill: 'punctuation',
        title: 'One full stop',
        stem: 'Which park notice uses a capital and one full stop?',
        options: [
          'The park needs new lights.',
          'the park needs new lights',
          'The park needs new lights!!!!',
        ],
        correct_index: 0,
        explanation: 'A capital at the start and one full stop at the end is enough. Extra ! looks messy.',
      },
      {
        skill: 'punctuation',
        title: 'its for belonging',
        stem: 'Which line uses its (belonging to it) the right way?',
        options: [
          'The school is proud of its oval.',
          'The school is proud of it’s oval.',
          'The school is proud of its’ oval.',
        ],
        correct_index: 0,
        explanation: 'its = belonging to it. it’s = it is. This small difference shows up in Selective writing.',
      },
      {
        skill: 'punctuation',
        title: 'Name the teacher',
        stem: 'Which line capitalises the teacher’s name the right way?',
        options: [
          'Ms Lee asked Year 5 to wait near the hall.',
          'ms lee asked year 5 to wait near the hall.',
          'MS LEE ASKED YEAR 5 TO WAIT NEAR THE HALL!!!!',
        ],
        correct_index: 0,
        explanation: 'Names and the start of a sentence take capitals. All-caps shouting does not.',
      },
      {
        skill: 'punctuation',
        title: 'Comma in a list',
        stem: 'Which canteen order uses commas in a plain list?',
        options: [
          'Please pack a sandwich, an apple, and water.',
          'Please pack a sandwich an apple and water',
          'Please pack, a sandwich an apple and, water.',
        ],
        correct_index: 0,
        explanation: 'Commas separate items in a list. Random commas in the wrong spots confuse the reader.',
      },
    ],
    structure: [
      {
        skill: 'structure',
        title: 'One job per part',
        stem: `In a ${label}, a middle paragraph should usually:`,
        options: [
          'Develop one idea with a short example',
          'List ten unrelated topics',
          'Start a new text type halfway through',
        ],
        correct_index: 0,
        explanation: 'Structure improves when each paragraph has a job the reader can follow.',
      },
      {
        skill: 'structure',
        title: 'Open clearly',
        stem: 'The opening should usually:',
        options: [
          'Show the purpose or hook in the first lines',
          'Hide the topic until a last-line twist',
          'Copy a shopping list',
        ],
        correct_index: 0,
        explanation: 'Start so the marker knows what this piece is doing. Twists that hide the task lose marks.',
      },
      {
        skill: 'structure',
        title: 'Finish the job',
        stem: `A strong ending for a ${label} usually:`,
        options: [
          'Closes the purpose (learn, request, recommend, or thank)',
          'Opens a brand-new topic never mentioned',
          'Stops mid-sentence with no close',
        ],
        correct_index: 0,
        explanation: 'End the job you started. A new topic at the end looks unfinished.',
      },
    ],
  };

  const chosen: RawQuestion[] = [];
  const cycle = skills.length > 0 ? skills : (['format'] as MiniSkill[]);
  const pool: RawQuestion[] = [];
  for (const skill of cycle) {
    const items = bank[skill];
    for (let offset = 0; offset < items.length; offset += 1) {
      pool.push(items[(variation + offset) % items.length]);
    }
  }
  for (const skill of Object.keys(bank) as MiniSkill[]) {
    if (cycle.includes(skill)) continue;
    pool.push(...bank[skill]);
  }

  const seen: MiniQuestionRef[] = [...alreadyOnUnit];
  for (const question of pool) {
    if (chosen.length >= packSize) break;
    const asRef: MiniQuestionRef = {
      title: asTrimmedString(question.title),
      stem: asTrimmedString(question.stem),
      options: Array.isArray(question.options)
        ? question.options.map((item) => asTrimmedString(item))
        : [],
    };
    if (!asRef.stem) continue;
    if (seen.some((row) => isSameMiniQuestion(asRef, row))) continue;
    chosen.push(question);
    seen.push(asRef);
  }
  return chosen;
}

export function buildFallbackPack(input: {
  moduleId: number;
  promptType: WritingType;
  focus: MiniFocus;
  packSize: number;
  startOrder: number;
  variation: number;
  existingQuestions?: MiniQuestionRef[];
}): GeneratedMiniDrill[] {
  const alreadyOnUnit = unitQuestionRefs(
    input.moduleId,
    input.existingQuestions,
  );
  const parsed = parseGeneratedPack(
    {
      questions: fallbackQuestions(
        input.promptType,
        input.focus.skills,
        input.variation,
        alreadyOnUnit,
        input.packSize,
      ),
    },
    input.focus.skills,
  );
  const novel = keepNovelMiniQuestions(parsed, alreadyOnUnit).slice(
    0,
    input.packSize,
  );

  return novel.map((question, index) => ({
    ...question,
    slug: `ai-${input.moduleId}-${randomUUID()}`,
    module_id: input.moduleId,
    prompt_type: input.promptType,
    sort_order: input.startOrder + index + 1,
  }));
}

export async function generateMiniPack(input: {
  moduleId: number;
  promptType: WritingType;
  unitLabel: string;
  focus: MiniFocus;
  missedStems: string[];
  packSize: number;
  startOrder: number;
  variation: number;
  existingQuestions?: MiniQuestionRef[];
}): Promise<{ drills: GeneratedMiniDrill[]; via: 'openai' | 'fallback' }> {
  const alreadyOnUnit = unitQuestionRefs(
    input.moduleId,
    input.existingQuestions,
  );
  const attach = (
    questions: ReturnType<typeof parseGeneratedPack>,
    via: 'openai' | 'fallback',
  ) => ({
    via,
    drills: keepNovelMiniQuestions(questions, alreadyOnUnit)
      .slice(0, input.packSize)
      .map((question, index) => ({
        ...question,
        slug: `ai-${input.moduleId}-${randomUUID()}`,
        module_id: input.moduleId,
        prompt_type: input.promptType,
        sort_order: input.startOrder + index + 1,
      })),
  });

  if (isOpenAIConfigured()) {
    try {
      const fromAi = await generateWithOpenAI({
        ...input,
        alreadyOnUnit,
      });
      if (fromAi.length >= input.packSize) {
        return attach(fromAi, 'openai');
      }
      if (fromAi.length > 0) {
        const padded = [
          ...fromAi,
          ...buildFallbackPack({
            ...input,
            existingQuestions: [...alreadyOnUnit, ...fromAi],
          }),
        ];
        return attach(padded, 'openai');
      }
      console.error(
        '[generate-mini-drills] OpenAI returned no valid mini questions; using fallback pack',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OpenAI generate failed';
      console.error('[generate-mini-drills] OpenAI generate failed; using fallback pack:', message);
    }
  }

  return {
    via: 'fallback',
    drills: buildFallbackPack({
      ...input,
      existingQuestions: alreadyOnUnit,
    }),
  };
}
