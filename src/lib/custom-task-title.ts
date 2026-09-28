import { typeLabel, type WritingType } from '@/lib/units';

export function customTaskTitle(promptType: WritingType, question: string): string {
  const line = question.split('\n')[0]?.trim().replace(/\s+/g, ' ') ?? '';
  if (line) return line.length > 72 ? `${line.slice(0, 69)}…` : line;
  return `Photo ${typeLabel(promptType)} task`;
}
