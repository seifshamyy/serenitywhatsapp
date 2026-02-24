import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://whmbrguzumyatnslzfsq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWJyZ3V6dW15YXRuc2x6ZnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1MTY4OSwiZXhwIjoyMDY0OTI3Njg5fQ.h-YbToBRx8WTW5KCk2IAYnmuhob3oiARGsnn61HwYQc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('push_subscriptions_serenity')
    .upsert({ endpoint: 'test_endpoint', keys: { test: 'key' } }, { onConflict: 'endpoint' })
    .select();

  if (error) console.error("Error:", error);
  else console.log("Success:", data);
}
test();
