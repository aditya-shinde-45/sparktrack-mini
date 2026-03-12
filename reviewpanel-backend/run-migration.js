import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('📦 Running mentor OTP sessions migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_mentor_otp_sessions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_').select('*').limit(0);
        console.log('Note: Using Supabase client query methods instead');
        
        // Since Supabase JS client doesn't support raw SQL, we'll provide instructions
        console.log('\n⚠️  Cannot execute raw SQL via Supabase JS client.');
        console.log('Please run this migration manually in Supabase dashboard:\n');
        console.log('1. Go to: https://gmtajoqjbetveyluklpa.supabase.co/project/_/sql/new');
        console.log('2. Copy the contents of: reviewpanel-backend/migrations/create_mentor_otp_sessions.sql');
        console.log('3. Paste and click "Run"\n');
        process.exit(1);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Tables created:');
    console.log('  - mentor_otp_sessions');
    console.log('  - mentor_otp_rate_limit');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\nPlease run the migration manually in Supabase SQL Editor:');
    console.log('https://gmtajoqjbetveyluklpa.supabase.co/project/_/sql/new');
    process.exit(1);
  }
}

runMigration();
