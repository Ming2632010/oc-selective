export const MODULE_IDS = [1, 2, 3, 4, 5, 6] as const;

export type ModuleInfo = {
  id: number;
  title: string;
  blurb: string;
};

export const MODULES: ModuleInfo[] = [
  { id: 1, title: 'Foundations', blurb: 'Warm up with advice sheets and clear structure.' },
  { id: 2, title: 'Newspaper Reports', blurb: 'Report events with facts, impact, and quotes.' },
  { id: 3, title: 'Diary & Recounts', blurb: 'Write vivid first-person diary entries.' },
  { id: 4, title: 'Persuasive Emails', blurb: 'Persuade a reader with a confident email voice.' },
  { id: 5, title: 'Mixed Practice', blurb: 'Switch between forms under exam conditions.' },
  { id: 6, title: 'Exam Readiness', blurb: 'Consolidate every form for the real test.' },
];

export function getModuleInfo(moduleId: number): ModuleInfo {
  return (
    MODULES.find((m) => m.id === moduleId) ?? {
      id: moduleId,
      title: `Module ${moduleId}`,
      blurb: 'Writing practice tasks.',
    }
  );
}

export const PROMPT_TYPE_LABELS: Record<string, string> = {
  newspaper_report: 'Newspaper Report',
  diary_entry: 'Diary Entry',
  email: 'Email',
  advice_sheet: 'Advice Sheet',
};

export function promptTypeLabel(type: string): string {
  return PROMPT_TYPE_LABELS[type] ?? type;
}
