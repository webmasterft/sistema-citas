"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Acción de servidor para crear una cuenta de médico de forma administrativa
 * Requiere SUPABASE_SERVICE_ROLE_KEY en el .env
 */
export async function createDoctorAccount(email: string, password: string, fullName: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Llave maestra
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Crear el usuario en el sistema de Autenticación
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'doctor' }
    });

    if (authError) throw authError;

    // 2. Crear su perfil en la tabla de profiles con rol médico
    // Esto es vital para que el RLS le deje entrar
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        role: 'doctor'
      });

    if (profileError) throw profileError;

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error("Error creando cuenta de médico:", error);
    return { success: false, error: error.message };
  }
}

export async function updateDoctorAccount(userId: string, data: { email?: string; password?: string; fullName?: string }) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;
    if (data.fullName) updateData.user_metadata = { full_name: data.fullName };

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (authError) throw authError;

    if (data.fullName) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", userId);
      if (profileError) throw profileError;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando cuenta de médico:", error);
    return { success: false, error: error.message };
  }
}
