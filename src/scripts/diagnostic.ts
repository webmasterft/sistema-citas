import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function diagnostic() {
  const doctorEmail = "ftorres@oshyn.com";
  console.log(`Diagnostic for ${doctorEmail}...`);

  // 1. Get Auth User
  const {
    data: { users },
    error: authError,
  } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find((u) => u.email === doctorEmail);

  if (!user) {
    console.error("User not found in Auth!");
    return;
  }
  console.log(`Auth User ID: ${user.id}`);

  // 2. Check Profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile Error:", profileError.message);
  } else {
    console.log("Profile Data:", JSON.stringify(profile, null, 2));
  }

  // 3. Check Patients for this doctor
  const { count, error: countError } = await supabaseAdmin
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id);

  if (countError) {
    console.error("Patients Query Error:", countError.message);
  } else {
    console.log(`Total patients found for this doctor: ${count}`);
  }

  // 4. List ALL patients to see if there are any
  const { count: allCount } = await supabaseAdmin
    .from("patients")
    .select("*", { count: "exact", head: true });
  console.log(`Total patients in database: ${allCount}`);
}

diagnostic();
