import { BookOpen, Calculator, PenLine } from 'lucide-react';
import { EXAM_SUBJECT_PRICE_AUD, KY1_SUBJECT_PRICE_AUD } from './subjects';
import { OC_SUBJECTS, SELECTIVE_SUBJECTS, type TrialSubject } from './trials';

export const PROGRAM_FAMILIES = ['year', 'exam'] as const;
export type ProgramFamily = (typeof PROGRAM_FAMILIES)[number];

export const PROGRAM_IDS = [
  'k-y1',
  'y2',
  'y3',
  'y4',
  'y5',
  'y6',
  'oc',
  'selective',
] as const;
export type ProgramId = (typeof PROGRAM_IDS)[number];

export type Program = {
  id: ProgramId;
  family: ProgramFamily;
  /** Short label in the header, e.g. K–Y1 or OC Trials. */
  navLabel: string;
  href: string;
  /** Visible in the marketing header. */
  inNav: boolean;
  /** Shown as a path card on the homepage. */
  onHome: boolean;
  /** Public landing page exists at `href`. */
  hasPage: boolean;
  /** Course content is live for at least one subject. */
  available: boolean;
  eyebrow: string;
  headline: string;
  summary: string;
  subjectsIntro: string;
  subjects: TrialSubject[];
  image: { src: string; alt: string };
  /** Display price in AUD for one subject for one year. */
  priceAud: number;
  metaTitle: string;
  metaDescription: string;
};

const YEAR_IMAGE = {
  src: '/marketing/hero-progress-chat.png',
  alt: 'A parent and child looking at TrialSeed practice progress together',
} as const;

const YEAR_SUBJECTS: TrialSubject[] = [
  {
    name: 'English',
    icon: PenLine,
    available: false,
    blurb:
      'Sounds, sentences, and first writing at this year level. Notes stay short so a parent and child can read them together.',
  },
  {
    name: 'Maths',
    icon: Calculator,
    available: false,
    blurb:
      'Number, shapes, and everyday counting in small, calm sets. Feedback points to the next kind of question to try.',
  },
  {
    name: 'Reading',
    icon: BookOpen,
    available: false,
    blurb:
      'Shared books and simple questions. Notes show what they understood, and where to look again.',
  },
];

function yearProgram(
  id: Extract<ProgramId, 'k-y1' | 'y2' | 'y3' | 'y4' | 'y5' | 'y6'>,
  opts: {
    navLabel: string;
    eyebrow: string;
    headline: string;
    summary: string;
    inNav?: boolean;
    onHome?: boolean;
    hasPage?: boolean;
    href?: string;
    image?: Program['image'];
    priceAud?: number;
    subjectsIntro?: string;
    subjects?: TrialSubject[];
    available?: boolean;
    metaTitle: string;
    metaDescription: string;
  },
): Program {
  const href = opts.href ?? `/${id}`;
  return {
    id,
    family: 'year',
    navLabel: opts.navLabel,
    href,
    inNav: opts.inNav ?? false,
    onHome: opts.onHome ?? false,
    hasPage: opts.hasPage ?? false,
    available: opts.available ?? false,
    eyebrow: opts.eyebrow,
    headline: opts.headline,
    summary: opts.summary,
    subjectsIntro:
      opts.subjectsIntro ??
      `These subjects will open at $${opts.priceAud ?? EXAM_SUBJECT_PRICE_AUD} AUD for one year. You can add one when you are ready.`,
    subjects: opts.subjects ?? YEAR_SUBJECTS,
    image: opts.image ?? YEAR_IMAGE,
    priceAud: opts.priceAud ?? EXAM_SUBJECT_PRICE_AUD,
    metaTitle: opts.metaTitle,
    metaDescription: opts.metaDescription,
  };
}

