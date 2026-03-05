
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function addPrescriptionColumn() {
  console.log("Adding 'prescription' column to 'clinical_history'...");
  const { error } = await supabaseAdmin.rpc('exec_sql', { 
    sql_query: "ALTER TABLE public.clinical_history ADD COLUMN IF NOT EXISTS prescription TEXT;" 
  });
  
  if (error) {
    // If rpc exec_sql doesn't exist, we might need another way or just hope it exists.
    // Usually I'll try to find if there's a custom function.
    console.error("Error using RPC:", error.message);
    console.log("Trying to execute via a different method if possible...");
  } else {
    console.log("Column added successfully.");
  }
}

addPrescriptionColumn();
