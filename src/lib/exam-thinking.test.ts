import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EXAM_THINKING_MINI_COUNT,
  EXAM_THINKING_MINI_QUESTIONS,
  EXAM_THINKING_MINI_SECONDS,
  EXAM_THINKING_PAPER_COUNT,
  EXAM_THINKING_PAPER_QUESTIONS,
  EXAM_THINKING_PAPER_SECONDS,
  choiceLetter,
  emptySittingAnswers,
  examThinkingCatalogue,
  examThinkingInstructions,
  examThinkingMetaLine,
  examThinkingSetsOfKind,
  examThinkingSittingIsTimed,
  findExamThinkingSet,
  formatCountdown,
  markChoiceClass,
  miniDifficultyBand,
  paperDifficultyBand,
  sittingProgress,
  sittingScore,
  usesExamThinkingDashboard,
} from './exam-thinking';
import { EXAM_THINKING_PREVIEW_QUESTIONS } from './exam-thinking-preview';

describe('Selective Thinking Skills catalogue', () => {
  it('keeps 100 mini exams of 12 and 20 papers of 40', () => {
    const catalogue = examThinkingCatalogue();
    assert.equal(catalogue.length, EXAM_THINKING_MINI_COUNT + EXAM_THINKING_PAPER_COUNT);
    assert.equal(examThinkingSetsOfKind('mini').length, 100);
    assert.equal(examThinkingSetsOfKind('paper').length, 20);
    assert.equal(EXAM_THINKING_MINI_QUESTIONS, 12);
    assert.equal(EXAM_THINKING_PAPER_QUESTIONS, 40);
    assert.equal(EXAM_THINKING_MINI_SECONDS, 0);
    assert.equal(EXAM_THINKING_PAPER_SECONDS, 40 * 60);
    assert.equal(examThinkingSittingIsTimed(EXAM_THINKING_MINI_SECONDS), false);
    assert.equal(examThinkingSittingIsTimed(EXAM_THINKING_PAPER_SECONDS), true);
    assert.equal(
      examThinkingMetaLine(EXAM_THINKING_MINI_QUESTIONS, EXAM_THINKING_MINI_SECONDS),
      '12 questions · no timer · four options A–D',
    );
    assert.equal(
      examThinkingMetaLine(EXAM_THINKING_PAPER_QUESTIONS, EXAM_THINKING_PAPER_SECONDS),
      '40 questions · 40 minutes · four options A–D',
    );
    assert.equal(
      catalogue.every((set) => set.isReady === false),
      true,
    );
  });

  it('bands mini exams and papers without mixing K–Y1 grades', () => {
    assert.equal(miniDifficultyBand(1), 'foundation');
    assert.equal(miniDifficultyBand(21), 'standard');
    assert.equal(miniDifficultyBand(61), 'exam');
    assert.equal(paperDifficultyBand(1), 'foundation');
    assert.equal(paperDifficultyBand(6), 'exam');
    assert.equal(usesExamThinkingDashboard('Year 5'), true);
    assert.equal(usesExamThinkingDashboard('Kindergarten'), false);
    assert.equal(findExamThinkingSet('mini', 100)?.title, 'Mini exam 100');
    assert.equal(findExamThinkingSet('paper', 20)?.title, 'Paper 20');
    assert.equal(findExamThinkingSet('paper', 21), null);
  });
});

describe('Selective Thinking Skills player helpers', () => {
  it('formats the countdown and tracks sitting progress', () => {
    assert.equal(formatCountdown(40 * 60), '40:00');
    assert.equal(formatCountdown(65), '01:05');
    assert.equal(formatCountdown(0), '00:00');
    assert.equal(choiceLetter(0), 'A');
    assert.equal(choiceLetter(3), 'D');
    assert.equal(choiceLetter(4), null);
    const answers = emptySittingAnswers(12);
    answers[0] = { chosen: 2, flagged: false };
    answers[3] = { chosen: null, flagged: true };
    const progress = sittingProgress(answers);
    assert.equal(progress.total, 12);
    assert.equal(progress.answered, 1);
    assert.equal(progress.flagged, 1);
    assert.equal(progress.blank, 11);
  });

  it('marks the right option green and the wrong chosen option terracotta', () => {
    assert.match(
      markChoiceClass({ submitted: true, chosen: 0, correctIndex: 0, index: 0 }),
      /DCEEE3/,
    );
    assert.match(
      markChoiceClass({ submitted: true, chosen: 1, correctIndex: 0, index: 1 }),
      /FBE4DC/,
    );
    assert.match(
      markChoiceClass({ submitted: false, chosen: 2, correctIndex: null, index: 2 }),
      /EEF6F0/,
    );
  });

  it('scores a finished sitting and keeps preview items as chrome only', () => {
    const score = sittingScore({
      questions: EXAM_THINKING_PREVIEW_QUESTIONS,
      answers: [
        { chosen: 0, flagged: false },
        { chosen: 0, flagged: true },
        { chosen: 2, flagged: false },
      ],
    });
    assert.equal(score.correct, 2);
    assert.equal(score.marked, 3);
    assert.equal(examThinkingInstructions('paper').questions, 40);
    assert.equal(examThinkingInstructions('mini').questions, 12);
    assert.equal(examThinkingInstructions('mini').minutes, 0);
    assert.match(examThinkingInstructions('mini').points[1] ?? '', /No timer/);
    assert.match(examThinkingInstructions('paper').points[2] ?? '', /No prior knowledge/);
    assert.equal(examThinkingInstructions('preview').minutes, 10);
    assert.match(examThinkingInstructions('preview').points[0] ?? '', /try the buttons/);
    assert.equal(
      EXAM_THINKING_PREVIEW_QUESTIONS.every((item) => item.options.length === 4),
      true,
    );
  });
});
