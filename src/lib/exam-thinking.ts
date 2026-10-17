export const EXAM_THINKING_CHOICES = ['A', 'B', 'C', 'D'] as const;
export type ExamThinkingChoice = (typeof EXAM_THINKING_CHOICES)[number];

export const EXAM_THINKING_MINI_COUNT = 100;
export const EXAM_THINKING_MINI_QUESTIONS = 12;
/** Mini exams are untimed practice. Full papers keep the 40-minute exam clock. */
export const EXAM_THINKING_MINI_SECONDS = 0;

export const EXAM_THINKING_PAPER_COUNT = 20;
export const EXAM_THINKING_PAPER_QUESTIONS = 40;
export const EXAM_THINKING_PAPER_SECONDS = 40 * 60;

/** Interface preview only. Long enough to try buttons without sitting a real paper. */
export const EXAM_THINKING_PREVIEW_SECONDS = 10 * 60;

export type ExamThinkingSetKind = 'mini' | 'paper';
export type ExamThinkingDifficultyBand = 'foundation' | 'standard' | 'exam';

export type ExamThinkingSet = {
  kind: ExamThinkingSetKind;
  setNumber: number;
  title: string;
  questionCount: number;
  timeLimitSeconds: number;
  difficultyBand: ExamThinkingDifficultyBand;
  isReady: boolean;
};

export type ExamThinkingQuestion = {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number | null;
};

export type ExamThinkingSittingAnswer = {
  chosen: number | null;
  flagged: boolean;
};

export type ExamThinkingOverview = {
  minis: ExamThinkingSet[];
  papers: ExamThinkingSet[];
  readyMiniCount: number;
  readyPaperCount: number;
  openWrongCount: number;
};

/** Year 4–7 Selective Thinking Skills uses the exam dashboard, not K–Y1 Maths. */
export function usesExamThinkingDashboard(grade: string): boolean {
  return grade === 'Year 4' || grade === 'Year 5' || grade === 'Year 6' || grade === 'Year 7';
}

export function miniDifficultyBand(setNumber: number): ExamThinkingDifficultyBand {
  if (setNumber <= 20) return 'foundation';
  if (setNumber <= 60) return 'standard';
  return 'exam';
}

export function paperDifficultyBand(setNumber: number): ExamThinkingDifficultyBand {
  return setNumber <= 5 ? 'foundation' : 'exam';
}

export function examThinkingSetTitle(kind: ExamThinkingSetKind, setNumber: number): string {
  return kind === 'mini' ? `Mini exam ${setNumber}` : `Paper ${setNumber}`;
}

export function examThinkingCatalogue(): ExamThinkingSet[] {
  const minis: ExamThinkingSet[] = Array.from({ length: EXAM_THINKING_MINI_COUNT }, (_, index) => {
    const setNumber = index + 1;
    return {
      kind: 'mini',
      setNumber,
      title: examThinkingSetTitle('mini', setNumber),
      questionCount: EXAM_THINKING_MINI_QUESTIONS,
      timeLimitSeconds: EXAM_THINKING_MINI_SECONDS,
      difficultyBand: miniDifficultyBand(setNumber),
      isReady: false,
    };
  });
  const papers: ExamThinkingSet[] = Array.from(
    { length: EXAM_THINKING_PAPER_COUNT },
    (_, index) => {
      const setNumber = index + 1;
      return {
        kind: 'paper',
        setNumber,
        title: examThinkingSetTitle('paper', setNumber),
        questionCount: EXAM_THINKING_PAPER_QUESTIONS,
        timeLimitSeconds: EXAM_THINKING_PAPER_SECONDS,
        difficultyBand: paperDifficultyBand(setNumber),
        isReady: false,
      };
    },
  );
  return [...minis, ...papers];
}

export function examThinkingSetsOfKind(kind: ExamThinkingSetKind): ExamThinkingSet[] {
  return examThinkingCatalogue().filter((set) => set.kind === kind);
}

export function emptyExamThinkingOverview(): ExamThinkingOverview {
  const minis = examThinkingSetsOfKind('mini');
  const papers = examThinkingSetsOfKind('paper');
  return {
    minis,
    papers,
    readyMiniCount: 0,
    readyPaperCount: 0,
    openWrongCount: 0,
  };
}

export function findExamThinkingSet(
  kind: ExamThinkingSetKind,
  setNumber: number,
): ExamThinkingSet | null {
  return (
    examThinkingCatalogue().find((set) => set.kind === kind && set.setNumber === setNumber) ?? null
  );
}

export function examThinkingSittingIsTimed(timeLimitSeconds: number): boolean {
  return timeLimitSeconds > 0;
}

