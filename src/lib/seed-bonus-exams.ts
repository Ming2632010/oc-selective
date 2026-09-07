/**
 * Original TrialSeed bonus exam papers.
 *
 * These follow Selective-style conditions (one 30-minute task, a clear
 * audience and form) but use new scenarios. They are not copies of NSW
 * Department of Education or Cambridge past papers.
 */
import type { SeedPrompt } from './seed-prompts';
import type { WritingType } from './units';

export const BONUS_EXAM_MODULE_ID = 12;

function paper(
  prompt_type: WritingType,
  title: string,
  description: string,
  hint_points: [string, string, string],
  sample_answer_high: string,
  sample_answer_medium: string,
): SeedPrompt {
  return {
    title,
    description,
    prompt_type,
    module_id: BONUS_EXAM_MODULE_ID,
    hint_points,
    sample_answer_high,
    sample_answer_medium,
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
    kind: 'bonus',
  };
}

export const BONUS_EXAM_PROMPTS: SeedPrompt[] = [
  paper(
    'news_report',
    'Night market goes dark',
    'Last Saturday the lanterns at Riverview Night Market failed for forty minutes. Stalls kept trading by phone-torch and neighbours brought spare lights from home.\n\nWrite a news report for the local paper.\n\nIn your report, you could:\n• explain what happened and when\n• describe the effect on stallholders and visitors\n• include comments from different people.',
    [
      'Lead with what happened, where, and when',
      'Show the effect on stallholders and visitors',
      'Include at least two different voices',
    ],
    'LANTERNS FAIL, MARKET KEEPS GLOWING\n\nRiverview Night Market went dark at 7:12pm on Saturday when the lantern circuit failed, leaving more than sixty stalls in sudden shadow.\n\nFood-stall owner Mei Tan said she “sold soup by phone-torch and still ran out”. Visitors formed a human chain of bicycle lights along the aisle. Electrician Paul Okeke told council the fault was a soaked junction box after Friday’s storm.\n\nMayor Lila Hart praised the crowd: “People stayed, shared batteries, and nobody was hurt.” Power returned at 7:52pm. Council will inspect the wiring before next month’s market.',
    'Night Market Goes Dark\n\nOn Saturday the lights at Riverview Night Market stopped working. People used phones to see. Some stallholders were worried. A visitor said it was strange but they stayed. The lights came back later. Council will check the wires.',
  ),
  paper(
    'diary_entry',
    'A week without power',
    'A storm has cut electricity to your street for seven days. School stayed open. Neighbours shared food and news on paper notes.\n\nWrite a diary entry from the last evening of that week.\n\nIn your writing, you could include:\n• how daily life changed\n• one tense or kind moment\n• how you feel now that power is due back tonight.',
    [
      'Write in first person as a diary, not a story told from outside',
      'Show one clear moment from the powerless week',
      'End with how you feel about the lights coming back',
    ],
    'Dear Diary,\nThe street is still black, but the repair truck’s orange light is already on the corner.\n\nThis week we boiled water on Mrs Karim’s camping stove and did homework by the window until the sky gave up. On Wednesday I ran the last note to Number 14 — “extra rice, come over” — and their dog walked me home because the crossing had no lamps.\n\nI liked the quiet more than I expected. I also missed the kettle. Tonight I will flick every switch once, just to hear the house wake up.',
    'Dear Diary,\nWe had no power for a week. It was hard to do homework. Neighbours shared food. I felt bored and a bit scared at night. The lights are coming back tonight and I am happy.',
  ),
  paper(
    'email',
    'A board game they have not made',
    'A toy company has asked young people for original board-game ideas. To enter, you email the company with one new game.\n\nWrite the email.\n\nIn your email, you could:\n• name the game and explain how it is played\n• say what makes it different\n• explain why children your age would want it.\n\nYou do not need to include full email headers.',
    [
      'Give the game a clear name and a simple way to play',
      'Say what is new about it',
      'Keep a polite, confident email voice',
    ],
    'Subject: Game idea — Bridge Builders\n\nHello Design Team,\n\nPlease consider Bridge Builders, a two-to-four player game set on a flooded town map.\n\nEach turn, a player plays a timber, stone, or rope card to join two islands. Storm cards can snap a weak bridge. The winner is the first team to link the school, clinic, and jetty.\n\nIt is different because players must cooperate on some turns and compete on others, so nobody sits out. Year 6 students already argue about the fairest path home after rain — this game turns that into a table.\n\nThank you for reading.\n\nKind regards,\nSam Rivera',
    'Hello,\n\nMy game is called Fast Cards. You put cards down and the highest number wins. Kids would like it because it is easy. Please make it.\n\nThanks.',
  ),
  paper(
    'news_report',
    'The wall that appeared overnight',
    'Residents woke to find a large painted mural on the side of the old bus depot. Nobody has claimed it. Some people want it kept. Others want it removed.\n\nWrite a news report for the town website.\n\nIn your report, you could:\n• describe the mural and where it is\n• explain why people disagree\n• include comments from different people.',
    [
      'Open with the facts: what appeared, where, and when',
      'Show both sides of the argument',
      'Use comments that sound like real people',
    ],
    'MYSTERY MURAL SPLITS DEPOT STREET\n\nA full-wall painting of migrating birds appeared on the old bus depot overnight, stretching from the loading dock to the corner clock.\n\nArt teacher Nina Cole called it “the best welcome our street has had in years”. Depot neighbour Craig Holt said the wall is council property: “Talent is not a permit.”\n\nNo artist has come forward. Council ranger Devi Sharma said the work will stay for fourteen days while they seek the painter and check the brickwork. “If it is safe, the community can vote,” she said.\n\nCrowds photographed the wall at dawn. Chalk messages at the base already read keep it and paint over.',
    'A Mural Appeared\n\nThis morning people saw a big painting on the bus depot. Some like it and some do not. A teacher said it is beautiful. A neighbour said it should not be there. Council will decide later.',
  ),
  paper(
    'narrative',
    'The midnight bell',
    'Your school bell rings once, clearly, at midnight. You are the only person who hears it from the street.\n\nWrite the opening of a narrative about what happens next. You do not need to finish the whole story, but the opening should set the place, the problem, and a reason to keep reading.',
    [
      'Start in the moment the bell rings — do not explain first',
      'Show the place with precise detail',
      'Leave a question or danger that pulls the reader on',
    ],
    'The bell should have been asleep. It sounded once — a clean, classroom note — and the empty street held it like a cup.\n\nI was halfway home, jumper still damp from training, when the second sound did not come. One ring. Then the gym windows bloomed with a pale green light that did not belong to any teacher I knew.\n\nI should have kept walking. Instead I put my palm on the gate. It was warm.\n\nInside, someone was lining up the chairs for an assembly that was not on any calendar.',
    'I heard the school bell at midnight and I was surprised. I went to look. The school was dark except for one light. I felt scared but I went in to see what was happening.',
  ),
  paper(
    'speech',
    'One late night in the library',
    'Your school is deciding whether to keep the library open until 7pm one night each week. You have been asked to speak at assembly.\n\nWrite the speech.\n\nIn your speech, you could:\n• explain who would use the late night and why\n• answer one worry adults might have\n• end with a clear request.',
    [
      'Open by speaking to the assembly, not to a page',
      'Give reasons that fit students and families',
      'End with one clear ask',
    ],
    'Good morning, staff and students.\n\nI am asking you to keep Thursday late-library night.\n\nSome of us share a computer at home. Some of us have younger siblings who need the table after dinner. From 5 until 7, the library is quiet enough to finish a draft and still catch the late bus.\n\nPeople worry about safety. Two staff already stay for choir. The same pair can lock the doors at 7, and a sign-out sheet can sit on the desk.\n\nPlease vote to keep one late night. Thirty extra minutes of shelves is not a luxury. It is a chance to finish the work we started.',
    'Hello everyone.\n\nI think the library should stay open later. Students can do homework. It is quiet. Please say yes. Thank you.',
  ),
];
