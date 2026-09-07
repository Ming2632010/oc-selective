import { readFileSync } from 'fs';
import { Pool } from 'pg';

const files = [
  'sql/schema.sql',
  'sql/writing_schema.sql',
  'sql/subscriptions_schema.sql',
  'sql/release_migration.sql',
];

async function main() {
  // Next.js loads `.env.local` for the app, but standalone `tsx` scripts do
  // not. Load it when present so local migration runs match local development.
  if (!process.env.DATABASE_URL) {
    process.loadEnvFile('.env.local');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    for (const file of files) {
      await pool.query(readFileSync(file, 'utf8'));
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
