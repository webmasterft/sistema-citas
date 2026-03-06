import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSubmit() {
  const doctorPayload = {
    full_name: 'Fernando Javier Torres Espinosa',
    specialty: 'Cardiología',
    email: 'fernando@medapp.ec',
    phone: '0991234567',
    address: 'Av. Gran Colombia',
    experience_years: 15,
    birth_date: '1982-12-16',
    license_number: 'LM-12345',
    ruc: '1712345678001',
    institution_id: null,
    auth_user_id: 'ca40d116-3d56-4c15-94d5-129f43ac6b81'
  };

  const id = 'c955e6ce-3d56-4c15-96b1-a5de57d7fbf6'; // Get the real ID
  const { data: dirs } = await supabase.from('doctors_directory').select('id').limit(1);
  const targetId = dirs[0].id;
  
  console.log("Simulating DoctorForm payload update for ID:", targetId);
  const { data, error } = await supabase.from('doctors_directory').update(doctorPayload).eq('id', targetId).select();
  console.log("Update result:", data, error);
}

testSubmit();
