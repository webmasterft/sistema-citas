import "dotenv/config";
import { supabase } from "../lib/supabase";

async function testSupabase() {
  console.log("Testing Supabase connection...");
  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1);
    if (error) {
      console.error("Supabase Error:", error.message);
      process.exit(1);
    }
    console.log("Supabase connection OK. Data count:", data);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

testSupabase();
