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

export type UnitInfo = {
  id: number;
  type: WritingType;
  title: string;
  blurb: string;
};

// Each Unit maps 1:1 to a writing text type. Order mirrors the local tutoring
// syllabus (Narrative → Speech), with Email kept as a bonus unit.
export const UNITS: UnitInfo[] = [
  { id: 1, type: 'narrative', title: 'Narrative', blurb: 'Tell an engaging story with a clear arc and vivid detail.' },
  { id: 2, type: 'diary_entry', title: 'Diary Entry', blurb: 'Write a personal, reflective first-person entry.' },
  { id: 3, type: 'news_report', title: 'News Report', blurb: 'Report events with facts, impact, and quotes.' },
  { id: 4, type: 'explanation', title: 'Explanation', blurb: 'Explain how or why something happens, step by step.' },
  { id: 5, type: 'advice_sheet', title: 'Advice Sheet', blurb: 'Give clear, friendly, well-organised advice.' },
  { id: 6, type: 'review', title: 'Review', blurb: 'Evaluate a book, film, or place with reasons and a recommendation.' },
  { id: 7, type: 'advertisement', title: 'Advertisement', blurb: 'Persuade an audience to want a product or event.' },
  { id: 8, type: 'persuasive_text', title: 'Persuasive Text', blurb: 'Argue a position with strong reasons and evidence.' },
  { id: 9, type: 'formal_letter', title: 'Formal Letter', blurb: 'Write a polite, structured letter for a real purpose.' },
  { id: 10, type: 'speech', title: 'Speech', blurb: 'Write a spoken address that moves and inspires listeners.' },
  { id: 11, type: 'email', title: 'Email', blurb: 'Write a clear email suited to its reader and purpose.' },
];

export function getUnitInfo(unitId: number): UnitInfo {
  return (
    UNITS.find((u) => u.id === unitId) ?? {
      id: unitId,
      type: 'narrative',
      title: `Unit ${unitId}`,
      blurb: 'Writing practice tasks.',
    }
  );
}

export function typeLabel(type: string): string {
  return TYPE_LABELS[type as WritingType] ?? type;
}
