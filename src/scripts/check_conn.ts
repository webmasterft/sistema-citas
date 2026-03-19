import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing credentials in .env");
    return;
  }

  console.log(`Testing connection to: ${url}`);
  console.log(`Using Key: ${key.substring(0, 20)}...`);

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("patients")
    .select("count", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    console.error("Connection failed:", error.message);
    if (error.hint) console.error("Hint:", error.hint);
  } else {
    console.log("Connection successful!");
    console.log(`Found ${data} active patients.`);
  }
}

testConnection();
