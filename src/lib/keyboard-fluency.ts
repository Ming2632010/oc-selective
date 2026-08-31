/** Official NSW Selective practice tests (department page + computer sitting). */
export const NSW_SELECTIVE_PRACTICE_TESTS =
  'https://education.nsw.gov.au/schooling/parents-and-carers/choosing-a-school-setting/selective-high-schools/placement-test/selective-high-school-practice-tests';

export const NSW_SELECTIVE_ONLINE_PRACTICE =
  'https://se-practice.au.insights.janison.com/pages/shs';

const MIN_SECONDS_FOR_WPM = 20;

export function wordsPerMinute(
  wordCount: number,
  timeSpentSeconds: number,
): number | null {
  if (!Number.isFinite(wordCount) || wordCount <= 0) return null;
  if (!Number.isFinite(timeSpentSeconds) || timeSpentSeconds < MIN_SECONDS_FOR_WPM) {
    return null;
  }
  return Math.round((wordCount * 60) / timeSpentSeconds);
}

export function focusedMinutes(timeSpentSeconds: number): number | null {
  if (!Number.isFinite(timeSpentSeconds) || timeSpentSeconds < MIN_SECONDS_FOR_WPM) {
    return null;
  }
  return Math.max(1, Math.round(timeSpentSeconds / 60));
}
