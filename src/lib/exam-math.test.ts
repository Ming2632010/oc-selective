import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EXAM_MATH_MINI_COUNT,
  EXAM_MATH_MINI_QUESTIONS,
  EXAM_MATH_MINI_SECONDS,
  EXAM_MATH_PAPER_COUNT,
  EXAM_MATH_PAPER_QUESTIONS,
  EXAM_MATH_PAPER_SECONDS,
  choiceLetter,
  emptySittingAnswers,
  examMathCatalogue,
  examMathInstructions,
  examMathMetaLine,
  examMathSetsOfKind,
  examMathSittingIsTimed,
  findExamMathSet,
  formatCountdown,
  markChoiceClass,
  miniDifficultyBand,
  paperDifficultyBand,
  sittingProgress,
  sittingScore,
  usesExamMathDashboard,
} from './exam-math';
import { readFileSync } from 'fs';

describe('Selective Math catalogue', () => {
  it('keeps 100 mini exams of 12 and 20 papers of 35', () => {
    const catalogue = examMathCatalogue();
    assert.equal(catalogue.length, EXAM_MATH_MINI_COUNT + EXAM_MATH_PAPER_COUNT);
    assert.equal(examMathSetsOfKind('mini').length, 100);
    assert.equal(examMathSetsOfKind('paper').length, 20);
    assert.equal(EXAM_MATH_MINI_QUESTIONS, 12);
    assert.equal(EXAM_MATH_PAPER_QUESTIONS, 35);
    assert.equal(EXAM_MATH_MINI_SECONDS, 0);
    assert.equal(EXAM_MATH_PAPER_SECONDS, 40 * 60);
    assert.equal(examMathSittingIsTimed(EXAM_MATH_MINI_SECONDS), false);
    assert.equal(examMathSittingIsTimed(EXAM_MATH_PAPER_SECONDS), true);
    assert.equal(
      examMathMetaLine(EXAM_MATH_MINI_QUESTIONS, EXAM_MATH_MINI_SECONDS),
      '12 questions · no timer · five options A–E',
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
    assert.equal(usesExamMathDashboard('Year 5'), true);
    assert.equal(usesExamMathDashboard('Kindergarten'), false);
    assert.equal(findExamMathSet('mini', 100)?.title, 'Mini exam 100');
    assert.equal(findExamMathSet('paper', 20)?.title, 'Paper 20');
    assert.equal(findExamMathSet('paper', 21), null);
  });
});

describe('Selective Math player helpers', () => {
  it('formats the countdown and tracks sitting progress', () => {
    assert.equal(formatCountdown(40 * 60), '40:00');
    assert.equal(formatCountdown(65), '01:05');
    assert.equal(formatCountdown(0), '00:00');
    assert.equal(choiceLetter(0), 'A');
    assert.equal(choiceLetter(4), 'E');
    assert.equal(choiceLetter(5), null);
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

  it('scores a finished sitting and keeps trial instructions untimed', () => {
    const score = sittingScore({
      questions: [{ correctIndex: 0 }, { correctIndex: 1 }, { correctIndex: 2 }],
      answers: [
        { chosen: 0, flagged: false },
        { chosen: 0, flagged: true },
        { chosen: 2, flagged: false },
      ],
    });
    assert.equal(score.correct, 2);
    assert.equal(score.marked, 3);
    assert.equal(examMathInstructions('paper').questions, 35);
    assert.equal(examMathInstructions('mini').questions, 12);
    assert.equal(examMathInstructions('mini').minutes, 0);
    assert.match(examMathInstructions('mini').points[1] ?? '', /No timer/);
    assert.equal(examMathInstructions('trial').minutes, 0);
    assert.match(examMathInstructions('trial').points[0] ?? '', /Trial questions only/);
    assert.equal(examMathInstructions('strengthen').questions, 1);
    assert.match(examMathInstructions('strengthen').points[2] ?? '', /keeps this type/);
  });
});

describe('Selective Math launch copy', () => {
  it('does not offer the dummy computer-test preview', () => {
    const files = [
      'src/components/dashboard/selective-math-home.tsx',
      'src/app/dashboard/selective-math/mini/page.tsx',
      'src/app/dashboard/selective-math/papers/page.tsx',
      'src/app/dashboard/page.tsx',
    ];
    const blob = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    assert.equal(/Try the computer test screen/i.test(blob), false);
    assert.equal(/Try the buttons\. Not scored as real maths/i.test(blob), false);
    assert.equal(/sit\/preview/.test(blob), false);
    const player = readFileSync('src/components/exam-math/player.tsx', 'utf8');
    const math = readFileSync('src/lib/exam-math.ts', 'utf8');
    assert.equal(/Preview only|try the buttons/i.test(`${player}\n${math}`), false);
  });
});

