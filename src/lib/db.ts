import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { debugLatency } from '@/lib/debug-latency';

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

/**
 * Execute a parameterized SQL query against Neon PostgreSQL.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const startedAt = performance.now();
  const statement =
    sql.match(/\b(?:FROM|INTO|UPDATE)\s+([a-z_]+)/i)?.[1] ?? 'unclassified';
  // #region agent log
  debugLatency('A,B,C', 'src/lib/db.ts:query', 'Database query started', {
    statement,
    parameterCount: params.length,
  });
  // #endregion
  try {
    const result = await getPool().query<T>(sql, params);
    // #region agent log
    debugLatency('A,B,C', 'src/lib/db.ts:query', 'Database query completed', {
      statement,
      durationMs: Math.round(performance.now() - startedAt),
      rowCount: result.rowCount ?? result.rows.length,
    });
    // #endregion
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('[db] Query failed:', message);
    throw new Error(`Database query failed: ${message}`);
  }
}
