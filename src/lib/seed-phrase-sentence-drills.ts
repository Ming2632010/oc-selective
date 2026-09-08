import type { PhraseSentencePrompt } from '@/lib/mini-item-kinds';
import type { MiniSkill } from '@/lib/seed-mini-drills';
import type { WritingType } from '@/lib/units';

export type SeedPhraseSentenceDrill = {
  slug: string;
  module_id: number;
  prompt_type: WritingType;
  skill: MiniSkill;
  item_kind: 'phrase_sentence';
  title: string;
  stem: string;
  explanation: string;
  sort_order: number;
  prompt: PhraseSentencePrompt;
};

function phraseSentence(
  module_id: number,
  prompt_type: WritingType,
  skill: MiniSkill,
  title: string,
  stem: string,
  phrase: string,
  task: string,
  sample: string,
): SeedPhraseSentenceDrill {
  return {
    slug: `unit-${module_id}-phrase-sentence-19`,
    module_id,
    prompt_type,
    skill,
    item_kind: 'phrase_sentence',
    title,
    stem,
    explanation: 'Use the phrase naturally and make the sentence sound like this unit’s writing type.',
    sort_order: 19,
    prompt: {
      phrase,
      task,
      minWords: 7,
      maxWords: 35,
      requireCapital: true,
      requireEndPunct: true,
      sample,
    },
  };
}

/** One AI-marked phrase-in-context sentence task for every writing unit. */
export const SEED_PHRASE_SENTENCE_DRILLS: SeedPhraseSentenceDrill[] = [
  phraseSentence(
    1, 'narrative', 'vocabulary', 'A sudden turn',
    'Use the phrase “without warning” in one narrative sentence.',
    'without warning', 'Write a story sentence where something unexpected happens.',
    'Without warning, the library lights flickered and the locked door swung open.',
  ),
  phraseSentence(
    2, 'diary_entry', 'audience', 'A real reaction',
    'Use the phrase “I could not believe” in one diary sentence.',
    'I could not believe', 'Write a personal diary sentence about something that happened to you.',
    'I could not believe that my lunchbox was still sitting on the oval bench.',
  ),
  phraseSentence(
    3, 'news_report', 'format', 'Name the source',
    'Use the phrase “according to” in one news-report sentence.',
    'according to', 'Write a calm factual sentence that names where the information came from.',
    'According to the principal, the flooded oval will remain closed until Friday.',
  ),
  phraseSentence(
    4, 'explanation', 'structure', 'Show the result',
    'Use the phrase “as a result” in one explanation sentence.',
    'as a result', 'Explain a cause and its result.',
    'The compost pile received fresh air; as a result, the scraps began to break down.',
  ),
  phraseSentence(
    5, 'advice_sheet', 'audience', 'Give helpful advice',
    'Use the phrase “make sure” in one advice-sheet sentence.',
    'make sure', 'Give a reader a clear, friendly tip for an excursion.',
    'Make sure you pack a hat and water bottle before the excursion.',
  ),
  phraseSentence(
    6, 'review', 'format', 'Make a recommendation',
    'Use the phrase “I would recommend” in one review sentence.',
    'I would recommend', 'Recommend a book or film and give one reason.',
    'I would recommend The Hidden Gate because its mystery is easy to follow.',
  ),
  phraseSentence(
    7, 'advertisement', 'audience', 'Invite the reader',
    'Use the phrase “don’t miss” in one advertisement sentence.',
    'don’t miss', 'Invite families to a school book fair.',
    'Don’t miss Saturday’s book fair, where every purchase helps our library.',
  ),
  phraseSentence(
    8, 'persuasive_text', 'structure', 'State a position',
    'Use the phrase “we should” in one persuasive sentence.',
    'we should', 'State a respectful position about a school improvement.',
    'We should open a quiet reading room because students need a calm place to work.',
  ),
  phraseSentence(
    9, 'formal_letter', 'format', 'Start with purpose',
    'Use the phrase “I am writing to” in one formal-letter sentence.',
    'I am writing to', 'Politely state the purpose of a letter to the principal.',
    'I am writing to request that the bins near Hall B are emptied before lunch.',
  ),
  phraseSentence(
    10, 'speech', 'format', 'Name your point',
    'Use the phrase “I want to talk about” in one speech sentence.',
    'I want to talk about', 'Address an assembly and introduce a school issue.',
    'Good morning, everyone. I want to talk about litter near the oval.',
  ),
  phraseSentence(
    11, 'email', 'audience', 'Make a polite request',
    'Use the phrase “Could you please” in one email sentence.',
    'Could you please', 'Politely ask a teacher for the homework link.',
    'Could you please send me the homework link from Tuesday?',
  ),
];
