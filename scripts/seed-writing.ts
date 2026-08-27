import { readFileSync } from 'fs';
import { Pool } from 'pg';
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
             time_limit_minutes = $9, is_active = $10
           WHERE title = $1`,
          values,
        );
        updated += 1;
      } else {
        await pool.query(
          `INSERT INTO prompts (
             title, description, prompt_type, module_id, hint_points,
             sample_answer_high, sample_answer_medium, is_locked,
             time_limit_minutes, is_active
           ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)`,
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
