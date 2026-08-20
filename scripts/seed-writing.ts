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

    const existing = await pool.query<{ c: number }>('SELECT COUNT(*)::int AS c FROM prompts');
    if (existing.rows[0].c > 0) {
      console.log(`Prompts already seeded (${existing.rows[0].c}). Skipping.`);
      return;
    }

    for (const prompt of SEED_PROMPTS) {
      await pool.query(
        `INSERT INTO prompts (
           title, description, prompt_type, module_id, hint_points,
           sample_answer_high, sample_answer_medium, is_locked,
           time_limit_minutes, is_active
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)`,
        [
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
        ],
      );
    }

    console.log(`Seeded ${SEED_PROMPTS.length} prompts.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
