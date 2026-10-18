
import 'dotenv/config';
import { supabase } from '../server/lib/supabase.js';

const { data, error } = await supabase
  .from('connection_test')
  .select('id, message')
  .limit(1);

if (error) {
  console.error('Supabase query failed:', error.message);
  process.exitCode = 1;
} else {
  console.log('Supabase connection successful!');
  console.log(data);
}
