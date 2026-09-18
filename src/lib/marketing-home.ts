import { KY1_SUBJECT_PRICE_AUD, SUBJECT_PRICE_AUD } from './subjects';

export const HOME_WHY_PARENTS = [
  {
    title: 'Practice that follows your child',
    body: 'We look at what is already going well and where a little more practice would help, then suggest the next task. Every child gets a path that fits them.',
  },
  {
    title: 'Exam trials and year-level paths',
    body: 'Selective Trials cover Writing, Math, Thinking Skills, and Reading. OC Trials cover Math, Thinking Skills, and Reading. K–Y1 starts the year-level path, with Y2 to Y6 to follow. Choose the exam or the year that fits your child.',
  },
  {
    title: 'One payment, one year',
    body: `Selective and OC subjects are $${SUBJECT_PRICE_AUD} AUD for twelve months. K–Y1 subjects are $${KY1_SUBJECT_PRICE_AUD} AUD, because that path is a smaller set of practice. Paid once. When the year ends we do not charge again unless you choose to return. You can enter a promotion code at checkout.`,
  },
];

export const HOME_FEATURES = [
  {
    title: 'Clear notes after each task',
    body: 'Feedback shows what is working and what to try next. Writing already does this for structure, vocabulary, audience, and grammar. Other subjects will use the same kind of notes as they open.',
  },
  {
    title: 'A progress line you can watch together',
    body: 'Writing already shows scores over time so a parent and student can see the line move. Other subjects will use the same chart when they open.',
  },
  {
    title: 'A chat that stays with that subject',
    body: 'Writing already has a chat so you can talk about the work together — what went well, and what to practise next. Other subjects will get their own chat as they open.',
  },
  {
    title: 'Practice that feels like the exam',
    body: 'Timed tasks, clear marks, and a chance to try again. Writing includes three drafts and sample answers after the last draft. Other subjects will follow the same practice loop.',
  },
];

export const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the difference between Selective Trials, OC Trials, and K–Y1?',
    a: 'Selective Trials are for the NSW Selective High School test: Writing, Math, Thinking Skills, and Reading. OC Trials are for Opportunity Class: Math, Thinking Skills, and Reading. K–Y1 is year-level practice for Kindergarten and Year 1, with Y2 to Y6 to follow. Choose the exam or the year that fits your child.',
  },
  {
    q: 'How does the AI help my child?',
    a: 'It is there to mark the work and point out what is going well and what to practise next. It does not replace a tutor. Writing already returns notes on structure, vocabulary, audience, and grammar. Math, Thinking Skills, and Reading will use the same approach as those courses open.',
  },
  {
    q: 'How does payment work?',
    a: `Selective and OC subjects are $${SUBJECT_PRICE_AUD} AUD for 12 months. K–Y1 subjects are $${KY1_SUBJECT_PRICE_AUD} AUD for 12 months, because that path is a smaller set of practice. We do not renew automatically. You only pay for subjects you add. A second child is a separate purchase.`,
  },
  {
    q: 'Which subjects can I use today?',
    a: 'Selective Writing is open now. Selective Math, Thinking Skills, and Reading, OC Trial subjects, and K–Y1 English, Maths, and Reading will open as those courses are ready. You are not charged for a subject until you choose to add it.',
  },
  {
    q: 'Can parent and student follow progress together?',
    a: 'Yes. Writing has a progress line so you can watch scores move, and a chat so parent and student can talk about that subject in one place. Other subjects will get the same tools when they open.',
  },
  {
    q: 'Can I use a promotion code?',
    a: 'Yes. Enter it on the Stripe checkout page after you choose a subject.',
  },
];
