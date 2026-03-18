import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function listUsers() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Auth Admin Error:", error.message);
    return;
  }

  for (const user of users) {
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    console.log(`Email: ${user.email}, Auth Role: ${user.user_metadata?.role}, Profile Role: ${profile?.role}`);
  }
}

listUsers();
