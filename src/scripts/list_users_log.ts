import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function listUsers() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    fs.appendFileSync("/tmp/users_log.txt", "Auth Admin Error: " + error.message + "\n");
    return;
  }

  for (const user of users) {
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    fs.appendFileSync("/tmp/users_log.txt", `User ID: ${user.id}, Email: ${user.email}, Metadata Role: ${user.user_metadata?.role}, Profile Role: ${profile?.role}\n`);
  }
}

listUsers();
