import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkLogin() {
  const email = "maggie@gmail.com";
  const password = "MedApp2026!";
  
  console.log(`Attempting to login with ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("❌ Login failed:", error.message);
  } else {
    console.log("✅ Login successful!");
    console.log("User data:", JSON.stringify(data.user, null, 2));
  }
}

checkLogin();
