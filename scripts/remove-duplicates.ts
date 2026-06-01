import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function removeDuplicates() {
  console.log('🧹 Removing duplicate businesses from DB...');

  // Find duplicate (business_name, city) combos
  const { data: allBusinesses, error } = await sb
    .from('businesses')
    .select('id, business_name, city, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  const seen = new Map<string, string>(); // key -> first id (keep oldest)
  const toDelete: string[] = [];

  for (const b of allBusinesses || []) {
    const key = `${b.business_name}__${b.city}`;
    if (seen.has(key)) {
      toDelete.push(b.id); // delete newer duplicate
    } else {
      seen.set(key, b.id);
    }
  }

  console.log(`Found ${toDelete.length} duplicates to remove.`);

  if (toDelete.length === 0) {
    console.log('✅ No duplicates!');
    return;
  }

  // Delete in chunks of 100
  const chunkSize = 100;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error: delError } = await sb
      .from('businesses')
      .delete()
      .in('id', chunk);
    if (delError) {
      console.error(`Error deleting chunk:`, delError.message);
    } else {
      deleted += chunk.length;
      console.log(`Deleted ${deleted}/${toDelete.length}...`);
    }
  }

  console.log(`\n✅ Done! Removed ${deleted} duplicate records.`);
}

removeDuplicates();
