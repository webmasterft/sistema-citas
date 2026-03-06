import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: prof } = await supabase.from('profiles').select('*').eq('id', 'c955e6ce-3d56-4c15-96b1-a5de57d7fbf6');
  console.log("Profiles matching dir ID:", prof);
}
test();
