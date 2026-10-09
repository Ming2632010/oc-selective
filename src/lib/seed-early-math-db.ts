import { query } from '@/lib/db';
import { SEED_EARLY_MATH } from '@/lib/seed-early-math';

/** Upsert K–Y1 Maths questions. Safe to re-run. Does not touch student work. */
export async function seedEarlyMathContent(): Promise<void> {
  for (const item of SEED_EARLY_MATH) {
    const existing = await query<{ id: string }>(
      'SELECT id FROM early_math_items WHERE slug = $1',
      [item.slug],
    );
    const values = [
      item.slug,
      item.unitId,
      item.skill,
      item.kind,
      item.title,
      item.stem,
      JSON.stringify(item.stimulus ?? {}),
      JSON.stringify(item.options ?? []),
      item.correctIndex ?? null,
      JSON.stringify(item.accepted ?? []),
      item.explanation,
      item.parentPrompt,
      item.difficulty,
      item.sortOrder,
    ];
    if ((existing.rowCount ?? existing.rows.length) > 0) {
      await query(
        `UPDATE early_math_items SET
           unit_id = $2, skill = $3, item_kind = $4, title = $5, stem = $6,
           stimulus = $7::jsonb, options = $8::jsonb, correct_index = $9,
           accepted = $10::jsonb, explanation = $11, parent_prompt = $12,
           difficulty = $13, sort_order = $14, is_active = TRUE
         WHERE slug = $1`,
        values,
      );
    } else {
      await query(
        `INSERT INTO early_math_items (
           slug, unit_id, skill, item_kind, title, stem, stimulus, options,
           correct_index, accepted, explanation, parent_prompt, difficulty, sort_order
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11, $12, $13, $14
         )`,
        values,
      );
    }
  }
}
