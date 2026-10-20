import { query } from '@/lib/db';
import { examThinkingCatalogue } from '@/lib/exam-thinking';

/** Insert empty mini and paper rows. Safe to re-run. Never adds questions. */
export async function seedExamThinkingSets(): Promise<void> {
  for (const set of examThinkingCatalogue()) {
    await query(
      `INSERT INTO exam_thinking_sets (
         kind, set_number, title, question_count, time_limit_seconds, difficulty_band, is_ready
       ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       ON CONFLICT (kind, set_number) DO UPDATE SET
         title = EXCLUDED.title,
         question_count = EXCLUDED.question_count,
         time_limit_seconds = EXCLUDED.time_limit_seconds,
         difficulty_band = EXCLUDED.difficulty_band`,
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
