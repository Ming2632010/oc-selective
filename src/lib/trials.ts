import type { LucideIcon } from 'lucide-react';
import { BookOpen, Brain, Calculator, PenLine } from 'lucide-react';

export type TrialSubject = {
  name: string;
  blurb: string;
  icon: LucideIcon;
  available: boolean;
};

export const SELECTIVE_SUBJECTS: TrialSubject[] = [
  {
    name: 'Writing',
    icon: PenLine,
    available: true,
    blurb:
      'Timed drafts with AI notes on structure, vocabulary, audience, and grammar. Three revisions, then sample answers.',
  },
  {
    name: 'Math',
    icon: Calculator,
    available: false,
    blurb:
      'Timed problem sets across the Selective maths syllabus. AI will highlight the question types to practise next.',
  },
  {
    name: 'Thinking Skills',
    icon: Brain,
    available: false,
    blurb:
      'Reasoning and pattern questions in exam style. Practice aimed at the gaps the student keeps missing.',
  },
  {
    name: 'Reading',
    icon: BookOpen,
    available: false,
    blurb:
      'Passages and comprehension under time. Feedback on where meaning is lost, not only a score.',
  },
];

export const OC_SUBJECTS: TrialSubject[] = [
  {
    name: 'Math',
    icon: Calculator,
    available: false,
    blurb:
      'OC-level problem sets under time. AI will highlight the topics that need another pass.',
  },
  {
    name: 'Thinking Skills',
    icon: Brain,
    available: false,
    blurb:
      'Reasoning practice for the OC paper. Notes on what is going well, and what to try next.',
  },
  {
    name: 'Reading',
    icon: BookOpen,
    available: false,
    blurb:
      'Short passages and questions at OC difficulty. Notes on what they understood, and where to look again.',
  },
];
