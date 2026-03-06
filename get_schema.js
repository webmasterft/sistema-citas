import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns_by_name', { t_name: 'doctors_directory' });
  
  if (error) {
    console.error("RPC failed, trying raw data fetch...");
    const { data: rows, error: fetchErr } = await supabase.from('doctors_directory').select('*').limit(1);
    if (fetchErr) {
      console.error(fetchErr);
    } else {
      console.log("Columns inferred from data:");
      if (rows && rows.length > 0) {
        console.log(Object.keys(rows[0]));
      } else {
        console.log("Table is empty, cannot infer columns.");
      }
    }
  } else {
    console.log(data);
  }
}

checkSchema();
