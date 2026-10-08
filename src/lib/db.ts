import { Pool, type QueryResult, type QueryResultRow } from 'pg';

const globalForDb = globalThis as typeof globalThis & {
  __ocSelectivePgPool?: Pool;
};

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  if (!globalForDb.__ocSelectivePgPool) {
    globalForDb.__ocSelectivePgPool = new Pool({
      connectionString,
      // Neon requires TLS. The pooled host (`*-pooler.*`) is preferred on Vercel.
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    globalForDb.__ocSelectivePgPool.on('error', (error) => {
      console.error('[db] Unexpected idle client error:', error);
    });
  }

  return globalForDb.__ocSelectivePgPool;
}

export async function runSql<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params);
}

/**
 * Execute a parameterized SQL query against Neon PostgreSQL.
 * If the writing-trial columns are missing (code shipped before migrate),
 * add them once and retry so the dashboard does not stay broken.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  try {
    return await runSql<T>(sql, params);
  } catch (error) {
    const { isMissingTrialColumn, ensureWritingTrialColumns } = await import(
      '@/lib/writing-trial-schema'
    );
    if (isMissingTrialColumn(error)) {
      await ensureWritingTrialColumns();
      return runSql<T>(sql, params);
    }
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('[db] Query failed:', message);
    throw new Error(`Database query failed: ${message}`);
  }
}
