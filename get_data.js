import { createClient } from "@supabase/supabase-js";
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data: dirs } = await supabase.from('doctors_directory').select('id, full_name, email').limit(2);
  const { data: profs } = await supabase.from('profiles').select('id, full_name, role').limit(2);
  
  fs.writeFileSync('db_data.json', JSON.stringify({ dirs, profs }, null, 2));
}
checkData();
