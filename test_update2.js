import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: dirs } = await supabase.from('doctors_directory').select('id').limit(1);
  if (dirs && dirs.length > 0) {
    const id = dirs[0].id;
    console.log("Updating", id);
    const { data: updated, error } = await supabase.from('doctors_directory').update({ ruc: '9876543210001' }).eq('id', id).select();
    console.log("Updated:", updated, error);
  }
}
test();
