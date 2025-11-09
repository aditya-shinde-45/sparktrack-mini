import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  throw new Error('Supabase configuration is incomplete');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'sparktrack-backend'
    }
  }
});

console.log('✅ Supabase client initialized');

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