import { getPoolInstance } from '../server/db.js';

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const pool = getPoolInstance();
    
    if (!pool) {
      return {
        success: false,
        message: 'Database pool not initialized',
      };
    }

    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    return {
      success: true,
      message: 'Database connection successful',
      details: {
        currentTime: result.rows[0]?.current_time,
        pgVersion: result.rows[0]?.pg_version,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Database connection failed',
      details: {
        code: error.code,
        stack: error.stack,
      },
    };
  }
}

export async function testDatabaseQuery(query: string, params?: any[]): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    const pool = getPoolInstance();
    
    if (!pool) {
      return {
        success: false,
        error: 'Database pool not initialized',
      };
    }

    const result = await pool.query(query, params);
    
    return {
      success: true,
      result: result.rows,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Query failed',
    };
  }
}

