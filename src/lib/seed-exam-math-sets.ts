import { query } from '@/lib/db';
import { examMathCatalogue } from '@/lib/exam-math';

/** Insert empty mini and paper rows. Safe to re-run. Never adds questions. */
export async function seedExamMathSets(): Promise<void> {
  for (const set of examMathCatalogue()) {
    await query(
      `INSERT INTO exam_math_sets (
         kind, set_number, title, question_count, time_limit_seconds, difficulty_band, is_ready
       ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       ON CONFLICT (kind, set_number) DO NOTHING`,
      [
        set.kind,
        set.setNumber,
        set.title,
        set.questionCount,
        set.timeLimitSeconds,
        set.difficultyBand,
      ],
    );
  }
}
