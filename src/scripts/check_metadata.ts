import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkMetadata() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    fs.appendFileSync("/tmp/metadata_log.txt", "Auth Admin Error: " + error.message + "\n");
    return;
  }

  for (const user of users) {
    fs.appendFileSync("/tmp/metadata_log.txt", `Email: ${user.email}\nMetadata: ${JSON.stringify(user.user_metadata, null, 2)}\n---\n`);
  }
}

checkMetadata();
