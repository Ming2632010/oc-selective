import { getProgram, type Program, type ProgramId } from './programs';

export const STUDENT_GRADES = [
  'Kindergarten',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
] as const;

export type StudentGrade = (typeof STUDENT_GRADES)[number];

export const DEFAULT_STUDENT_GRADE: StudentGrade = 'Year 5';

const GRADE_PROGRAM: Record<StudentGrade, ProgramId> = {
  Kindergarten: 'k-y1',
  'Year 1': 'k-y1',
  'Year 2': 'y2',
  'Year 3': 'y3',
  'Year 4': 'y4',
  'Year 5': 'y5',
  'Year 6': 'y6',
  'Year 7': 'selective',
};

/** Year 4–7 keep the live Selective Writing dashboard. Younger years wait for their program. */
export function usesWritingDashboard(grade: string): boolean {
  return grade === 'Year 4' || grade === 'Year 5' || grade === 'Year 6' || grade === 'Year 7';
}

/** Kindergarten and Year 1 use the K–Y1 Maths dashboard. */
export function usesMathsDashboard(grade: string): boolean {
  return grade === 'Kindergarten' || grade === 'Year 1';
}

export function programIdForGrade(grade: string): ProgramId | null {
  if (!isStudentGrade(grade)) return null;
  return GRADE_PROGRAM[grade];
}

export function programForGrade(grade: string): Program | null {
  const id = programIdForGrade(grade);
  return id ? getProgram(id) : null;
}

export function isStudentGrade(value: string): value is StudentGrade {
  return (STUDENT_GRADES as readonly string[]).includes(value);
}
