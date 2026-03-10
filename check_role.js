require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: profiles, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.log("Error fetching profiles:", JSON.stringify(error, null, 2));
  } else {
    console.log("Profiles:", JSON.stringify(profiles, null, 2));
  }
}

check();
