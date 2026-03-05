
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedAppointments() {
  const doctorEmail = "ftorres@oshyn.com";
  console.log(`Seeding appointments for ${doctorEmail}...`);

  // 1. Get Doctor
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === doctorEmail);
  if (!user) return;

  // 2. Get Patient
  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("id")
    .ilike("first_name", "%Isaac%")
    .limit(1)
    .single();

  if (!patient) {
    console.error("Patient not found!");
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const appointmentsData = [
    {
      doctor_id: user.id,
      patient_id: patient.id,
      start_time: new Date(year, month, today.getDate(), 9, 0).toISOString(),
      end_time: new Date(year, month, today.getDate(), 10, 0).toISOString(),
      status: 'confirmed',
      reason: 'Control de rutina'
    },
    {
      doctor_id: user.id,
      patient_id: patient.id,
      start_time: new Date(year, month, today.getDate() + 1, 11, 0).toISOString(),
      end_time: new Date(year, month, today.getDate() + 1, 12, 0).toISOString(),
      status: 'pending',
      reason: 'Revisión de exámenes'
    },
    {
      doctor_id: user.id,
      patient_id: patient.id,
      start_time: new Date(year, month, today.getDate() + 2, 14, 30).toISOString(),
      end_time: new Date(year, month, today.getDate() + 2, 15, 30).toISOString(),
      status: 'confirmed',
      reason: 'Consulta especializada'
    },
    {
      doctor_id: user.id,
      patient_id: patient.id,
      start_time: new Date(year, month, today.getDate() - 1, 10, 0).toISOString(),
      end_time: new Date(year, month, today.getDate() - 1, 11, 0).toISOString(),
      status: 'completed',
      reason: 'Seguimiento post-operatorio'
    }
  ];

  console.log("Inserting appointments...");
  const { error } = await supabaseAdmin
    .from("appointments")
    .insert(appointmentsData);

  if (error) {
    console.error("Error seeding appointments:", error.message);
  } else {
    console.log("Appointments seeded successfully!");
  }
}

seedAppointments();
