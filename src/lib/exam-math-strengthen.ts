export type ExamMathWrongState = {
  timesWrong: number;
  similarCorrect: number;
  isOpen: boolean;
};

/** One correct same-type follow-up closes the type. A miss keeps it open. */
export function nextStrengthenWrongState(
  current: ExamMathWrongState,
  correct: boolean,
): ExamMathWrongState {
  if (correct) {
    return {
      timesWrong: current.timesWrong,
      similarCorrect: current.similarCorrect + 1,
      isOpen: false,
    };
  }
  return {
    timesWrong: current.timesWrong + 1,
    similarCorrect: current.similarCorrect,
    isOpen: true,
  };
}

export function strengthenOutcomeCopy(correct: boolean): string {
  return correct
    ? 'This type is cleared. A later miss in a mini exam or paper can bring it back.'
    : 'This type stays on Strengthen. The next question will be the same reasoning with new numbers.';
}
