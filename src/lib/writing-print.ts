import { SITE_NAME } from './site';

export const PRINT_TIME_ZONE = 'Australia/Sydney';

export type PrintPromptKind = 'practice' | 'test' | 'bonus' | 'custom';

export function printSittingLabel(input: {
  kind?: PrintPromptKind | string | null;
  draftNumber: number;
}): string {
  if (input.kind === 'custom') return 'Custom task · one attempt';
  if (input.kind === 'bonus') return 'Bonus exam paper · one sitting';
  if (input.kind === 'test') return 'Term review · one sitting';
  const draft = Math.min(3, Math.max(1, Math.floor(input.draftNumber) || 1));
  return `Draft ${draft} of 3`;
}

export function formatPrintDate(
  value: string | Date | null | undefined,
  now = new Date(),
): string {
  const raw = value ? new Date(value) : now;
  const date = Number.isNaN(raw.getTime()) ? now : raw;
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: PRINT_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function printDocumentTitle(input: {
  taskTitle: string;
  sittingLabel: string;
}): string {
  const title = input.taskTitle.trim() || 'Writing results';
  return `${title} · ${input.sittingLabel} · ${SITE_NAME}`;
}