export const PROGRAMS: readonly Program[] = [
  yearProgram('k-y1', {
    navLabel: 'K–Y1',
    eyebrow: 'K–Y1',
    headline: 'Kindergarten and Year 1 practice',
    summary:
      `Gentle English, Maths, and early reading for the first years of school. Feedback will stay short and kind, so a parent and child can sit together. Each subject is $${KY1_SUBJECT_PRICE_AUD} AUD for one year — a smaller set of practice than the exam paths.`,
    inNav: true,
    onHome: true,
    hasPage: true,
    available: true,
    priceAud: KY1_SUBJECT_PRICE_AUD,
    subjectsIntro:
      `Maths is open now at $${KY1_SUBJECT_PRICE_AUD} AUD for one year. English and Reading will follow. It is a smaller set of practice, so a parent and child can sit together without a full exam course.`,
    subjects: [
      {
        name: 'English',
        icon: PenLine,
        available: false,
        blurb:
          'Sounds, sentences, and first writing at this year level. Notes stay short so a parent and child can read them together.',
      },
      {
        name: 'Maths',
        icon: Calculator,
        available: true,
        blurb:
          'See amounts, count, break numbers, and solve short stories. Seed Patch grows as they practise.',
      },
      {
        name: 'Reading',
        icon: BookOpen,
        available: false,
        blurb:
          'Shared books and simple questions. Notes show what they understood, and where to look again.',
      },
    ],
    image: {
      src: '/marketing/k-y1-progress-chat.png',
      alt: 'A parent and a Kindergarten-age boy looking at TrialSeed practice progress together',
    },
    metaTitle: 'K–Y1',
    metaDescription:
      `TrialSeed Kindergarten and Year 1 practice. Maths is open now at $${KY1_SUBJECT_PRICE_AUD} AUD per subject for one year. English and Reading are coming soon.`,
  }),
  yearProgram('y2', {
    navLabel: 'Y2',
    eyebrow: 'Y2',
    headline: 'Year 2 practice',
    summary:
      'Year 2 English, Maths, and Reading will open in the same TrialSeed style — calm tasks, clear notes, and a progress line you can watch together.',
    metaTitle: 'Y2',
    metaDescription: 'TrialSeed Year 2 practice for English, Maths, and Reading, opening soon.',
  }),
  yearProgram('y3', {
    navLabel: 'Y3',
    eyebrow: 'Y3',
    headline: 'Year 3 practice',
    summary:
      'Year 3 English, Maths, and Reading will open in the same TrialSeed style — calm tasks, clear notes, and a progress line you can watch together.',
    metaTitle: 'Y3',
    metaDescription: 'TrialSeed Year 3 practice for English, Maths, and Reading, opening soon.',
  }),
  yearProgram('y4', {
    navLabel: 'Y4',
    eyebrow: 'Y4',
    headline: 'Year 4 practice',
    summary:
      'Year 4 English, Maths, and Reading will open beside OC Trials, so families can choose year-level practice or the Opportunity Class path.',
    metaTitle: 'Y4',
    metaDescription: 'TrialSeed Year 4 practice for English, Maths, and Reading, opening soon.',
  }),
  yearProgram('y5', {
    navLabel: 'Y5',
    eyebrow: 'Y5',
    headline: 'Year 5 practice',
    summary:
      'Year 5 English, Maths, and Reading will open beside Selective Trials, so families can choose year-level practice or the Selective path.',
    metaTitle: 'Y5',
    metaDescription: 'TrialSeed Year 5 practice for English, Maths, and Reading, opening soon.',
  }),
  yearProgram('y6', {
    navLabel: 'Y6',
    eyebrow: 'Y6',
    headline: 'Year 6 practice',
    summary:
      'Year 6 English, Maths, and Reading will open beside Selective Trials, so families can choose year-level practice or the Selective path.',
    metaTitle: 'Y6',
    metaDescription: 'TrialSeed Year 6 practice for English, Maths, and Reading, opening soon.',
  }),
  {
    id: 'oc',
    family: 'exam',
    navLabel: 'OC Trials',
    href: '/oc-trial',
    inNav: true,
    onHome: true,
    hasPage: true,
    available: false,
    eyebrow: 'OC Trials',
    headline: 'Opportunity Class practice',
    summary:
      'Math, Thinking Skills, and Reading, with practice built around those three subjects. Feedback is aimed at what is already going well and what to try next. Each subject will have a progress line and a chat so parent and student can follow along when those courses open. $99 AUD per subject for one year.',
    subjectsIntro:
      'All three OC subjects will open at the same $99 yearly price. You can add a subject when you are ready.',
    subjects: OC_SUBJECTS,
    priceAud: EXAM_SUBJECT_PRICE_AUD,
    image: {
      src: '/marketing/oc-progress-chat.png',
      alt: 'A parent and child looking at Opportunity Class practice progress on a tablet',
    },
    metaTitle: 'OC Trials',
    metaDescription:
      'TrialSeed Opportunity Class practice for Math, Thinking Skills, and Reading. $99 AUD per subject for one year.',
  },
  {
    id: 'selective',
    family: 'exam',
    navLabel: 'Selective Trials',
    href: '/selective-trial',
    inNav: true,
    onHome: true,
    hasPage: true,
    available: true,
    eyebrow: 'Selective Trials',
    headline: 'NSW Selective High School practice',
    summary:
      'Four subjects: Writing, Math, Thinking Skills, and Reading. Feedback shows what is going well and what to try next. Writing already has a progress line, a subject chat, and a suggestion for the next task. $99 AUD per subject for one year.',
    subjectsIntro:
      'Writing is open now. Math, Thinking Skills, and Reading will open at the same price.',
    subjects: SELECTIVE_SUBJECTS,
    priceAud: EXAM_SUBJECT_PRICE_AUD,
    image: {
      src: '/marketing/selective-progress-chat.png',
      alt: 'A student reviewing Selective exam practice progress on a tablet',
    },
    metaTitle: 'Selective Trials',
    metaDescription:
      'TrialSeed NSW Selective High School practice for Writing, Math, Thinking Skills, and Reading. $99 AUD per subject for one year.',
  },
];

