"use server";

import { createClient } from "@supabase/supabase-js";

interface DoctorData {
  email?: string;
  password?: string;
  fullName?: string;
  avatarUrl?: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  experienceYears?: number;
  ruc?: string;
  institutionId?: string;
}

/**
 * Acción de servidor para crear una cuenta de médico de forma administrativa
 */
export async function createDoctorAccount(email: string, password: string, fullName: string, initialData: Partial<DoctorData> = {}) {
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
      user_metadata: { 
        full_name: fullName, 
        role: 'doctor',
        avatar_url: initialData.avatarUrl 
      }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        role: 'doctor',
        avatar_url: initialData.avatarUrl || null,
        specialty: initialData.specialty || null,
        license_number: initialData.licenseNumber || null,
        phone: initialData.phone || null,
        address: initialData.address || null,
        birth_date: initialData.birthDate || null,
        experience_years: initialData.experienceYears || null,
        ruc: initialData.ruc || null,
        institution_id: initialData.institutionId || null
      });

    if (profileError) throw profileError;

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error("Error creando cuenta de médico:", error);
    return { success: false, error: error.message };
  }
}

export async function updateDoctorAccount(userId: string, data: DoctorData) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const updateData: any = {};
    if (data.email) {
      updateData.email = data.email;
      updateData.email_confirm = true;
    }
    if (data.password) updateData.password = data.password;
    
    updateData.user_metadata = { 
      full_name: data.fullName,
      avatar_url: data.avatarUrl,
      role: 'doctor'
    };

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (authError) throw authError;

    const profileUpdates: any = {
      full_name: data.fullName,
      avatar_url: data.avatarUrl,
      specialty: data.specialty,
      license_number: data.licenseNumber,
      phone: data.phone,
      address: data.address,
      birth_date: data.birthDate,
      experience_years: data.experienceYears,
      ruc: data.ruc,
      institution_id: data.institutionId
    };

    // Remove undefined values
    Object.keys(profileUpdates).forEach(key => profileUpdates[key] === undefined && delete profileUpdates[key]);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId);
    
    if (profileError) throw profileError;

    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando cuenta de médico:", error);
    return { success: false, error: error.message };
  }
}

export async function upsertDoctorDirectory(id: string | null, payload: any) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    if (id) {
      console.log("Admin Server Action: Updating doctors_directory ID:", id);
      const { data, error } = await supabaseAdmin
        .from("doctors_directory" as any)
        .update(payload)
        .eq("id", id)
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } else {
      console.log("Admin Server Action: Inserting new doctor to doctors_directory");
      const { data, error } = await supabaseAdmin
        .from("doctors_directory" as any)
        .insert([payload])
        .select();
        
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    console.error("Error upserting doctors directory:", error);
    return { success: false, error: error.message };
  }
}

export async function getDoctorsAndAvatars() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin
      .from("doctors_directory" as any)
      .select("*")
      .order("full_name");
      
    if (doctorsError) throw doctorsError;

    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, avatar_url");

    if (profilesError) throw profilesError;

    const doctorsWithAvatars = doctorsData.map((doc: any) => {
      const profile = profilesData?.find((p: any) => p.id === doc.auth_user_id);
      return {
        ...doc,
        avatar_url: profile?.avatar_url || null
      };
    });

    return { success: true, data: doctorsWithAvatars };
  } catch (err: any) {
    console.error("Error fetching doctors and avatars:", err);
    return { success: false, error: err.message };
  }
}
