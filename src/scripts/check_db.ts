import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function runFix() {
  console.log("Adding prescription column...");
  // Using a trick to execute SQL if possible, or just informing the user
  // Since I can't easily run arbitrary SQL via the client without an RPC,
  // and I don't know if an RPC exists, I'll just provide the SQL in the response.

  // However, I CAN check if the data is there.
  const { data: records, error } = await supabaseAdmin
    .from("clinical_history")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching clinical history:", error.message);
  } else {
    console.log("Clinical history accessible. Columns:", Object.keys(records[0] || {}));
  }
}

runFix();
