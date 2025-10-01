import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to SUPABASE_ANON_KEY');
  if (!supabaseAnonKey) {
    throw new Error('Missing both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in environment variables');
  }
}

// Use service role key for backend operations (admin access)
// Falls back to anon key if service role key is not available
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

console.log(`Supabase client initialized with ${supabaseServiceKey ? 'Service Role' : 'Anon'} key`);

/**
 * Database configuration and utilities
 */
class DatabaseConfig {
  /**
   * Get Supabase client instance
   */
  getClient() {
    return supabase;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('pbl')
        .select('*')
        .limit(1);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Execute a query with error handling
   */
  async executeQuery(query) {
    try {
      return await query;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

// Export both the raw supabase client (for backward compatibility) and the config class
const dbConfig = new DatabaseConfig();

// Backward compatibility: expose config helpers on the Supabase client default export
supabase.testConnection = dbConfig.testConnection.bind(dbConfig);
supabase.getClient = () => supabase;
supabase.databaseConfig = dbConfig;

export const databaseConfig = dbConfig;
export { DatabaseConfig, supabase };
export default supabase;