import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

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

export default supabase;
