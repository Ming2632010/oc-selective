/**
 * Seed prompts derived from NSW SHS Writing practice / past papers
 * in `Writing questions info/`, plus complementary practice tasks
 * so modules 1–6 each have coverage.
 */
export type SeedPrompt = {
  title: string;
  description: string;
  prompt_type: 'newspaper_report' | 'diary_entry' | 'email' | 'advice_sheet';
  module_id: number;
  hint_points: [string, string, string];
  sample_answer_high: string;
  sample_answer_medium: string;
  is_locked: boolean;
  time_limit_minutes: number;
  is_active: boolean;
};

export const SEED_PROMPTS: SeedPrompt[] = [
  {
    title: 'New to the area',
    description:
      'Three new students have just arrived in your local area. Your teacher has asked you to write an advice sheet for them, making them feel enthusiastic about coming to your school.\n\nWrite an advice sheet for the new students about how to get on well in your school and local area.',
    prompt_type: 'advice_sheet',
    module_id: 1,
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
    title: 'Chaos on the beach',
    description:
      'A shipping container with party accessories has been washed up on a beach. The container has burst open and the contents have gone everywhere. Crowds of people have rushed to the beach to have a look at the balloons, plastic straws, plates, cups and fancy dress costumes, etc.\n\nWrite a newspaper report about this incident for the local paper.\n\nIn your report, you could:\n• explain what has happened\n• describe the impact on the beach and the sea\n• include comments from different people.',
    prompt_type: 'newspaper_report',
    module_id: 2,
    hint_points: [
      'Explain clearly what has happened',
      'Describe the impact on the beach and the sea',
      'Include comments from different people',
    ],
    sample_answer_high:
      'PARTY RUBBISH TURNS BEACH INTO CHAOS\n\nSunrise Beach was buried under balloons, cups and fancy-dress costumes yesterday after a shipping container washed ashore and split open.\n\nLifeguard Maya Chen said tides dragged plastic “as far as the rock pools”. Volunteers filled twelve bags before dusk, yet straws still glittered in the shallows.\n\nLocal café owner Tom Reid called the scene “surreal — kids posing in pirate hats while seagulls fought over plates”. Council ranger Priya Nair urged visitors to leave items for safe disposal: “This is pollution, not a free party.”\n\nAuthorities are tracing the container’s owner while clean-up continues at first light.',
    sample_answer_medium:
      'Chaos on the Beach\n\nYesterday a container opened on the beach and party things went everywhere. People came to look. The beach was messy and some rubbish went in the sea. A lifeguard said it was bad. A parent said kids were excited. Cleaners will come tomorrow.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'In the future',
    description:
      'Imagine the date is July 19th 2099.\n\nWrite a diary entry of someone your own age who is living in the future. Use the sentence below to start your diary:\n\nDear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that...\n\nIn your writing, you could include interesting, futuristic details about:\n• technology\n• ways to travel\n• home and social life.',
    prompt_type: 'diary_entry',
    module_id: 3,
    hint_points: [
      'Include interesting futuristic details about technology',
      'Describe ways to travel in 2099',
      'Show home and social life in the future',
    ],
    sample_answer_high:
      'Dear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that today was Sky-Bridge Day — the first time Year 6 could ride the magnetic pods alone.\n\nMy wrist-holo flashed a green route: kitchen → balcony pad → school dome in four minutes. Below us, gardens grew on every roof and delivery drones hummed like bees.\n\nAt lunch, friends beamed in from three suburbs for a shared AR picnic; we ate real mangoes while our avatars raced on Mars tracks. Mum still insists we talk face-to-face at dinner, robot muted.\n\nI fell asleep planning tomorrow’s pod solo. 2099 feels noisy, bright, and somehow still like home.',
    sample_answer_medium:
      'Dear Diary,\nWhen our house robot woke me up with its loud singing, I remembered that school was starting. I used a flying bus to get there. At home we have screens everywhere. I played games with friends online. The future is cool but also busy.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'A new superhero',
    description:
      'A movie company is holding a competition to win $1000. To enter you have to send an email to the company giving original ideas for a new superhero character for a blockbuster movie, graphic novel or book.\n\nWrite your email.\n\nIn your email, you could:\n• describe what the character looks like\n• explain how they use their superpowers\n• say why this character would be popular.\n\nYou do not need to include email formatting.',
    prompt_type: 'email',
    module_id: 4,
    hint_points: [
      'Describe what the character looks like',
      'Explain how they use their superpowers',
      'Say why this character would be popular',
    ],
    sample_answer_high:
      'Subject: Competition entry — Tideward\n\nHello Creative Team,\n\nPlease meet Tideward: a 14-year-old coastal guardian in a sea-glass cloak and coral-threaded boots, freckles glowing when danger nears.\n\nPowers: Tideward can reshape water into shields, whisper to marine life, and freeze a single wave mid-crash to buy rescue time. Strength grows with courage, not anger.\n\nWhy audiences will care: kids see a hero who protects beaches they love, mixing adventure with real-world stewardship. Merch writes itself — glow cloaks, tide charts, gentle strength.\n\nThank you for considering Tideward for your next blockbuster.\n\nKind regards,\nAva Chen',
    sample_answer_medium:
      'Hello,\n\nMy superhero is called Flash Kid. He wears a red suit and can run fast. He stops robbers and helps people. I think he would be popular because kids like speed and action. Please pick my idea.\n\nThanks.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Community garden proposal',
    description:
      'Your local council is deciding whether to turn an empty lot into a community garden. They have asked young people for ideas.\n\nWrite an email to the council explaining why a community garden would help your neighbourhood and how students could be involved.',
    prompt_type: 'email',
    module_id: 5,
    hint_points: [
      'Explain clear benefits for the neighbourhood',
      'Describe how students could take part',
      'Persuade with a polite, confident email voice',
    ],
    sample_answer_high:
      'Subject: Support for a Riverview community garden\n\nDear Councillors,\n\nAn empty lot on Maple Street could become a shared garden that feeds families, cools our block, and gives students real science outdoors.\n\nOur class can run weekend planting clubs, compost workshops, and a produce share for elders nearby. Paths and raised beds would keep it accessible.\n\nPlease approve the garden trial this spring — Riverview is ready to dig in.\n\nYours sincerely,\nJordan Lee\nYear 6 Student Representative',
    sample_answer_medium:
      'Dear Council,\n\nI think a garden is a good idea. People can grow food and kids can help water plants. It would make the area nicer. Please say yes.\n\nFrom Sam',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Sports carnival day',
    description:
      'Write a diary entry about an unforgettable sports carnival at your school. Include how the day began, a tense or funny moment during an event, and how you felt at the end.',
    prompt_type: 'diary_entry',
    module_id: 5,
    hint_points: [
      'Set the scene for how the day began',
      'Describe a tense or funny moment during an event',
      'Reflect on your feelings at the end of the day',
    ],
    sample_answer_high:
      'Dear Diary,\nHouse shirts blazed across the oval at 8:10 and my stomach did cartwheels before the whistle.\n\nIn the relay I fumbled the baton — then Mia yelled “still run!” and the crowd noise became a tunnel. We still placed second, laughing so hard we nearly forgot the medal.\n\nBy sunset my legs ached and my voice was gone, but belonging felt louder than winning. Best carnival yet.',
    sample_answer_medium:
      'Dear Diary,\nToday was sports carnival. I ran in a race and it was close. Something funny happened when someone dropped a baton. At the end I was tired but happy.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'Lost pet notice',
    description:
      'A beloved neighbourhood pet has gone missing. Write a newspaper report for the local paper that informs readers, describes the pet, and encourages the community to help.',
    prompt_type: 'newspaper_report',
    module_id: 6,
    hint_points: [
      'Inform readers what has happened and when',
      'Describe the pet with useful identifying details',
      'Include community voices and a clear call to help',
    ],
    sample_answer_high:
      'SEARCH ON FOR “MAPLE” THE GINGER CAT\n\nResidents of Harbor Lane are searching for Maple, a ginger cat with a white-tipped tail missing since Tuesday evening.\n\nOwner Elise Park said Maple slipped out during a storm: “She is shy but answers to a treat jar.” Neighbour Omar Blake reported a similar cat near the bus stop at dusk.\n\nAnyone with information is asked to call the community hotline. Flyers are posted at the library and café until Maple is home safe.',
    sample_answer_medium:
      'Cat Missing\n\nA cat called Maple is missing. She is orange. The owner is sad. Please look for her and call if you see her. Neighbours said they will help.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
  {
    title: 'School buddy advice',
    description:
      'Your principal wants a short advice sheet for Year 5 students who will become “buddies” for new Kindergarten children next term.\n\nWrite an advice sheet that helps buddies feel confident, kind, and prepared.',
    prompt_type: 'advice_sheet',
    module_id: 6,
    hint_points: [
      'Explain how to make Kindergarten children feel safe',
      'Give practical playground and classroom tips',
      'Encourage kindness with a confident, friendly tone',
    ],
    sample_answer_high:
      'BUDDY GUIDE: SMALL HANDS, BIG HEARTS\n\nYour job is simple: help a little learner feel brave.\n\nFirst days\nKneel to their height, learn their name, and show toilets, bags, and the bubble taps. Smile more than you speak.\n\nPlaytime\nOffer two game choices, watch for tears, and fetch a teacher if someone is hurt. Never leave your buddy alone near the gate.\n\nMindset\nPatience is a superpower. If plans change, breathe and try again. Kindergarten remembers how you made them feel — be the calm friend you once needed.',
    sample_answer_medium:
      'Advice for Buddies\n\nBe nice to the little kids. Show them where things are. Play with them at lunch. Tell a teacher if there is a problem. Being kind is important.',
    is_locked: true,
    time_limit_minutes: 30,
    is_active: true,
  },
];
