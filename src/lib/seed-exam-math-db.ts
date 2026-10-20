import { query } from '@/lib/db';
import { buildExamMathBank, type ExamMathSeedItem } from '@/lib/exam-math-bank';
import { seedExamMathSets } from '@/lib/seed-exam-math-sets';

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Upsert Selective Math questions. Safe to re-run. Does not touch student sittings. */
export async function seedExamMathContent(): Promise<void> {
  await seedExamMathSets();
  const bank = buildExamMathBank();
  const sets = await query<{ id: string; kind: 'mini' | 'paper'; set_number: number }>(
    `SELECT id, kind, set_number FROM exam_math_sets`,
  );
  const setId = new Map(sets.rows.map((row) => [`${row.kind}:${row.set_number}`, row.id]));

  const withIds = bank.map((item) => {
    const id = setId.get(`${item.kind}:${item.setNumber}`);
    if (!id) throw new Error(`Missing exam_math_sets row for ${item.kind} ${item.setNumber}`);
    return { ...item, setId: id };
  });

  for (const group of chunks(withIds, 80)) {
    await upsertItemChunk(group);
  }

  await query(
    `UPDATE exam_math_sets AS exam_set
     SET is_ready = (
       SELECT COUNT(*) >= exam_set.question_count
       FROM exam_math_items item
       WHERE item.set_id = exam_set.id AND item.is_active = TRUE
     )`,
  );
}

async function upsertItemChunk(
  items: Array<ExamMathSeedItem & { setId: string }>,
): Promise<void> {
  const params: unknown[] = [];
  const rows = items.map((item, index) => {
    const base = index * 8;
    params.push(
      item.setId,
      item.sortOrder,
      item.familyId,
      item.skill,
      item.stem,
      JSON.stringify(item.options),
      item.correctIndex,
      item.explanation,
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, '{}'::jsonb, $${base + 6}::jsonb, $${base + 7}, $${base + 8}, TRUE)`;
  });
  await query(
    `INSERT INTO exam_math_items (
       set_id, sort_order, family_id, skill, stem, stimulus, options, correct_index, explanation, is_active
     ) VALUES ${rows.join(', ')}
     ON CONFLICT (set_id, sort_order) DO UPDATE SET
       family_id = EXCLUDED.family_id,
       skill = EXCLUDED.skill,
       stem = EXCLUDED.stem,
       stimulus = EXCLUDED.stimulus,
       options = EXCLUDED.options,
       correct_index = EXCLUDED.correct_index,
       explanation = EXCLUDED.explanation,
       is_active = TRUE`,
    params,
  );
}
