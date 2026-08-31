/**
 * Seed prompts for the per-type Units. Each prompt's `module_id` is the Unit id
 * (see src/lib/units.ts) and `prompt_type` matches that Unit's text type.
 */
import { EXTRA_WRITING_PROMPTS } from './seed-prompts-extra';
import type { WritingType } from './units';

export type PromptKind = 'practice' | 'test';

export type SeedPrompt = {
  title: string;
  description: string;
  prompt_type: WritingType;
  module_id: number;
  hint_points: [string, string, string];
  sample_answer_high: string;
  sample_answer_medium: string;
  is_locked: boolean;
  time_limit_minutes: number;
  is_active: boolean;
  kind?: PromptKind;
};

export const CORE_WRITING_PROMPTS: SeedPrompt[] = [
  // ─────────────── Unit 1 · Narrative ───────────────
  {
    title: 'The locked door',
    description:
      'Every day you walk past a door at the back of your school that is always locked. This morning, it is open.\n\nWrite a narrative about what happens when you go through the door.',
    prompt_type: 'narrative',
    module_id: 1,
    hint_points: [
      'Open with a hook and set the scene clearly',
      'Build tension through the middle with vivid detail',
      'Resolve the story with a satisfying or surprising ending',
    ],
    sample_answer_high:
      'The handle had never turned before. Today it gave with a soft click, and the cold breath of the corridor pulled me in.\n\nInside, dust hung like slow snow. Shelves rose into the dark, each one crowded with jars that glowed faintly — bottled afternoons, someone had labelled them, and rainy Tuesdays. My fingers hovered over a jar marked first day of school.\n\nA floorboard groaned. I spun, heart hammering, and found only my own reflection in a tall, spotted mirror — except the reflection was smiling when I was not.\n\nI did not wait to ask why. I ran, the door slamming behind me, and when I looked back it was locked again, as if it had never opened at all. But my pocket was heavy now, and inside it a small glass jar glowed with the warmth of a memory I had not yet made.',
    sample_answer_medium:
      'The door was open so I went in. It was dark and dusty with lots of shelves and strange jars. I heard a noise and got scared. I saw a mirror and my reflection looked weird. I ran out and the door locked again. I found a small jar in my pocket. It was a strange day.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 2 · Diary Entry ───────────────
  {
    title: 'In the future',
    description:
      'Imagine the date is July 19th 2099.\n\nWrite a diary entry of someone your own age who is living in the future. Use the sentence below to start your diary:\n\nDear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that...\n\nIn your writing, you could include interesting, futuristic details about:\n• technology\n• ways to travel\n• home and social life.',
    prompt_type: 'diary_entry',
    module_id: 2,
    hint_points: [
      'Include interesting futuristic details about technology',
      'Describe ways to travel in 2099',
      'Show home and social life in the future',
    ],
    sample_answer_high:
      'Dear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that today was Sky-Bridge Day — the first time Year 6 could ride the magnetic pods alone.\n\nMy wrist-holo flashed a green route: kitchen → balcony pad → school dome in four minutes. Below us, gardens grew on every roof and delivery drones hummed like bees.\n\nAt lunch, friends beamed in from three suburbs for a shared AR picnic; we ate real mangoes while our avatars raced on Mars tracks. Mum still insists we talk face-to-face at dinner, robot muted.\n\nI fell asleep planning tomorrow’s pod solo. 2099 feels noisy, bright, and somehow still like home.',
    sample_answer_medium:
      'Dear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that school was starting. I used a flying bus to get there. At home we have screens everywhere. I played games with friends online. The future is cool but also busy.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Sports carnival day',
    description:
      'Write a diary entry about an unforgettable sports carnival at your school. Include how the day began, a tense or funny moment during an event, and how you felt at the end.',
    prompt_type: 'diary_entry',
    module_id: 2,
    hint_points: [
      'Set the scene for how the day began',
      'Describe a tense or funny moment during an event',
      'Reflect on your feelings at the end of the day',
    ],
    sample_answer_high:
      'Dear Diary,\nHouse shirts blazed across the oval at 8:10 and my stomach did cartwheels before the whistle.\n\nIn the relay I fumbled the baton — then Mia yelled “still run!” and the crowd noise became a tunnel. We still placed second, laughing so hard we nearly forgot the medal.\n\nBy sunset my legs ached and my voice was gone, but belonging felt louder than winning. Best carnival yet.',
    sample_answer_medium:
      'Dear Diary,\nToday was sports carnival. I ran in a race and it was close. Something funny happened when someone dropped a baton. At the end I was tired but happy.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 3 · News Report ───────────────
  {
    title: 'Chaos on the beach',
    description:
      'A shipping container with party accessories has been washed up on a beach. The container has burst open and the contents have gone everywhere. Crowds of people have rushed to the beach to have a look at the balloons, plastic straws, plates, cups and fancy dress costumes, etc.\n\nWrite a news report about this incident for the local paper.\n\nIn your report, you could:\n• explain what has happened\n• describe the impact on the beach and the sea\n• include comments from different people.',
    prompt_type: 'news_report',
    module_id: 3,
    hint_points: [
      'Explain clearly what has happened',
      'Describe the impact on the beach and the sea',
      'Include comments from different people',
    ],
    sample_answer_high:
      'PARTY RUBBISH TURNS BEACH INTO CHAOS\n\nSunrise Beach was buried under balloons, cups and fancy-dress costumes yesterday after a shipping container washed ashore and split open.\n\nLifeguard Maya Chen said tides dragged plastic “as far as the rock pools”. Volunteers filled twelve bags before dusk, yet straws still glittered in the shallows.\n\nLocal café owner Tom Reid called the scene “surreal — kids posing in pirate hats while seagulls fought over plates”. Council ranger Priya Nair urged visitors to leave items for safe disposal: “This is pollution, not a free party.”\n\nAuthorities are tracing the container’s owner while clean-up continues at first light.',
    sample_answer_medium:
      'Chaos on the Beach\n\nYesterday a container opened on the beach and party things went everywhere. People came to look. The beach was messy and some rubbish went in the sea. A lifeguard said it was bad. A parent said kids were excited. Cleaners will come tomorrow.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Lost pet notice',
    description:
      'A beloved neighbourhood pet has gone missing. Write a news report for the local paper that informs readers, describes the pet, and encourages the community to help.',
    prompt_type: 'news_report',
    module_id: 3,
    hint_points: [
      'Inform readers what has happened and when',
      'Describe the pet with useful identifying details',
      'Include community voices and a clear call to help',
    ],
    sample_answer_high:
      'SEARCH ON FOR “MAPLE” THE GINGER CAT\n\nResidents of Harbor Lane are searching for Maple, a ginger cat with a white-tipped tail missing since Tuesday evening.\n\nOwner Elise Park said Maple slipped out during a storm: “She is shy but answers to a treat jar.” Neighbour Omar Blake reported a similar cat near the bus stop at dusk.\n\nAnyone with information is asked to call the community hotline. Flyers are posted at the library and café until Maple is home safe.',
    sample_answer_medium:
      'Cat Missing\n\nA cat called Maple is missing. She is orange. The owner is sad. Please look for her and call if you see her. Neighbours said they will help.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 4 · Explanation ───────────────
  {
    title: 'Why do volcanoes erupt?',
    description:
      'Your science teacher has asked you to write a clear explanation for younger students.\n\nWrite an explanation of why volcanoes erupt.\n\nIn your writing, you could explain:\n• what is happening beneath the ground\n• the steps that lead to an eruption\n• why some eruptions are more powerful than others.',
    prompt_type: 'explanation',
    module_id: 4,
    hint_points: [
      'Explain what happens beneath the ground',
      'Set out the steps that lead to an eruption in order',
      'Use clear cause-and-effect language younger students understand',
    ],
    sample_answer_high:
      'HOW VOLCANOES ERUPT\n\nDeep below the ground, it is so hot that rock melts into a thick liquid called magma. Because magma is lighter than the solid rock around it, it slowly rises, collecting in a pocket called a magma chamber.\n\nAs more magma pushes up, pressure builds — like shaking a fizzy drink. Gases trapped inside the magma try to escape. When the pressure becomes too great, the magma bursts through a weak point in the Earth’s crust, and lava, ash and gas explode out.\n\nSome eruptions are gentle because the magma is runny and gases slip out easily. Others are violent because sticky magma traps gas until it explodes all at once. This is why no two volcanoes behave in exactly the same way.',
    sample_answer_medium:
      'Volcanoes erupt because of hot melted rock called magma under the ground. The magma rises and pressure builds up. Gas gets trapped. When there is too much pressure it bursts out as lava and ash. Some eruptions are bigger because the magma is thicker and traps more gas.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 5 · Advice Sheet ───────────────
  {
    title: 'New to the area',
    description:
      'Three new students have just arrived in your local area. Your teacher has asked you to write an advice sheet for them, making them feel enthusiastic about coming to your school.\n\nWrite an advice sheet for the new students about how to get on well in your school and local area.',
    prompt_type: 'advice_sheet',
    module_id: 5,
    hint_points: [
      'Explain how to get on well at school (routines, teachers, friendships)',
      'Highlight exciting local area activities and places',
      'Use a warm, encouraging tone that builds enthusiasm',
    ],
    sample_answer_high:
      'WELCOME TO RIVERVIEW!\n\nStarting somewhere new can feel huge, but you have picked a brilliant place to land.\n\nAt school\nBe curious in class and ask questions — our teachers love helpers. Join one club in your first fortnight (coding, drama or soccer are favourites) so you meet people fast. Sit with someone new at lunch on day one; almost everyone remembers being the new kid.\n\nAround the area\nAfter school, try the riverside bike path or Saturday markets. The library runs a quiet homework zone, and the community pool has junior squads if you like swimming.\n\nOne tip\nSmile, introduce yourself, and say yes to the first invitation you get. Riverview looks after its newcomers — we cannot wait to cheer you on.',
    sample_answer_medium:
      'Hello new students,\n\nWelcome to our school. To get on well, be friendly and listen to teachers. Join a club if you can. In the local area there is a park and shops. People here are nice so say hello. I hope you like it here.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'School buddy advice',
    description:
      'Your principal wants a short advice sheet for Year 5 students who will become “buddies” for new Kindergarten children next term.\n\nWrite an advice sheet that helps buddies feel confident, kind, and prepared.',
    prompt_type: 'advice_sheet',
    module_id: 5,
    hint_points: [
      'Explain how to make Kindergarten children feel safe',
      'Give practical playground and classroom tips',
      'Encourage kindness with a confident, friendly tone',
    ],
    sample_answer_high:
      'BUDDY GUIDE: SMALL HANDS, BIG HEARTS\n\nYour job is simple: help a little learner feel brave.\n\nFirst days\nKneel to their height, learn their name, and show toilets, bags, and the bubble taps. Smile more than you speak.\n\nPlaytime\nOffer two game choices, watch for tears, and fetch a teacher if someone is hurt. Never leave your buddy alone near the gate.\n\nMindset\nPatience is a superpower. If plans change, breathe and try again. Kindergarten remembers how you made them feel — be the calm friend you once needed.',
    sample_answer_medium:
      'Advice for Buddies\n\nBe nice to the little kids. Show them where things are. Play with them at lunch. Tell a teacher if there is a problem. Being kind is important.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 6 · Review ───────────────
  {
    title: 'Review a book you love',
    description:
      'Your school library is making a display of student recommendations.\n\nWrite a review of a book you love for other students your age.\n\nIn your review, you could:\n• give a taste of what the book is about (no big spoilers)\n• explain what makes it special\n• recommend who would enjoy it.',
    prompt_type: 'review',
    module_id: 6,
    hint_points: [
      'Give a spoiler-free taste of what the book is about',
      'Explain what makes it special, with reasons',
      'Recommend who would enjoy it and why',
    ],
    sample_answer_high:
      'A BOOK THAT KEPT ME UP PAST BEDTIME\n\nIf you have ever wished a story would grab you by the collar, meet *The Clockwork Sparrow*.\n\nSet in a glittering department store, it follows Sophie, a sharp-eyed shop girl who stumbles into a jewel theft and refuses to look away. The plot ticks along like the clockwork bird at its heart — every chapter ends on a hook that made me whisper “one more”.\n\nWhat makes it special is Sophie herself: clever, stubborn, and kind. The mystery is fair, so you can solve clues alongside her.\n\nReaders who love adventure, a dash of history, and a heroine who trusts herself will race through it. Give it to anyone who thinks they “don’t like reading” — this one changes minds.',
    sample_answer_medium:
      'I really liked *The Clockwork Sparrow*. It is about a girl called Sophie who solves a robbery in a big shop. It is exciting and the endings of chapters make you keep reading. I liked Sophie because she is clever and brave. I recommend it to people who like mysteries and adventure.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 7 · Advertisement ───────────────
  {
    title: 'The gadget of the future',
    description:
      'A company has invented an amazing new gadget for students and wants young people to write the advertisement.\n\nWrite an advertisement for a brand-new gadget of your own invention.\n\nIn your writing, you could:\n• describe what the gadget does\n• use persuasive, catchy language\n• make readers feel they must have it.',
    prompt_type: 'advertisement',
    module_id: 7,
    hint_points: [
      'Describe clearly what the gadget does',
      'Use catchy, persuasive language and a slogan',
      'Make the reader feel they must have it',
    ],
    sample_answer_high:
      'MEET THE HOMEWORK HERO — YOUR DESK’S NEW BEST FRIEND!\n\nTired of losing pens, focus, and time? The Homework Hero clips to any desk and changes everything.\n\nOne tap dims distractions, sets a gentle focus timer, and even whispers a hint when you’re stuck (never the answer — that’s cheating!). Its soft light glows green when you’re smashing your goals.\n\nStudents in trials finished homework 20 minutes faster and actually smiled about it.\n\nDon’t just do your homework. Beat it.\nHomework Hero — focus has never felt this good. Ask for yours today!',
    sample_answer_medium:
      'NEW! The Homework Hero!\n\nThis cool gadget helps you do your homework. It has a timer and a light and gives you hints. It helps you finish faster. Everyone will want one. Get the Homework Hero today!',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 8 · Persuasive Text ───────────────
  {
    title: 'Should students have homework?',
    description:
      'Your school is holding a debate about homework.\n\nWrite a persuasive text arguing whether students your age should be given homework.\n\nIn your writing, you should:\n• state your position clearly\n• give strong reasons and examples\n• answer what the other side might say.',
    prompt_type: 'persuasive_text',
    module_id: 8,
    hint_points: [
      'State your position clearly in the introduction',
      'Support it with strong reasons and examples',
      'Address and answer the opposing view',
    ],
    sample_answer_high:
      'HOMEWORK: LESS, BUT SMARTER\n\nStudents should be set homework — but only the kind that is worth their time.\n\nFirstly, short, focused practice helps ideas stick. Reading for fifteen minutes or revising ten spelling words builds skills that a single lesson cannot. Secondly, homework teaches responsibility: planning a small task each night is practice for the bigger deadlines of high school.\n\nSome argue homework steals family time and causes stress. That is true when it is pointless or endless. The answer is not to scrap homework, but to keep it brief and meaningful.\n\nA little homework, done well, is not a punishment — it is a promise to our future selves. Let’s keep it, and make it count.',
    sample_answer_medium:
      'I think students should have some homework. Homework helps you practise what you learned and remember it. It also teaches you to be responsible. Some people say homework is stressful, but if it is short it is okay. So we should have a little homework but not too much.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 9 · Formal Letter ───────────────
  {
    title: 'A letter to the council',
    description:
      'The empty lot near your home could become something useful for young people.\n\nWrite a formal letter to your local council persuading them to build something for children and teenagers on the empty lot.\n\nUse a polite, formal tone and set your letter out correctly.',
    prompt_type: 'formal_letter',
    module_id: 9,
    hint_points: [
      'Use correct formal letter structure and a polite tone',
      'Explain your request and why it matters',
      'Suggest how young people would benefit and be involved',
    ],
    sample_answer_high:
      'Dear Councillors,\n\nI am writing to ask you to turn the empty lot on Maple Street into a space for young people, such as a skate park and community garden.\n\nAt present, children in our area have nowhere safe to gather after school. A dedicated space would keep us active, reduce boredom, and give neighbours of all ages a reason to meet. Students from my school have already offered to help plan and care for it.\n\nI understand budgets are limited, so I suggest starting with a small trial: a few ramps and garden beds, reviewed after one year.\n\nThank you for considering my request. I would be glad to present our ideas at a council meeting.\n\nYours faithfully,\nJordan Lee',
    sample_answer_medium:
      'Dear Council,\n\nI am writing about the empty lot on Maple Street. I think you should build a park for kids and teenagers. There is nowhere to go after school. It would keep us active and happy. Students could help look after it. Please think about it.\n\nYours faithfully,\nJordan Lee',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 10 · Speech ───────────────
  {
    title: 'A speech to your school',
    description:
      'You have been asked to give a speech at a school assembly about something you believe would make your school even better.\n\nWrite the speech you would deliver.\n\nIn your writing, you could:\n• open in a way that grabs attention\n• give reasons that inspire your audience\n• end with a memorable call to action.',
    prompt_type: 'speech',
    module_id: 10,
    hint_points: [
      'Open in a way that grabs the audience’s attention',
      'Give reasons and examples that inspire listeners',
      'End with a memorable call to action',
    ],
    sample_answer_high:
      'Good morning, everyone.\n\nRaise your hand if you have ever eaten lunch alone. Keep it up. Now look around — you are not the only one. Today I want to talk about a simple idea that could change that: a Buddy Bench.\n\nA Buddy Bench is a spot in the playground where anyone who feels lonely can sit, and where the rest of us know to come and say hello. It costs almost nothing, but it tells every student the same thing: you belong here.\n\nImagine a school where no one is left out — where kindness is not a rule, but a habit. We already have the kindest students I know. We just need the bench.\n\nSo here is my challenge to you: this week, notice one person on their own, and invite them in. Let’s build the bench, and let’s build the friendships to go with it. Thank you.',
    sample_answer_medium:
      'Good morning everyone.\n\nHave you ever felt lonely at lunch? I think our school should have a Buddy Bench. It is a place where lonely students can sit and others come to talk to them. It would help people make friends and feel included. Please help make our school kinder. Let’s get a Buddy Bench. Thank you.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },

  // ─────────────── Unit 11 · Email ───────────────
  {
    title: 'A new superhero',
    description:
      'A movie company is holding a competition to win $1000. To enter you have to send an email to the company giving original ideas for a new superhero character for a blockbuster movie, graphic novel or book.\n\nWrite your email.\n\nIn your email, you could:\n• describe what the character looks like\n• explain how they use their superpowers\n• say why this character would be popular.\n\nYou do not need to include email formatting.',
    prompt_type: 'email',
    module_id: 11,
    hint_points: [
      'Describe what the character looks like',
      'Explain how they use their superpowers',
      'Say why this character would be popular',
    ],
    sample_answer_high:
      'Subject: Competition entry — Tideward\n\nHello Creative Team,\n\nPlease meet Tideward: a 14-year-old coastal guardian in a sea-glass cloak and coral-threaded boots, freckles glowing when danger nears.\n\nPowers: Tideward can reshape water into shields, whisper to marine life, and freeze a single wave mid-crash to buy rescue time. Strength grows with courage, not anger.\n\nWhy audiences will care: kids see a hero who protects beaches they love, mixing adventure with real-world stewardship. Merch writes itself — glow cloaks, tide charts, gentle strength.\n\nThank you for considering Tideward for your next blockbuster.\n\nKind regards,\nAva Chen',
    sample_answer_medium:
      'Hello,\n\nMy superhero is called Flash Kid. He wears a red suit and can run fast. He stops robbers and helps people. I think he would be popular because kids like speed and action. Please pick my idea.\n\nThanks.',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Community garden proposal',
    description:
      'Your local council is deciding whether to turn an empty lot into a community garden. They have asked young people for ideas.\n\nWrite an email to the council explaining why a community garden would help your neighbourhood and how students could be involved.',
    prompt_type: 'email',
    module_id: 11,
    hint_points: [
      'Explain clear benefits for the neighbourhood',
      'Describe how students could take part',
      'Persuade with a polite, confident email voice',
    ],
    sample_answer_high:
      'Subject: Support for a Riverview community garden\n\nDear Councillors,\n\nAn empty lot on Maple Street could become a shared garden that feeds families, cools our block, and gives students real science outdoors.\n\nOur class can run weekend planting clubs, compost workshops, and a produce share for elders nearby. Paths and raised beds would keep it accessible.\n\nPlease approve the garden trial this spring — Riverview is ready to dig in.\n\nYours sincerely,\nJordan Lee\nYear 6 Student Representative',
    sample_answer_medium:
      'Dear Council,\n\nI think a garden is a good idea. People can grow food and kids can help water plants. It would make the area nicer. Please say yes.\n\nFrom Sam',
    is_locked: false,
    time_limit_minutes: 30,
    is_active: true,
  },
];

export const SEED_PROMPTS: SeedPrompt[] = [
  ...CORE_WRITING_PROMPTS,
  ...EXTRA_WRITING_PROMPTS,
].map((prompt) => ({
  ...prompt,
  kind: prompt.kind ?? 'practice',
}));

export function isTestPrompt(kind: string | null | undefined): boolean {
  return kind === 'test';
}