export function getProgram(id: ProgramId): Program {
  const program = PROGRAMS.find((item) => item.id === id);
  if (!program) {
    throw new Error(`Unknown program: ${id}`);
  }
  return program;
}

export function navPrograms(programs: readonly Program[] = PROGRAMS): Program[] {
  return programs.filter((program) => program.inNav);
}

export function homePrograms(programs: readonly Program[] = PROGRAMS): Program[] {
  return programs
    .filter((program) => program.onHome)
    .slice()
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (a.family !== b.family) return a.family === 'exam' ? -1 : 1;
      return 0;
    });
}

export function publicPrograms(programs: readonly Program[] = PROGRAMS): Program[] {
  return programs.filter((program) => program.hasPage);
}

export type HeaderNavLink = {
  type: 'link';
  id: ProgramId;
  label: string;
  href: string;
};

export type HeaderNavGroup = {
  type: 'group';
  id: 'years';
  label: 'Years';
  items: HeaderNavLink[];
};

export type HeaderNavItem = HeaderNavLink | HeaderNavGroup;

/**
 * Year programs stay a single header link while only one is public.
 * When Y2–Y6 join the menu, they collapse into a Years dropdown so the
 * bar does not grow by one item each year.
 */
export function buildHeaderNav(programs: readonly Program[] = PROGRAMS): HeaderNavItem[] {
  const years = navPrograms(programs).filter((program) => program.family === 'year');
  const exams = navPrograms(programs).filter((program) => program.family === 'exam');
  const yearLinks: HeaderNavLink[] = years.map((program) => ({
    type: 'link',
    id: program.id,
    label: program.navLabel,
    href: program.href,
  }));
  const items: HeaderNavItem[] = [];
  if (yearLinks.length === 1) {
    items.push(yearLinks[0]);
  } else if (yearLinks.length > 1) {
    items.push({ type: 'group', id: 'years', label: 'Years', items: yearLinks });
  }
  for (const program of exams) {
    items.push({
      type: 'link',
      id: program.id,
      label: program.navLabel,
      href: program.href,
    });
  }
  return items;
}
