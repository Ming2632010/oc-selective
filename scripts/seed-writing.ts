import { readFileSync } from 'fs';
import { Pool } from 'pg';
import { buildDecodeGuide, defaultPurposes } from '../src/lib/decode-guide';
import { SEED_PROMPTS } from '../src/lib/seed-prompts';

function loadEnv() {
  return Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split('\n')
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
}

async function main() {
  const env = loadEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const schema = readFileSync('sql/writing_schema.sql', 'utf8');
    await pool.query(schema);

    // Upsert on title so re-running realigns unit numbers and copy on an
    // existing database without discarding prompt ids (attempts reference them).
    let inserted = 0;
    let updated = 0;

    for (const prompt of SEED_PROMPTS) {
      const purposes =
        prompt.purposes && prompt.purposes.length > 0
          ? prompt.purposes
          : defaultPurposes(prompt.prompt_type);
      const values = [
        prompt.title,
        prompt.description,
        prompt.prompt_type,
        prompt.module_id,
        JSON.stringify(prompt.hint_points),
        prompt.sample_answer_high,
        prompt.sample_answer_medium,
        prompt.is_locked,
        prompt.time_limit_minutes,
        prompt.is_active,
        prompt.kind ?? 'practice',
        purposes,
        prompt.purpose_note ?? null,
        prompt.stimulus_image ?? null,
        prompt.stimulus_quote ?? null,
        JSON.stringify(buildDecodeGuide(prompt)),
      ];

      const existing = await pool.query<{ id: string }>(
        'SELECT id FROM prompts WHERE title = $1',
        [prompt.title],
      );

      if (existing.rowCount) {
        await pool.query(
          `UPDATE prompts SET
             description = $2, prompt_type = $3, module_id = $4,
             hint_points = $5::jsonb, sample_answer_high = $6,
             sample_answer_medium = $7, is_locked = $8,
             time_limit_minutes = $9, is_active = $10, kind = $11,
             purposes = $12::text[], purpose_note = $13,
             stimulus_image = $14, stimulus_quote = $15, decode_guide = $16::jsonb
           WHERE title = $1`,
          values,
        );
        updated += 1;
      } else {
        await pool.query(
          `INSERT INTO prompts (
             title, description, prompt_type, module_id, hint_points,
             sample_answer_high, sample_answer_medium, is_locked,
             time_limit_minutes, is_active, kind,
             purposes, purpose_note, stimulus_image, stimulus_quote, decode_guide
           ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::text[],$13,$14,$15,$16::jsonb)`,
          values,
        );
        inserted += 1;
      }
    }

    console.log(`Seed complete: ${inserted} inserted, ${updated} updated.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
