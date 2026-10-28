import type { ExamMathQuestion } from './exam-math';
export { EXAM_MATH_PREVIEW_SECONDS } from './exam-math';

export const EXAM_MATH_PREVIEW_QUESTIONS: ExamMathQuestion[] = [
  {
    id: 'preview-1',
    stem: 'This preview shows a bar graph on the computer test screen. Choose A after you read the graph. The sitting is not scored as real maths.',
    options: [
      'A — the marked correct option',
      'B — an incorrect option',
      'C — an incorrect option',
      'D — an incorrect option',
      'E — an incorrect option',
    ],
    correctIndex: 0,
    working: [
      {
        heading: 'Read the bars',
        body: 'This preview is only for the buttons. On a real question you would read the graph here.',
        stimulus: {
          type: 'table',
          caption: 'Club counts',
          headers: ['Club', 'Students'],
          rows: [
            ['Chess', '6'],
            ['Drama', '11'],
            ['Choir', '4'],
            ['Code', '9'],
          ],
        },
      },
      {
        heading: 'The answer',
        body: 'The correct choice is A.',
      },
    ],
    stimulus: {
      type: 'bar',
      caption: 'Preview: lunch clubs',
      bars: [
        { label: 'Chess', value: 6 },
        { label: 'Drama', value: 11 },
        { label: 'Choir', value: 4 },
        { label: 'Code', value: 9 },
      ],
    },
  },
  {
    id: 'preview-2',
    stem: 'Flag this table question, jump to question 3, then come back. Choose any option.',
    options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
    correctIndex: 1,
    working: [
      {
        heading: 'Read the table',
        body: 'On a real question the working would show the times you need, step by step.',
        stimulus: {
          type: 'table',
          caption: 'Bus times',
          headers: ['Stop', 'Time'],
          rows: [
            ['Depot', '08:05'],
            ['Bridge', '08:17'],
            ['School', '08:31'],
          ],
        },
      },
    ],
    stimulus: {
      type: 'table',
      caption: 'Preview: bus times',
      headers: ['Stop', 'Time'],
      rows: [
        ['Depot', '08:05'],
        ['Bridge', '08:17'],
        ['School', '08:31'],
      ],
    },
  },
  {
    id: 'preview-3',
    stem: 'Hide the timer, show it again, then choose an option and finish the sitting.',
    options: ['Option A', 'Option B', 'Option C', 'Option D', 'Option E'],
    correctIndex: 2,
    working: [
      {
        heading: 'Read the clock',
        body: 'On a real question the working would show the hour-hand and minute-hand angles in a table.',
        stimulus: {
          type: 'table',
          caption: 'Clock facts',
          headers: ['Hand', 'Angle'],
          rows: [
            ['Hour', '97.5°'],
            ['Minute', '90°'],
          ],
        },
      },
    ],
    stimulus: { type: 'clock', hour: 3, minute: 15 },
  },
];
