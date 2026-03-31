import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createBuckets = async () => {
  try {
    console.log('📦 Checking and creating Supabase buckets...\n');

    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      process.exit(1);
    }

    console.log('✅ Existing buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
    });
    console.log();

    // Buckets to create
    const requiredBuckets = [
      { name: 'evaluation-forms', public: true },
      { name: 'documents', public: true },
      { name: 'uploads', public: true }
    ];

    // Create missing buckets
    for (const bucket of requiredBuckets) {
      const exists = buckets.some(b => b.name === bucket.name);
      
      if (exists) {
        console.log(`✅ Bucket '${bucket.name}' already exists`);
      } else {
        console.log(`📝 Creating bucket '${bucket.name}'...`);
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: 52428800 // 50MB
        });

        if (error) {
          console.error(`❌ Error creating bucket '${bucket.name}':`, error);
        } else {
          console.log(`✅ Bucket '${bucket.name}' created successfully`);
        }
      }
    }

    console.log('\n✅ Bucket setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createBuckets();