export function examThinkingMetaLine(questionCount: number, timeLimitSeconds: number): string {
  if (examThinkingSittingIsTimed(timeLimitSeconds)) {
    return `${questionCount} questions · ${timeLimitSeconds / 60} minutes · four options A–D`;
  }
  return `${questionCount} questions · no timer · four options A–D`;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function choiceLetter(index: number): ExamThinkingChoice | null {
  return EXAM_THINKING_CHOICES[index] ?? null;
}

export function emptySittingAnswers(count: number): ExamThinkingSittingAnswer[] {
  return Array.from({ length: count }, () => ({ chosen: null, flagged: false }));
}

export function sittingProgress(answers: ExamThinkingSittingAnswer[]) {
  const total = answers.length;
  const answered = answers.filter((answer) => answer.chosen !== null).length;
  const flagged = answers.filter((answer) => answer.flagged).length;
  const blank = total - answered;
  return { total, answered, flagged, blank };
}

export function markChoiceClass(input: {
  submitted: boolean;
  chosen: number | null;
  correctIndex: number | null;
  index: number;
}): string {
  const isRightChoice = input.submitted && input.correctIndex === input.index;
  if (isRightChoice) {
    return 'border-[#2D5A4A] bg-[#DCEEE3] text-brand-dark';
  }
  if (input.submitted && input.chosen === input.index && !isRightChoice) {
    return 'border-terracotta bg-[#FBE4DC] text-[#8A3A28]';
  }
  if (!input.submitted && input.chosen === input.index) {
    return 'border-[#2D5A4A] bg-[#EEF6F0] text-brand-dark';
  }
  return 'border-[#E8D9B0] bg-white text-warm-ink hover:border-terracotta';
}

export function sittingScore(input: {
  answers: ExamThinkingSittingAnswer[];
  questions: Array<{ correctIndex: number | null }>;
}) {
  let correct = 0;
  let marked = 0;
  for (let index = 0; index < input.questions.length; index += 1) {
    const expected = input.questions[index]?.correctIndex;
    if (typeof expected !== 'number') continue;
    marked += 1;
    if (input.answers[index]?.chosen === expected) correct += 1;
  }
  return { correct, marked, total: input.questions.length };
}

export function examThinkingInstructions(kind: ExamThinkingSetKind | 'preview'): {
  heading: string;
  minutes: number;
  questions: number;
  points: string[];
} {
  if (kind === 'preview') {
    return {
      heading: 'Computer test screen',
      minutes: EXAM_THINKING_PREVIEW_SECONDS / 60,
      questions: 3,
      points: [
        'This is only to try the buttons, timer, and review screen.',
        'There are no Selective Thinking Skills questions yet.',
        'Choose A–D, flag a question, hide the timer, then finish.',
      ],
    };
  }
  if (kind === 'mini') {
    return {
      heading: 'Thinking Skills · Mini exam',
      minutes: 0,
      questions: EXAM_THINKING_MINI_QUESTIONS,
      points: [
        `${EXAM_THINKING_MINI_QUESTIONS} multiple-choice questions. Four options, A to D.`,
        'No timer. Take the time you need, then finish when you are ready.',
        'No prior knowledge is needed. These are critical thinking and problem-solving items.',
        'No calculator or dictionary. You may work on paper.',
        'No marks are lost for a wrong answer, so attempt every question.',
        'You can flag a question and come back before you finish.',
      ],
    };
  }
  return {
    heading: 'Thinking Skills Test',
    minutes: EXAM_THINKING_PAPER_SECONDS / 60,
    questions: EXAM_THINKING_PAPER_QUESTIONS,
    points: [
      `${EXAM_THINKING_PAPER_QUESTIONS} multiple-choice questions. Four options, A to D.`,
      `${EXAM_THINKING_PAPER_SECONDS / 60} minutes. The timer counts down on the screen.`,
      'No prior knowledge is needed. These are critical thinking and problem-solving items.',
      'No calculator or dictionary. You may work on paper.',
      'There is no extra time at the end to record answers.',
      'No marks are lost for a wrong answer, so attempt every question.',
      'You can hide the timer, flag a question, and jump between questions.',
    ],
  };
}

export function difficultyBandLabel(band: ExamThinkingDifficultyBand): string {
  if (band === 'foundation') return 'Foundation';
  if (band === 'standard') return 'Standard';
  return 'Exam';
}

export function examThinkingNotReadyMessage(kind: ExamThinkingSetKind): string {
  return kind === 'mini'
    ? 'This mini exam has no questions yet. Sample papers will be used to build the bank.'
    : 'This paper has no questions yet. Sample papers will be used to build the bank.';
}
