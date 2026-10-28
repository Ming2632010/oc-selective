import type { ExamThinkingQuestion } from './exam-thinking';
export { EXAM_THINKING_PREVIEW_SECONDS } from './exam-thinking';

export const EXAM_THINKING_PREVIEW_QUESTIONS: ExamThinkingQuestion[] = [
  {
    id: 'preview-1',
    stem: 'This is the computer test screen, not a Thinking Skills question. Choose A to see a correct mark after you finish.',
    options: [
      'the marked correct option',
      'an incorrect option',
      'another incorrect option',
      'a fourth incorrect option',
    ],
    correctIndex: 0,
  },
  {
    id: 'preview-2',
    stem: 'Flag this question, jump to question 3 with the number buttons, then come back. Choose any option.',
    options: ['the first option', 'the second option', 'the third option', 'the fourth option'],
    correctIndex: 1,
  },
  {
    id: 'preview-3',
    stem: 'Hide the timer, show it again, then choose an option and finish the sitting.',
    options: ['the first option', 'the second option', 'the third option', 'the fourth option'],
    correctIndex: 2,
  },
];
