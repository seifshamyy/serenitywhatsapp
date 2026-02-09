import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whmbrguzumyatnslzfsq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWJyZ3V6dW15YXRuc2x6ZnNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1MTY4OSwiZXhwIjoyMDY0OTI3Njg5fQ.h-YbToBRx8WTW5KCk2IAYnmuhob3oiARGsnn61HwYQc';

export const supabase = createClient(supabaseUrl, supabaseKey);
