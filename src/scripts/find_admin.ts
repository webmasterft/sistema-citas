import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function findAdmin() {
  console.log("Searching for profiles with admin or webmaster role...");
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role")
    .or("role.eq.admin,role.eq.webmaster");

  if (profileError) {
    console.error("Profile Query Error:", profileError.message);
    return;
  }

  if (profiles && profiles.length > 0) {
    console.log("Profiles found:");
    for (const profile of profiles) {
      // Get the email from Auth
      const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      console.log(`- ${profile.full_name} ID: ${profile.id} ROLE: ${profile.role} EMAIL: ${user?.email || "Unknown"}`);
    }
  } else {
    console.log("No profiles with admin/webmaster role found.");
  }
}

findAdmin();
