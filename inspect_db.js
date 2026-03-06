const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log("--- Inspecting clinical_history ---");
  const { data: ch, error: chErr } = await supabase.from('clinical_history').select('*').limit(1);
  if (chErr) {
    console.error("clinical_history error:", chErr);
  } else if (ch.length > 0) {
    console.log(JSON.stringify(Object.keys(ch[0]), null, 2));
  } else {
    console.log("clinical_history is empty.");
  }

  console.log("\n--- Inspecting patients ---");
  const { data: p, error: pErr } = await supabase.from('patients').select('*').limit(1);
  if (pErr) {
    console.error("patients error:", pErr);
  } else if (p.length > 0) {
    console.log(JSON.stringify(Object.keys(p[0]), null, 2));
  } else {
    console.log("patients is empty.");
  }
}

inspect();
