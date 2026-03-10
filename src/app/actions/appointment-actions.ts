"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Crea una nueva cita y envía un correo de confirmación al paciente
 */
export async function createAppointment(payload: any) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Insert appointment
    const { data: appointment, error: insertError } = await supabaseAdmin
      .from("appointments")
      .insert([payload])
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Fetch Patient details
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", payload.patient_id)
      .single();

    if (patientError) throw patientError;

    // 3. Fetch Doctor details
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from("doctors_directory" as any)
      .select("*")
      .eq("id", payload.doctor_id)
      .single();

    if (doctorError) throw doctorError;

    // 4. Send Email if patient has email and API Key is configured
    if (patient.email && process.env.RESEND_API_KEY) {
      try {
        const dateObj = new Date(payload.start_time);
        const formattedDate = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
        const formattedTime = format(dateObj, "HH:mm");

        await resend.emails.send({
          from: "Sistema de Citas <onboarding@resend.dev>",
          to: patient.email,
          subject: "Confirmación de su Cita Médica",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #0ea5e9; padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">CITA CONFIRMADA</h1>
              </div>
              <div style="padding: 32px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
                <p style="font-size: 18px;">Hola <strong>${patient.first_name} ${patient.last_name}</strong>,</p>
                <p>Nos complace informarle que su cita ha sido agendada exitosamente. Aquí tiene los detalles de su visita:</p>
                
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 24px 0;">
                  <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Médico</span>
                    <span style="font-size: 16px; font-weight: 600; color: #0ea5e9;">Dr. ${doctor.full_name}</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Especialidad</span>
                    <span style="font-size: 16px; font-weight: 600;">${doctor.specialty}</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Fecha</span>
                    <span style="font-size: 16px; font-weight: 600;">${formattedDate}</span>
                  </div>
                  <div>
                    <span style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Hora</span>
                    <span style="font-size: 16px; font-weight: 600;">${formattedTime}</span>
                  </div>
                </div>
                
                <p style="margin-top: 24px;">Si necesita cancelar o reprogramar su cita, por favor contáctenos con al menos 24 horas de anticipación.</p>
                
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                
                <p style="font-size: 13px; color: #94a3b8; text-align: center;">Este es un mensaje automático, por favor no responda a este correo.</p>
              </div>
              <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} Sistema de Gestión de Citas Médicas
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // We don't throw here to avoid failing the appointment creation if only email fails
      }
    }

    return { success: true, data: appointment };
  } catch (error: any) {
    console.error("Error in createAppointment server action:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza una cita existente
 */
export async function updateAppointment(id: string, payload: any) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return { success: false, error: error.message };
  }
}
