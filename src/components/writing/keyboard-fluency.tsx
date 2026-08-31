import {
  focusedMinutes,
  NSW_SELECTIVE_ONLINE_PRACTICE,
  NSW_SELECTIVE_PRACTICE_TESTS,
  wordsPerMinute,
} from '@/lib/keyboard-fluency';

export function KeyboardFluencyNote({
  wordCount,
  timeSpentSeconds,
}: {
  wordCount: number;
  timeSpentSeconds: number | null | undefined;
}) {
  const seconds = typeof timeSpentSeconds === 'number' ? timeSpentSeconds : 0;
  const wpm = wordsPerMinute(wordCount, seconds);
  const minutes = focusedMinutes(seconds);

  return (
    <section className="rounded-lg border border-stone-200 p-4">
      <h2 className="mb-2 text-lg font-medium">On the keyboard</h2>
      {wpm && minutes ? (
        <p className="text-stone-800">
          You wrote {wordCount} words in about {minutes} minute
          {minutes === 1 ? '' : 's'} (about {wpm} word{wpm === 1 ? '' : 's'} a
          minute).
        </p>
      ) : (
        <p className="text-stone-800">You wrote {wordCount} words.</p>
      )}
      <p className="mt-2 text-sm text-stone-600">
        Strong typed scripts on the day are often a few hundred words, not a
        novel. Ideas, form, and control matter more than filling the page.
      </p>
      <p className="mt-3 text-sm text-stone-700">
        Sit the{' '}
        <a
          href={NSW_SELECTIVE_ONLINE_PRACTICE}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-700 underline"
        >
          official NSW computer practice test
        </a>{' '}
        once so the real typing screen is familiar. The Department also lists{' '}
        <a
          href={NSW_SELECTIVE_PRACTICE_TESTS}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-700 underline"
        >
          practice tests and PDFs
        </a>
        .
      </p>
    </section>
  );
}
