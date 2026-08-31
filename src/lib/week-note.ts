export type WeekNoteData = {
  plot_days: number;
  focused_minutes: number;
  last_test_title: string | null;
  last_test_score: number | null;
  next_form_label: string | null;
  next_title: string | null;
};

export function buildWeekNote(input: {
  plot_days: number;
  focused_minutes: number;
  lastTest: { title: string; overall_score: number | null } | null;
  nextFormLabel: string | null;
  nextTitle: string | null;
}): WeekNoteData {
  return {
    plot_days: input.plot_days,
    focused_minutes: input.focused_minutes,
    last_test_title: input.lastTest?.title ?? null,
    last_test_score:
      typeof input.lastTest?.overall_score === 'number'
        ? input.lastTest.overall_score
        : null,
    next_form_label: input.nextFormLabel,
    next_title: input.nextTitle,
  };
}
