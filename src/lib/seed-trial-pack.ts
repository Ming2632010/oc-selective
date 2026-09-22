import type { WritingType } from '@/lib/units';
import type { MiniSkill } from '@/lib/seed-mini-drills';

export const TRIAL_PACK_PROMPT_TITLE = 'The yellow raincoat';

export const TRIAL_PACK_PROMPT = {
  title: TRIAL_PACK_PROMPT_TITLE,
  description:
    'On a wet Monday a yellow raincoat is hanging on your classroom door. Nobody claims it. At lunch you put it on, and the playground looks different.\n\nWrite a narrative about what happens next.',
  prompt_type: 'narrative' as WritingType,
  module_id: 1,
  hint_points: [
    'Open on the raincoat and the change you notice',
    'Give the character a clear problem or choice in the middle',
    'Finish the story so the ending belongs to this wet Monday',
  ] as [string, string, string],
  sample_answer_high:
    'The raincoat smelled of river water. I only meant to try one sleeve, but the playground went quiet, as if the rain had pressed pause.\n\nKids were still there — Maya with her apple, Jonah kicking a puddle — yet their mouths moved without sound. A paper boat slid past my shoe and unfolded into a map of the school, with a red X on the locked sports shed.\n\nI should have taken the coat off. Instead I ran. The shed door, always chained, lifted like a curtain. Inside, a younger me sat on a crate, shivering, waiting for someone to come back.\n\nI hung the raincoat on the crate. Sound rushed in with the rain. When I returned to class, the hook on the door was empty, and my own coat — the grey one Mum labelled — was dry on my chair.',
  sample_answer_medium:
    'I saw a yellow raincoat on the door and put it on. Outside everything looked shiny. I walked around and found a shed. I went in and it was dark. Then I took the coat off and went back to class. It was a strange lunchtime.',
  is_locked: false,
  time_limit_minutes: 30,
  is_active: true,
  kind: 'trial' as const,
};

export type TrialPackDrill = {
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

function trialDrill(
  sort_order: number,
  skill: MiniSkill,
  prompt_type: WritingType,
  title: string,
  stem: string,
  options: string[],
  correct_index: number,
  explanation: string,
): TrialPackDrill {
  return {
    slug: `trial-pack-${String(sort_order).padStart(2, '0')}`,
    module_id: 1,
    prompt_type,
    skill,
    title,
    stem,
    options,
    correct_index,
    explanation,
    sort_order,
  };
}

/** Extra trial-only questions. Paid unit banks do not include these rows. */
export const TRIAL_PACK_DRILLS: TrialPackDrill[] = [
  trialDrill(
    1,
    'format',
    'narrative',
    'Story shape',
    'A Selective narrative is usually strongest when it has:',
    [
      'A beginning, a problem or change, and an ending that belongs to that story',
      'A list of what the character packed for lunch',
      'Only dialogue and no setting at all',
    ],
    0,
    'Markers look for a complete little story, not a shopping list or a chat with no place.',
  ),
  trialDrill(
    2,
    'audience',
    'diary_entry',
    'Who a diary is for',
    'A diary entry is usually written for:',
    [
      'The writer, in a private first-person voice',
      'A principal who must be persuaded in formal language',
      'A newspaper reader who wants facts and quotes',
    ],
    0,
    'A diary talks to the self. Formal letters and news reports have other readers.',
  ),
  trialDrill(
    3,
    'vocabulary',
    'narrative',
    'A sharper verb',
    'Which verb makes the action clearer than “went”?',
    ['Slipped', 'Went', 'Did'],
    0,
    '“Slipped” shows how the character moved. “Went” and “did” stay vague.',
  ),
  trialDrill(
    4,
    'punctuation',
    'narrative',
    'Speech marks',
    'Which sentence punctuates the spoken words correctly?',
    [
      '“Leave it,” Maya whispered.',
      'Leave it, Maya whispered.',
      '“Leave it, Maya whispered.',
    ],
    0,
    'Spoken words need opening and closing speech marks, and the comma stays inside.',
  ),
  trialDrill(
    5,
    'structure',
    'explanation',
    'A useful opening',
    'The most useful first sentence of an explanation is one that:',
    [
      'Tells the reader what will be explained',
      'Starts with a joke that never comes back',
      'Asks the reader to buy something',
    ],
    0,
    'Explanations open by naming the idea, then unpack it step by step.',
  ),
  trialDrill(
    6,
    'format',
    'news_report',
    'News opening',
    'A news report should usually begin with:',
    [
      'The most important fact: what happened, who, and where',
      'The writer’s childhood memory of a similar day',
      'A rhyming chorus for the reader to clap',
    ],
    0,
    'News leads with the event. Memories and songs belong in other forms.',
  ),
  trialDrill(
    7,
    'audience',
    'formal_letter',
    'A formal greeting',
    'The best greeting for a letter to a principal is:',
    ['Dear Ms Tan,', 'Hey!!!', 'To whom it may be,'],
    0,
    'A named, polite greeting matches a formal school reader.',
  ),
  trialDrill(
    8,
    'vocabulary',
    'review',
    'A precise adjective',
    'Which word tells a reader more than “nice”?',
    ['Crisp', 'Nice', 'Good'],
    0,
    '“Crisp” gives a specific quality. “Nice” and “good” stay empty.',
  ),
  trialDrill(
    9,
    'punctuation',
    'diary_entry',
    'Apostrophe for belonging',
    'Which phrase shows that the raincoat belongs to Jonah?',
    ['Jonah’s raincoat', 'Jonahs raincoat', 'Jonahs’ raincoat'],
    0,
    'One owner takes ’s. A plural owners’ mark would need more than one Jonah.',
  ),
  trialDrill(
    10,
    'structure',
    'narrative',
    'An ending that fits',
    'A strong narrative ending usually:',
    [
      'Closes the problem the story opened',
      'Starts a brand-new adventure with new characters',
      'Lists every character’s favourite colour',
    ],
    0,
    'The ending should finish this story’s problem, not open a different book.',
  ),
];
