import type { ExamMathQuestion } from './exam-math';
export { EXAM_MATH_PREVIEW_SECONDS } from './exam-math';

export const EXAM_MATH_PREVIEW_QUESTIONS: ExamMathQuestion[] = [
  {
    id: 'preview-1',
    stem: 'This is the computer test screen, not a maths question. Choose A to see a correct mark after you finish.',
    options: [
      'A — the marked correct option',
      'B — an incorrect option',
      'C — an incorrect option',
      'D — an incorrect option',
      'E — an incorrect option',
    ],
    correctIndex: 0,
  },
  {
    id: 'preview-2',
    stem: 'Flag this question, jump to question 3 with the number buttons, then come back. Choose any option.',
    options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
    correctIndex: 1,
  },
  {
    id: 'preview-3',
    stem: 'Hide the timer, show it again, then choose an option and finish the sitting.',
    options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
    correctIndex: 2,
  },
];
