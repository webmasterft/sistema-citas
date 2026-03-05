"use server";

import { createClient } from "@supabase/supabase-js";

export async function createInstitutionAccount(email: string, password: string, name: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'admin' } // O a new role 'institution_admin' if needed
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: name,
        role: 'admin' // Institutions are managed by admins for now
      });

    if (profileError) throw profileError;

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error("Error creando cuenta de institución:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInstitutionAccount(userId: string, data: { email?: string; password?: string; name?: string }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;
    if (data.name) updateData.user_metadata = { full_name: data.name };

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (authError) throw authError;

    if (data.name) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.name })
        .eq("id", userId);
      if (profileError) throw profileError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando cuenta de institución:", error);
    return { success: false, error: error.message };
  }
}
