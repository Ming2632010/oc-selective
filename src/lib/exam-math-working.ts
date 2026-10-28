import { EXAM_MATH_CHOICES, type ExamMathChoice } from './exam-math';
import { parseExamMathStimulus, type ExamMathStimulus } from './exam-math-stimulus';

/** Numbered method steps shown after a student opens working. */
export type ExamMathWorkingStep = {
  heading: string;
  body: string;
  stimulus?: ExamMathStimulus;
};

export type ExamMathWorking = ExamMathWorkingStep[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function workingTable(
  caption: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): ExamMathStimulus {
  return {
    type: 'table',
    caption,
    headers,
    rows: rows.map((row) => row.map((cell) => String(cell))),
  };
}

export function factTable(caption: string, rows: Array<[string, string | number]>): ExamMathStimulus {
  return workingTable(caption, ['What we know', 'Value'], rows);
}

export function calcTable(caption: string, rows: Array<[string, string | number]>): ExamMathStimulus {
  return workingTable(caption, ['Step', 'Working'], rows);
}

export function workingSteps(
  ...steps: Array<ExamMathWorkingStep | null | undefined | false>
): ExamMathWorking {
  return steps.filter((step): step is ExamMathWorkingStep => Boolean(step));
}

export function parseExamMathWorking(value: unknown): ExamMathWorking {
  const raw = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.steps) ? value.steps : [];
  const steps: ExamMathWorking = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const heading = typeof row.heading === 'string' ? row.heading.trim() : '';
    const body = typeof row.body === 'string' ? row.body.trim() : '';
    if (!heading && !body) continue;
    steps.push({
      heading: heading || 'Working',
      body,
      stimulus: parseExamMathStimulus(row.stimulus),
    });
  }
  return steps;
}

export function fallbackWorking(explanation: string | undefined): ExamMathWorking {
  const body = explanation?.trim();
  if (!body) return [];
  return [{ heading: 'Method', body }];
}

export function attachAnswerWorking(
  steps: ExamMathWorking,
  options: string[],
  correctIndex: number,
): ExamMathWorking {
  const letter: ExamMathChoice = EXAM_MATH_CHOICES[correctIndex] ?? 'A';
  const correct = options[correctIndex] ?? '';
  const withoutAnswer = steps.filter((step) => step.heading !== 'The answer');
  return [
    ...withoutAnswer,
    {
      heading: 'The answer',
      body: `The correct choice is ${letter}: ${correct}.`,
      stimulus: workingTable(
        'Check the options',
        ['Choice', 'Value', 'Correct?'],
        options.map((option, index) => [
          EXAM_MATH_CHOICES[index] ?? '',
          option,
          index === correctIndex ? 'Yes' : 'No',
        ]),
      ),
    },
  ];
}

export function completeWorking(input: {
  steps?: ExamMathWorking;
  explanation?: string;
  options: string[];
  correctIndex: number;
}): ExamMathWorking {
  const method = input.steps && input.steps.length > 0 ? input.steps : fallbackWorking(input.explanation);
  return attachAnswerWorking(method, input.options, input.correctIndex);
}

export function workingHasFigure(steps: ExamMathWorking): boolean {
  return steps.some((step) => Boolean(step.stimulus));
}
