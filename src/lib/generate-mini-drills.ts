import { randomUUID } from 'crypto';
import { createJsonCompletion, isOpenAIConfigured } from '@/lib/openai';
import {
  EXTRA_PACK_SIZE,
  type MiniFocus,
} from '@/lib/mini-weakness';
import {
  SEED_MINI_DRILLS,
  isMiniSkill,
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

export function parseGeneratedQuestion(
  raw: RawQuestion,
  allowedSkills: MiniSkill[],
): Omit<GeneratedMiniDrill, 'slug' | 'module_id' | 'prompt_type' | 'sort_order'> | null {
  const skillRaw = asTrimmedString(raw.skill);
  if (!isMiniSkill(skillRaw)) return null;
  if (allowedSkills.length > 0 && !allowedSkills.includes(skillRaw)) return null;

  const title = asTrimmedString(raw.title);
  const stem = asTrimmedString(raw.stem);
  const explanation = asTrimmedString(raw.explanation);
  const options = uniqueOptions(
    Array.isArray(raw.options)
      ? raw.options.map((item) => asTrimmedString(item)).filter(Boolean)
      : [],
  );
  const correctIndex = Number(raw.correct_index);

  if (title.length < 3 || title.length > 72) return null;
  if (stem.length < 12 || stem.length > 320) return null;
  if (explanation.length < 12 || explanation.length > 420) return null;
  if (options.length !== 3) return null;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 2) {
    return null;
  }

  return {
    skill: skillRaw,
    title,
    stem,
    options,
    correct_index: correctIndex,
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
  return parsed.filter((question) => {
    const key = question.stem.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function exampleSeeds(moduleId: number, skills: MiniSkill[]) {
  return SEED_MINI_DRILLS.filter(
    (drill) => drill.module_id === moduleId && skills.includes(drill.skill),
  )
    .slice(0, 6)
    .map((drill) => ({
      skill: drill.skill,
      title: drill.title,
      stem: drill.stem,
      options: drill.options,
      correct_index: drill.correct_index,
    }));
}

async function generateWithOpenAI(input: {
  moduleId: number;
  promptType: WritingType;
  unitLabel: string;
  focus: MiniFocus;
  missedStems: string[];
  packSize: number;
}): Promise<ReturnType<typeof parseGeneratedPack>> {
  const examples = exampleSeeds(input.moduleId, input.focus.skills);

  const raw = await createJsonCompletion({
    temperature: 0.5,
    system: [
      'You write extra multiple-choice mini questions for NSW Selective Writing practice.',
      'Year 5–6 only. Short, clear, not extra-hard. No rare words. No tricks.',
      'Target the requested skills for this text type (format, audience, word choice, punctuation, or structure).',
      'Each question has exactly 3 options and one obviously best answer.',
      'Wrong options should be common student mix-ups (wrong text type, slang, missing punctuation).',
      'Explanations are one or two short sentences a student can use on the next draft.',
      'Return ONLY JSON: { "questions": [ { "skill", "title", "stem", "options", "correct_index", "explanation" } ] }',
    ].join('\n'),
    user: {
      text_type: input.promptType,
      unit_label: input.unitLabel,
      target_skills: input.focus.skills,
      why: input.focus.reason,
      how_many: input.packSize,
      missed_question_stems: input.missedStems.slice(0, 8),
      style_examples: examples,
    },
  });

  return parseGeneratedPack(JSON.parse(raw), input.focus.skills);
}

function fallbackQuestions(
  promptType: WritingType,
  skills: MiniSkill[],
  variation: number,
): RawQuestion[] {
  const label = typeLabel(promptType);
  const slot = variation % 3;
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
        stem: `Which line belongs in a ${label}?`,
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
        title: 'End the sentence',
        stem: 'Which sentence is punctuated correctly?',
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
        title: 'it’s or its',
        stem: 'Which sentence is correct?',
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
        title: 'A name capital',
        stem: 'Which sentence uses capitals correctly?',
        options: [
          'Ms Lee asked Year 5 to wait near the hall.',
          'ms lee asked year 5 to wait near the hall.',
          'MS LEE ASKED YEAR 5 TO WAIT NEAR THE HALL!!!!',
        ],
        correct_index: 0,
        explanation: 'Names and the start of a sentence take capitals. All-caps shouting does not.',
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
  for (let i = 0; i < EXTRA_PACK_SIZE; i += 1) {
    const skill = cycle[i % cycle.length];
    const options = bank[skill];
    chosen.push(options[(slot + i) % options.length]);
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
}): GeneratedMiniDrill[] {
  const parsed = parseGeneratedPack(
    { questions: fallbackQuestions(input.promptType, input.focus.skills, input.variation) },
    input.focus.skills,
  ).slice(0, input.packSize);

  return parsed.map((question, index) => ({
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
}): Promise<{ drills: GeneratedMiniDrill[]; via: 'openai' | 'fallback' }> {
  const attach = (
    questions: ReturnType<typeof parseGeneratedPack>,
    via: 'openai' | 'fallback',
  ) => ({
    via,
    drills: questions.slice(0, input.packSize).map((question, index) => ({
      ...question,
      slug: `ai-${input.moduleId}-${randomUUID()}`,
      module_id: input.moduleId,
      prompt_type: input.promptType,
      sort_order: input.startOrder + index + 1,
    })),
  });

  if (isOpenAIConfigured()) {
    const fromAi = await generateWithOpenAI(input);
    if (fromAi.length < 2) {
      throw new Error('OpenAI did not return enough valid mini questions');
    }
    return attach(fromAi, 'openai');
  }

  return {
    via: 'fallback',
    drills: buildFallbackPack(input),
  };
}
