import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whmbrguzumyatnslzfsq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWJyZ3V6dW15YXRuc2x6ZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTE2ODksImV4cCI6MjA2NDkyNzY4OX0.xcSogaAHv8uQzhFgEDZ1niFx8lirLiBRvkPpMF174YM';

export const supabase = createClient(supabaseUrl, supabaseKey);
