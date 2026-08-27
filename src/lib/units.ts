export type WritingType =
  | 'narrative'
  | 'diary_entry'
  | 'news_report'
  | 'explanation'
  | 'advice_sheet'
  | 'review'
  | 'advertisement'
  | 'persuasive_text'
  | 'formal_letter'
  | 'speech'
  | 'email';

export const WRITING_TYPES: WritingType[] = [
  'narrative',
  'diary_entry',
  'news_report',
  'explanation',
  'advice_sheet',
  'review',
  'advertisement',
  'persuasive_text',
  'formal_letter',
  'speech',
  'email',
];

export const TYPE_LABELS: Record<WritingType, string> = {
  narrative: 'Narrative',
  diary_entry: 'Diary Entry',
  news_report: 'News Report',
  explanation: 'Explanation',
  advice_sheet: 'Advice Sheet',
  review: 'Review',
  advertisement: 'Advertisement',
  persuasive_text: 'Persuasive Text',
  formal_letter: 'Formal Letter',
  speech: 'Speech',
  email: 'Email',
};

export type UnitGroup = 'Creative' | 'Informative' | 'Persuasive';

export type UnitInfo = {
  id: number;
  group: UnitGroup;
  type: WritingType;
  title: string;
  blurb: string;
};

// Each Unit maps 1:1 to a writing text type, grouped by writing purpose:
// Creative → Informative → Persuasive, building complexity across the course.
export const UNITS: UnitInfo[] = [
  // Creative
  { id: 1, group: 'Creative', type: 'narrative', title: 'Narrative', blurb: 'Tell an engaging story with a clear arc and vivid detail.' },
  { id: 2, group: 'Creative', type: 'diary_entry', title: 'Diary Entry', blurb: 'Write a personal, reflective first-person entry.' },
  // Informative
  { id: 3, group: 'Informative', type: 'news_report', title: 'News Report', blurb: 'Report events with facts, impact, and quotes.' },
  { id: 4, group: 'Informative', type: 'explanation', title: 'Explanation', blurb: 'Explain how or why something happens, step by step.' },
  { id: 5, group: 'Informative', type: 'advice_sheet', title: 'Advice Sheet', blurb: 'Give clear, friendly, well-organised advice.' },
  { id: 6, group: 'Informative', type: 'review', title: 'Review', blurb: 'Evaluate a book, film, or place with reasons and a recommendation.' },
  // Persuasive
  { id: 7, group: 'Persuasive', type: 'advertisement', title: 'Advertisement', blurb: 'Persuade an audience to want a product or event.' },
  { id: 8, group: 'Persuasive', type: 'persuasive_text', title: 'Persuasive Text', blurb: 'Argue a position with strong reasons and evidence.' },
  { id: 9, group: 'Persuasive', type: 'formal_letter', title: 'Formal Letter', blurb: 'Write a polite, structured letter for a real purpose.' },
  { id: 10, group: 'Persuasive', type: 'speech', title: 'Speech', blurb: 'Write a spoken address that moves and inspires listeners.' },
  { id: 11, group: 'Persuasive', type: 'email', title: 'Email', blurb: 'Write a clear email suited to its reader and purpose.' },
];

export const UNIT_GROUPS: UnitGroup[] = ['Creative', 'Informative', 'Persuasive'];

export function unitsByGroup(group: UnitGroup): UnitInfo[] {
  return UNITS.filter((u) => u.group === group);
}

export function getUnitInfo(unitId: number): UnitInfo {
  return (
    UNITS.find((u) => u.id === unitId) ?? {
      id: unitId,
      group: 'Creative',
      type: 'narrative',
      title: `Unit ${unitId}`,
      blurb: 'Writing practice tasks.',
    }
  );
}

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as WritingType] ?? type;
}
