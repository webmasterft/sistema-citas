"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Toggles a patient's active status (Soft Delete / Reactivation)
 */
export async function togglePatientActive(patientId: string, active: boolean) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { error } = await supabaseAdmin
      .from("patients")
      .update({ is_active: active })
      .eq("id", patientId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling patient status:", error);
    return { success: false, error: error.message };
  }
}
